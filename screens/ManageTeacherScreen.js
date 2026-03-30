import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNPMS } from '../context/AuthContext';
import { User, Home, Phone, Save, Lock } from 'lucide-react-native';

const ManageTeacherScreen = ({ route, navigation }) => {
  const { teacher } = route.params; 
  const { adminUpdateProfile, isLoading } = useNPMS();

  const [name, setName] = useState(teacher.name || '');
  const [roomNum, setRoomNum] = useState(teacher.room_num || '');
  const [phoneNum, setPhoneNum] = useState(teacher.phone_num || '');
  // Load the stored password from the database
  const [password, setPassword] = useState(teacher.password || ''); 

  const handleUpdate = async () => {
    if (!name || !roomNum || !password) {
      Alert.alert("Error", "Name, Room, and Password are required.");
      return;
    }

    try {
      // Send all updates (including password) to the context function
      await adminUpdateProfile(teacher.id, {
        name,
        room_num: roomNum,
        phone_num: phoneNum,
        password: password // Updates DB column AND Login system
      });

      Alert.alert("Success", "Teacher profile updated successfully.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Teacher Profile</Text>
      <Text style={styles.subHeader}>Editing details for {teacher.email}</Text>

      <View style={styles.form}>
        {/* Name Input */}
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <User size={20} color="#6b7280" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Teacher Name"
          />
        </View>

        {/* Room Input */}
        <Text style={styles.label}>Assigned Room</Text>
        <View style={styles.inputWrapper}>
          <Home size={20} color="#6b7280" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            value={roomNum} 
            onChangeText={setRoomNum} 
            placeholder="e.g. Room 301"
          />
        </View>

        {/* Phone Input */}
        <Text style={styles.label}>Contact Number</Text>
        <View style={styles.inputWrapper}>
          <Phone size={20} color="#6b7280" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            value={phoneNum} 
            onChangeText={setPhoneNum} 
            placeholder="Mobile Number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Password Input */}
        <Text style={styles.label}>Password (Visible)</Text>
        <View style={[styles.inputWrapper, { borderColor: '#f59e0b' }]}>
          <Lock size={20} color="#6b7280" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            placeholder="User Password"
          />
        </View>
        <Text style={styles.hintText}>Changing this updates the login immediately.</Text>

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleUpdate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: 'white' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  subHeader: { fontSize: 14, color: '#6b7280', marginBottom: 30 },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1f2937' },
  saveBtn: { backgroundColor: '#059669', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  hintText: { fontSize: 12, color: '#f59e0b', marginTop: -10, fontStyle: 'italic' }
});

export default ManageTeacherScreen;