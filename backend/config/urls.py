from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    """API root endpoint để test"""
    return JsonResponse({
        "message": "Smart Home IoT API",
        "endpoints": {
            "auth": {
                "register": "/api/auth/register/",
                "login": "/api/auth/login/"
            },
            "homes": "/api/homes/",
            "devices": "/api/devices/",
            "logs": "/api/logs/",
            "admin": "/admin/"
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    
    # Giữ tương thích với API cũ: /api/auth/register và /api/auth/login
    path('api/', include('core.users.urls')),
    path('api/homes/', include('core.homes.urls')),
    path('api/devices/', include('core.devices.urls')),
    path('api/logs/', include('core.logs.urls')),
]