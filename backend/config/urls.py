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
    
    # Gom tất cả app vào prefix /api
    path('api/auth/', include('core.users.urls')), # Để vào thẳng các route của user
    path('api/homes/', include('core.homes.urls')),
    path('api/devices/', include('core.devices.urls')),
    path('api/logs/', include('core.logs.urls')),
]
