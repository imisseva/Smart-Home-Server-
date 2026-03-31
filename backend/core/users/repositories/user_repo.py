from ..models import Account, FaceUser

class UserRepository:
    
    @staticmethod
    def get_by_username(username):
        """Lấy user theo username"""
        try:
            return Account.objects.get(username=username)
        except Account.DoesNotExist:
            return None
    
    @staticmethod
    def get_by_id(user_id):
        """Lấy user theo ID"""
        try:
            return Account.objects.get(id=user_id)
        except Account.DoesNotExist:
            return None
    
    @staticmethod
    def create_user(user_data):
        """Tạo user mới"""
        return Account.objects.create(**user_data)
    
    @staticmethod
    def username_exists(username):
        """Kiểm tra username đã tồn tại chưa"""
        return Account.objects.filter(username=username).exists()
    
    @staticmethod
    def get_all_users():
        """Lấy tất cả users"""
        return Account.objects.all()
    
    @staticmethod
    def count_users():
        """Đếm tổng số users"""
        return Account.objects.count()


class FaceUserRepository:
    
    @staticmethod
    def get_by_user_id(user_id):
        """Lấy FaceUser theo user_id"""
        return FaceUser.objects.filter(id_user_id=user_id)
    
    @staticmethod
    def create_face_user(face_data):
        """Tạo FaceUser mới"""
        return FaceUser.objects.create(**face_data)
    
    @staticmethod
    def get_by_face_id(face_id):
        """Lấy FaceUser theo face_id"""
        try:
            return FaceUser.objects.get(id_face=face_id)
        except FaceUser.DoesNotExist:
            return None

