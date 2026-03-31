from django.urls import path
from .views import device_views

app_name = 'devices'

urlpatterns = [
    path('', device_views.HomeDevicesView.as_view(), name='home-devices'),
    path('toggle/', device_views.ToggleDeviceView.as_view(), name='toggle-device'),
    path('intensity/', device_views.UpdateDeviceIntensityView.as_view(), name='update-intensity'),
]
