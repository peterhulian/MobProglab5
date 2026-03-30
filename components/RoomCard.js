import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RoomCard = ({ room, isAlert, dbLevel, onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.roomCard, isAlert ? styles.borderRed : styles.borderGreen]}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomTitle}>{room.roomId}</Text>
        <View style={[styles.badge, isAlert ? styles.bgRed : styles.bgGreen]}>
          <Text style={styles.badgeText}>{room.status}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.roomDetails}>
        {room.logData ? (
          <Text style={styles.detailText}>
            Noise Level: <Text style={styles.bold}>{dbLevel} dB</Text>
          </Text>
        ) : (
          <Text style={[styles.detailText, {fontStyle:'italic', color: '#9ca3af'}]}>
            No recent noise.
          </Text>
        )}
        <View style={[styles.teacherBox, !room.teacher && styles.unassignedBox]}>
          <Text style={styles.label}>Assigned Teacher:</Text>
          <Text style={styles.teacherName}>{room.teacher ? room.teacher.name : 'Unassigned'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});

export default RoomCard;