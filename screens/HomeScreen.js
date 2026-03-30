import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Volume2 } from 'lucide-react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Volume2 size={80} color="#059669" style={styles.logoIcon} />
        <Text style={styles.mainTitle}>NPMS</Text>
        <Text style={styles.subtitle}>Noise Pollution Monitoring System</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupButtonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 32, justifyContent: 'center', alignItems: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 60 },
  logoIcon: { marginBottom: 20 },
  mainTitle: { fontSize: 40, fontWeight: 'bold', color: '#059669', letterSpacing: 2 },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 10, textAlign: 'center' },
  buttonContainer: { width: '100%', maxWidth: 300, gap: 16 },
  loginButton: { width: '100%', padding: 16, backgroundColor: '#059669', borderRadius: 12, alignItems: 'center', elevation: 2 },
  loginButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  signupButton: { width: '100%', padding: 16, backgroundColor: '#f3f4f6', borderRadius: 12, alignItems: 'center' },
  signupButtonText: { color: '#059669', fontWeight: 'bold', fontSize: 18 },
});

export default HomeScreen;