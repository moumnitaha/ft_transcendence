from django.urls import re_path, path

from . import games_consumer, match_consumer

websocket_urlpatterns = [
    path('api/pong/<str:room_name>', games_consumer.PongConsumer.as_asgi()),
    path('api/match/<str:room_name>', match_consumer.MatchMaking.as_asgi()),
]
# Compare this snippet from pong/views.py:
# from django.shortcuts import render, HttpResponse
