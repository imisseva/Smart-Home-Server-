from ..repositories.device_repo import DeviceRepository
import paho.mqtt.publish as publish


class DeviceService:  
    MQTT_HOST = "broker.emqx.io"
    MQTT_PORT = 1883
    @staticmethod
    def get_all_devices():
        """Lấy tất cả devices"""
        return DeviceRepository.get_all_devices()
    
    @staticmethod
    def get_device_by_id(device_id):
        """Lấy device theo ID"""
        try:
            return DeviceRepository.get_all_devices().get(id=device_id)
        except:
            return None
    
    @staticmethod
    def get_devices_by_home(home_id):
        """Lấy tất cả devices của một home"""
        return DeviceRepository.get_all_devices().filter(id_home_id=home_id)
    
    @staticmethod
    def get_active_devices_count():
        """Đếm số devices đang active"""
        return DeviceRepository.count_active_devices()
    
    @staticmethod
    def toggle_device_status(device_id):
        device = DeviceService.get_device_by_id(device_id)

        if not device:
            print(f"DEBUG: Không tìm thấy Device với ID: {device_id}")
            return None

        # 1. Đảo trạng thái trong Database
        device.status = not device.status       
        device.save()

        # 2. Xử lý Payload dựa trên Type trong DB (AC, DOOR, LIGHT...)
        device_type = getattr(device, 'type', '').upper()
        device_name_lower = device.name.lower() if device.name else ""

        if device_type == "DOOR" or "door" in device_name_lower:
            payload = "OPEN" if device.status else "CLOSE"
        else:
            payload = "ON" if device.status else "OFF"

        # 3. Gửi MQTT
        if device.mqtt_topic:
            try:
                publish.single(
                    device.mqtt_topic,
                    payload=payload,
                    hostname=DeviceService.MQTT_HOST, 
                    port=DeviceService.MQTT_PORT
                )
                print(f"MQTT SENT: {payload} to {device.mqtt_topic}")
            except Exception as e:
                print(f"MQTT ERROR: {e}")
        
        return device
    
    @staticmethod
    def update_intensity(device_id, intensity):
        device = DeviceService.get_device_by_id(device_id)
        if device and device.mqtt_topic:
            # 1. Lưu vào DB
            device.intensity = intensity
            device.save()
            
            # 2. Gửi MQTT (gửi giá trị số 0-100 hoặc 0-255)
            try:
                publish.single(
                    device.mqtt_topic,
                    payload=str(intensity), # ESP32 sẽ nhận chuỗi số này
                    hostname="broker.emqx.io",
                    port=1883
                )
                print(f"[MQTT] Sent Intensity {intensity} to {device.mqtt_topic}")
            except Exception as e:
                print(f"[MQTT] Error: {e}")
            return device
        return None

