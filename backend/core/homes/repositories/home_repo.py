from ..models import Home, HomeUser, Request

class HomeRepository:
    
    @staticmethod
    def get_by_id(home_id):
        """Lấy home theo ID"""
        try:
            return Home.objects.get(id=home_id)
        except Home.DoesNotExist:
            return None
    
    @staticmethod
    def get_all_homes():
        """Lấy tất cả homes"""
        return Home.objects.all()
    
    @staticmethod
    def create_home(home_data):
        """Tạo home mới"""
        return Home.objects.create(**home_data)


class HomeUserRepository:
    
    @staticmethod
    def get_by_home_id(home_id):
        """Lấy tất cả users trong một home"""
        return HomeUser.objects.filter(id_home_id=home_id)
    
    @staticmethod
    def get_by_user_id(user_id):
        """Lấy tất cả homes của một user"""
        return HomeUser.objects.filter(id_user_id=user_id)
    
    @staticmethod
    def get_by_home_and_user(home_id, user_id):
        """Lấy HomeUser theo home_id và user_id"""
        try:
            return HomeUser.objects.get(id_home_id=home_id, id_user_id=user_id)
        except HomeUser.DoesNotExist:
            return None
    
    @staticmethod
    def create_home_user(home_user_data):
        """Tạo HomeUser mới"""
        return HomeUser.objects.create(**home_user_data)


class RequestRepository:
    
    @staticmethod
    def get_by_id(request_id):
        """Lấy request theo ID"""
        try:
            return Request.objects.get(id_request=request_id)
        except Request.DoesNotExist:
            return None
    
    @staticmethod
    def get_by_home_id(home_id):
        """Lấy tất cả requests của một home"""
        return Request.objects.filter(id_home_id=home_id)
    
    @staticmethod
    def get_by_user_id(user_id):
        """Lấy tất cả requests của một user"""
        return Request.objects.filter(id_user_id=user_id)
    
    @staticmethod
    def get_pending_requests():
        """Lấy tất cả requests đang pending"""
        return Request.objects.filter(status='pending')
    
    @staticmethod
    def create_request(request_data):
        """Tạo request mới"""
        return Request.objects.create(**request_data)
    
    @staticmethod
    def update_request_status(request_id, status):
        """Cập nhật status của request"""
        request = RequestRepository.get_by_id(request_id)
        if request:
            request.status = status
            request.save()
            return request
        return None

