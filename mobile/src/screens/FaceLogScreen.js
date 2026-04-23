import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Modal,
  Image, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LogService from '../services/logService';

export default function FaceLogScreen({ route, navigation }) {
  const { homeId, homeName } = route.params;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [homeId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await LogService.getHomeLogs(homeId, 100);
      // Lọc chỉ lấy log face_recognition (từ ESP32 camera)
      const faceLogs = (response.data || []).filter(l => l.method === 'face_recognition');
      // Sắp xếp mới nhất lên đầu
      faceLogs.sort((a, b) => new Date(b.log_time) - new Date(a.log_time));
      setLogs(faceLogs);
    } catch (err) {
      console.error('Lỗi load face logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLogs();
  }, [homeId]);

  const formatTime = (isoString) => {
    if (!isoString) return '---';
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const renderLogItem = ({ item }) => {
    const isStranger = item.is_stranger;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (item.image_url) {
            setSelectedLog(item);
            setShowImageModal(true);
          }
        }}
      >
        <LinearGradient
          colors={isStranger
            ? ['rgba(255, 59, 48, 0.12)', 'rgba(255, 59, 48, 0.04)']
            : ['rgba(0, 229, 255, 0.08)', 'rgba(0, 229, 255, 0.02)']}
          style={[styles.logCard, { borderColor: isStranger ? 'rgba(255, 59, 48, 0.35)' : 'rgba(0, 229, 255, 0.2)' }]}
        >
          {/* Avatar / Face thumbnail */}
          <View style={[styles.avatarWrapper, { borderColor: isStranger ? '#FF3B30' : '#00E5FF' }]}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.avatarImg} />
            ) : (
              <Ionicons name={isStranger ? 'warning' : 'person'} size={28} color={isStranger ? '#FF3B30' : '#00E5FF'} />
            )}
          </View>

          {/* Info */}
          <View style={styles.logInfo}>
            <View style={styles.logTopRow}>
              <Text style={[styles.logName, { color: isStranger ? '#FF3B30' : '#FFF' }]} numberOfLines={1}>
                {item.user_fullname || (isStranger ? 'Người lạ' : 'Không xác định')}
              </Text>
              {isStranger && (
                <View style={styles.strangerBadge}>
                  <Ionicons name="warning" size={12} color="#FF3B30" />
                  <Text style={styles.strangerBadgeText}>NGƯỜI LẠ</Text>
                </View>
              )}
            </View>
            <Text style={styles.logTime}>
              <Ionicons name="time-outline" size={12} color="#607D8B" /> {formatTime(item.log_time)}
            </Text>
          </View>

          {/* Arrow */}
          {item.image_url && (
            <Ionicons name="chevron-forward" size={20} color={isStranger ? '#FF3B30' : '#00E5FF'} style={{ opacity: 0.7 }} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Lịch sử ra vào</Text>
          <Text style={styles.headerSubtitle}>{homeName}</Text>
        </View>
        <TouchableOpacity onPress={loadLogs} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#00E5FF" />
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      {!loading && logs.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Ionicons name="people" size={16} color="#00E5FF" />
            <Text style={styles.summaryText}>{logs.filter(l => !l.is_stranger).length} lượt vào</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="warning" size={16} color="#FF3B30" />
            <Text style={[styles.summaryText, { color: '#FF3B30' }]}>{logs.filter(l => l.is_stranger).length} người lạ</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="camera-outline" size={72} color="#37474F" />
          <Text style={styles.emptyTitle}>Chưa có lịch sử</Text>
          <Text style={styles.emptySubtitle}>Camera ESP32 chưa ghi nhận lượt ra vào nào</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id_loghome}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5FF" />}
        />
      )}

      {/* Modal xem ảnh full */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowImageModal(false)} />
          <View style={styles.imageModalContent}>
            {/* Header modal */}
            <View style={styles.imageModalHeader}>
              <View>
                <Text style={[styles.imageModalName, { color: selectedLog?.is_stranger ? '#FF3B30' : '#FFF' }]}>
                  {selectedLog?.user_fullname || (selectedLog?.is_stranger ? 'Người lạ' : 'Không xác định')}
                </Text>
                <Text style={styles.imageModalTime}>{formatTime(selectedLog?.log_time)}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowImageModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Ảnh */}
            {selectedLog?.image_url ? (
              <Image
                source={{ uri: selectedLog.image_url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={64} color="#607D8B" />
                <Text style={{ color: '#607D8B', marginTop: 10 }}>Không có ảnh</Text>
              </View>
            )}

            {/* Badge người lạ */}
            {selectedLog?.is_stranger && (
              <View style={styles.strangerAlert}>
                <Ionicons name="warning" size={18} color="#FF3B30" />
                <Text style={styles.strangerAlertText}>Người này không thuộc danh sách thành viên trong nhà</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  backButton: { padding: 5, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 12 },
  refreshButton: { padding: 5, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderRadius: 12 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: '#00E5FF', marginTop: 2, opacity: 0.8 },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginTop: 15, marginBottom: 5,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryText: { fontSize: 14, color: '#00E5FF', fontWeight: '600' },
  summaryDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 20 },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  loadingText: { marginTop: 15, color: '#00E5FF', fontWeight: 'bold' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#607D8B', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },

  listContent: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 30 },

  logCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 16, marginBottom: 12,
    borderWidth: 1,
  },
  avatarWrapper: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  logInfo: { flex: 1, marginLeft: 14 },
  logTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  logName: { fontSize: 16, fontWeight: '700', flex: 1 },
  strangerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,59,48,0.4)',
  },
  strangerBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FF3B30' },
  logTime: { fontSize: 12, color: '#607D8B' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  imageModalContent: {
    width: '90%', maxHeight: '85%',
    backgroundColor: '#121F3A',
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  imageModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,229,255,0.15)',
  },
  imageModalName: { fontSize: 18, fontWeight: 'bold' },
  imageModalTime: { fontSize: 12, color: '#90A4AE', marginTop: 4 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  fullImage: { width: '100%', height: 380 },
  noImagePlaceholder: {
    height: 250, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  strangerAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.35)',
  },
  strangerAlertText: { flex: 1, fontSize: 13, color: '#FF3B30', lineHeight: 18 },
});
