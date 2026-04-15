import cv2
import mediapipe as mp
import numpy as np
import io
import base64
import os
from mediapipe.python.solutions import face_detection as mp_face_detection
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class FaceProcessor:
    # Khởi tạo MediaPipe Face Detection
    mp_face_detection = mp.solutions.face_detection
    detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

    # Khởi tạo MediaPipe Face Landmarker cho tính toán góc mặt
    MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'face_landmarker.task')
    
    if os.path.exists(MODEL_PATH):
        _base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
        _options = vision.FaceLandmarkerOptions(
            base_options=_base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=True,
            num_faces=1,
        )
        landmarker = vision.FaceLandmarker.create_from_options(_options)
        print("[head_pose] Model loaded: " + MODEL_PATH)
    else:
        landmarker = None
        print(f"[!] Không tìm thấy file model MediaPipe: {MODEL_PATH}")


    @staticmethod
    def get_target_face_and_crop(image_file):
        """
        Tìm tất cả khuôn mặt, chọn cái to nhất và cắt ra.
        """
        # Chuyển đổi file gửi lên thành định dạng OpenCV
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None: return None
        
        h, w, _ = img.shape
        # Chuyển sang RGB cho MediaPipe
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = FaceProcessor.detector.process(rgb_img)

        if not results.detections:
            return None # Không thấy mặt nào

        # Logic: Chọn khuôn mặt có diện tích Bounding Box lớn nhất (người đứng gần nhất)
        target_detection = max(results.detections, 
                               key=lambda d: d.location_data.relative_bounding_box.width * d.location_data.relative_bounding_box.height)
        
        bbox = target_detection.location_data.relative_bounding_box
        x = int(bbox.xmin * w)
        y = int(bbox.ymin * h)
        rw = int(bbox.width * w)
        rh = int(bbox.height * h)

        # Thêm 20% lề (padding) để AI trích xuất đặc trưng tốt hơn
        pad = int(max(rw, rh) * 0.2)
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2, y2 = min(w, x + rw + pad), min(h, y + rh + pad)

        cropped_img = img[y1:y2, x1:x2]
        
        # Chuyển ngược lại về dạng file (bytes) để gửi lên AI Server
        _, buffer = cv2.imencode('.jpg', cropped_img)
        return io.BytesIO(buffer.tobytes())

    @staticmethod
    def rotation_matrix_to_euler(R):
        sy = np.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
        singular = sy < 1e-6
        if not singular:
            pitch = np.degrees(np.arctan2(R[2, 1], R[2, 2]))
            yaw   = np.degrees(np.arctan2(-R[2, 0], sy))
            roll  = np.degrees(np.arctan2(R[1, 0], R[0, 0]))
        else:
            pitch = np.degrees(np.arctan2(-R[1, 2], R[1, 1]))
            yaw   = np.degrees(np.arctan2(-R[2, 0], sy))
            roll  = 0.0
        return float(pitch), float(yaw), float(roll)

    @staticmethod
    def classify_pose(pitch, yaw,
                      thresh_yaw_right=10.0,
                      thresh_yaw_left=10.0,
                      thresh_pitch_up=10.0,
                      thresh_pitch_down=8.0):
        
        if yaw > thresh_yaw_right:
            return "Nghieng Phai"
        elif yaw < -thresh_yaw_left:
            return "Nghieng Trai"
        elif pitch < -thresh_pitch_up:
            return "Ngua Len"
        elif pitch > thresh_pitch_down:
            return "Cui Xuong"
        return "Chinh Dien"

    @staticmethod
    def check_face_pose_local(image_base64, expected_angle,
                              thresh_yaw_right=10.0,
                              thresh_yaw_left=10.0,
                              thresh_pitch_up=10.0,
                              thresh_pitch_down=8.0):
        """
        Kiểm tra góc xoay của khuôn mặt bằng MediaPipe Tasks Vision cục bộ.
        """
        if getattr(FaceProcessor, 'landmarker', None) is None:
             return {"valid": False, "reason": "Lỗi hệ thống: Chưa load model MediaPipe Face Landmarker."}

        try:
            # 1. Chuyển đổi base64 thành ảnh OpenCV
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            img_data = base64.b64decode(image_base64)
            np_arr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if img is None:
                return {"valid": False, "reason": "Không thể đọc dữ liệu ảnh"}

            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # 2. Extract Transform Matrix bằng Face Landmarker
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
            results = FaceProcessor.landmarker.detect(mp_image)
            
            if not results.face_landmarks:
                return {"valid": False, "reason": "Không tìm thấy khuôn mặt nào trong khung hình"}
                
            R = np.array(results.facial_transformation_matrixes[0])[:3, :3]
            pitch, yaw, roll = FaceProcessor.rotation_matrix_to_euler(R)

            pitch = round(pitch, 2)
            yaw = round(yaw, 2)
            roll = round(roll, 2)

            # Lấy label từ hàm phân loại
            label = FaceProcessor.classify_pose(pitch, yaw, 
                                                thresh_yaw_right, thresh_yaw_left, 
                                                thresh_pitch_up, thresh_pitch_down)
            
            info = (
                "=============== KET QUA PHAN TICH ==============\n"
                "Nhan     : " + label + "\n"
                "Pitch    : " + str(pitch) + " deg\n"
                "Yaw      : " + str(yaw)   + " deg\n"
                "Roll     : " + str(roll)  + " deg\n\n"
                "Nguong\n"
                "Yaw Phai   >  +" + str(thresh_yaw_right)  + " deg\n"
                "Yaw Trai   < -" + str(thresh_yaw_left)   + " deg\n"
                "Pitch Len  <  -" + str(thresh_pitch_up)   + " deg\n"
                "Pitch Xuong > +" +str(thresh_pitch_down) + " deg\n"
                "================================================"
            )
            print(info)

            # Thiết lập logic kiểm tra
            valid = False
            reason = "Góc mặt chưa đúng."
            pose_name = label

            if expected_angle == "center":
                if label == "Chinh Dien":
                    valid = True
                else:
                    reason = "Vui lòng nhìn thẳng vào camera"
            elif expected_angle == "left":
                if label == "Nghieng Trai":
                    valid = True
                else:
                    reason = "Vui lòng nghiêng mặt sang TRÁI nhiều hơn"
            elif expected_angle == "right":
                if label == "Nghieng Phai":
                    valid = True
                else:
                    reason = "Vui lòng nghiêng mặt sang PHẢI nhiều hơn"
            elif expected_angle == "up":
                if label == "Ngua Len":
                    valid = True
                else:
                    reason = "Vui lòng ngẩng đầu NGỬA LÊN"
            elif expected_angle == "down":
                if label == "Cui Xuong":
                    valid = True
                else:
                    reason = "Vui lòng CÚI XUỐNG thấp hơn"
            else:
                return {"valid": False, "reason": "Góc yêu cầu không hợp lệ trên Server"}

            if valid:
                return {
                    "valid": True,
                    "pose": pose_name,
                    "info_log": info,
                    "confidence": 1.0
                }
            else:
                return {
                    "valid": False,
                    "reason": reason,
                    "info_log": info
                }

        except Exception as e:
            print(f"[!] Lỗi MediaPipe Landmarker Pose Local: {str(e)}")
            return {"valid": False, "reason": f"Lỗi nội bộ khi phân tích khuôn mặt: {str(e)}"}