from django.urls import include, path
from .views import weather_history, weather_page, weather_view

urlpatterns = [
    path('', weather_page),
    path('api/v1/weather/', weather_view),
    path('api/v1/history/', weather_history),
    path('api-auth/', include('rest_framework.urls')),
    
]

