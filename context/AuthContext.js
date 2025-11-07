// context/AuthContext.js (Supabase Version - REPLACE your current file with this)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

const NPMSContext = createContext(null);
export const useNPMS = () => useContext(NPMSContext);

const getDefaultProfile = (id, name, email, role, classroomId, contactNumber) => ({
  id: id,
  name: name,
  email: email,
  role: role,
  classroomId: role === 'Teacher' ? classroomId : null,
  contactNumber: contactNumber,
  is_verified: false,
});

const BREACH_DURATION_LIMIT = 180; // 3 minutes in seconds

// Helper to normalize DB rows -> client shape (adds isVerified)
const normalizeProfile = (row) => {
  if (!row) return null;
  return {
    ...row,
    // keep original snake_case too if you want, but add a consistent camelCase prop
    isVerified: !!row.is_verified,
  };
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatuses, setSystemStatuses] = useState({}); 
  const [allUsers, setAllUsers] = useState([]); 

  // --- 1. INITIAL SESSION CHECK & STATE CHANGE LISTENER ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          fetchUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // --- 2. DATA FETCHERS ---
  const fetchUserData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error("Error fetching user profile:", error);
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // CRITICAL VERIFICATION CHECK
      if (!data.is_verified) {
        // Keep this UX: show alert and force sign out
        Alert.alert("Access Denied", "Your account is awaiting verification by Faculty Staff.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      const normalized = normalizeProfile(data);
      setUser(normalized);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (err) {
      console.error("fetchUserData error", err);
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching all users:", error);
        return;
      }

      // normalize each row to add isVerified
      const normalized = (data || []).map(normalizeProfile);
      setAllUsers(normalized);
    } catch (err) {
      console.error("fetchAllUsers error", err);
    }
  };

  // --- 3. REALTIME AND INITIAL DATA SETUP ---
  useEffect(() => {
    if (!user) return;

    const fetchInitialStatuses = async () => {
      const { data, error } = await supabase.from('class_statuses').select('*');
      if (error) { console.error("Error fetching initial statuses:", error); return; }
      const statusMap = data.reduce((acc, curr) => { acc[curr.classroomId] = curr; return acc; }, {});
      setSystemStatuses(statusMap);
    };
    fetchInitialStatuses();

    // Subscribe to class_statuses updates
    const channel = supabase
      .channel('public:class_statuses')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'class_statuses' }, (payload) => {
        const newStatus = payload.new;
        setSystemStatuses(prevStatuses => ({ ...prevStatuses, [newStatus.classroomId]: newStatus }));

        // Client-side critical alert
        if (user.role !== 'Faculty' && user.classroomId === newStatus.classroomId && newStatus.breachDuration >= BREACH_DURATION_LIMIT) {
          Alert.alert("CRITICAL NOISE ALERT!", `Room ${newStatus.classroomId} sustained excessive noise.`, [{ text: "OK" }]);
        }
      })
      .subscribe();

    // If user is faculty (admin), fetch all users
    if (user.role === 'Faculty') {
      fetchAllUsers();
    }

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // --- 4. AUTHENTICATION FUNCTIONS ---
  const login = async (email, password) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      throw new Error(signInError.message);
    }
    // onAuthStateChange handles remaining flow
  };

  const signup = async (name, email, role, classroomId, contactNumber, password) => {
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      throw new Error(authError.message);
    }

    // 2. Create profile in 'profiles' table
    const userId = authData.user.id;
    const profile = getDefaultProfile(userId, name, email, role, classroomId, contactNumber);

    const { error: profileError } = await supabase.from('profiles').insert([profile]);

    if (profileError) {
      console.error("Failed to create profile entry:", profileError);
      // optionally you might want to cleanup auth user here if profile creation failed
    }

    // Force sign out after signup so the user must be approved before logging in
    await supabase.auth.signOut();

    Alert.alert("Success!", `Account created for ${name}. Your account is awaiting verification by Faculty Staff.`);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { console.error("Logout Error:", error); }
  };

  // --- 5. ADMIN/PROFILE FUNCTIONS ---
  const approveUser = async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', userId).select().single();
      if (error) {
        Alert.alert("Error", `Failed to approve user: ${error.message}`);
        return;
      }
      const normalized = normalizeProfile(data);
      setAllUsers(prevUsers => prevUsers.map(u => (u.id === userId ? normalized : u)));
      Alert.alert("Account Approved", `${normalized.name} has been successfully verified.`);
    } catch (err) {
      console.error("approveUser error", err);
      Alert.alert("Error", "Failed to approve user.");
    }
  };

  const rejectUser = async (userId) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) {
        Alert.alert("Error", `Failed to delete profile: ${error.message}`);
        return;
      }
      setAllUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      Alert.alert("Account Rejected", `User request has been removed.`);
    } catch (err) {
      console.error("rejectUser error", err);
      Alert.alert("Error", "Failed to reject user.");
    }
  };

  const updateProfile = async (newName, newEmail, newContactNumber) => {
    try {
      const updateData = { name: newName, contactNumber: newContactNumber };
      const { data: updatedProfile, error } = await supabase.from('profiles').update(updateData).eq('id', user.id).select().single();
      if (error) {
        Alert.alert("Error", `Failed to update profile: ${error.message}`);
        return;
      }
      const normalized = normalizeProfile(updatedProfile);
      setUser(normalized);
      // If admin, refresh all users to reflect edits
      if (user.role === 'Faculty') { fetchAllUsers(); }
      Alert.alert("Profile Updated", "Your information has been successfully saved.");
    } catch (err) {
      console.error("updateProfile error", err);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    approveUser,
    rejectUser,
    systemStatuses,
    allUsers,
    BREACH_DURATION_LIMIT,
    fetchAllUsers, // optionally exposed for manual refresh
  };

  return <NPMSContext.Provider value={value}>{children}</NPMSContext.Provider>;
};
