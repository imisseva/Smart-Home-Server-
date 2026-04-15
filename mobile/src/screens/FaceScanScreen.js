import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
// Import cấu hình và Service của bạn
import FaceService from '../services/FaceService';

const ANGLES = [
  { id: 'center', instruction: 'Hãy nhìn THẲNG vào camera' },
  { id: 'up', instruction: 'Hãy nhìn LÊN TRÊN một chút' },
  { id: 'down', instruction: 'Hãy nhìn XUỐNG DƯỚI một chút' },
  { id: 'left', instruction: 'Hãy quay mặt sang Phải' },
  { id: 'right', instruction: 'Hãy quay mặt sang Trái' }
];

// Hàm "phiên dịch" lỗi AI sang lời nhắc dễ hiểu cho người dùng
const getActionableMessage = (errorString, expected) => {
  if (!errorString) return "Vui lòng điều chỉnh lại tư thế khuôn mặt.";
  const errLower = errorString.toLowerCase();

  let detected = "";
  if (errLower.includes("cui xuong")) detected = "cúi xuống";
  else if (errLower.includes("ngua len")) detected = "ngẩng lên";
  else if (errLower.includes("nghieng trai")) detected = "nghiêng trái";
  else if (errLower.includes("nghieng phai")) detected = "nghiêng phải";

  if (expected === 'center') {
    if (detected === "cúi xuống") return "Bạn đang cúi mặt, hãy nhích lên một chút nhé.";
    if (detected === "ngẩng lên") return "Bạn đang ngẩng đầu, hãy cúi xuống một chút.";
    if (detected === "nghiêng trái" || detected === "nghiêng phải") return "Bạn đang ngoảnh mặt, hãy nhìn thẳng vào camera.";
    return "Hãy nhìn thẳng vào camera nhé.";
  }

  if (expected === 'up') {
    return "Hãy ngẩng đầu lên cao hơn một xíu nữa.";
  }

  if (expected === 'down') {
    return "Hãy cúi đầu xuống thêm một chút nữa.";
  }

  if (expected === 'left') return "Sai hướng rồi, hãy quay mặt sang TRÁI.";
  if (expected === 'right') return "Sai hướng rồi, hãy quay mặt sang PHẢI.";

  return "Tư thế chưa đúng, hãy làm theo hướng dẫn.";
};

export default function FaceScanScreen({ route, navigation }) {
  const { userId } = route.params || { userId: 'user_123' };

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Các State quản lý
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Animation cho tia quét
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // --- LOGIC HIỆU ỨNG QUÉT CHỈ CHẠY KHI ĐANG CHỜ AI XỬ LÝ ---
  useEffect(() => {
    if (isCapturing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1200, useNativeDriver: true })
        ])
      ).start();
    } else {
      scanLineAnim.stopAnimation();
      scanLineAnim.setValue(0);
    }
  }, [isCapturing]);

  // --- LOGIC TỰ ĐỘNG ĐẾM NGƯỢC ---
  useEffect(() => {
    let timer;
    if (isScanning && currentStep < ANGLES.length && !isCapturing && !isUploading && !scanError) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        handleAutoCapture();
      }
    }
    return () => clearTimeout(timer);
  }, [isScanning, countdown, currentStep, isCapturing, isUploading, scanError]);

  // --- HÀM TỰ ĐỘNG CHỤP & KIỂM TRA BẰNG AI ---
  const handleAutoCapture = async () => {
    if (!cameraRef.current) return;
    setIsCapturing(true);
    setScanError(null);

    try {
      // Yêu cầu camera trả về cả uri và base64
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true
      });
      const expectedAngle = ANGLES[currentStep].id;

      // 1. Gửi base64 cho Server AI kiểm tra tư thế
      const result = await FaceService.checkPose(photo.base64, expectedAngle);

      // NẾU LỖI -> Dịch lỗi, hiện trên màn hình, tắt quét
      if (!result.valid) {
        const friendlyMessage = getActionableMessage(result.reason, expectedAngle);
        setScanError(friendlyMessage);
        setIsCapturing(false);
        setIsScanning(false); // Ép nút chuyển về "BẮT ĐẦU QUÉT"
        return;
      }

      // 2. NẾU ĐÚNG -> Chỉ lưu URI vào mảng (giống code cũ) để gửi lên Django cho nhẹ
      const newImage = { angle: ANGLES[currentStep].id, uri: photo.uri };
      const updatedImages = [...images, newImage];
      setImages(updatedImages);

      if (currentStep < ANGLES.length - 1) {
        setCurrentStep(prev => prev + 1);
        setCountdown(3);
        setIsCapturing(false);
      } else {
        setIsScanning(false);
        setIsCapturing(false);
        uploadToServer(updatedImages); // Gọi hàm Upload lên Django
      }
    } catch (error) {
      setScanError("Quá trình xử lý ảnh bị gián đoạn. Vui lòng thử lại.");
      setIsCapturing(false);
      setIsScanning(false);
    }
  };

  // --- HÀM ĐÓNG GÓI VÀ GỬI LÊN DJANGO SERVER ---
  // --- HÀM GỌI SERVICE ĐỂ GỬI LÊN DJANGO SERVER ---
  const uploadToServer = async (capturedImages) => {
    setIsUploading(true);

    try {
      // Chỉ cần 1 dòng duy nhất để gọi Service!
      await FaceService.uploadFaceImages(userId, capturedImages);

      Alert.alert("Thành công", "Đã gửi dữ liệu khuôn mặt lên hệ thống an toàn!");
      navigation.goBack();

    } catch (error) {
      console.log("Upload Error:", error);
      Alert.alert("Lỗi Upload", error.error || error.reason || "Không thể gửi ảnh lên Server. Vui lòng kiểm tra mạng.");

      // Reset lại luồng quét nếu lỗi
      setImages([]);
      setCurrentStep(0);
      setCountdown(3);
    } finally {
      setIsUploading(false);
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

  // Xác định màu sắc của khung Oval
  const outlineColor = scanError ? '#FF3B30' : (isCapturing ? '#00FF00' : 'rgba(0, 255, 0, 0.4)');

  return (
    <View style={styles.container}>
      {isUploading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 20, fontSize: 16 }}>Đang đóng gói và gửi về Server...</Text>
        </View>
      ) : (
        <CameraView style={styles.camera} facing="front" ref={cameraRef}>
          <View style={styles.overlay}>

            {/* Hướng dẫn trên cùng */}
            {(!scanError) && (
              <View style={styles.instructionBox}>
                <Text style={styles.stepText}>Bước {currentStep + 1}/5</Text>
                <Text style={styles.instructionText}>{ANGLES[currentStep].instruction}</Text>
              </View>
            )}

            {/* KHUNG KHUÔN MẶT */}
            <View style={styles.faceOutlineContainer}>
              <View style={[
                styles.faceOutline,
                { borderColor: outlineColor, borderStyle: (isCapturing || scanError) ? 'solid' : 'dashed' }
              ]} />

              {/* Hiệu ứng quét */}
              {isCapturing && !scanError && (
                <View style={styles.scannerClipper}>
                  <Animated.View style={[
                    styles.scanLine,
                    {
                      transform: [{
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 316]
                        })
                      }]
                    }
                  ]} />
                </View>
              )}

              {/* Số đếm ngược */}
              {isScanning && !isCapturing && !scanError && (
                <Text style={styles.countdownText}>{countdown}</Text>
              )}
            </View>

            {/* UI BÁO LỖI */}
            {scanError && (
              <View style={styles.inlineErrorBox}>
                <Text style={styles.errorTitle}>Tư Thế Chưa Chuẩn</Text>
                <Text style={styles.errorMessage}>{scanError}</Text>
              </View>
            )}
          </View>

          {/* Nút điều khiển Bắt đầu / Hủy */}
          <View style={styles.buttonContainer}>
            {!isScanning ? (
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => {
                  setScanError(null);
                  setCountdown(3);
                  setIsScanning(true);
                }}
              >
                <Text style={styles.startBtnText}>BẮT ĐẦU QUÉT</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setIsScanning(false);
                  setCountdown(3);
                  setCurrentStep(0);
                  setImages([]);
                  setScanError(null);
                }}
              >
                <Text style={styles.cancelBtnText}>HỦY QUÉT</Text>
              </TouchableOpacity>
            )}
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  instructionBox: {
    position: 'absolute', top: 60,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 10, alignItems: 'center', width: '85%'
  },
  stepText: { color: '#00FF00', fontWeight: 'bold', fontSize: 18, marginBottom: 5 },
  instructionText: { color: 'white', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },

  faceOutlineContainer: { width: 250, height: 320, justifyContent: 'center', alignItems: 'center' },
  faceOutline: { position: 'absolute', width: '100%', height: '100%', borderWidth: 4, borderRadius: 150 },

  scannerClipper: { position: 'absolute', width: '100%', height: '100%', borderRadius: 150, overflow: 'hidden' },
  scanLine: {
    width: '100%', height: 4, backgroundColor: '#00FF00',
    shadowColor: '#00FF00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5
  },

  countdownText: { position: 'absolute', fontSize: 120, fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.8)' },

  inlineErrorBox: {
    position: 'absolute', bottom: 120, width: '85%',
    backgroundColor: 'rgba(20, 20, 20, 0.85)', padding: 15, borderRadius: 10,
    borderWidth: 1, borderColor: '#FF3B30', alignItems: 'center',
  },
  errorTitle: { color: '#FF3B30', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  errorMessage: { color: 'white', fontSize: 15, textAlign: 'center' },

  buttonContainer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  startBtn: { backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
  startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  cancelBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  btn: { padding: 15, backgroundColor: 'blue', borderRadius: 8, alignSelf: 'center', marginTop: '50%' },
  btnText: { color: 'white' }
});