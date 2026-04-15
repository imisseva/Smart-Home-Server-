from django.urls import path
from .views import home_views

app_name = 'homes'

urlpatterns = [
    path('', home_views.UserHomesView.as_view(), name='user-homes'),
    path('create/', home_views.CreateHomeView.as_view(), name='create-home'),
    path('search/', home_views.SearchHomesView.as_view(), name='search-homes'),
    path('join/', home_views.JoinHomeView.as_view(), name='join-home'),
    path('requests/', home_views.HomeRequestsView.as_view(), name='home-requests'),
    path('requests/approve/', home_views.ApproveRequestView.as_view(), name='approve-request'),
    path('requests/reject/', home_views.RejectRequestView.as_view(), name='reject-request'),
]
