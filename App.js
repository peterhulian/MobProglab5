import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useNPMS } from './context/AuthContext';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { user, isLoading } = useNPMS();

    // IMPROVEMENT: Show a spinner instead of a blank screen while checking session
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ 
            headerStyle: { backgroundColor: '#059669' }, 
            headerTintColor: 'white',
            headerTitleStyle: { fontWeight: 'bold' }
        }}>
            {user ? (
                // --- AUTHENTICATED STACK ---
                <Stack.Screen 
                    name="Dashboard" 
                    component={DashboardScreen} 
                    options={{ title: 'NPMS Dashboard' }}
                />
            ) : (
                // --- PUBLIC STACK ---
                <Stack.Group>
                    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }}/>
                    <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Request Access' }}/>
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
         <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}