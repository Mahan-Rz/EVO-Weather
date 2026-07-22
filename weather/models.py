from django.db import models
from django.contrib.auth.models import User

class WeatherSearch(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    city = models.CharField(max_length=100)
    temperature = models.FloatField(null=True, blank=True)
    windspeed = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.city} - {self.user.username}"
