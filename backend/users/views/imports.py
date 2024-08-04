# import the custom user instead of the base user
from pong.models import Player, Game
from ..serializers import UserSerializer
from django.contrib.auth import password_validation
import requests
import os
from dotenv import load_dotenv
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
	action,
    permission_classes,
    authentication_classes,
)
from django.contrib.auth import authenticate, login
from django.contrib.auth import get_user_model

User = get_user_model()
# end
