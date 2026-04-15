from ..repositories.home_repo import HomeRepository, HomeUserRepository, RequestRepository
from core.devices.repositories.device_repo import DeviceRepository
from core.users.repositories.user_repo import UserRepository

class HomeService:
    
    @staticmethod
    def get_system_health():
        """
        Hàm này tổng hợp thông tin hệ thống để test
        """
        # 1. Gọi Repo để lấy dữ liệu thiết bị
        total_dev = DeviceRepository.get_all_devices().count()
        active_dev = DeviceRepository.count_active_devices()
        
        # 2. Gọi Repository để đếm User
        total_user = UserRepository.count_users()
        
        # 3. Logic: Đánh giá hệ thống
        status = "NORMAL"
        if active_dev > 10:
            status = "HIGH_LOAD" # Giả sử bật nhiều quá thì báo tải cao
            
        # 4. Trả về kết quả (Dictionary)
        return {
            "status": status,
            "message": "Kiểm tra hệ thống thành công",
            "statistics": {
                "total_users": total_user,
                "total_devices": total_dev,
                "active_devices": active_dev
            }
        }
    
    @staticmethod
    def get_user_homes(user_id):
        """Lấy tất cả homes của một user"""
        home_users = HomeUserRepository.get_by_user_id(user_id)
        return [hu.id_home for hu in home_users if hu.id_home]
    
    @staticmethod
    def get_home_members(home_id):
        """Lấy tất cả members của một home"""
        return HomeUserRepository.get_by_home_id(home_id)
    
    @staticmethod
    def create_join_request(user_id, home_id):
        """Tạo request join home"""
        import uuid
        request_data = {
            'id_request': str(uuid.uuid4()),
            'id_user_id': user_id,
            'id_home_id': home_id,
            'status': 'pending'
        }
        return RequestRepository.create_request(request_data)
