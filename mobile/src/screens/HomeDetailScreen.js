import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, RefreshControl, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceService from '../services/deviceService';
import LogService from '../services/logService';
import HomeService from '../services/homeService';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const ESP32_IP = "http://10.73.28.213"; 

export default function HomeDetailScreen({ route, navigation }) {
  const { homeId, homeName } = route.params;
  const { user } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [userRole, setUserRole] = useState('user');

  // Sensor state
  const [temp, setTemp] = useState("--");
  const [hum, setHum] = useState("--");
  const [isConn, setIsConn] = useState(false);

  useEffect(() => {
    loadDevices();
    loadRequests();
    
    LogService.createLog(homeId, 'remote_app').catch(console.error);

    // Bắt đầu Fetch Sensor Khi vào trang chi tiết nhà
    fetchSensors();
    const timer = setInterval(fetchSensors, 5000);
    return () => clearInterval(timer);
  }, [homeId]);

  const fetchSensors = async () => {
    try {
      const res = await axios.get(`${ESP32_IP}/sensor`, { timeout: 2000 });
      setTemp(Number(res.data.temp).toFixed(1));
      setHum(Number(res.data.hum).toFixed(1));
      setIsConn(true);
    } catch (e) {
      setIsConn(false);
      console.log("Lỗi kết nối ESP32 - Sensor");
    }
  };

  const loadRequests = async () => {
    try {
      const response = await HomeService.getHomeRequests(homeId, 'pending');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await DeviceService.getHomeDevices(homeId);
      setDevices(response.data || []);
      
      const homesResponse = await HomeService.getUserHomes();
      const currentHome = homesResponse.data?.find(h => h.id === homeId);
      if (currentHome) {
        setUserRole(currentHome.role || 'user');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.error || 'Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleDevice = async (deviceId) => {
    try {
      await DeviceService.toggleDevice(deviceId);
      await loadDevices();
    } catch (error) {
      Alert.alert('Lỗi', error.error || 'Không thể cập nhật thiết bị');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await HomeService.approveRequest(requestId);
      Alert.alert('Thành công', 'Đã duyệt yêu cầu tham gia nhà');
      await loadRequests();
      await loadDevices(); 
    } catch (error) {
      Alert.alert('Lỗi', error.error || 'Không thể duyệt yêu cầu');
    }
  };

  const handleRejectRequest = async (requestId) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn từ chối yêu cầu này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối', style: 'destructive',
          onPress: async () => {
            try {
              await HomeService.rejectRequest(requestId);
              Alert.alert('Thành công', 'Đã từ chối yêu cầu');
              await loadRequests();
            } catch (error) {
              Alert.alert('Lỗi', error.error || 'Không thể từ chối yêu cầu');
            }
          }
        }
      ]
    );
  };

  const handleUpdateIntensity = async (deviceId, currentIntensity) => {
    Alert.prompt(
      'Cập nhật cường độ', 'Nhập giá trị (0-100):',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'OK',
          onPress: async (value) => {
            const intensity = parseInt(value);
            if (isNaN(intensity) || intensity < 0 || intensity > 100) {
              Alert.alert('Lỗi', 'Giá trị phải từ 0-100');
              return;
            }
            try {
              await DeviceService.updateIntensity(deviceId, intensity);
              await loadDevices();
            } catch (error) {
              Alert.alert('Lỗi', error.error || 'Không thể cập nhật');
            }
          }
        }
      ], 'plain-text', currentIntensity?.toString() || '50'
    );
  };

  const getDeviceIcon = (type) => {
    const icons = { light: 'bulb', fan: 'snow', door: 'lock-closed', ac: 'thermometer' };
    return icons[type] || 'hardware-chip';
  };

  const getDeviceColor = (type) => {
    const colors = { light: '#FFD700', fan: '#00E5FF', door: '#FF9800', ac: '#B388FF' };
    return colors[type] || '#B0BEC5';
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0A1128', '#121F3A']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.loadingText}>Đang tải trang điều khiển...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />
      <LinearGradient colors={['#0A1128', '#121F3A']} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{homeName}</Text>
        {userRole === 'admin' ? (
          <View style={styles.headerActions}>
            {/* Nút Log khuôn mặt */}
            <TouchableOpacity
              onPress={() => navigation.navigate('FaceLog', { homeId, homeName })}
              style={styles.headerActionButton}
            >
              <Ionicons name="shield-checkmark-outline" size={24} color="#00E5FF" />
            </TouchableOpacity>
            {/* Nút Thông báo yêu cầu tham gia */}
            <TouchableOpacity
              onPress={() => { loadRequests(); setShowRequestsModal(true); }}
              style={[styles.headerActionButton, { marginLeft: 8 }]}
            >
              <Ionicons name="notifications-outline" size={24} color="#00E5FF" />
              {requests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{requests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadDevices(); loadRequests(); fetchSensors(); }} tintColor="#00E5FF" />}
        showsVerticalScrollIndicator={false}
      >

        {/* --- KHU VỰC CẢM BIẾN (Di chuyển từ HomeScreen) --- */}
        <View style={styles.sensorContainer}>
          <LinearGradient colors={['rgba(255, 59, 48, 0.15)', 'rgba(255, 59, 48, 0.05)']} style={[styles.sensorCard, { borderColor: 'rgba(255, 59, 48, 0.3)' }]}>
            <View style={styles.sensorIconOuterRed}>
              <Ionicons name="thermometer-outline" size={28} color="#FF3B30" />
            </View>
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorValue}>{temp}°C</Text>
              <Text style={styles.sensorLabel}>Nhiệt độ</Text>
            </View>
          </LinearGradient>

          <LinearGradient colors={['rgba(0, 229, 255, 0.15)', 'rgba(0, 122, 255, 0.05)']} style={[styles.sensorCard, { borderColor: 'rgba(0, 229, 255, 0.3)' }]}>
            <View style={styles.sensorIconOuterBlue}>
              <Ionicons name="water-outline" size={28} color="#00E5FF" />
            </View>
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorValue}>{hum}%</Text>
              <Text style={styles.sensorLabel}>Độ ẩm</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.connStatusWrapper}>
          <View style={[styles.connStatusDot, { backgroundColor: isConn ? '#00FF00' : '#FF3B30' }]} />
          <Text style={styles.connStatusText}>
            {isConn ? "Trạm ESP32 Đang Bật" : "Trạm ESP32 Đang Tắt"}
          </Text>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>THIẾT BỊ ĐIỀU KHIỂN</Text>

        {/* Device List */}
        {devices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="hardware-chip-outline" size={64} color="#607D8B" />
            <Text style={styles.emptyText}>Chưa có thiết bị nào được cấp quyền</Text>
          </View>
        ) : (
          devices.map((device) => (
            <LinearGradient key={device.id} colors={['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.2)']} style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <View style={[styles.deviceIconBg, { backgroundColor: `rgba(${parseInt(getDeviceColor(device.type).slice(1,3),16)},${parseInt(getDeviceColor(device.type).slice(3,5),16)},${parseInt(getDeviceColor(device.type).slice(5,7),16)},0.2)` }]}>
                  <Ionicons name={getDeviceIcon(device.type)} size={28} color={getDeviceColor(device.type)} />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceType}>{device.type.toUpperCase()}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleButton, device.status ? styles.toggleButtonActive : styles.toggleButtonInactive]}
                  onPress={() => handleToggleDevice(device.id)}
                >
                  <Ionicons name={device.status ? 'power' : 'power-outline'} size={24} color={device.status ? '#0A1128' : '#607D8B'} />
                </TouchableOpacity>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Trạng thái:</Text>
                <Text style={[styles.statusValue, { color: device.status ? '#00E5FF' : '#FF3B30' }]}>
                  {device.status ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
                </Text>
              </View>

              {device.intensity !== null && device.intensity !== undefined && (
                <View style={styles.intensityRow}>
                  <Text style={styles.intensityLabel}>Mức độ: {device.intensity}%</Text>
                  <TouchableOpacity style={styles.intensityButton} onPress={() => handleUpdateIntensity(device.id, device.intensity)}>
                    <Ionicons name="options-outline" size={20} color="#00E5FF" />
                    <Text style={styles.intensityButtonText}>Điều chỉnh</Text>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          ))
        )}
      </ScrollView>

      {/* Modal hiển thị requests */}
      <Modal visible={showRequestsModal} animationType="fade" transparent={true} onRequestClose={() => setShowRequestsModal(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#121F3A', '#0A1128']} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yêu Cầu Tham Gia</Text>
              <TouchableOpacity onPress={() => setShowRequestsModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={28} color="#00E5FF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {requests.length === 0 ? (
                <View style={styles.emptyRequestsContainer}>
                  <Ionicons name="finger-print-outline" size={64} color="#607D8B" />
                  <Text style={styles.emptyRequestsText}>Không có yêu cầu chờ duyệt</Text>
                </View>
              ) : (
                requests.map((req) => (
                  <View key={req.id_request} style={styles.requestCard}>
                    <View style={styles.requestInfo}>
                      <View style={styles.requestUserIcon}>
                        <Ionicons name="person" size={24} color="#00E5FF" />
                      </View>
                      <View style={styles.requestDetails}>
                        <Text style={styles.requestUserName}>{req.id_user?.fullname || req.id_user?.username || 'Người dùng'}</Text>
                        <Text style={styles.requestUserInfo}>@{req.id_user?.username}</Text>
                        {req.id_user?.email && <Text style={styles.requestUserInfo}>{req.id_user.email}</Text>}
                      </View>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity style={[styles.requestButton, styles.approveButton]} onPress={() => handleApproveRequest(req.id_request)}>
                        <Ionicons name="checkmark" size={20} color="#0A1128" />
                        <Text style={styles.requestButtonTextApprove}>CHO PHÉP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.requestButton, styles.rejectButton]} onPress={() => handleRejectRequest(req.id_request)}>
                        <Ionicons name="close" size={20} color="#FF3B30" />
                        <Text style={styles.requestButtonTextReject}>TỪ CHỐI</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#00E5FF', fontWeight: 'bold' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  backButton: { padding: 5, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  placeholder: { width: 38 },
  scrollView: { flex: 1, paddingBottom: 20 },
  
  // SENSOR STYLES (from Home)
  sensorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginTop: 20 },
  sensorCard: { flex: 0.48, padding: 15, borderRadius: 16, borderTopWidth: 2, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'column', alignItems: 'center' },
  sensorIconOuterRed: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 59, 48, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  sensorIconOuterBlue: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 229, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  sensorInfo: { alignItems: 'center' },
  sensorValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  sensorLabel: { fontSize: 13, color: '#90A4AE', letterSpacing: 0.5 },
  
  connStatusWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, backgroundColor: 'rgba(255,255,255,0.03)', alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  connStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8, shadowColor: '#00FF00', shadowOffset: { width:0, height:0 }, shadowOpacity: 0.8, shadowRadius: 5 },
  connStatusText: { fontSize: 13, color: '#90A4AE', fontWeight: '600' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#00E5FF', marginHorizontal: 20, marginBottom: 10, letterSpacing: 1.5, marginTop: 10 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { marginTop: 15, fontSize: 14, color: '#90A4AE' },
  
  deviceCard: { marginHorizontal: 15, marginTop: 15, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.1)' },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  deviceIconBg: { width: 55, height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  deviceInfo: { flex: 1, marginLeft: 15 },
  deviceName: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  deviceType: { fontSize: 12, color: '#00E5FF', marginTop: 4, fontWeight: 'bold', letterSpacing: 1 },
  
  toggleButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  toggleButtonInactive: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' },
  toggleButtonActive: { backgroundColor: '#00E5FF', borderColor: '#00E5FF', shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 5 },
  
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  statusLabel: { fontSize: 14, color: '#90A4AE' },
  statusValue: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  intensityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  intensityLabel: { fontSize: 14, color: '#90A4AE' },
  intensityButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)' },
  intensityButtonText: { marginLeft: 8, color: '#00E5FF', fontWeight: 'bold' },

  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerActionButton: { padding: 8, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 12, position: 'relative' },
  notificationButton: { padding: 8, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 12, position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, borderWidth: 1, borderColor: '#0A1128' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 229, 255, 0.2)' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  modalCloseButton: { padding: 5, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 12 },
  modalBody: { padding: 20 },
  
  emptyRequestsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyRequestsText: { marginTop: 15, fontSize: 16, color: '#90A4AE' },
  
  requestCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' },
  requestInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  requestUserIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 229, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)' },
  requestDetails: { flex: 1 },
  requestUserName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  requestUserInfo: { fontSize: 13, color: '#90A4AE', marginBottom: 2 },
  
  requestActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  requestButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  approveButton: { backgroundColor: '#00E5FF', borderColor: '#00E5FF', shadowColor: '#00E5FF', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.5, shadowRadius: 5, elevation: 3 },
  rejectButton: { backgroundColor: 'transparent', borderColor: '#FF3B30' },
  requestButtonTextApprove: { color: '#0A1128', fontWeight: '900', marginLeft: 8 },
  requestButtonTextReject: { color: '#FF3B30', fontWeight: 'bold', marginLeft: 8 },
});
