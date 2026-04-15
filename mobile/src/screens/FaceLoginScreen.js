import React, { useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AuthContext } from '../context/AuthContext';

export default function FaceLoginScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const { loginWithFace } = useContext(AuthContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current) {
      Alert.alert("Lỗi", "Không tìm thấy camera.");
      return;
    }

    setIsProcessing(true);

    try {
      // 👇 FIX CHÍNH: Delay nhỏ để Android kịp init camera buffer
      await new Promise(resolve => setTimeout(resolve, 300));

      // 👇 Dùng options tối thiểu nhất có thể
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 0.5,
      });

      console.log("Chụp thành công:", photo.uri);
      
      const result = await loginWithFace(photo.uri);

      if (result.success) {
        Alert.alert("Thành công", "Nhận diện khuôn mặt thành công!");
      } else {
        Alert.alert("Thất bại", result.message);
        setIsProcessing(false);
      }
    } catch (error) {
      console.log("LỖI CAPTURE:", error.message);
      Alert.alert("Lỗi", error.message || "Quá trình quét bị gián đoạn.");
      setIsProcessing(false);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 👇 QUAN TRỌNG: Giữ CameraView LUÔN MOUNTED, chỉ ẩn UI bằng overlay */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="front"
          ref={cameraRef}
          onCameraReady={() => {
            console.log("Camera ready!");
            setIsCameraReady(true);
          }}
        />

        {/* Nếu đang xử lý thì che camera bằng overlay thay vì unmount */}
        {isProcessing ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00FF00" />
            <Text style={styles.loadingText}>Đang nhận diện khuôn mặt...</Text>
          </View>
        ) : (
          <>
            <View style={styles.overlay}>
              <Text style={styles.instructionText}>Đưa khuôn mặt vào khung hình</Text>
              <View style={styles.faceOutline} />
              {/* Debug: hiện trạng thái camera */}
              <Text style={{ color: isCameraReady ? '#00FF00' : 'orange', marginTop: 8 }}>
                {isCameraReady ? '● Camera sẵn sàng' : '● Đang khởi động camera...'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.captureBtn, !isCameraReady && { opacity: 0.5 }]}
                onPress={handleCapture}
                disabled={!isCameraReady}
              >
                <Text style={styles.captureBtnText}>
                  {isCameraReady ? "QUÉT ĐĂNG NHẬP" : "ĐANG KHỞI ĐỘNG..."}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelBtnText}>HỦY</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
// bla bla
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  cameraContainer: { flex: 1 },
  // 👇 Loading che lên camera thay vì unmount camera
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#00FF00', fontSize: 16, marginTop: 15, fontWeight: 'bold' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  instructionText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  faceOutline: { width: 250, height: 320, borderWidth: 3, borderColor: '#00FF00', borderRadius: 150, borderStyle: 'dashed' },
  buttonContainer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  captureBtn: { backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, marginBottom: 15 },
  captureBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { color: '#fff', fontSize: 16 },
  btn: { padding: 15, backgroundColor: 'blue', borderRadius: 8, alignSelf: 'center', marginTop: '50%' },
  btnText: { color: 'white' }
});