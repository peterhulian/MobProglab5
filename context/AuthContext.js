import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

const AuthContext = createContext({});

export const useNPMS = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [roomAlerts, setRoomAlerts] = useState({}); 

  // --- 1. AUTH LISTENER ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id, session.user.email);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchProfile(session.user.id, session.user.email);
      else {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- 2. CORE LOGIC: Listen for Noise Alerts ---
  useEffect(() => {
    refreshDashboardData();

    const channel = supabase
      .channel('public:noise_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'noise_logs' }, (payload) => {
          handleNewLog(payload.new);
      })
      .subscribe();

    const interval = setInterval(() => { fetchAllUsers(); }, 10000); 

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []); 

  // --- HELPERS ---
  const refreshDashboardData = async () => {
    await fetchAllUsers();
    const { data: logs } = await supabase.from('noise_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (logs) {
      const alerts = {};
      logs.forEach(log => { if (!alerts[log.room_id]) alerts[log.room_id] = log; });
      setRoomAlerts(alerts);
    }
  };

  const handleNewLog = (newLog) => {
    setRoomAlerts(prev => ({ ...prev, [newLog.room_id]: newLog }));
  };

  // --- AUTH FUNCTIONS ---
  const fetchProfile = async (userId, email) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        setUser({ ...data, email });
        if (data.role === 'Faculty') fetchAllUsers();
      }
    } catch (e) { console.log(e); } 
    finally { setIsLoading(false); }
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setAllUsers(data);
  };

  const login = async (email, password) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setIsLoading(false); throw error; }
  };

  // UPDATED: Now saves 'password' to the profiles table too
  const signup = async (name, email, role, roomNum, contactNumber, password) => {
    setIsLoading(true);
    // 1. Create User in Auth System
    const { data: { user }, error } = await supabase.auth.signUp({ email, password });
    if (error) { setIsLoading(false); throw error; }
    
    // 2. Save Details (including PASSWORD) to Profiles table
    if (user) {
      await supabase.from('profiles').insert([{
        id: user.id, 
        name, 
        role, 
        email,
        room_num: role === 'Teacher' ? roomNum : null,
        phone_num: contactNumber,
        is_verified: false,
        password: password // <--- SAVING PASSWORD HERE
      }]);
      Alert.alert("Success", "Account created! Wait for verification.");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };
  
  const updateProfile = async (name, email, contactNumber) => {
    if (!user) return;
    setIsLoading(true);
    await supabase.from('profiles').update({ name, phone_num: contactNumber, email }).eq('id', user.id);
    if (user.email !== email) await supabase.auth.updateUser({ email });
    await fetchProfile(user.id, email);
    setIsLoading(false);
  };

  // UPDATED: Handles both Profile update AND Password update
  const adminUpdateProfile = async (targetId, updates) => {
    setIsLoading(true);

    // 1. Update the 'profiles' table (Name, Room, Phone, AND visible Password)
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', targetId);

    if (error) {
      setIsLoading(false);
      throw error;
    }

    // 2. If 'password' was changed, update the ACTUAL Login System using RPC
    if (updates.password) {
       const { error: rpcError } = await supabase.rpc('admin_update_password', {
          target_user_id: targetId,
          new_password: updates.password
       });
       if (rpcError) {
         console.log("RPC Error", rpcError);
         Alert.alert("Warning", "Profile saved, but password login update failed.");
       }
    }
    
    await fetchAllUsers();
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user, allUsers, isLoading, roomAlerts, 
      login, signup, logout, updateProfile, fetchAllUsers,
      adminUpdateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};