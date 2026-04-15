import React, { useState, useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { 
  View, Text, TextInput, TouchableOpacity, 
  Alert, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { login, register, isLoading } = useContext(AuthContext);

  // --- STATE CHO CÁC TRƯỜNG DỮ LIỆU ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');     
  const [phone, setPhone] = useState('');     

  const handleSubmit = async () => {
    if (!username || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập Tài khoản và Mật khẩu");
      return;
    }

    if (isLoginMode) {
      const result = await login(username, password);
      if (!result.success) {
        Alert.alert("Đăng nhập thất bại", result.message);
      }
    } else {
      const registerData = {
        username: username,
        password: password,
        fullname: fullname,
        email: email,
        phone: phone
      };

      const result = await register(registerData);
      
      if (result.success) {
        Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.");
        setIsLoginMode(true); 
        setPassword('');
      } else {
        Alert.alert("Đăng ký thất bại", result.message);
      }
    }
  };

  const handleFaceLogin = () => {
    navigation.navigate('FaceLogin');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient colors={['#0A1128', '#121F3A']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerContainer}>
            <Ionicons name="home-outline" size={50} color="#00E5FF" />
            <Text style={styles.title}>
              {isLoginMode ? 'SMART HOUSE' : 'ĐĂNG KÝ HỆ THỐNG'}
            </Text>
            <Text style={styles.subtitle}>
              {isLoginMode ? 'Xác thực định danh bằng sinh trắc học hoặc mật khẩu' : 'Điền thông tin để tạo tài khoản mới'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#00E5FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tài khoản (*)"
                placeholderTextColor="#607D8B"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#00E5FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu (*)"
                placeholderTextColor="#607D8B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true} 
              />
            </View>

            {!isLoginMode && (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color="#00E5FF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Họ và tên"
                    placeholderTextColor="#607D8B"
                    value={fullname}
                    onChangeText={setFullname}
                  />
                </View>
                
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#00E5FF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#607D8B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#00E5FF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Số điện thoại"
                    placeholderTextColor="#607D8B"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
              <LinearGradient colors={['#00E5FF', '#007AFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
                {isLoading ? (
                  <ActivityIndicator color="#0A1128" />
                ) : (
                  <Text style={styles.btnText}>
                    {isLoginMode ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* --- NÚT ĐĂNG NHẬP BẰNG FACE ID (MẪU MỚI TO, Ở GIỮA) --- */}
          {isLoginMode && (
            <View style={styles.faceLoginContainer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Phương thức đăng nhập nhanh</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.faceLoginBtnWrapper} 
                onPress={handleFaceLogin}  
                disabled={isLoading}
              >
                <View style={styles.faceLoginBtnOuter}>
                  <LinearGradient colors={['#0A1128', '#1A2A47']} style={styles.faceLoginBtnInner}>
                    <Ionicons name="scan-outline" size={48} color="#00E5FF" />
                  </LinearGradient>
                </View>
                <Text style={styles.faceLoginText}>Face ID Scan</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.switchBtn} onPress={() => setIsLoginMode(!isLoginMode)}>
            <Text style={styles.switchText}>
              {isLoginMode ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <Text style={styles.switchTextHighlight}>
                {isLoginMode ? "Đăng ký tại đây" : "Quay lại đăng nhập"}
              </Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 24, 
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40
  },
  title: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#FFFFFF',
    marginTop: 15,
    letterSpacing: 2
  },
  subtitle: {
    fontSize: 14,
    color: '#90A4AE',
    marginTop: 8,
    textAlign: 'center'
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: { 
    flex: 1,
    paddingVertical: 15,
    color: '#FFF',
    fontSize: 16,
  },
  button: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  btnText: { 
    color: '#0A1128', 
    fontWeight: 'bold', 
    fontSize: 16,
    letterSpacing: 1
  },
  faceLoginContainer: {
    marginTop: 35,
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  dividerText: {
    color: '#90A4AE',
    marginHorizontal: 15,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  faceLoginBtnWrapper: {
    alignItems: 'center',
  },
  faceLoginBtnOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 2,
    backgroundColor: '#00E5FF', // Border màu neon
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 10
  },
  faceLoginBtnInner: {
    flex: 1,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceLoginText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  switchBtn: {
    marginTop: 40,
    alignItems: 'center',
    padding: 10,
    marginBottom: 20
  },
  switchText: { 
    color: '#90A4AE',
    fontSize: 14,
  },
  switchTextHighlight: {
    color: '#00E5FF',
    fontWeight: 'bold'
  }
});