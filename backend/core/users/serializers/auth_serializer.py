from rest_framework import serializers
from ..repositories.user_repo import UserRepository

# 1. Input: Đăng ký
class RegisterRequestSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, min_length=1) # Không cần check độ dài quá kỹ
    fullname = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if UserRepository.username_exists(value):
            raise serializers.ValidationError("Tài khoản đã tồn tại!")
        return value

# 2. Input: Đăng nhập
class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)

# 3. Output: Trả về Client
class UserResponseSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        from ..models import Account
        model = Account
        # Trả về cả password để bạn test xem nó có đúng là plain text ko (Thực tế nên bỏ đi)
        fields = ['id', 'username', 'fullname', 'email', 'phone', 'password', 'avatar_url']

    def get_avatar_url(self, obj):
        from ..models import FaceUser
        try:
            face_user = FaceUser.objects.get(id_user=obj)
            return face_user.avatar_url
        except FaceUser.DoesNotExist:
            return ""

