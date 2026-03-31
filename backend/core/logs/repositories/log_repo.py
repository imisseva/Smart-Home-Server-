from ..models import LogHome

class LogHomeRepository:
    
    @staticmethod
    def get_by_id(log_id):
        """Lấy log theo ID"""
        try:
            return LogHome.objects.get(id_loghome=log_id)
        except LogHome.DoesNotExist:
            return None
    
    @staticmethod
    def get_by_home_id(home_id):
        """Lấy tất cả logs của một home"""
        return LogHome.objects.filter(id_home_id=home_id).order_by('-log_time')
    
    @staticmethod
    def get_by_user_id(user_id):
        """Lấy tất cả logs của một user"""
        return LogHome.objects.filter(id_user_id=user_id).order_by('-log_time')
    
    @staticmethod
    def get_recent_logs(limit=10):
        """Lấy logs gần đây nhất"""
        return LogHome.objects.all().order_by('-log_time')[:limit]
    
    @staticmethod
    def create_log(log_data):
        """Tạo log mới"""
        return LogHome.objects.create(**log_data)
    
    @staticmethod
    def get_logs_by_method(method):
        """Lấy logs theo method"""
        return LogHome.objects.filter(method=method).order_by('-log_time')

