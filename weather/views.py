from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import render

from .serializers import WeatherSearchSerializer
from .models import WeatherSearch
from .services import get_coordinates, get_weather
from .utils import (get_cached_weather, set_cached_weather)


def weather_page(request):
    return render(request, "weather/weather.html")

@api_view(['GET'])
@permission_classes([AllowAny])
def weather_view(request):
    city = request.GET.get('city')

    if not city:
        return Response({"error": "City is required"}, status=400)

    cached_weather = get_cached_weather(city)

    if cached_weather:
        return Response(cached_weather)

    geo_response = get_coordinates(city)

    if not geo_response.get("results"):
        return Response({"error": "city not found"}, status=404)

    lat = geo_response["results"][0]["latitude"]
    lon = geo_response["results"][0]["longitude"]

    weather_data = get_weather(lat, lon)
    weather = weather_data.get("current_weather", {})
    hourly = weather_data.get("hourly", {})
    daily = weather_data.get("daily", {})

    current_time = weather.get("time")
    current_index = None

    if current_time and hourly.get("time"):
        try:
            current_index = hourly["time"].index(current_time)
        except ValueError:
            try:
                current_dt = datetime.fromisoformat(current_time)
                hourly_times = [datetime.fromisoformat(t) for t in hourly["time"]]
                current_index = min(range(len(hourly_times)), key=lambda i: abs((hourly_times[i] - current_dt).total_seconds()))
            except Exception:
                current_index = None

    def hourly_value(key):
        values = hourly.get(key, [])
        if current_index is not None and 0 <= current_index < len(values):
            return values[current_index]
        return None

    hourly_forecast = []
    hourly_times = hourly.get("time", [])
    hourly_temps = hourly.get("temperature_2m", [])
    hourly_codes = hourly.get("weathercode", [])
    hourly_precip = hourly.get("precipitation_probability", [])
    hourly_humidity = hourly.get("relativehumidity_2m", [])
    hourly_pressure = hourly.get("pressure_msl", [])
    hourly_visibility = hourly.get("visibility", [])
    hourly_uv_index = hourly.get("uv_index", [])

    start_index = current_index if current_index is not None else 0
    end_index = min(start_index + 12, len(hourly_times))

    for i in range(start_index, end_index):
        hourly_forecast.append({
            "time": hourly_times[i],
            "temperature": hourly_temps[i] if i < len(hourly_temps) else None,
            "weathercode": hourly_codes[i] if i < len(hourly_codes) else None,
            "precipitation_probability": hourly_precip[i] if i < len(hourly_precip) else None,
            "humidity": hourly_humidity[i] if i < len(hourly_humidity) else None,
            "pressure": hourly_pressure[i] if i < len(hourly_pressure) else None,
            "visibility": hourly_visibility[i] if i < len(hourly_visibility) else None,
            "uv_index": hourly_uv_index[i] if i < len(hourly_uv_index) else None,
        })

    forecast = []
    daily_times = daily.get("time", [])
    daily_max = daily.get("temperature_2m_max", [])
    daily_min = daily.get("temperature_2m_min", [])
    daily_codes = daily.get("weathercode", [])

    for i in range(len(daily_times)):
        forecast.append({
            "date": daily_times[i],
            "temperature_max": daily_max[i] if i < len(daily_max) else None,
            "temperature_min": daily_min[i] if i < len(daily_min) else None,
            "weathercode": daily_codes[i] if i < len(daily_codes) else None,
        })

    weather.update({
        "humidity": hourly_value("relativehumidity_2m"),
        "pressure": hourly_value("pressure_msl"),
        "precipitation_probability": hourly_value("precipitation_probability"),
        "cloudcover": hourly_value("cloudcover"),
        "windgust": hourly_value("windgusts_10m"),
        "visibility": hourly_value("visibility"),
        "uv_index": hourly_value("uv_index"),
        "wind_direction": hourly_value("winddirection_10m"),
        "temperature_max": daily_max[0] if daily_max else None,
        "temperature_min": daily_min[0] if daily_min else None,
        "sunrise": daily.get("sunrise", [None])[0],
        "sunset": daily.get("sunset", [None])[0],
    })

    if request.user.is_authenticated:
        WeatherSearch.objects.create(
            user=request.user,
            city=city,
            temperature=weather.get("temperature"),
            windspeed=weather.get("windspeed")
        )

    response_data = {
        "city": city,
        "latitude": lat,
        "longitude": lon,
        "current": weather,
        "current_index": current_index,
        "forecast": forecast,
        "hourly_forecast": hourly_forecast
    }

    set_cached_weather(city, response_data)

    if request.user.is_authenticated:
        history = WeatherSearch.objects.filter(user=request.user).order_by('-created_at')[:5]
        serializer = WeatherSearchSerializer(history, many=True)
        response_data["history"] = serializer.data

    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weather_history(request):
    history = WeatherSearch.objects.filter(user=request.user).order_by('-id')
    serializer = WeatherSearchSerializer(history, many=True)
    return Response(serializer.data)
