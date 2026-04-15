import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import FaceService from '../services/FaceService';

export default function FaceManagementScreen({ navigation }) {
  const { user, updateUserAvatar } = useContext(AuthContext);
  const [faceData, setFaceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Để ý: Chúng ta phải re-fetch mỗi khi màn hình được focus 
    // (nếu người dùng vừa đi quét mặt xong quay lại)
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFaceStatus();
    });
    
    fetchFaceStatus(); // Vẫn gọi lần đầu khi component mount
    return unsubscribe;
  }, [navigation]);

  // Hàm kiểm tra xem user đã có FaceID trong DB chưa
  const fetchFaceStatus = async () => {
    try {
      setLoading(true);
      const data = await FaceService.checkFaceStatus(user.id);
      setFaceData(data);
      if (data && data.avatar_url) {
        updateUserAvatar(data.avatar_url);
      }
    } catch (error) {
      console.log("Error fetching face status", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFace = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa toàn bộ dữ liệu khuôn mặt?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Gọi Service Xóa
              await FaceService.deleteFaceData(user.id);
              
              Alert.alert("Thành công", "Đã xóa dữ liệu khuôn mặt");
              setFaceData({ has_face: false }); 
              // Cập nhật lại context để trang chủ mất Avatar cũ
              updateUserAvatar(null);
              
            } catch (e) {
              console.log("Delete Error:", e);
              // Lấy thông báo lỗi từ backend nếu có, không thì báo lỗi chung
              Alert.alert("Lỗi", e.error || "Không thể xóa dữ liệu, vui lòng thử lại sau.");
            }
          } 
        }
      ]
    );
  };
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />
      {/* Background Gradient */}
      <LinearGradient colors={['#0A1128', '#121F3A']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản Lý Khuôn Mặt</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.cardContainer}>
        {faceData && faceData.has_face ? (
          // --- TRƯỜNG HỢP: ĐÃ ĐĂNG KÝ ---
          <View style={styles.content}>
            <View style={styles.statusBadge}>
              <Ionicons name="shield-checkmark" size={20} color="#00E5FF" />
              <Text style={styles.statusText}>Đã bảo mật bằng Face ID</Text>
            </View>
            
            <View style={styles.avatarBorder}>
              <Image 
                source={{ uri: faceData.avatar_url || 'https://via.placeholder.com/150' }} 
                style={styles.facePreview} 
              />
            </View>
            
            <Text style={styles.info}>Dữ liệu khuôn mặt của bạn đang được mã hóa an toàn trên hệ thống máy chủ SmartHouse.</Text>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteFace}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.deleteBtnText}>Xóa dữ liệu khuôn mặt</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // --- TRƯỜNG HỢP: CHƯA ĐĂNG KÝ ---
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Ionicons name="scan-outline" size={60} color="#00E5FF" />
            </View>
            
            <Text style={styles.title}>Tính năng Chưa kích hoạt</Text>
            <Text style={styles.description}>
              Đăng ký khuôn mặt giúp hệ thống xác thực nhanh với độ tin cậy tuyệt đối, không cần mật khẩu.
            </Text>

            <TouchableOpacity 
              onPress={() => navigation.navigate('FaceScanScreen', { userId: user.id })}
            >
              <LinearGradient colors={['#00E5FF', '#007AFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.registerBtn}>
                <Ionicons name="person-add" size={24} color="#0A1128" />
                <Text style={styles.registerBtnText}>Bắt đầu Quét FaceID</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
  },
  backButton: { padding: 5, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A1128' },
  cardContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
  },
  content: { 
    width: '100%', alignItems: 'center', backgroundColor: 'rgba(18, 31, 58, 0.8)',
    borderRadius: 24, padding: 30, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  statusBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 229, 255, 0.1)', 
    paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginBottom: 30,
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)'
  },
  statusText: { color: '#00E5FF', fontWeight: 'bold', marginLeft: 8 },
  avatarBorder: {
    padding: 4, borderRadius: 80, backgroundColor: 'rgba(0, 229, 255, 0.2)', marginBottom: 25,
  },
  facePreview: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: '#00E5FF' },
  info: { textAlign: 'center', color: '#B0BEC5', marginBottom: 30, lineHeight: 22, fontSize: 14 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)' },
  deleteBtnText: { color: '#FF3B30', fontWeight: 'bold', marginLeft: 8 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  description: { textAlign: 'center', color: '#90A4AE', marginBottom: 35, fontSize: 15, lineHeight: 22 },
  registerBtn: { flexDirection: 'row', paddingHorizontal: 25, paddingVertical: 16, borderRadius: 30, alignItems: 'center', shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  registerBtnText: { color: '#0A1128', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});