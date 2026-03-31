from rest_framework import serializers
from ..models import LogHome

class LogHomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogHome
        fields = ['id_loghome', 'id_home', 'id_user', 'log_time', 'image_url', 'method']

