from django.urls import re_path, path

from . import consumers

websocket_urlpatterns = [
    path(r"api/conversation/<int:id>/", consumers.ChatConsumer.as_asgi()),
    re_path(r"api/chat/hello/$", consumers.UsersConsumer.as_asgi()),
]
