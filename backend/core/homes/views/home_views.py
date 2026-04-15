from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..services.home_service import HomeService
from ..serializers.home_serializer import HomeSerializer, HomeUserSerializer, RequestSerializer
from ..repositories.home_repo import HomeRepository, RequestRepository
from core.users.models import Account

class UserHomesView(APIView):
    """Lấy danh sách homes của user hiện tại"""
    def get(self, request):
        user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None
        if not user_id:
            # Nếu chưa có auth, tạm thời lấy từ query param (sẽ cải thiện sau)
            user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response({"error": "User ID required"}, status=status.HTTP_400_BAD_REQUEST)
        
        homes = HomeService.get_user_homes(user_id)
        serializer = HomeSerializer(homes, many=True)
        
        # Lấy role của user trong mỗi home
        result = []
        for home in homes:
            home_user = HomeService.get_home_members(home.id).filter(id_user_id=user_id).first()
            result.append({
                **HomeSerializer(home).data,
                'role': home_user.role if home_user else 'user'
            })
        
        return Response({"data": result}, status=status.HTTP_200_OK)


class CreateHomeView(APIView):
    """Tạo home mới"""
    def post(self, request):
        import uuid
        from ..models import Home, HomeUser
        
        namehome = request.data.get('namehome')
        user_id = request.data.get('user_id') or (request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None)
        
        if not namehome or not user_id:
            return Response({"error": "namehome and user_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Tạo home
        home = Home.objects.create(
            id=str(uuid.uuid4()),
            namehome=namehome
        )
        
        # Thêm user làm admin
        HomeUser.objects.create(
            id=str(uuid.uuid4()),
            id_home=home,
            id_user_id=user_id,
            role='admin'
        )
        
        serializer = HomeSerializer(home)
        return Response({
            "message": "Tạo nhà thành công",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)


class SearchHomesView(APIView):
    """Tìm homes theo tên"""
    def get(self, request):
        namehome = request.query_params.get('namehome', '').strip()
        
        if not namehome:
            return Response({"error": "namehome parameter required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Tìm homes có tên chứa chuỗi tìm kiếm (case-insensitive)
        homes = HomeRepository.get_all_homes().filter(namehome__icontains=namehome)
        serializer = HomeSerializer(homes, many=True)
        
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)


class JoinHomeView(APIView):
    """Gửi request join home"""
    def post(self, request):
        home_id = request.data.get('home_id')
        user_id = request.data.get('user_id') or (request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None)
        
        if not home_id or not user_id:
            return Response({"error": "home_id and user_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Kiểm tra xem user đã có request pending chưa
        existing_request = RequestRepository.get_by_home_id(home_id).filter(
            id_user_id=user_id,
            status='pending'
        ).first()
        
        if existing_request:
            return Response({"error": "Bạn đã gửi yêu cầu tham gia nhà này rồi"}, status=status.HTTP_400_BAD_REQUEST)
        
        request_obj = HomeService.create_join_request(user_id, home_id)
        serializer = RequestSerializer(request_obj)
        
        return Response({
            "message": "Đã gửi yêu cầu tham gia nhà",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)


class HomeRequestsView(APIView):
    """Lấy danh sách requests của một home"""
    def get(self, request):
        home_id = request.query_params.get('home_id')
        status_filter = request.query_params.get('status', 'pending')  # Mặc định lấy pending
        
        if not home_id:
            return Response({"error": "home_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        requests = RequestRepository.get_by_home_id(home_id).filter(status=status_filter)
        serializer = RequestSerializer(requests, many=True)
        
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)


class ApproveRequestView(APIView):
    """Duyệt request (approve)"""
    def post(self, request):
        request_id = request.data.get('request_id')
        
        if not request_id:
            return Response({"error": "request_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        request_obj = RequestRepository.get_by_id(request_id)
        if not request_obj:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if request_obj.status != 'pending':
            return Response({"error": "Request đã được xử lý rồi"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cập nhật status thành approved
        RequestRepository.update_request_status(request_id, 'approved')
        
        # Tự động thêm user vào home
        import uuid
        from ..models import HomeUser
        
        # Kiểm tra xem user đã có trong home chưa
        existing = HomeUser.objects.filter(
            id_home_id=request_obj.id_home_id,
            id_user_id=request_obj.id_user_id
        ).first()
        
        if not existing:
            HomeUser.objects.create(
                id=str(uuid.uuid4()),
                id_home_id=request_obj.id_home_id,
                id_user_id=request_obj.id_user_id,
                role='user'
            )
        
        updated_request = RequestRepository.get_by_id(request_id)
        serializer = RequestSerializer(updated_request)
        
        return Response({
            "message": "Đã duyệt yêu cầu tham gia nhà",
            "data": serializer.data
        }, status=status.HTTP_200_OK)


class RejectRequestView(APIView):
    """Từ chối request (reject)"""
    def post(self, request):
        request_id = request.data.get('request_id')
        
        if not request_id:
            return Response({"error": "request_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        request_obj = RequestRepository.get_by_id(request_id)
        if not request_obj:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if request_obj.status != 'pending':
            return Response({"error": "Request đã được xử lý rồi"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cập nhật status thành rejected
        RequestRepository.update_request_status(request_id, 'rejected')
        
        updated_request = RequestRepository.get_by_id(request_id)
        serializer = RequestSerializer(updated_request)
        
        return Response({
            "message": "Đã từ chối yêu cầu tham gia nhà",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
