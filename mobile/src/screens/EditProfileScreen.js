import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import AuthService from '../services/authService'; 

export default function EditProfileScreen({ navigation }) {
  const { user, login } = useContext(AuthContext); 

  const [fullname, setFullname] = useState(user?.fullname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const payload = {
        user_id: user.id, 
        fullname: fullname,
        email: email,
        phone: phone,
      };

      if (password.trim() !== '') {
        payload.password = password;
      }

      const result = await AuthService.updateProfile(payload);
      Alert.alert("Thành công", "Dữ liệu định danh đã được cập nhật!");
      login({ ...user, ...result.data }); 
      navigation.goBack(); 

    } catch (error) {
      console.log("Update Profile Error:", error);
      Alert.alert("Lỗi", error.error || "Hệ thống từ chối cập nhật hồ sơ, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />
      <LinearGradient colors={['#0A1128', '#121F3A']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ Sơ Định Danh</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow}>
              <Ionicons name="person-circle-outline" size={100} color="#00E5FF" />
            </View>
            <Text style={styles.userId}>USER ID: {user?.id.substring(0, 8).toUpperCase()}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>TÊN NGƯỜI DÙNG</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#00E5FF" style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Họ và tên" 
                placeholderTextColor="#607D8B"
                value={fullname}
                onChangeText={setFullname}
              />
            </View>

            <Text style={styles.label}>THƯ ĐIỆN TỬ</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#00E5FF" style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Email tham gia mạng" 
                placeholderTextColor="#607D8B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>MÃ GIAO TIẾP</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#00E5FF" style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Số điện thoại" 
                placeholderTextColor="#607D8B"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <Text style={styles.label}>MÃ BẢO MẬT MỚI</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#00E5FF" style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="Bỏ trống nếu giữ nguyên" 
                placeholderTextColor="#607D8B"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.updateBtnWrapper} onPress={handleUpdate} disabled={isLoading}>
              <LinearGradient colors={['#00E5FF', '#007AFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.updateBtn}>
                {isLoading ? (
                  <ActivityIndicator color="#0A1128" />
                ) : (
                  <>
                    <Ionicons name="sync-circle-outline" size={24} color="#0A1128" style={{marginRight: 8}} />
                    <Text style={styles.updateBtnText}>ĐỒNG BỘ DỮ LIỆU</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0, 229, 255, 0.2)'
  },
  backButton: { padding: 5, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  placeholder: { width: 38 },
  
  avatarContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  avatarGlow: { 
    shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 25, elevation: 15,
    backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 60, padding: 5, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.4)'
  },
  userId: { color: '#00E5FF', marginTop: 15, fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
  
  formContainer: { paddingHorizontal: 25 },
  label: { fontSize: 12, fontWeight: '900', color: '#00E5FF', marginBottom: 8, letterSpacing: 1.5, marginTop: 15 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', paddingHorizontal: 15
  },
  icon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#FFF' },
  
  updateBtnWrapper: { marginTop: 40, shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  updateBtn: { flexDirection: 'row', paddingVertical: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  updateBtnText: { color: '#0A1128', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 }
});