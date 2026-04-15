import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, FlatList, SafeAreaView, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeService from '../services/homeService';

export default function JoinHomeScreen({ navigation }) {
  const [homeName, setHomeName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!homeName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập định danh Hub');
      return;
    }

    setSearching(true);
    try {
      const response = await HomeService.searchHomes(homeName.trim());
      setSearchResults(response.data || []);
      
      if (response.data.length === 0) {
        Alert.alert('Thông báo', 'Không có tín hiệu Hub nào khớp với tên này');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.error || 'Mất kết nối dò quét Hub');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinHome = async (homeId, homeName) => {
    setLoading(true);
    try {
      await HomeService.joinHome(homeId);
      Alert.alert('Tín hiệu phân hồi', 'Đã cấp tín hiệu xin quyền quản trị Hub. Vui lòng chờ phê duyệt!', [
        {
          text: 'RÕ',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      Alert.alert('Từ chối', error.error || 'Server chặn yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const renderHomeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.homeItem}
      onPress={() => handleJoinHome(item.id, item.namehome)}
      disabled={loading}
    >
      <View style={styles.homeItemIcon}>
        <Ionicons name="pulse" size={24} color="#00E5FF" />
      </View>
      <View style={styles.homeItemInfo}>
        <Text style={styles.homeItemName}>{item.namehome}</Text>
        <Text style={styles.homeItemId}>Mã định danh: {item.id}</Text>
      </View>
      <Ionicons name="enter-outline" size={24} color="#00E5FF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />
      <LinearGradient colors={['#0A1128', '#121F3A']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dò Tìm Tín Hiệu Hub</Text>
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
            <LinearGradient colors={['rgba(0, 229, 255, 0.2)', 'rgba(0, 0, 0, 0.3)']} style={styles.iconContainerInner}>
              <Ionicons name="wifi" size={64} color="#00E5FF" />
            </LinearGradient>
          </View>

          <Text style={styles.label}>TẦN SỐ / ĐỊNH DANH HUB</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Tên nhà..."
              placeholderTextColor="#607D8B"
              value={homeName}
              onChangeText={setHomeName}
              autoCapitalize="words"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={[styles.searchButton, searching && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color="#0A1128" size="small" />
              ) : (
                <LinearGradient colors={['#00E5FF', '#007AFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.searchButtonInner}>
                  <Ionicons name="scan-circle-outline" size={26} color="#0A1128" />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.badgeHint}>
            <Ionicons name="information-circle-outline" size={16} color="#00E5FF" style={{marginRight: 6}} />
            <Text style={styles.hint}>Nhập tên để rà quét và lấy quyền đăng nhập.</Text>
          </View>

          {/* Kết quả tìm kiếm */}
          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultHeader}>
                <View style={styles.resultDot} />
                <Text style={styles.resultsTitle}>TÍN HIỆU TÌM ĐƯỢC ({searchResults.length})</Text>
              </View>
              <FlatList
                data={searchResults}
                renderItem={renderHomeItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0, 229, 255, 0.2)'
  },
  backButton: { padding: 5, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  placeholder: { width: 38 },
  
  formContainer: { flex: 1, padding: 24, paddingTop: 40 },
  
  iconContainerOuter: { alignItems: 'center', marginBottom: 40 },
  iconContainerInner: { 
    width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(0, 229, 255, 0.4)',
    shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15
  },
  
  label: { fontSize: 13, fontWeight: '900', color: '#00E5FF', marginBottom: 10, letterSpacing: 2 },
  
  searchContainer: { flexDirection: 'row', marginBottom: 25 },
  input: {
    flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 18, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', fontSize: 16, color: '#FFF', marginRight: 15
  },
  searchButton: { 
    width: 65, height: '100%', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#00E5FF', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5
  },
  searchButtonInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchButtonDisabled: { opacity: 0.6 },
  
  badgeHint: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 229, 255, 0.05)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' },
  hint: { fontSize: 13, color: '#90A4AE', fontStyle: 'italic' },
  
  resultsContainer: { marginTop: 40 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  resultDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FF00', marginRight: 10, shadowColor: '#00FF00', shadowOffset:{width:0, height:0}, shadowOpacity: 1, shadowRadius: 5 },
  resultsTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
  
  homeItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)'
  },
  homeItemIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0, 229, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  homeItemInfo: { flex: 1 },
  homeItemName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 4, letterSpacing: 0.5 },
  homeItemId: { fontSize: 12, color: '#90A4AE' },
});
