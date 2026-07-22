from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from .views import weather_view


class WeatherViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch("weather.views.get_weather")
    @patch("weather.views.get_coordinates")
    def test_weather_view_includes_hourly_forecast(self, mock_get_coordinates, mock_get_weather):
        mock_get_coordinates.return_value = {
            "results": [{"latitude": 40.71, "longitude": -74.01}]
        }
        mock_get_weather.return_value = {
            "current_weather": {"time": "2026-06-27T12:00"},
            "hourly": {
                "time": [f"2026-06-27T{i:02d}:00" for i in range(12, 24)],
                "temperature_2m": [20 + i for i in range(12)],
                "weathercode": [1] * 12,
                "precipitation_probability": [5] * 12,
                "relativehumidity_2m": [60] * 12,
                "pressure_msl": [1010] * 12,
            },
            "daily": {
                "time": ["2026-06-27", "2026-06-28"],
                "temperature_2m_max": [25, 26],
                "temperature_2m_min": [18, 19],
                "weathercode": [1, 2],
                "sunrise": ["2026-06-27T05:00"],
                "sunset": ["2026-06-27T20:00"],
            },
        }

        request = self.factory.get("/api/v1/weather/", {"city": "New York"})
        response = weather_view(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["hourly_forecast"]), 12)
        self.assertEqual(response.data["hourly_forecast"][0]["temperature"], 20)
