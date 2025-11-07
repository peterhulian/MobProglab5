// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNPMS } from '../context/AuthContext';
import { User, Mail, Zap, Phone } from 'lucide-react-native'; // FIXED: Ensure all icons are imported

const ProfileScreen = ({ navigation }) => {
  const { user, isLoading, updateProfile } = useNPMS();
  
  // Local state for profile editing
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');

  // Ensure local state updates if user data changes externally (e.g., after login)
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setContactNumber(user.contactNumber || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!name || !email || (user.role === 'Teacher' && !contactNumber)) {
      Alert.alert("Error", "All required fields must be filled.");
      return;
    }

    if (name === user.name && email === user.email && contactNumber === user.contactNumber) {
      Alert.alert("No Changes", "No changes were made to the profile.");
      return;
    }

    try {
      await updateProfile(name, email, contactNumber); // Pass contactNumber
      navigation.goBack(); 
    } catch (error) {
      Alert.alert("Save Error", "Could not save profile changes.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.centerContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.roleText}>Role: <Text style={styles.roleValue}>{user?.role}</Text></Text>
        <Text style={styles.roleText}>Status: <Text style={styles.roleValue}>{user?.isVerified ? 'Verified' : 'Pending/Unverified'}</Text></Text>
        
        {user?.classroomId && (
            <Text style={styles.roleText}>Assigned Room: <Text style={styles.roleValue}>{user.classroomId}</Text></Text>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}><User size={16} color="#4b5563" /> Full Name</Text>
          <TextInput
            style={styles.input}
            onChangeText={setName}
            value={name}
            placeholder="Full Name"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}><Mail size={16} color="#4b5563" /> School Email</Text>
          <TextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            placeholder="email@school.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}><Phone size={16} color="#4b5563" /> Contact Number (Required for Teachers)</Text>
          <TextInput
            style={styles.input}
            onChangeText={setContactNumber}
            value={contactNumber}
            placeholder="555-1234"
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}><Zap size={16} color="#4b5563" /> Password</Text>
          <TextInput
            style={styles.input}
            value="••••••••"
            secureTextEntry
            editable={false}
          />
          <Text style={styles.noteText}>Contact IT support to change your password.</Text>
        </View>


        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
        
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flexGrow: 1,
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderTopWidth: 4,
    borderTopColor: '#059669', 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#059669',
  },
  roleText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  roleValue: {
    fontWeight: '600',
    color: '#1f2937',
  },
  inputGroup: {
    marginTop: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: 'white',
  },
  noteText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 5,
  },
  saveButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#059669',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af', 
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ProfileScreen;