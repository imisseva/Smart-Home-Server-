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
  const [isScanActive, setIsScanActive] = useState(true);

  React.useEffect(() => {
    let active = true;
    let timerId;

    const continuousScan = async () => {
      // Loop liên tục nếu camera đã sẵn sàng và cờ quét đang bật
      while (active && isCameraReady && isScanActive) {
        try {
          if (!cameraRef.current) break;
          
          // Chụp ngầm 100% không làm chớp UI
          const photo = await cameraRef.current.takePictureAsync({ 
            quality: 0.3,
            base64: false
          });
          
          // Bộ đếm thông minh: Nếu Backend xử lý rỗng thì trả về rất nhanh (<400ms)
          // Nếu Backend kẹt lại >600ms, nghĩa là đã TÌM THẤY MẶT và đang gửi lên AI.
          // Lúc này ta lập tức show Loading che màn hình lại!
          let loadingTimer = setTimeout(() => {
            if (active) setIsProcessing(true);
          }, 600);
          
          const result = await loginWithFace(photo.uri, true);
          clearTimeout(loadingTimer);
          
          if (result.success) {
            active = false;
            setIsScanActive(false);
            setIsProcessing(false);
            Alert.alert("Thành công", "Đăng nhập Face ID thành công!");
            break;
          } else {
            const errorMsg = result.message || "";
            
            // CHỈ đá ra khi thuật toán MDB / AI đã trích xuất được khuôn mặt rõ ràng
            // nhưng không trùng với tài khoản nào trong hệ thống.
            if (errorMsg.includes("Khuôn mặt không khớp") || errorMsg.includes("AI nhận diện ra User nhưng không tồn tại")) {
               active = false;
               setIsScanActive(false);
               setIsProcessing(false);
               Alert.alert("Thất bại", errorMsg);
               navigation.goBack();
               break;
            } else {
               // Không tìm thấy mặt, nhắm mắt, hình mờ...
               // -> Ẩn Loading (nếu lỡ hiện) và im lặng thử lại
               setIsProcessing(false);
               await new Promise(res => setTimeout(res, 800));
            }
          }
        } catch (error) {
          // Lỗi quá trình, nghỉ chút lặp lại ngầm
          setIsProcessing(false);
          await new Promise(res => setTimeout(res, 1000));
        }
      }
    };

    if (isCameraReady && isScanActive) {
       // Đợi 1 giây để tay cầm chắc chắn
       timerId = setTimeout(() => {
          if (active) continuousScan();
       }, 1000);
    }

    return () => { 
       active = false; 
       if (timerId) clearTimeout(timerId);
    };
  }, [isCameraReady, isScanActive]);


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

        {isProcessing ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00FF00" style={{ transform: [{ scale: 1.5 }] }} />
            <Text style={styles.loadingText}>ĐANG PHÂN TÍCH FACE ID...</Text>
            <Text style={{ color: '#ccc', marginTop: 10 }}>Đang đối chiếu dữ liệu với máy chủ</Text>
          </View>
        ) : (
          <>
            <View style={styles.overlay}>
              <Text style={styles.instructionText}>
                Đang tìm kiếm khuôn mặt...
              </Text>
              <View style={[styles.faceOutline, { borderColor: '#00FF00' }]} />
              
              {!isCameraReady && (
                <Text style={{ color: 'orange', marginTop: 15, fontSize: 16 }}>Đang khởi động camera...</Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsScanActive(false); navigation.goBack(); }}>
                <Text style={styles.cancelBtnText}>QUAY LẠI TRANG CHỦ</Text>
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