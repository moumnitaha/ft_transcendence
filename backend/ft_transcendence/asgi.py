"""
ASGI config for transcendence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import pong.routing
import chat.routing
import users.routing
from chat.token_auth import TokenAuthMiddleware
from chat.token_auth import TokenAuthMiddlewareStack

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "transcendence.settings")

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": (
            TokenAuthMiddleware(
                URLRouter(
                    pong.routing.websocket_urlpatterns
                    + chat.routing.websocket_urlpatterns
                    + users.routing.websocket_urlpatterns
                )
            )
        ),
        # Just HTTP for now. (We can add other protocols later.)
    }
)
