import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useNPMS } from './context/AuthContext';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
// Ensure you have created this file from the previous instructions
import ManageTeacherScreen from './screens/ManageTeacherScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { user, isLoading } = useNPMS();

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
                <Stack.Group>
                    <Stack.Screen 
                        name="Dashboard" 
                        component={DashboardScreen} 
                        options={{ title: 'NPMS Dashboard' }}
                    />
                    {/* NEW: Edit Screen */}
                    <Stack.Screen 
                        name="ManageTeacher" 
                        component={ManageTeacherScreen} 
                        options={{ title: 'Edit Teacher' }}
                    />
                </Stack.Group>
            ) : (
                // --- PUBLIC STACK ---
                <Stack.Group>
                    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }}/>
                    <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Registration' }}/>
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