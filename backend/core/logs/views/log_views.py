from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..services.log_service import LogService
from ..serializers.log_serializer import LogHomeSerializer

class HomeLogsView(APIView):
    """Lấy lịch sử truy cập của một home"""
    def get(self, request):
        home_id = request.query_params.get('home_id')
        limit = int(request.query_params.get('limit', 50))
        
        if not home_id:
            return Response({"error": "home_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        logs = LogService.get_home_access_history(home_id, limit)
        serializer = LogHomeSerializer(logs, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)


class CreateLogView(APIView):
    """Tạo log khi user truy cập home"""
    def post(self, request):
        home_id = request.data.get('home_id')
        user_id = request.data.get('user_id')
        method = request.data.get('method', 'remote_app')
        image_url = request.data.get('image_url')
        
        if not home_id or not user_id:
            return Response({"error": "home_id and user_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        log = LogService.create_access_log(home_id, user_id, method, image_url)
        serializer = LogHomeSerializer(log)
        
        return Response({
            "message": "Đã tạo log",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)
