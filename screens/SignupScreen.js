import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useNPMS } from '../context/AuthContext';
import { User, Mail, Lock, Home, Phone, Briefcase, ChevronDown, ChevronUp } from 'lucide-react-native';

// --- REPLACE THIS with your computer's local IP address ---
const API_BASE_URL = 'http://192.168.1.14:8000/api';


const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Teacher');
  const [roomNum, setRoomNum] = useState(''); 
  const [contactNumber, setContactNumber] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  // Dynamic Rooms State (Kept in background in case you need it later)
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Dropdown States
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  
  const { signup } = useNPMS();

  // --- UPDATED: Fetch from Django API (Fails Silently) ---
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const response = await fetch(`${API_BASE_URL}/available-rooms/`); 
        
        // If the API fails or is empty, we just exit and let the user type manually
        if (!response.ok) return; 
        
        const data = await response.json();
        const rooms = data.map(item => item.room_id); 
        setAvailableRooms(rooms);
      } catch (err) {
        // Log it to console for you, but don't show the user
        console.log("IoT/API Room fetch skipped:", err); 
      } finally {
        setLoadingRooms(false);
      }
    };

    if (role === 'Teacher') {
        fetchRooms();
    }
  }, [role]);

  const handleSignup = async () => {
    // Bypassed validation: Removed the (role === 'Teacher' && !roomNum) requirement
    if (!name || !email || !password) {
      Alert.alert('Incomplete Form', 'Name, Email, and Password are required.');
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
            {/* --- MANUAL ROOM INPUT --- */}
            <View style={styles.inputGroup}>
              <Home size={20} color="#6b7280" style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Room Number (e.g. 101)" 
                value={roomNum} 
                onChangeText={setRoomNum} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Phone size={20} color="#6b7280" style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Contact Number" 
                value={contactNumber} 
                onChangeText={setContactNumber} 
                keyboardType="phone-pad" 
              />
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