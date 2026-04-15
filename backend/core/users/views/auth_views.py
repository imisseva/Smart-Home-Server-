from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Account
# Import file Serializer bạn đã viết + Service vừa tạo ở trên
from ..serializers.auth_serializer import RegisterRequestSerializer, LoginRequestSerializer, UserResponseSerializer
from ..services.auth_service import AuthService

# --- API ĐĂNG KÝ ---
class RegisterView(APIView):
    def post(self, request):
        # 1. Input DTO: Kiểm tra dữ liệu gửi lên
        input_serializer = RegisterRequestSerializer(data=request.data)
        
        if not input_serializer.is_valid():
            # Nếu dữ liệu lỗi (thiếu pass, trùng username...) -> Trả về lỗi 400
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Gọi Service: Tạo user
        try:
            new_user = AuthService.register_user(input_serializer.validated_data)
            
            # 3. Output DTO: Đóng gói dữ liệu trả về
            output_serializer = UserResponseSerializer(new_user)
            
            return Response({
                "message": "Đăng ký thành công",
                "data": output_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- API ĐĂNG NHẬP ---
class LoginView(APIView):
    def post(self, request):
        # 1. Input DTO: Kiểm tra dữ liệu gửi lên
        input_serializer = LoginRequestSerializer(data=request.data)
        
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Gọi Service: Kiểm tra đăng nhập
        username = input_serializer.validated_data['username']
        password = input_serializer.validated_data['password']
        
        user = AuthService.login_user(username, password)
        
        if user:
            # 3. Output DTO: Trả về thông tin user nếu đúng
            output_serializer = UserResponseSerializer(user)
            return Response({
                "message": "Đăng nhập thành công",
                "data": output_serializer.data
            }, status=status.HTTP_200_OK)
        else:
            # Trả về lỗi 401 nếu sai pass hoặc ko tìm thấy user
            return Response(
                {"error": "Sai tài khoản hoặc mật khẩu"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

class ProfileUpdateView(APIView):
    """
    API để cập nhật thông tin cá nhân (fullname, email, phone, password)
    """
    def put(self, request):
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({"error": "Thiếu thông tin user_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            account = Account.objects.get(id=user_id)
            
            # Lấy các trường dữ liệu gửi lên (nếu không gửi thì giữ nguyên None)
            fullname = request.data.get('fullname')
            email = request.data.get('email')
            phone = request.data.get('phone')
            password = request.data.get('password')

            # Cập nhật nếu có dữ liệu mới
            if fullname is not None:
                account.fullname = fullname
            if email is not None:
                account.email = email
            if phone is not None:
                account.phone = phone
            if password: 
                account.password = password 

            account.save()

            output_serializer = UserResponseSerializer(account)

            return Response({
                "message": "Cập nhật hồ sơ thành công",
                "data": output_serializer.data
            }, status=status.HTTP_200_OK)

        except Account.DoesNotExist:
            return Response({"error": "Người dùng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Lỗi server: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)