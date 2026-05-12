import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Alert, Modal, Linking
} from 'react-native';
import { useNPMS } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import { generateAndPrintReport } from '../lib/ReportGenerator';
import {
  LogOut, Check, X, Bell, ShieldCheck, Phone, 
  MessageSquare, XCircle, Printer, Edit
} from 'lucide-react-native';

const API_BASE_URL = 'http://192.168.1.14:8000/api';

const normalizeRoom = (roomString) => {
    if (!roomString) return 'unknown_room';
    return roomString.toString().toLowerCase()
        .replace(/room/g, '').replace(/class/g, '')
        .replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '').trim();
};

const isRecentAlert = (createdAt) => {
    if (!createdAt) return false;
    const now = new Date();
    const logTime = new Date(createdAt);
    return ((now - logTime) / 1000 / 60) < 5; 
};

// ==========================================
// 2. FACULTY VIEW (With Report & Actions)
// ==========================================
const FacultyDashboard = ({ users, onApprove, onReject, onDelete, roomAlerts, refreshData, navigation }) => {
  const pendingUsers = users.filter(u => !u.is_verified);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleRoomClick = (room) => {
      setSelectedRoom(room);
      setModalVisible(true);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    await generateAndPrintReport(users);
    setIsPrinting(false);
  };

  const performCall = () => {
      if (!selectedRoom?.teacher?.phone_num) {
          Alert.alert("No Number", "This teacher hasn't provided a phone number.");
          return;
      }
      Linking.openURL(`tel:${selectedRoom.teacher.phone_num}`);
  };

  const performMessage = () => {
      if (!selectedRoom?.teacher?.phone_num) {
          Alert.alert("No Number", "This teacher hasn't provided a phone number.");
          return;
      }
      const message = `Notice: High noise levels detected in ${selectedRoom.roomId}. Please manage the class.`;
      Linking.openURL(`sms:${selectedRoom.teacher.phone_num}?body=${message}`);
  };

  const monitoredRooms = useMemo(() => {
    const list = [];
    Object.values(roomAlerts).forEach(log => {
        const iotRoomClean = normalizeRoom(log.room_id);
        const teacher = users.find(u => 
            u.role === 'Teacher' && normalizeRoom(u.room_num) === iotRoomClean
        );
        list.push({
            roomId: log.room_id,
            logData: log,
            teacher: teacher || null,
            status: isRecentAlert(log.created_at) ? 'NOISE DETECTED' : 'Quiet',
            isAlert: isRecentAlert(log.created_at)
        });
    });

    users.forEach(u => {
        if(u.role === 'Teacher' && u.room_num) {
            const teacherRoomClean = normalizeRoom(u.room_num);
            const alreadyExists = list.find(item => normalizeRoom(item.roomId) === teacherRoomClean);
            if (!alreadyExists) {
                list.push({ roomId: u.room_num, logData: null, teacher: u, status: 'Quiet', isAlert: false });
            }
        }
    });
    return list.sort((a, b) => (b.isAlert === a.isAlert) ? 0 : b.isAlert ? 1 : -1);
  }, [roomAlerts, users]);

  return (
    <View style={{flex: 1}}>
        <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refreshData} />}
        >
        {/* Approvals */}
        {pendingUsers.length > 0 && (
            <View style={styles.section}>
            <Text style={styles.sectionHeader}>Pending Approvals</Text>
            {pendingUsers.map(item => (
                <View key={item.id} style={styles.requestCard}>
                <View style={{flex:1}}>
                    <Text style={styles.boldText}>{item.name}</Text>
                    <Text style={styles.subText}>{item.role} • {item.room_num}</Text>
                </View>
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => onApprove(item.id)} style={styles.btnApprove}><Check size={16} color="white"/></TouchableOpacity>
                    <TouchableOpacity onPress={() => onReject(item.id)} style={styles.btnReject}><X size={16} color="white"/></TouchableOpacity>
                </View>
                </View>
            ))}
            </View>
        )}

        {/* Room Monitoring Header */}
        <View style={styles.headerRow}>
            <View>
                <Text style={styles.sectionHeader}>Room Monitoring</Text>
                <Text style={styles.subHeader}>Tap a card to take action</Text>
            </View>
            
            <TouchableOpacity 
                style={styles.printBtn} 
                onPress={handlePrint}
                disabled={isPrinting}
            >
                {isPrinting ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <>
                        <Printer size={18} color="white" style={{marginRight: 6}} />
                        <Text style={styles.printBtnText}>Report</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>

        {monitoredRooms.map((room, index) => {
            const isAlert = room.isAlert;
            const dbLevel = room.logData ? room.logData.db_level.toFixed(1) : '0.0';

            return (
              <RoomCard 
                key={index}
                room={room}
                isAlert={isAlert}
                dbLevel={dbLevel}
                onPress={() => handleRoomClick(room)}
              />
            );
        })}
        </ScrollView>

        {/* --- 3. THE POPUP MODAL --- */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Manage {selectedRoom?.roomId}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <XCircle size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalStatus}>
                        Status: <Text style={{fontWeight: 'bold', color: selectedRoom?.isAlert ? '#ef4444' : '#059669'}}>
                            {selectedRoom?.status}
                        </Text>
                    </Text>

                    {selectedRoom?.teacher ? (
                        <View style={styles.contactContainer}>
                            <Text style={styles.contactLabel}>Teacher: {selectedRoom.teacher.name}</Text>
                            <Text style={styles.contactLabel}>Number: {selectedRoom.teacher.phone_num || 'N/A'}</Text>
                            
                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity style={styles.btnCall} onPress={performCall}>
                                    <Phone size={20} color="white" style={{marginRight: 8}}/>
                                    <Text style={styles.btnText}>Call</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.btnMessage} onPress={performMessage}>
                                    <MessageSquare size={20} color="white" style={{marginRight: 8}}/>
                                    <Text style={styles.btnText}>Msg</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.btnEdit} 
                                    onPress={() => {
                                        setModalVisible(false);
                                        navigation.navigate('ManageTeacher', { teacher: selectedRoom.teacher });
                                    }}
                                >
                                    <Edit size={20} color="white" />
                                </TouchableOpacity>
                            </View>

                            {/* NEW DELETE BUTTON */}
                            <TouchableOpacity 
                                style={styles.btnDelete} 
                                onPress={() => {
                                    setModalVisible(false);
                                    onDelete(selectedRoom.teacher.id);
                                }}
                            >
                                <Text style={styles.btnText}>🗑 Delete Teacher Account</Text>
                            </TouchableOpacity>

                        </View>
                    ) : (
                        <Text style={styles.noTeacherText}>No teacher assigned to this room.</Text>
                    )}
                </View>
            </View>
        </Modal>
    </View>
  );
};

// ==========================================
// 4. TEACHER VIEW (Standard)
// ==========================================
const TeacherDashboard = ({ user, roomAlerts }) => {
  if (!user.is_verified) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text style={styles.pendingText}>Verification Pending</Text>
      </View>
    );
  }
  const myLogKey = Object.keys(roomAlerts).find(logKey => normalizeRoom(logKey) === normalizeRoom(user.room_num));
  const myLog = myLogKey ? roomAlerts[myLogKey] : null;
  const isAlert = myLog ? isRecentAlert(myLog.created_at) : false;
  const dbDisplay = myLog ? myLog.db_level.toFixed(1) : '0.0';

  return (
    <View style={styles.container}>
      <View style={[styles.largeCard, isAlert ? styles.bgRedLight : styles.bgGreenLight]}>
        {isAlert ? <Bell size={80} color="#ef4444"/> : <ShieldCheck size={80} color="#059669"/>}
        <Text style={styles.largeStatus}>{isAlert ? "NOISE DETECTED" : "ROOM QUIET"}</Text>
        <Text style={styles.hugeDb}>{dbDisplay} <Text style={{fontSize: 30}}>dB</Text></Text>
        <Text style={styles.infoText}>Room: {user.room_num}</Text>
      </View>
    </View>
  );
};

// ==========================================
// 5. MAIN DASHBOARD CONTROLLER
// ==========================================
const DashboardScreen = ({ navigation }) => {
  // Pulled setAllUsers from context
  const { user, logout, allUsers, setAllUsers, fetchAllUsers, roomAlerts, isLoading } = useNPMS();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{marginRight: 10}} onPress={logout}><LogOut size={24} color="white" /></TouchableOpacity>
      ),
      title: `Hello, ${user?.name?.split(' ')[0] || 'User'}`
    });
  }, [navigation, user]);

  const approveUser = async (id) => {
    // INSTANT UI UPDATE: Verify them in UI instantly
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: true } : u));
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${id}/approve/`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error("Permission Denied.");
    } catch (error) {
      Alert.alert("Error", error.message);
      fetchAllUsers(); // rollback if failed
    }
  };

  const rejectUser = async (id) => {
    // INSTANT UI UPDATE: Remove from UI instantly
    setAllUsers(prev => prev.filter(u => u.id !== id));
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${id}/`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) fetchAllUsers(); // rollback if failed
    } catch (error) {
      console.log("Error rejecting user", error);
      fetchAllUsers(); 
    }
  };

  const deleteUser = (id) => {
    Alert.alert(
      "Delete Teacher",
      "Are you sure you want to permanently delete this teacher's account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            // INSTANT UI UPDATE: Remove from UI instantly
            setAllUsers(prev => prev.filter(u => u.id !== id));
            try {
              const response = await fetch(`${API_BASE_URL}/profiles/${id}/`, { 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });
              if (!response.ok) throw new Error("Delete failed");
            } catch (error) {
              Alert.alert("Error", "Failed to delete user.");
              fetchAllUsers(); // rollback
            }
          }
        }
      ]
    );
  };

  if (isLoading) return <ActivityIndicator size="large" color="#059669" style={{marginTop: 50}} />;
  if (!user) return <Text>Error loading profile</Text>;

  const isFaculty = (user.role || '').toLowerCase() === 'faculty';

  return (
    <View style={styles.container}>
      {isFaculty ? (
        <FacultyDashboard 
            users={allUsers} 
            onApprove={approveUser} 
            onReject={rejectUser} 
            onDelete={deleteUser} 
            roomAlerts={roomAlerts} 
            refreshData={fetchAllUsers}
            navigation={navigation} 
        />
      ) : (
        <TeacherDashboard user={user} roomAlerts={roomAlerts} />
      )}
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, marginTop: 10 },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  subHeader: { fontSize: 14, color: '#6b7280' },
  
  printBtn: { backgroundColor: '#374151', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, elevation: 2 },
  printBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  section: { marginBottom: 20 },
  
  requestCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  btnApprove: { backgroundColor: '#059669', padding: 10, borderRadius: 8 },
  btnReject: { backgroundColor: '#ef4444', padding: 10, borderRadius: 8 },
  boldText: { fontWeight: 'bold', fontSize: 16, color: '#1f2937' },
  subText: { color: '#6b7280', fontSize: 13 },

  roomCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 15, padding: 15, borderLeftWidth: 6, elevation: 3 },
  borderRed: { borderLeftColor: '#ef4444' },
  borderGreen: { borderLeftColor: '#059669' },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomTitle: { fontSize: 18, fontWeight: '800', color: '#374151' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  bgRed: { backgroundColor: '#fee2e2' },
  bgGreen: { backgroundColor: '#d1fae5' },
  badgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 10 },
  detailText: { fontSize: 14, color: '#4b5563' },
  bold: { fontWeight: 'bold', color: '#111827' },
  teacherBox: { marginTop: 8, padding: 10, backgroundColor: '#f9fafb', borderRadius: 8 },
  unassignedBox: { backgroundColor: '#fef3c7' },
  label: { fontSize: 12, color: '#6b7280' },
  teacherName: { fontWeight: 'bold', color: '#374151', fontSize: 15 },

  largeCard: { margin: 20, padding: 30, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 5, flex: 1, maxHeight: 500, backgroundColor: 'white' },
  bgRedLight: { backgroundColor: '#fef2f2', borderWidth: 3, borderColor: '#ef4444' },
  bgGreenLight: { backgroundColor: '#f0fdf4', borderWidth: 3, borderColor: '#059669' },
  largeStatus: { fontSize: 26, fontWeight: '900', marginTop: 20, marginBottom: 5, textTransform: 'uppercase' },
  hugeDb: { fontSize: 60, fontWeight: '900', color: '#1f2937' },
  infoText: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 20 },
  pendingText: { fontSize: 18, fontWeight: 'bold', color: '#fbbf24', marginTop: 20 },

  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  modalStatus: { fontSize: 16, color: '#4b5563', marginBottom: 20 },
  contactContainer: { width: '100%', alignItems: 'flex-start' },
  contactLabel: { fontSize: 16, color: '#374151', marginBottom: 5 },
  noTeacherText: { color: '#9ca3af', fontStyle: 'italic', marginTop: 10 },
  
  modalBtnRow: { flexDirection: 'row', gap: 8, marginTop: 20, width: '100%' },
  btnCall: { flex: 2, backgroundColor: '#059669', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10 },
  btnMessage: { flex: 2, backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10 },
  btnEdit: { flex: 1, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10 },
  btnDelete: { width: '100%', backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginTop: 15 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default DashboardScreen;