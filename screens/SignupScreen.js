import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useNPMS } from '../context/AuthContext';
import { User, Mail, Lock, Home, Phone, Briefcase, ChevronDown } from 'lucide-react-native'; 
// Removed Picker import since we are using a custom dropdown

// --- Custom Role Dropdown Component ---
const RoleDropdown = ({ role, setRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { label: "Teacher", value: "Teacher" },
    { label: "Faculty Staff", value: "Faculty" },
  ];

  const currentLabel = options.find(opt => opt.value === role)?.label || "Select Role";

  const handleSelect = (value) => {
    setRole(value);
    setIsOpen(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      {/* Selector Button */}
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <Briefcase size={20} color="#6b7280" style={styles.icon} />
        <Text style={[styles.dropdownText, role === 'Teacher' && styles.dropdownSelectedText]}>
          {currentLabel}
        </Text>
        <ChevronDown 
          size={18} 
          color="#6b7280" 
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {/* Options List */}
      {isOpen && (
        <View style={styles.dropdownOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownOption,
                option.value === role && styles.dropdownOptionSelected,
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <Text style={[
                styles.dropdownOptionText, 
                option.value === role && styles.dropdownOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
// --- End Custom Role Dropdown Component ---


const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [role, setRole] = useState('Teacher');
  const [classroomId, setClassroomId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const { signup } = useNPMS();

  const handleSignup = async () => {
    // CRITICAL VALIDATION
    if (!name || !email || !password || (role === 'Teacher' && !classroomId)) {
      Alert.alert('Incomplete Form', 'Please fill out all required fields.');
      return;
    }
    
    setLocalLoading(true);

    try {
        await signup(name, email, role, classroomId, contactNumber, password); 
        navigation.navigate('Login'); 
        
    } catch (error) {
        let errorMessage = error.message;
        if (errorMessage.includes("duplicate key value") || errorMessage.includes("already registered")) {
            errorMessage = "This email is already registered. Please use a different one or log in.";
        }
        Alert.alert("Sign Up Failed", errorMessage || "An unknown error occurred during registration.");
    } finally {
        setLocalLoading(false);
    }
  };
  
  const isButtonDisabled = localLoading || !name || !email || !password || (role === 'Teacher' && !classroomId);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Request Account</Text>
        <Text style={styles.subtitle}>Sign up to access the NPMS dashboard. All accounts require Faculty verification.</Text>

        {/* 🚀 NEW DROPDOWN COMPONENT */}
        <RoleDropdown role={role} setRole={setRole} />
        {/* --- End Role Dropdown --- */}

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <User size={20} color="#6b7280" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Mail size={20} color="#6b7280" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="School Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Lock size={20} color="#6b7280" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password (Min 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Conditional Teacher Fields (Classroom ID and Contact Number) */}
        {role === 'Teacher' && (
          <>
            {/* Classroom ID - Only for Teachers */}
            <View style={styles.inputGroup}>
              <Home size={20} color="#6b7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Assigned Classroom ID (e.g., 101)"
                value={classroomId}
                onChangeText={setClassroomId}
                keyboardType="numeric"
                autoCorrect={false}
              />
            </View>
            {/* Contact Number - Only for Teachers (Optional) */}
            <View style={styles.inputGroup}>
              <Phone size={20} color="#6b7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Contact Number (Optional)"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
              />
            </View>
          </>
        )}

        {/* Signup Button */}
        <TouchableOpacity
          style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={isButtonDisabled}
        >
          {localLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Submit Request</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? <Text style={{fontWeight: 'bold'}}>Log In</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 30,
    textAlign: 'center',
    width: '100%',
    maxWidth: 350,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9fafb',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1f2937',
    paddingHorizontal: 0,
  },
  button: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a3a3a3',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
  },

  // --- NEW DROPDOWN STYLES ---
  dropdownContainer: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 15,
    zIndex: 10, // Ensure dropdown options render above other elements
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9fafb',
    justifyContent: 'space-between',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#6b7280', // Placeholder color
  },
  dropdownSelectedText: {
    color: '#1f2937', // Text color when a value is selected
  },
  dropdownOptions: {
    position: 'absolute',
    top: 50, // Below the button
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5, // Android shadow
    maxHeight: 150, // Limit height if you had more options
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#eff6ff', // Light blue background for selection
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownOptionTextSelected: {
    fontWeight: 'bold',
    color: '#2563eb', // Blue text for selection
  }
});

export default SignupScreen;