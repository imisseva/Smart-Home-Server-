from ..models import Device

class DeviceRepository:
    
    @staticmethod
    def get_all_devices():
        # Lấy tất cả thiết bị và sắp xếp theo tên
        return Device.objects.all().order_by('name')

    @staticmethod
    def count_active_devices():
        # Đếm số thiết bị đang BẬT (status=True)
        return Device.objects.filter(status=True).count()

