import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useNPMS } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, Home, Phone, Briefcase, ChevronDown, ChevronUp } from 'lucide-react-native';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Teacher');
  const [roomNum, setRoomNum] = useState(''); 
  const [contactNumber, setContactNumber] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  // Dynamic Rooms State
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Dropdown States
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  
  const { signup } = useNPMS();

  // --- UPDATED: Fetch ONLY AVAILABLE Rooms ---
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        // Call the NEW SQL function that filters out taken rooms
        const { data, error } = await supabase.rpc('get_available_rooms');
        
        if (error) throw error;

        if (data) {
          const rooms = data.map(item => item.room_id);
          setAvailableRooms(rooms);
        }
      } catch (err) {
        console.log("Error fetching rooms:", err);
        setAvailableRooms([]); 
      } finally {
        setLoadingRooms(false);
      }
    };

    // Only fetch if role is Teacher
    if (role === 'Teacher') {
        fetchRooms();
    }
  }, [role]); // Re-run if role changes back to Teacher

  const handleSignup = async () => {
    if (!name || !email || !password || (role === 'Teacher' && !roomNum)) {
      Alert.alert('Incomplete Form', 'Please fill out all required fields.');
      return;
    }
    
    setLocalLoading(true);
    try {
        await signup(name, email, role, roomNum, contactNumber, password);
        Alert.alert("Success", "Account registration sent!");
        navigation.navigate('Login');
    } catch (error) {
        Alert.alert("Sign Up Failed", error.message);
    } finally {
        setLocalLoading(false);
    }
  };
  
  const toggleRoleDropdown = () => {
    setRoleDropdownOpen(!roleDropdownOpen);
    setRoomDropdownOpen(false); 
  };

  const toggleRoomDropdown = () => {
    setRoomDropdownOpen(!roomDropdownOpen);
    setRoleDropdownOpen(false); 
  };

  const selectRoom = (r) => {
      setRoomNum(r);
      setRoomDropdownOpen(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>Sign up to access the NPMS dashboard.</Text>

        {/* ROLE DROPDOWN */}
        <View style={styles.dropdownContainer}>
             <TouchableOpacity style={styles.inputGroup} onPress={toggleRoleDropdown}>
                <Briefcase size={20} color="#6b7280" style={styles.icon} />
                <Text style={styles.inputText}>
                    {role === 'Teacher' ? 'Teacher' : 'Faculty Staff'}
                </Text>
                {roleDropdownOpen ? <ChevronUp size={20} color="#6b7280"/> : <ChevronDown size={20} color="#6b7280"/>}
             </TouchableOpacity>
             
             {roleDropdownOpen && (
                 <View style={styles.dropdownList}>
                     <TouchableOpacity style={styles.dropdownItem} onPress={() => { setRole('Teacher'); setRoleDropdownOpen(false); }}>
                        <Text style={styles.itemText}>Teacher</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.dropdownItem} onPress={() => { setRole('Faculty'); setRoleDropdownOpen(false); }}>
                        <Text style={styles.itemText}>Faculty Staff</Text>
                     </TouchableOpacity>
                 </View>
             )}
        </View>

        <View style={styles.inputGroup}>
          <User size={20} color="#6b7280" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputGroup}>
          <Mail size={20} color="#6b7280" style={styles.icon} />
          <TextInput style={styles.input} placeholder="School Email" value={email} onChangeText={setEmail} autoCapitalize="none"/>
        </View>

        <View style={styles.inputGroup}>
          <Lock size={20} color="#6b7280" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        {role === 'Teacher' && (
          <>
            {/* --- AVAILABLE ROOMS DROPDOWN --- */}
            <View style={styles.dropdownContainer}>
                <TouchableOpacity style={styles.inputGroup} onPress={toggleRoomDropdown}>
                    <Home size={20} color="#6b7280" style={styles.icon} />
                    <Text style={[styles.inputText, !roomNum && { color: '#9ca3af' }]}>
                        {roomNum || "Select Available Room"}
                    </Text>
                    {loadingRooms ? <ActivityIndicator size="small" color="#059669"/> : (
                        roomDropdownOpen ? <ChevronUp size={20} color="#6b7280"/> : <ChevronDown size={20} color="#6b7280"/>
                    )}
                </TouchableOpacity>

                {roomDropdownOpen && (
                    <View style={styles.dropdownList}>
                        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                            {availableRooms.length === 0 ? (
                                <View style={styles.dropdownItem}>
                                    <Text style={[styles.itemText, { fontStyle: 'italic', color: '#ef4444' }]}>
                                        No rooms available
                                    </Text>
                                </View>
                            ) : (
                                availableRooms.map((r, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={styles.dropdownItem} 
                                        onPress={() => selectRoom(r)}
                                    >
                                        <Text style={styles.itemText}>{r}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>

            <View style={styles.inputGroup}>
              <Phone size={20} color="#6b7280" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Contact Number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
            </View>
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={localLoading}>
          {localLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Submit</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? <Text style={{fontWeight: 'bold'}}>Log In</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 30, backgroundColor: 'white', alignItems: 'center', paddingBottom: 50 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 30, textAlign: 'center' },
  
  inputGroup: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 15, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#f9fafb', height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16, color: '#1f2937' },
  inputText: { flex: 1, fontSize: 16, color: '#1f2937' },

  dropdownContainer: { width: '100%', maxWidth: 350, zIndex: 10, marginBottom: 0 }, 
  dropdownList: { 
      position: 'absolute', 
      top: 52, left: 0, right: 0, 
      backgroundColor: 'white', 
      borderWidth: 1, 
      borderColor: '#d1d5db', 
      borderRadius: 8, 
      shadowColor: '#000', 
      shadowOpacity: 0.1, 
      shadowRadius: 4, 
      elevation: 5,
      zIndex: 1000 
  },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemText: { fontSize: 16, color: '#374151' },

  button: { width: '100%', maxWidth: 350, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  linkText: { color: '#3b82f6', fontSize: 14 },
});

export default SignupScreen;