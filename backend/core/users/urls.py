from django.urls import path
from .views import auth_views , face_views

app_name = 'users'

urlpatterns = [
    path('auth/register/', auth_views.RegisterView.as_view(), name='register'),
    path('auth/login/', auth_views.LoginView.as_view(), name='login'),
    path('auth/face-login/', face_views.FaceLoginView.as_view(), name='face-login'),
    path('auth/face-esp-check/', face_views.FaceCheckESPView.as_view(), name='face-esp-check'),
    path('auth/profile/update/', auth_views.ProfileUpdateView.as_view(), name='profile-update'),
    path('auth/check-pose/', face_views.FacePoseCheckView.as_view(), name='check-pose'),
    path('auth/face-status/', face_views.FaceManagementView.as_view(), name='face-status'),
    path('auth/face-register/', face_views.FaceRegisterView.as_view(), name='face-register'),
]

