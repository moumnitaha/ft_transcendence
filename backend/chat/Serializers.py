from rest_framework import serializers
from .models import User, Conversation, Message, deletefor, Seen
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.authtoken.models import Token
from django.contrib.auth import models
from users.serializers import UserSerializer


class ConversationSerializer(serializers.ModelSerializer):
    sender = UserSerializer()  # Serializer for sender
    receiver = UserSerializer()  # Serializer for receiver

    class Meta:
        model = Conversation
        fields = ['id', 'sender', 'receiver', 'last_msg',
                  'date', 'blocked']  # Add more fields as needed
        # read_only_fields = ['sender','receiver']


class deleteforSerializer(serializers.ModelSerializer):
    class Meta:
        model = deletefor
        fields = ["userId"]


class SeenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seen
        fields = ["userId"]


class MessageSerializer(serializers.ModelSerializer):

    conversation = ConversationSerializer()
    deletefor = deleteforSerializer(many=True)  # Serializer for sender

    class Meta:
        model = Message
        fields = ["id", "conversation", "deletefor", "sender", "reciever",
                  "text_message", "datetime", "join"]  # Add more fields as needed
        # exclude = ['email', 'password', 'level']





# class serialzer of JWT
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # token['id'] = user.id
        token['email'] = user.email
        token['password'] = user.password
        # token['email'] = user.email
        # ...

        return token
