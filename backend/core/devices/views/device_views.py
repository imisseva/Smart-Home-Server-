from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..services.device_service import DeviceService
from ..serializers.device_serializer import DeviceSerializer

class HomeDevicesView(APIView):
    """Lấy danh sách devices của một home"""
    def get(self, request):
        home_id = request.query_params.get('home_id')
        if not home_id:
            return Response({"error": "home_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        devices = DeviceService.get_devices_by_home(home_id)
        serializer = DeviceSerializer(devices, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)


class ToggleDeviceView(APIView):
    """Bật/tắt device"""
    def post(self, request):
        device_id = request.data.get('device_id')
        if not device_id:
            return Response({"error": "device_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        device = DeviceService.toggle_device_status(device_id)
        if device:
            serializer = DeviceSerializer(device)
            return Response({
                "message": "Đã cập nhật trạng thái thiết bị",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)


class UpdateDeviceIntensityView(APIView):
    def post(self, request):
        device_id = request.data.get('device_id')
        intensity = request.data.get('intensity')
        
        if not device_id or intensity is None:
            return Response({"error": "device_id and intensity required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Gọi service thay vì tự save() để bắn MQTT
        device = DeviceService.update_intensity(device_id, intensity)
        
        if device:
            serializer = DeviceSerializer(device)
            return Response({
                "message": "Đã cập nhật cường độ",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)