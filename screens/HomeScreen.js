// screens/HomeScreen.js
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { useNPMS } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { isAuthenticated, isLoading } = useNPMS();

  // Redirect Logic: Navigate to Dashboard if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Replaces the Home screen so the user can't hit 'back' to log out
      navigation.replace('Dashboard'); 
    }
  }, [isAuthenticated, isLoading, navigation]);

  if (isLoading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Initializing NPMS...</Text>
        </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Volume2 size={64} color="#059669" style={styles.logoIcon} />
        <Text style={styles.mainTitle}>NPMS</Text>
        <Text style={styles.subtitle}>
          Noise Pollution Monitoring System
        </Text>
        <Text style={styles.tagline}>
          Proactively ensuring quiet, focused learning environments during class hours.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Log In to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupButtonText}>Request Access</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#059669',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    color: '#059669',
  },
  logoIcon: {
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1, 
    color: '#059669',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#059669', 
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  signupButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  signupButtonText: {
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default HomeScreen;