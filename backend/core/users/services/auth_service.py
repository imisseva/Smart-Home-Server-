from ..repositories.user_repo import UserRepository
import uuid # Dùng để sinh ID ngẫu nhiên vì bảng Account dùng ID chuỗi

class AuthService:
    
    @staticmethod
    def register_user(data):
        # 1. Kiểm tra username đã tồn tại chưa
        if UserRepository.username_exists(data['username']):
            raise ValueError("Username đã tồn tại!")
        
        # 2. Tạo ID ngẫu nhiên (UUID v4)
        new_id = str(uuid.uuid4())
        
        # 3. Tạo User mới trong DB qua Repository
        user_data = {
            'id': new_id,
            'username': data['username'],
            'password': data['password'], # LƯU PASS THÔ (KHÔNG MÃ HÓA)
            'fullname': data.get('fullname', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', '')
        }
        user = UserRepository.create_user(user_data)
        return user

    @staticmethod
    def login_user(username, input_password):
        # 1. Tìm user trong DB qua Repository
        user = UserRepository.get_by_username(username)
        
        if not user:
            return None # Không tìm thấy user
        
        # 2. So sánh mật khẩu (SO SÁNH CHUỖI THÔ)
        if user.password == input_password:
            return user # Đúng mật khẩu
        else:
            return None # Sai mật khẩu
