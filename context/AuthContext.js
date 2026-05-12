import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your computer's current local IP address
const API_BASE_URL = 'http://192.168.1.14:8000/api';

const AuthContext = createContext({});

export const useNPMS = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [roomAlerts, setRoomAlerts] = useState({}); 

  // --- 1. AUTH INITIALIZATION ---
  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log("Error reading local storage", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. CORE LOGIC: Polling for Noise Alerts ---
  useEffect(() => {
    if (!user) return; 

    refreshDashboardData();

    const interval = setInterval(() => { 
      refreshDashboardData(); 
    }, 5000); 

    return () => clearInterval(interval);
  }, [user]); 

  // --- HELPERS ---
  const refreshDashboardData = async () => {
    await fetchAllUsers();
    
    try {
      const response = await fetch(`${API_BASE_URL}/logs/`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      
      const logs = await response.json();
      
      const alerts = {};
      logs.forEach(log => { 
        if (!alerts[log.room_id]) alerts[log.room_id] = log; 
      });
      setRoomAlerts(alerts);
    } catch (error) {
      console.log("Polling error:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`);
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.log("Error fetching users:", error);
    }
  };

  // --- AUTH FUNCTIONS ---
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const textResponse = await response.text(); 
      let data;
      try {
          data = JSON.parse(textResponse); 
      } catch (err) {
          console.log("DJANGO CRASHED. RAW HTML RESPONSE:", textResponse.substring(0, 300));
          throw new Error("Server error. Check your Django terminal for a traceback.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

    } catch (error) {
      console.log("Login Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name, email, role, roomNum, contactNumber, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password,
          role: role,
          room_num: role === 'Teacher' ? roomNum : null,
          phone_num: contactNumber
        })
      });

      const textResponse = await response.text(); 
      let data;
      try {
          data = JSON.parse(textResponse);
      } catch (err) {
          console.log("DJANGO CRASHED. RAW HTML RESPONSE:", textResponse.substring(0, 300));
          throw new Error("Server error. Check your Django terminal for a traceback.");
      }

      if (!response.ok) {
        const errorMessage = typeof data === 'object' ? JSON.stringify(data) : "Registration failed";
        throw new Error(errorMessage);
      }

      Alert.alert("Success", "Account created! Wait for verification.");
    } catch (error) {
      console.log("Signup Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };
  
  const updateProfile = async (name, email, contactNumber) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${user.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone_num: contactNumber })
      });

      if (!response.ok) throw new Error("Update failed");

      const updatedUser = await response.json();
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const adminUpdateProfile = async (targetId, updates) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/profiles/${targetId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error("Admin update failed");

      await fetchAllUsers();
    } catch (error) {
      console.log("Admin Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, allUsers, setAllUsers, isLoading, roomAlerts, 
      login, signup, logout, updateProfile, fetchAllUsers,
      adminUpdateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};