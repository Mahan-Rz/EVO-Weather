import redis
from django.conf import settings
import json

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
)

def get_cached_weather(city):
    city = city.strip().lower()

    key = f"weather:{city}"

    cached_data = redis_client.get(key)

    if cached_data:
        return json.loads(cached_data)

    return None

def set_cached_weather(city, data):

    city = city.strip().lower()

    key = f"weather:{city}"

    redis_client.set(key, json.dumps(data))

    redis_client.expire(key, 600)