import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeService from '../services/homeService';

export default function CreateHomeScreen({ navigation }) {
  const [homeName, setHomeName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateHome = async () => {
    if (!homeName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhà');
      return;
    }

    setLoading(true);
    try {
      const response = await HomeService.createHome(homeName.trim());
      Alert.alert('Thành công', 'Đã tạo Hub điều khiển mới!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', error.error || 'Không thể tạo Hub mới');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />
      <LinearGradient colors={['#0A1128', '#121F3A']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Khởi Tạo Hub</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.iconContainerOuter}>
            <View style={styles.iconContainerInner}>
              <Ionicons name="cube-outline" size={64} color="#00E5FF" />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Hệ thống Hub giúp bạn quản lý tập trung và chia sẻ quyền điều khiển các thiết bị SmartHouse.</Text>
          </View>

          <Text style={styles.label}>TÊN ĐỊNH DANH HUB</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business" size={24} color="#00E5FF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Căn hộ số 69, Biệt thự biển..."
              placeholderTextColor="#607D8B"
              value={homeName}
              onChangeText={setHomeName}
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          <TouchableOpacity
            style={[styles.buttonWrapper, loading && styles.buttonDisabled]}
            onPress={handleCreateHome}
            disabled={loading}
          >
            <LinearGradient colors={['#00E5FF', '#007AFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
              {loading ? (
                <ActivityIndicator color="#0A1128" />
              ) : (
                <>
                  <Ionicons name="planet" size={24} color="#0A1128" />
                  <Text style={styles.buttonText}>KÍCH HOẠT HUB</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0A1128',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  backButton: {
    padding: 5,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 38,
  },
  formContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  iconContainerOuter: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainerInner: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(0, 229, 255, 0.4)',
    shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15, borderRadius: 12, marginBottom: 35,
    borderLeftWidth: 4, borderLeftColor: '#00E5FF',
  },
  infoText: {
    color: '#B0BEC5', fontSize: 13, lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00E5FF',
    marginBottom: 10,
    letterSpacing: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 14,
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: '#FFF',
    fontSize: 16,
  },
  buttonWrapper: {
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  button: {
    padding: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0A1128',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 10,
  },
});
