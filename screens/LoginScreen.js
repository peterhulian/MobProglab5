import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNPMS } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react-native';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const { login } = useNPMS();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLocalLoading(true);
    try {
      await login(email, password);
    } catch (error) {
       Alert.alert('Login Failed', error.message);
    } finally {
       setLocalLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your dashboard</Text>

        <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
                <Mail size={20} color="#6b7280" style={styles.icon} />
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
            </View>
            <View style={styles.inputWrapper}>
                <Lock size={20} color="#6b7280" style={styles.icon} />
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={localLoading}>
          {localLoading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Log In</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: 'white', padding: 30, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 40 },
  inputContainer: { width: '100%', maxWidth: 350, gap: 15, marginBottom: 30 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 15, height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  button: { width: '100%', maxWidth: 350, backgroundColor: '#059669', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default LoginScreen;