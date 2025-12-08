import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

const AuthContext = createContext({});

export const useNPMS = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  // This holds the latest log for every room detected
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
    // A. Initial Load
    refreshDashboardData();

    // B. Realtime Subscription (Listen for NEW alerts only)
    const channel = supabase
      .channel('public:noise_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'noise_logs' },
        (payload) => {
          // When a device triggers an alert, update state immediately
          handleNewLog(payload.new);
        }
      )
      .subscribe();

    // C. Refresh users periodically (to catch new teacher signups)
    const interval = setInterval(() => {
        fetchAllUsers(); 
    }, 10000); 

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []); 

  // --- HELPERS ---

  const refreshDashboardData = async () => {
    await fetchAllUsers(); // Load teachers to map them
    
    // Get the latest 50 logs
    const { data: logs } = await supabase
      .from('noise_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logs) {
      const alerts = {};
      // Process logs. Since we ordered desc, the first time we see a room, it's the latest.
      logs.forEach(log => {
        if (!alerts[log.room_id]) {
          alerts[log.room_id] = log;
        }
      });
      setRoomAlerts(alerts);
    }
  };

  const handleNewLog = (newLog) => {
    setRoomAlerts(prev => ({
      ...prev,
      [newLog.room_id]: newLog // Update this room with the newest log
    }));
  };

  // --- AUTH FUNCTIONS ---

  const fetchProfile = async (userId, email) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        // Standardizing: using room_num everywhere
        setUser({ ...data, email });
        if (data.role === 'Faculty') fetchAllUsers();
      }
    } catch (e) { console.log(e); } 
    finally { setIsLoading(false); }
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
        setAllUsers(data);
        return data;
    }
    return [];
  };

  const login = async (email, password) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setIsLoading(false); throw error; }
  };

  // UPDATED: Now saves to 'room_num' correctly
  const signup = async (name, email, role, roomNum, contactNumber, password) => {
    setIsLoading(true);
    const { data: { user }, error } = await supabase.auth.signUp({ email, password });
    if (error) { setIsLoading(false); throw error; }
    
    if (user) {
      await supabase.from('profiles').insert([{
        id: user.id, 
        name, 
        role, 
        email,
        room_num: role === 'Teacher' ? roomNum : null, // Crucial for auto-assign
        phone_num: contactNumber,
        is_verified: false 
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

  return (
    <AuthContext.Provider value={{
      user, allUsers, isLoading, roomAlerts, 
      login, signup, logout, updateProfile, fetchAllUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};