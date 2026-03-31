from django.urls import path
from .views import log_views

app_name = 'logs'

urlpatterns = [
    path('', log_views.HomeLogsView.as_view(), name='home-logs'),
    path('create/', log_views.CreateLogView.as_view(), name='create-log'),
]
