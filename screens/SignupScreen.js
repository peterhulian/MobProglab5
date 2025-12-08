import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useNPMS } from '../context/AuthContext';
import { User, Mail, Lock, Home, Phone, Briefcase, ChevronDown } from 'lucide-react-native';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Teacher');
  const [roomNum, setRoomNum] = useState(''); // RENAMED variable
  const [contactNumber, setContactNumber] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { signup } = useNPMS();

  const handleSignup = async () => {
    if (!name || !email || !password || (role === 'Teacher' && !roomNum)) {
      Alert.alert('Incomplete Form', 'Please fill out all required fields.');
      return;
    }
    
    setLocalLoading(true);
    try {
        // Updated to pass roomNum
        await signup(name, email, role, roomNum, contactNumber, password);
        navigation.navigate('Login');
    } catch (error) {
        Alert.alert("Sign Up Failed", error.message);
    } finally {
        setLocalLoading(false);
    }
  };
  
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const selectRole = (r) => {
      setRole(r);
      setDropdownOpen(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Request Account</Text>
        <Text style={styles.subtitle}>Sign up to access the NPMS dashboard.</Text>

        {/* ROLE DROPDOWN */}
        <View style={{ width: '100%', maxWidth: 350, zIndex: 2000 }}>
             <TouchableOpacity style={styles.inputGroup} onPress={toggleDropdown}>
                <Briefcase size={20} color="#6b7280" style={styles.icon} />
                <Text style={{flex:1, color: '#1f2937', fontSize: 16}}>{role === 'Teacher' ? 'Teacher' : 'Faculty Staff'}</Text>
                <ChevronDown size={20} color="#6b7280"/>
             </TouchableOpacity>
             
             {dropdownOpen && (
                 <View style={styles.dropdownList}>
                     <TouchableOpacity style={styles.dropdownItem} onPress={() => selectRole('Teacher')}>
                        <Text style={styles.itemText}>Teacher</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.dropdownItem} onPress={() => selectRole('Faculty')}>
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
            <View style={styles.inputGroup}>
              <Home size={20} color="#6b7280" style={styles.icon} />
              {/* IMPORTANT: Ensure this matches the IoT Room ID format */}
              <TextInput 
                style={styles.input} 
                placeholder="Room No. (e.g., Room 2)" 
                value={roomNum} 
                onChangeText={setRoomNum} 
              />
            </View>
            <View style={styles.inputGroup}>
              <Phone size={20} color="#6b7280" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Contact Number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
            </View>
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={localLoading}>
          {localLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Submit Request</Text>}
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
  inputGroup: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 350, marginBottom: 15, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#f9fafb', height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16, color: '#1f2937' },
  button: { width: '100%', maxWidth: 350, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  linkText: { color: '#3b82f6', fontSize: 14 },
  dropdownList: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemText: { fontSize: 16, color: '#374151' }
});

export default SignupScreen;