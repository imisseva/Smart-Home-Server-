from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import uuid
import requests
from supabase import create_client, Client
from ..services.ai_service import AIService
from ..models import FaceUser
from ..models import Account  # Chỉnh sửa path nếu cần

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_ANON_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class FaceLoginView(APIView):
    def post(self, request):
        face_image = request.FILES.get('face_image')

        if not face_image:
            return Response(
                {"error": "Không tìm thấy dữ liệu ảnh khuôn mặt"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # ================================================================
            # 1. Gọi AI trích xuất vector từ ảnh Mobile gửi lên
            # ================================================================
            login_vector = AIService.extract_single_embedding(face_image)
            
            if not login_vector:
                return Response(
                    {"error": "AI không thể nhận diện khuôn mặt trong ảnh, vui lòng thử lại."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ================================================================
            # 2. So sánh với Database (Face Recognition)
            # ================================================================
            matched_user_id = None
            matched_avatar_url = "" # <-- THÊM BIẾN NÀY ĐỂ HỨNG AVATAR
            highest_similarity = 0.0
            
            # Ngưỡng chấp nhận (Threshold). 
            # Có thể tinh chỉnh từ 0.45 đến 0.7 tùy độ khắt khe của hệ thống
            THRESHOLD = 0.45

            # Lấy tất cả user đã đăng ký khuôn mặt (có lưu vector)
            registered_faces = FaceUser.objects.exclude(vector_image__isnull=True)

            for face_record in registered_faces:
                db_vector = face_record.vector_image
                
                # Tính độ giống nhau
                sim_score = AIService.calculate_cosine_similarity(login_vector, db_vector)
                
                # Tìm ra người giống nhất
                if sim_score > highest_similarity:
                    highest_similarity = sim_score
                    if highest_similarity >= THRESHOLD:
                        # Lấy ID của Account liên kết với FaceUser này
                        matched_user_id = face_record.id_user_id 
                        # LẤY AVATAR TỪ BẢNG FACEUSER LUÔN
                        matched_avatar_url = face_record.avatar_url 

            print(f"Độ giống cao nhất tìm thấy: {highest_similarity}")

            # Nếu không ai vượt qua được điểm Threshold
            if not matched_user_id:
                return Response(
                    {"error": "Khuôn mặt không khớp với bất kỳ tài khoản nào trong hệ thống"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # ================================================================
            # 3. Lấy thông tin User từ Database dựa trên user_id AI tìm được
            # ================================================================
            try:
                account = Account.objects.get(id=matched_user_id)
                
                return Response({
                    "message": "Đăng nhập Face ID thành công",
                    "data": {
                        "id": account.id,
                        "username": account.username,
                        "fullname": account.fullname,
                        "email": account.email,
                        "phone": account.phone,
                        "avatar_url": matched_avatar_url # <-- TRẢ VỀ BIẾN VỪA LẤY ĐƯỢC
                    }
                }, status=status.HTTP_200_OK)

            except Account.DoesNotExist:
                return Response(
                    {"error": "Lỗi dữ liệu: AI nhận diện ra User nhưng không tồn tại trong Database"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            return Response(
                {"error": f"Lỗi quá trình xử lý đăng nhập bằng khuôn mặt: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FaceManagementView(APIView):
    """
    Xử lý kiểm tra trạng thái và xóa Face ID
    """
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "Thiếu user_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            face_user = FaceUser.objects.get(id_user=user_id)
            return Response({
                "has_face": True,
                "id_face": face_user.id_face,
                "avatar_url": face_user.avatar_url
            }, status=status.HTTP_200_OK)
        except FaceUser.DoesNotExist:
            return Response({
                "has_face": False,
                "message": "Người dùng chưa đăng ký khuôn mặt"
            }, status=status.HTTP_200_OK)

    def delete(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "Thiếu user_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Dọn dẹp Storage trên Supabase trước
            # Lấy danh sách các file trong thư mục của user này
            files = supabase.storage.from_("face_images").list(user_id)
            if files:
                # Tạo mảng đường dẫn file để xóa
                paths_to_remove = [f"{user_id}/{file['name']}" for file in files]
                supabase.storage.from_("face_images").remove(paths_to_remove)

            # 2. Xóa dữ liệu trong DB Django
            deleted_count, _ = FaceUser.objects.filter(id_user=user_id).delete()
            
            if deleted_count > 0:
                return Response({"message": "Đã xóa toàn bộ dữ liệu khuôn mặt và ảnh trên Cloud"}, status=status.HTTP_200_OK)
            return Response({"error": "Không tìm thấy dữ liệu để xóa"}, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FaceRegisterView(APIView):
    """
    API hứng FormData (gồm 5 ảnh) từ Mobile, đẩy lên Supabase Storage,
    lưu Database và gọi Server AI.
    """
    def post(self, request):
        user_id = request.data.get('user_id')
        images = request.FILES.getlist('face_images')
        angles = request.data.getlist('angles')

        # 1. Kiểm tra đầu vào
        if not user_id:
            return Response({"error": "Thiếu user_id"}, status=status.HTTP_400_BAD_REQUEST)
        if len(images) != 5 or len(angles) != 5:
            return Response({"error": f"Yêu cầu đủ 5 ảnh, nhận được {len(images)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            account = Account.objects.get(id=user_id)
        except Account.DoesNotExist:
            return Response({"error": "User không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

        uploaded_urls = []
        avatar_url = ""

        try:
            # 2. Upload 5 ảnh lên Supabase
            for i in range(len(images)):
                image_file = images[i]
                angle = angles[i]
                
                file_bytes = image_file.read()
                file_path = f"{user_id}/{user_id}_{angle}.jpg"
                
                # Upload lên bucket 'face_images'
                supabase.storage.from_("face_images").upload(
                    path=file_path, 
                    file=file_bytes, 
                    file_options={"content-type": "image/jpeg", "upsert": "true"}
                )
                
                public_url = supabase.storage.from_("face_images").get_public_url(file_path)
                uploaded_urls.append(public_url)

                if angle == 'center':
                    avatar_url = public_url

            if not avatar_url and uploaded_urls:
                avatar_url = uploaded_urls[0]

            # 3. Lưu vào Database
            face_user, created = FaceUser.objects.update_or_create(
                id_user=account,
                defaults={
                    'id_face': str(uuid.uuid4()) if not FaceUser.objects.filter(id_user=account).exists() else FaceUser.objects.get(id_user=account).id_face,
                    'avatar_url': avatar_url
                }
            )

            try:
                Vector=AIService.extract_profile_embedding(images)
                if Vector is None:
                     print(" AI Service không trả về embedding. Có thể do lỗi mạng hoặc dữ liệu ảnh không hợp lệ.")  
                else:
                    face_user.vector_image = Vector
                    face_user.save()
                    print("Đã lưu embedding vào database FaceUser.")
            except Exception as e:
                print(f"Lỗi gọi AI Server: {e}")

            return Response({
                "message": "Đã lưu 5 góc mặt và trích xuất đặc trưng thành công.",
                "id_face": face_user.id_face,
                "avatar_url": avatar_url
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Lỗi quá trình xử lý: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # check pose #


class FacePoseCheckView(APIView):
    def post(self, request):
        image_base64 = request.data.get('image')  
        expected_angle = request.data.get('expected_angle')

        if not image_base64 or not expected_angle:
            return Response(
                {"error": "Thiếu image hoặc expected_angle"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # RÀO LẠI BẰNG TRY...EXCEPT ĐỂ CHỐNG SẬP KHI HUGGINGFACE LỖI MẠNG
        try:
            result = AIService.check_face_pose(image_base64, expected_angle)

            if result["valid"]:
                return Response({
                    "valid": True,
                    "pose": result.get("pose"),
                    "confidence": result.get("confidence")
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "valid": False,
                    "reason": result.get("reason")
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            # Nếu AI Server hoặc HuggingFace bị sập, báo lỗi văn minh về cho Mobile
            return Response({
                "valid": False,
                "reason": "Hệ thống AI đang bận hoặc lỗi mạng. Vui lòng thử lại sau."
            }, status=status.HTTP_200_OK)