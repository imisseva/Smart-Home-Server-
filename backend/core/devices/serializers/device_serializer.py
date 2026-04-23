from rest_framework import serializers
from ..models import Device, Tahc

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'id_home', 'name', 'type', 'status', 'intensity', 'passcode', 'mqtt_topic', 'pin', 'mac_address']


class TahcSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tahc
        fields = ['id_tahc', 'id_home', 'temp', 'hum', 'created_at']

