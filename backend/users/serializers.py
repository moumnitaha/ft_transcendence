from rest_framework import serializers
from django.contrib.auth import password_validation
from .models import User, Friendship
from chat.models import Conversation


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "nickname", "password", "avatar_url", "is_online", "last_login"]


class FriendshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship 
        fields = '__all__'

class ConversationSerializer(serializers.ModelSerializer):
     class Meta:
        model = Friendship 
        fields = ['id']