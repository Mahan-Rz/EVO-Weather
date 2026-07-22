import requests


def get_coordinates(city):
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}"
    return requests.get(url).json()


def get_weather(lat, lon):
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        f"&current_weather=true"
        f"&hourly=temperature_2m,relativehumidity_2m,pressure_msl,cloudcover,precipitation_probability,windgusts_10m,weathercode,visibility,uv_index"
        f"&timezone=auto"
        f"&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset"
        f"&forecast_days=7"
    )
    return requests.get(url).json()