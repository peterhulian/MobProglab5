// screens/DashboardScreen.js
import React from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Alert, FlatList, Dimensions, ActivityIndicator 
} from 'react-native';
import { useNPMS } from '../context/AuthContext'; 
import { supabase } from '../lib/supabase';
import { 
  Volume2, LogOut, CheckCircle, XCircle, Users, Speaker, Clock, 
  User, Phone, Home, Check, X, Mail 
} from 'lucide-react-native'; 

const { width } = Dimensions.get('window');

const COLOR_MAP = {
  'Solid Green': '#10b981', 
  'Blinking Yellow': '#fbbf24', 
  'Blinking Red': '#ef4444', 
};

const formatDuration = (seconds) => {
  if (seconds > 3600) return "1h+";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const minText = minutes > 0 ? `${minutes}m ` : '';
  const secText = `${remainingSeconds}s`;
  return minText + secText;
};

// --- Account Request List ---
const AccountRequestList = ({ pendingUsers, onApprove, onReject, loading }) => {
  if (pendingUsers.length === 0) {
    return (
      <View style={styles.noRequestsContainer}>
        <CheckCircle size={32} color={COLOR_MAP['Solid Green']} />
        <Text style={styles.noRequestsText}>No pending account requests.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestDetails}>
        <Text style={styles.requestName}>
          <User size={14} color="#1f2937" /> {item.name} ({item.role})
        </Text>
        <Text style={styles.requestInfo}>
          <Mail size={14} color="#6b7280" /> {item.email}
        </Text>
        <Text style={styles.requestInfo}>
          <Home size={14} color="#6b7280" /> Classroom: {item.classroomId || 'N/A'}
        </Text>
        <Text style={styles.requestInfo}>
          <Phone size={14} color="#6b7280" /> Contact: {item.contactNumber || 'N/A'}
        </Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.approveButton} 
          onPress={() => onApprove(item.id)}
          disabled={loading}
        >
          <Check size={18} color="white" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectButton} 
          onPress={() => onReject(item.id)}
          disabled={loading}
        >
          <X size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View>
      <Text style={styles.listHeader}>Pending Account Requests ({pendingUsers.length})</Text>
      <FlatList
        data={pendingUsers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

// --- Faculty Dashboard ---
const FacultyDashboard = ({ users, onApprove, onReject, systemStatuses, loading }) => {
  const BREACH_LIMIT = 180; // 3 minutes
  const pendingUsers = users.filter(u => !u.is_verified);
  const verifiedUsers = users.filter(u => u.is_verified);

  const rooms = Object.values(systemStatuses || {});
  const sortedRooms = rooms.sort((a, b) => b.dbLevel - a.dbLevel);

  return (
    <ScrollView contentContainerStyle={styles.facultyScrollContainer}>
      <Text style={styles.roleTitle}>Faculty Dashboard</Text>

      {/* Pending Requests */}
      <AccountRequestList 
        pendingUsers={pendingUsers} 
        onApprove={onApprove} 
        onReject={onReject}
        loading={loading}
      />

      {/* Verified Accounts */}
      <Text style={styles.listHeader_verified}>
        Verified Teachers ({verifiedUsers.length})
      </Text>

      {verifiedUsers.map((user) => (
        <View key={user.id} style={styles.verifiedCard}>
          <Text style={styles.verifiedName}>{user.name}</Text>
          <Text style={styles.verifiedEmail}>{user.email}</Text>
          <Text style={styles.verifiedRole}>{user.role} • {user.classroomId}</Text>
        </View>
      ))}

      {/* Real-time Room Status */}
      <Text style={styles.listHeader_verified}>Live Classroom Status</Text>

      {sortedRooms.map((room) => {
        const color = COLOR_MAP[room.led] || '#6b7280';
        return (
          <View key={room.classroomId} style={[styles.roomCard, { borderLeftColor: color }]}>
            <View style={styles.roomHeader}>
              <Text style={styles.roomTitle}>Classroom {room.classroomId}</Text>
              <Text style={[styles.roomStatus, { color }]}>{room.status}</Text>
            </View>
            <Text style={styles.dataText}>Noise: {room.dbLevel.toFixed(1)} dB</Text>
            <Text style={styles.dataText}>Breach: {formatDuration(room.breachDuration)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

// --- Teacher Dashboard ---
const TeacherDashboard = ({ user, systemStatuses }) => {
  if (!user.is_verified) {
    return (
      <View style={styles.container}>
        <View style={styles.pendingCard}>
          <Clock size={48} color="#fbbf24" />
          <Text style={styles.pendingTitle}>Awaiting Approval</Text>
          <Text style={styles.pendingText}>
            Your account is pending faculty verification. You will be notified once approved.
          </Text>
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  const room = systemStatuses[user.classroomId];
  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No assigned classroom yet.</Text>
      </View>
    );
  }

  const color = COLOR_MAP[room.led] || '#6b7280';

  return (
    <ScrollView contentContainerStyle={styles.teacherScrollContainer}>
      <View style={[styles.statusMonitorCard, { borderColor: color }]}>
        <Text style={[styles.roomTitle, { color }]}>Classroom {room.classroomId}</Text>
        <Text style={styles.dataText}>Noise: {room.dbLevel.toFixed(1)} dB</Text>
        <Text style={styles.dataText}>Status: {room.status}</Text>
        <Text style={styles.dataText}>Breach: {formatDuration(room.breachDuration)}</Text>
      </View>
    </ScrollView>
  );
};

// --- Main Dashboard Component ---
const DashboardScreen = ({ navigation }) => {
  const { user, logout, allUsers, fetchAllUsers, systemStatuses, isLoading } = useNPMS();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.headerLogoutButton} onPress={logout}>
            <LogOut size={20} color="white" />
          </TouchableOpacity>
        </View>
      ),
      title: `${user?.role || 'User'} Dashboard`
    });
  }, [navigation, user]);

  // --- Approve / Reject Actions ---
  const approveUser = async (id) => {
    try {
      await supabase.from('profiles').update({ is_verified: true }).eq('id', id);
      Alert.alert("Success", "User approved successfully.");
      fetchAllUsers();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const rejectUser = async (id) => {
    try {
      await supabase.from('profiles').delete().eq('id', id);
      Alert.alert("User Rejected", "Account request has been deleted.");
      fetchAllUsers();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user.role === 'Faculty' ? (
        <FacultyDashboard 
          users={allUsers} 
          onApprove={approveUser} 
          onReject={rejectUser} 
          systemStatuses={systemStatuses} 
          loading={isLoading}
        />
      ) : (
        <TeacherDashboard user={user} systemStatuses={systemStatuses} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  facultyScrollContainer: { padding: 16 },
  roleTitle: { fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  listHeader: { fontSize: 18, fontWeight: '700', color: '#ef4444', marginTop: 10 },
  listHeader_verified: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 20 },
  headerLogoutButton: { padding: 5 },

  // Request Cards
  requestCard: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 5, borderLeftColor: '#fbbf24', flexDirection: 'row', justifyContent: 'space-between' },
  requestDetails: { flex: 1 },
  requestName: { fontSize: 16, fontWeight: 'bold' },
  requestInfo: { fontSize: 13, color: '#4b5563' },
  requestActions: { flexDirection: 'row', alignItems: 'center' },
  approveButton: { backgroundColor: '#059669', padding: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  approveButtonText: { color: 'white', fontWeight: '600', marginLeft: 4 },
  rejectButton: { backgroundColor: '#ef4444', padding: 8, borderRadius: 6 },

  noRequestsContainer: { backgroundColor: 'white', padding: 20, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  noRequestsText: { marginTop: 10, color: '#374151' },

  // Verified Users
  verifiedCard: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 6 },
  verifiedName: { fontWeight: 'bold', fontSize: 15 },
  verifiedEmail: { color: '#4b5563', fontSize: 13 },
  verifiedRole: { fontSize: 13, color: '#059669' },

  // Room Status
  roomCard: { backgroundColor: 'white', borderRadius: 8, borderLeftWidth: 5, marginBottom: 8, padding: 10 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  roomTitle: { fontWeight: '700', fontSize: 16 },
  roomStatus: { fontSize: 14, fontWeight: '700' },
  dataText: { fontSize: 14, color: '#374151' },

  // Pending / Teacher
  pendingCard: { backgroundColor: 'white', padding: 30, borderRadius: 12, margin: 20, alignItems: 'center', borderWidth: 2, borderColor: '#fbbf24' },
  pendingTitle: { fontSize: 22, fontWeight: 'bold', color: '#fbbf24' },
  pendingText: { textAlign: 'center', color: '#4b5563', marginTop: 10 },
  teacherScrollContainer: { padding: 20 },
  statusMonitorCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, borderWidth: 2, marginBottom: 20 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 40, fontWeight: '700' },
});

export default DashboardScreen;
