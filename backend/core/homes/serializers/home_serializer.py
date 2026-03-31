from rest_framework import serializers
from ..models import Home, HomeUser, Request
from core.users.models import Account

class HomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Home
        fields = ['id', 'namehome']


class HomeUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeUser
        fields = ['id', 'id_home', 'id_user', 'role']


class UserInfoSerializer(serializers.ModelSerializer):
    """Serializer cho thông tin user trong request"""
    class Meta:
        model = Account
        fields = ['id', 'username', 'fullname', 'email', 'phone']


class RequestSerializer(serializers.ModelSerializer):
    """Serializer cho request với thông tin user"""
    id_user = UserInfoSerializer(read_only=True)
    id_home = HomeSerializer(read_only=True)
    
    class Meta:
        model = Request
        fields = ['id_request', 'id_user', 'id_home', 'status']

