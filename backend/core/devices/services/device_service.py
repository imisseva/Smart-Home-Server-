from ..repositories.device_repo import DeviceRepository
import paho.mqtt.publish as publish
import ssl
import os
import json


class DeviceService:
    # Đọc cấu hình MQTT từ biến môi trường (set trong .env hoặc docker-compose)
    MQTT_HOST     = os.getenv("MQTT_BROKER_HOST", "644040342b4148298dc3b191fffa3ed3.s1.eu.hivemq.cloud")
    MQTT_PORT     = int(os.getenv("MQTT_BROKER_PORT", 8883))
    MQTT_USERNAME = os.getenv("MQTT_USERNAME", "imisseva123")
    MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "Phong123nguyen")

    # TLS config cho HiveMQ Cloud (bắt buộc khi dùng port 8883)
    _TLS = {"tls_version": ssl.PROTOCOL_TLS}
    _AUTH = None  # Được build từ property để luôn lấy giá trị mới nhất

    @classmethod
    def _get_auth(cls):
        return {"username": cls.MQTT_USERNAME, "password": cls.MQTT_PASSWORD}

    @classmethod
    def _publish(cls, topic, payload):
        """Gửi MQTT message lên HiveMQ Cloud với TLS + auth"""
        publish.single(
            topic,
            payload=payload,
            hostname=cls.MQTT_HOST,
            port=cls.MQTT_PORT,
            auth=cls._get_auth(),
            tls=cls._TLS,
        )

    @staticmethod
    def get_all_devices():
        """Lấy tất cả devices"""
        return DeviceRepository.get_all_devices()

    @staticmethod
    def get_device_by_id(device_id):
        """Lấy device theo ID"""
        try:
            return DeviceRepository.get_all_devices().get(id=device_id)
        except Exception:
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
            action_str = "OPEN" if device.status else "CLOSE"
        else:
            action_str = "ON" if device.status else "OFF"

        payload_dict = {
            "pin": device.pin,
            "action": action_str
        }
        payload = json.dumps(payload_dict)

        # 3. Gửi MQTT lên HiveMQ Cloud
        if device.mqtt_topic:
            try:
                DeviceService._publish(device.mqtt_topic, payload)
                print(f"[MQTT] SENT: topic={device.mqtt_topic} payload={payload} host={DeviceService.MQTT_HOST}:{DeviceService.MQTT_PORT}")
            except Exception as e:
                print(f"[MQTT] ERROR toggle: {e}")
        else : 
            print(f"DEBUG: Device ID {device_id} không có mqtt_topic, không gửi MQTT")

        return device

    @staticmethod
    def update_intensity(device_id, intensity):
        device = DeviceService.get_device_by_id(device_id)
        if device and device.mqtt_topic:
            # 1. Lưu vào DB
            device.intensity = intensity
            device.save()

            # 2. Gửi MQTT (JSON Payload)
            payload_dict = {
                "pin": device.pin,
                "action": "INTENSITY",
                "value": intensity
            }
            payload = json.dumps(payload_dict)
            try:
                DeviceService._publish(device.mqtt_topic, payload)
                print(f"[MQTT] Sent Intensity {intensity} to {device.mqtt_topic} (JSON: {payload})")
            except Exception as e:
                print(f"[MQTT] Error intensity: {e}")
            return device
        return None

