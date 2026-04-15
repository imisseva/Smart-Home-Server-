import React, { useContext, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, Alert, SafeAreaView, StatusBar, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import HomeService from '../services/homeService';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHomes();
  }, []);

  const loadHomes = async () => {
    try {
      setLoading(true);
      const response = await HomeService.getUserHomes();
      setHomes(response.data || []);
    } catch (error) {
      Alert.alert('Lỗi', error.error || 'Không thể tải danh sách nhà');
      setHomes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomes();
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn kết thúc phiên đăng nhập?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: () => logout(), style: 'destructive' }
    ]);
  };

  const handleEditProfile = () => navigation.navigate('EditProfile');
  const handleJoinHome = () => navigation.navigate('JoinHome');
  const handleCreateHome = () => navigation.navigate('CreateHome');
  const goToHomeDetail = (homeId, homeName) => navigation.navigate('HomeDetail', { homeId, homeName });
  const handleFaceScan = () => navigation.navigate('FaceManagement');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />
      <LinearGradient colors={['#0A1128', '#121F3A']} style={StyleSheet.absoluteFillObject} />

      {/* --- PHẦN 1: HEADER --- */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="hardware-chip-outline" size={28} color="#00E5FF" />
          <Text style={styles.appName}>SMART HOUSE</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="power" size={26} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5FF" />}
        showsVerticalScrollIndicator={false}
      >
        {loading && homes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={styles.loadingText}>Đang đồng bộ dữ liệu...</Text>
          </View>
        ) : (
          <>
            {/* --- PHẦN 2: THÔNG TIN USER --- */}
            <LinearGradient colors={['rgba(0, 229, 255, 0.1)', 'rgba(0, 122, 255, 0.05)']} style={styles.userInfoSection}>
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/150?img=3' }} 
                  style={styles.avatar} 
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.greeting}>Xin chào,</Text>
                <Text style={styles.userName}>
                  {user?.fullname || user?.username || "Thành viên"}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.userRole}>Đã định danh</Text>
                </View>
              </View>
            </LinearGradient>

            {/* --- PHẦN 3: CÁC NÚT TÍNH NĂNG --- */}
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.actionBtnWrapper} onPress={handleEditProfile}>
                <View style={[styles.actionBtn, { borderColor: 'rgba(0, 229, 255, 0.3)' }]}>
                  <Ionicons name="planet" size={28} color="#00E5FF" />
                </View>
                <Text style={styles.actionText}>Tài khoản</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtnWrapper} onPress={handleJoinHome}>
                <View style={[styles.actionBtn, { borderColor: 'rgba(138, 43, 226, 0.3)' }]}>
                  <Ionicons name="log-in-outline" size={28} color="#B388FF" />
                </View>
                <Text style={styles.actionText}>Tham gia</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtnWrapper} onPress={handleCreateHome}>
                <View style={[styles.actionBtn, { borderColor: 'rgba(255, 152, 0, 0.3)' }]}>
                  <Ionicons name="cube-outline" size={28} color="#FF9800" />
                </View>
                <Text style={styles.actionText}>Tạo Hub</Text>
              </TouchableOpacity>
            </View>

            {/* --- PHẦN 4: DANH SÁCH NHÀ --- */}
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>CÁC HUB ĐIỀU KHIỂN</Text>
              {homes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="radio-outline" size={48} color="#607D8B" />
                  <Text style={styles.emptyText}>Hệ thống trống. Hãy tạo hoặc tham gia một Hub.</Text>
                </View>
              ) : (
                homes.map((home) => (
                  <TouchableOpacity 
                    key={home.id} 
                    onPress={() => goToHomeDetail(home.id, home.name)}
                  >
                    <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.2)']} style={styles.homeCard}>
                      <View style={styles.homeIconBg}>
                        <Ionicons name="aperture" size={26} color="#00E5FF" />
                      </View>
                      <View style={styles.homeInfo}>
                        <Text style={styles.homeName}>{home.namehome || home.name}</Text>
                        <Text style={styles.homeRole}>Quyền năng: {home.role === 'admin' ? 'Quản trị viên' : 'Khách'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color="#00E5FF" />
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* --- PHẦN 5: FAB QUẢN LÝ KHUÔN MẶT --- */}
      <TouchableOpacity style={styles.fabScan} onPress={handleFaceScan}>
        <LinearGradient colors={['#00E5FF', '#007AFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
          <Ionicons name="scan-outline" size={32} color="#0A1128" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  scrollContent: { paddingBottom: 110 },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  appName: { fontSize: 20, fontWeight: '900', color: '#FFF', marginLeft: 10, letterSpacing: 2 },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 12 },
  
  userInfoSection: {
    flexDirection: 'row', padding: 20,
    marginTop: 20, marginHorizontal: 15, borderRadius: 20, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)'
  },
  avatarBorder: {
    padding: 3, borderRadius: 33, backgroundColor: 'rgba(0, 229, 255, 0.5)'
  },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#0A1128' },
  userDetails: { marginLeft: 15, flex: 1 },
  greeting: { fontSize: 13, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  roleBadge: { 
    alignSelf: 'flex-start', marginTop: 6, backgroundColor: 'rgba(0, 229, 255, 0.2)', 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 
  },
  userRole: { fontSize: 11, color: '#00E5FF', fontWeight: 'bold', textTransform: 'uppercase' },

  actionContainer: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 25 },
  actionBtnWrapper: { alignItems: 'center', flex: 1 },
  actionBtn: { 
    width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1
  },
  actionText: { fontSize: 12, fontWeight: 'bold', color: '#B0BEC5' },
  
  listSection: { flex: 1, marginTop: 35, paddingHorizontal: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#00E5FF', marginBottom: 15, marginLeft: 5, letterSpacing: 1.5 },
  homeCard: { 
    flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, marginBottom: 12, 
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.1)'
  },
  homeIconBg: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(0, 229, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  homeInfo: { flex: 1, marginLeft: 15 },
  homeName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5 },
  homeRole: { fontSize: 12, color: '#90A4AE', marginTop: 4 },
  
  emptyContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { textAlign: 'center', color: '#90A4AE', marginTop: 15, fontSize: 14 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  loadingText: { marginTop: 15, color: '#00E5FF', fontWeight: 'bold', letterSpacing: 1 },
  
  fabScan: { 
    position: 'absolute', bottom: 30, alignSelf: 'center', 
    shadowColor: "#00E5FF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10 
  },
  fabInner: { 
    width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)'
  }
});