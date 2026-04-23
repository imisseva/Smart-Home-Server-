from rest_framework import serializers
from ..models import LogHome


class LogHomeSerializer(serializers.ModelSerializer):
    user_fullname = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    is_stranger = serializers.SerializerMethodField()

    class Meta:
        model = LogHome
        fields = ['id_loghome', 'id_home', 'id_user', 'user_fullname', 'user_avatar', 'is_stranger', 'log_time', 'image_url', 'method']

    def get_user_fullname(self, obj):
        if obj.id_user:
            return obj.id_user.fullname or obj.id_user.username
        return "Người lạ"

    def get_user_avatar(self, obj):
        if obj.id_user:
            # Lấy avatar từ FaceUser nếu có
            try:
                from core.users.models import FaceUser
                face = FaceUser.objects.get(id_user=obj.id_user)
                return face.avatar_url
            except Exception:
                return None
        return None

    def get_is_stranger(self, obj):
        return obj.id_user is None
