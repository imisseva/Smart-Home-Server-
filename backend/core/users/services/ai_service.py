from gradio_client import Client
from PIL import Image, ImageOps
import requests
import io


class AIService:
    # Bảng dịch từ khóa của Mobile sang từ khóa kỳ vọng của AI
    POSE_MAP = {
        "center": "Chinh Dien",
        "left": "Nghieng Trai",
        "right": "Nghieng Phai",
        "up": "Ngua Len",
        "down": "Cui Xuong",
    }

    # Khởi tạo client trỏ thẳng vào tên Space check pose
    _client = Client("aiwho/posedetection")

    # URL của API AI để trích xuất embedding từ ảnh
    API_AI_EMBEDDING = "https://aiwho-embeddingresnet34.hf.space"


    @staticmethod
    def _normalize_image(image_file) -> bytes:
        """
        Chuẩn hóa ảnh từ mobile trước khi gửi lên AI:
        - Fix EXIF rotation (ảnh chụp dọc/ngang từ điện thoại hay bị xoay)
        - Convert sang RGB (tránh RGBA, grayscale, HEIC...)
        - Resize nếu quá lớn (MTCNN không cần ảnh full-res)
        - Encode lại thành JPEG chuẩn
        """
        print("  [normalize] Bắt đầu chuẩn hóa ảnh...")
        image_file.seek(0)
        img = Image.open(image_file)

        print(f"  [normalize] Ảnh gốc: size={img.size} | mode={img.mode}")

        # Đọc EXIF rotation tag trước khi sửa
        try:
            exif = img._getexif()
            orientation = exif.get(274) if exif else None  # 274 = Orientation tag
            print(f"  [normalize] EXIF Orientation tag: {orientation} (1=bình thường, 3=180°, 6=90°CW, 8=90°CCW)")
        except Exception:
            print("  [normalize] Không đọc được EXIF (ảnh không có hoặc không phải JPEG)")

        # Tự động sửa hướng theo EXIF — đây là nguyên nhân chính gây lỗi 400
        img = ImageOps.exif_transpose(img)
        print(f"  [normalize] Ảnh sau exif_transpose: size={img.size}")

        # Đảm bảo luôn là RGB
        if img.mode != "RGB":
            print(f"  [normalize] Convert mode {img.mode} → RGB")
            img = img.convert("RGB")

        # Resize nếu cạnh dài hơn 1280px
        max_size = 1280
        if max(img.size) > max_size:
            old_size = img.size
            img.thumbnail((max_size, max_size), Image.LANCZOS)
            print(f"  [normalize] Resize {old_size} → {img.size}")

        # Encode sang JPEG chuẩn
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        buf.seek(0)
        result_bytes = buf.read()
        print(f"  [normalize] Xong! Size sau normalize: {len(result_bytes)} bytes")
        return result_bytes


    @staticmethod
    def extract_profile_embedding(image_files):
        print("=" * 50)
        print("[extract_profile_embedding] Bắt đầu trích xuất embedding từ nhiều ảnh...")
        url = f"{AIService.API_AI_EMBEDDING}/extract_profile"
        files_to_send = []

        try:
            for i, img in enumerate(image_files):
                file_name = getattr(img, 'name', f'face_{i+1}.jpg')
                content_type = getattr(img, 'content_type', 'image/jpeg')
                print(f"  [File {i+1}] name={file_name} | content_type={content_type}")

                # Normalize ảnh trước khi gửi (fix EXIF rotation từ mobile)
                normalized_bytes = AIService._normalize_image(img)

                if len(normalized_bytes) == 0:
                    print(f"[!] LỖI: File {i+1} sau normalize rỗng (0 bytes), bỏ qua.")
                    continue

                files_to_send.append(('files', (f"face_{i+1}.jpg", normalized_bytes, "image/jpeg")))

            if not files_to_send:
                print("[!] CẢNH BÁO: Không có file ảnh nào hợp lệ sau khi normalize.")
                return None

            print(f"[extract_profile_embedding] Gửi {len(files_to_send)} ảnh lên: {url}")
            response = requests.post(url, files=files_to_send, timeout=(10, 120))

            print(f"[extract_profile_embedding] HTTP Status nhận về: {response.status_code}")
            response.raise_for_status()

            data = response.json()
            print(f"[extract_profile_embedding] Response JSON: {data}")

            vector = data.get("vector")
            if not vector:
                print("[!] LỖI: Server trả 200 nhưng không có trường 'vector' trong response.")
                return None

            print(f"[+] Thành công! Chiều dài vector: {len(vector)} | 3 giá trị đầu: {vector[:3]}")
            return vector

        except requests.exceptions.HTTPError as err:
            print(f"[!] LỖI HTTP từ server AI (extract_profile): {err}")
            if err.response is not None:
                print(f"    HTTP Status: {err.response.status_code}")
                print(f"    Chi tiết lỗi từ server: {err.response.text}")
                if err.response.status_code == 400:
                    print("    >> GỢI Ý: 400 thường do ảnh bị xoay (EXIF rotation), ảnh mờ,")
                    print("              hoặc không có khuôn mặt rõ ràng. Kiểm tra ảnh gửi lên.")
                elif err.response.status_code == 422:
                    print("    >> GỢI Ý: 422 thường do sai key/format multipart. Key phải là 'files' (số nhiều).")
                elif err.response.status_code == 500:
                    print("    >> GỢI Ý: 500 là lỗi nội bộ server AI. Thử lại hoặc kiểm tra HuggingFace Space.")
            return None

        except requests.exceptions.ConnectionError as err:
            print(f"[!] LỖI KẾT NỐI (extract_profile): Không thể kết nối tới {url}")
            print(f"    Chi tiết: {err}")
            return None

        except requests.exceptions.Timeout as err:
            print(f"[!] LỖI TIMEOUT (extract_profile): Server không phản hồi trong 120s.")
            print(f"    Chi tiết: {err}")
            return None

        except Exception as e:
            print(f"[!] LỖI KHÔNG XÁC ĐỊNH (extract_profile): {type(e).__name__}: {str(e)}")
            return None


    @staticmethod
    def extract_single_embedding(image_file):
        """
        Gọi API trích xuất đặc trưng cho 1 ảnh duy nhất lúc Đăng nhập
        """
        print("=" * 50)
        print("[extract_single_embedding] Bắt đầu trích xuất embedding ảnh Login...")
        url = f"{AIService.API_AI_EMBEDDING}/extract_single"

        try:
            file_name = getattr(image_file, 'name', 'face.jpg')
            content_type = getattr(image_file, 'content_type', 'image/jpeg')
            print(f"  [File] name={file_name} | content_type={content_type}")

            # Normalize ảnh trước khi gửi (fix EXIF rotation từ mobile)
            normalized_bytes = AIService._normalize_image(image_file)

            if len(normalized_bytes) == 0:
                print("[!] LỖI: File ảnh sau normalize rỗng (0 bytes).")
                return None

            # CHÚ Ý: Key cho ảnh đơn trên FastAPI là 'file' (số ít), hardcode JPEG sau normalize
            files = {"file": ("face.jpg", normalized_bytes, "image/jpeg")}

            print(f"[extract_single_embedding] Gửi ảnh lên: {url}")
            response = requests.post(url, files=files, timeout=(10, 60))

            print(f"[extract_single_embedding] HTTP Status nhận về: {response.status_code}")
            response.raise_for_status()

            data = response.json()
            print(f"[extract_single_embedding] Response JSON: {data}")

            if data.get('status') == 'success':
                vector = data.get('vector')
                if not vector:
                    print("[!] LỖI: status=success nhưng không có trường 'vector'.")
                    return None
                print(f"[+] Thành công! Chiều dài vector: {len(vector)} | 3 giá trị đầu: {vector[:3]}")
                return vector

            print(f"[!] LỖI: Server trả status khác 'success': {data.get('status')} | message: {data.get('detail', 'N/A')}")
            return None

        except requests.exceptions.HTTPError as err:
            print(f"[!] LỖI HTTP từ server AI (extract_single): {err}")
            if err.response is not None:
                print(f"    HTTP Status: {err.response.status_code}")
                print(f"    Chi tiết lỗi từ server: {err.response.text}")
                # Gợi ý nguyên nhân phổ biến
                if err.response.status_code == 400:
                    print("    >> GỢI Ý: 400 thường do ảnh bị xoay (EXIF rotation), ảnh mờ,")
                    print("              hoặc không có khuôn mặt rõ ràng. Kiểm tra ảnh gửi lên.")
                elif err.response.status_code == 422:
                    print("    >> GỢI Ý: 422 thường do sai key/format multipart. Key phải là 'file' (số ít).")
                elif err.response.status_code == 500:
                    print("    >> GỢI Ý: 500 là lỗi nội bộ server AI. Thử lại hoặc kiểm tra HuggingFace Space.")
            return None

        except requests.exceptions.ConnectionError as err:
            print(f"[!] LỖI KẾT NỐI (extract_single): Không thể kết nối tới {url}")
            print(f"    Chi tiết: {err}")
            return None

        except requests.exceptions.Timeout as err:
            print(f"[!] LỖI TIMEOUT (extract_single): Server không phản hồi trong 60s.")
            print(f"    Chi tiết: {err}")
            return None

        except Exception as e:
            print(f"[!] LỖI KHÔNG XÁC ĐỊNH (extract_single): {type(e).__name__}: {str(e)}")
            return None


    @staticmethod
    def calculate_cosine_similarity(vec1, vec2):
        """
        Tính độ tương đồng Cosine giữa 2 vector. Trả về giá trị từ -1 đến 1.
        Càng gần 1 thì 2 khuôn mặt càng giống nhau.
        """
        import math

        if not vec1 or not vec2:
            print("[!] LỖI cosine_similarity: Một hoặc cả hai vector bị None/rỗng.")
            return 0.0

        if len(vec1) != len(vec2):
            print(f"[!] LỖI cosine_similarity: Độ dài vector không khớp ({len(vec1)} vs {len(vec2)}).")
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))

        if norm1 == 0 or norm2 == 0:
            print("[!] LỖI cosine_similarity: Một vector có norm = 0 (vector toàn số 0).")
            return 0.0

        similarity = dot_product / (norm1 * norm2)
        print(f"[cosine_similarity] Kết quả similarity: {similarity:.4f}")
        return similarity


    @staticmethod
    def check_face_pose(image_base64, expected_angle):
        print("=" * 50)
        print(f"[check_face_pose] Kiểm tra góc mặt | expected_angle (từ app): '{expected_angle}'")

        try:
            # 1. Chuẩn hóa chuỗi base64
            if not image_base64.startswith("data:image"):
                image_base64 = f"data:image/jpeg;base64,{image_base64}"
            print(f"  [base64] Độ dài chuỗi sau chuẩn hóa: {len(image_base64)} ký tự")

            client = AIService._client

            # 2. Lấy expected_label trước khi gọi AI (để log rõ)
            expected_label = AIService.POSE_MAP.get(expected_angle)
            if expected_label is None:
                print(f"[!] LỖI: Góc '{expected_angle}' không có trong POSE_MAP.")
                print(f"    Các góc hợp lệ: {list(AIService.POSE_MAP.keys())}")
                return {"valid": False, "reason": "Góc yêu cầu không hợp lệ"}

            print(f"  [POSE_MAP] '{expected_angle}' → kỳ vọng AI trả về: '{expected_label}'")

            # 3. Gọi API với format từ điển {"url": ...}
            print("[check_face_pose] Đang gọi Gradio API /run_detection ...")
            result = client.predict(
                image={"url": image_base64},
                thresh_yaw_right=10.0,
                thresh_yaw_left=10.0,
                thresh_pitch_up=10.0,
                thresh_pitch_down=10.0,
                api_name="/run_detection"
            )

            print(f"  [Gradio] Raw result nhận về: {result}")

            # 4. Unpack kết quả (tuple: image_dict, text_string)
            if isinstance(result, (list, tuple)) and len(result) >= 2:
                ket_qua_img, pose_result = result
                print(f"  [Gradio] pose_result (text): '{pose_result}'")
            else:
                pose_result = result
                print(f"  [Gradio] Kết quả không phải tuple, dùng trực tiếp: '{pose_result}'")

            if not pose_result:
                print("[!] LỖI: AI trả về pose_result rỗng hoặc None.")
                return {"valid": False, "reason": "AI không trả về kết quả"}

            # 5. So sánh chuỗi
            is_match = expected_label.lower() in str(pose_result).lower()
            print(f"  [So sánh] '{expected_label.lower()}' in '{str(pose_result).lower()}' → {is_match}")

            if not is_match:
                print(f"[check_face_pose] KHÔNG KHỚP: yêu cầu='{expected_label}' | phát hiện='{pose_result}'")
                return {
                    "valid": False,
                    "reason": f"Yêu cầu: {expected_label}, nhưng phát hiện: {pose_result}"
                }

            print(f"[+] KHỚP GÓC MẶT: '{pose_result}'")
            return {
                "valid": True,
                "pose": pose_result,
                "confidence": 1.0
            }

        except Exception as e:
            print(f"[!] LỖI KHÔNG XÁC ĐỊNH (check_face_pose): {type(e).__name__}: {str(e)}")
            return {"valid": False, "reason": f"Lỗi AI: {str(e)}"}