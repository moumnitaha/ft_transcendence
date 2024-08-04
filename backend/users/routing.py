from django.urls import re_path, path
from . import notifications

websocket_urlpatterns = [
    path("api/notification", notifications.NotificationsConsumer.as_asgi()),
]
