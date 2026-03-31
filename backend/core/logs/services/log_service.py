from ..repositories.log_repo import LogHomeRepository

class LogService:
    
    @staticmethod
    def create_access_log(home_id, user_id, method, image_url=None):
        """Tạo log khi user truy cập home"""
        import uuid
        from django.utils import timezone
        
        log_data = {
            'id_loghome': str(uuid.uuid4()),
            'id_home_id': home_id,
            'id_user_id': user_id,
            'log_time': timezone.now(),
            'method': method,
            'image_url': image_url
        }
        return LogHomeRepository.create_log(log_data)
    
    @staticmethod
    def get_home_access_history(home_id, limit=50):
        """Lấy lịch sử truy cập của một home"""
        return LogHomeRepository.get_by_home_id(home_id)[:limit]
    
    @staticmethod
    def get_user_access_history(user_id, limit=50):
        """Lấy lịch sử truy cập của một user"""
        return LogHomeRepository.get_by_user_id(user_id)[:limit]
    
    @staticmethod
    def get_recent_activities(limit=20):
        """Lấy các hoạt động gần đây"""
        return LogHomeRepository.get_recent_logs(limit)

