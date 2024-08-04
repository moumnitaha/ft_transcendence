from django.utils import timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from users.models import User
from chat.models import Conversation
from django.db.models import Q
from .serializers import ConversationSerializer

user_connections = {}


class NotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user_id"] == AnonymousUser():
            await self.close()
            return
        self.group_name = f"notifications_{self.scope['user_id']}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        if self.scope["user_id"] not in user_connections:
            user_connections[self.scope["user_id"]] = 0
            await self.update_online_status(self.scope["user_id"], True)
            channel_layer = get_channel_layer()
            try:
                Conversations = await database_sync_to_async(self.allConversation)(self.scope["user_id"])
                for item in Conversations:
                    room_name = f"chat_{item['id']}"
                    print("===============>", room_name)
                    await channel_layer.group_send(
                        room_name,
                        {
                            "type": "user.lastSeen",
                            "id": item['id']
                        }
                    )
                await channel_layer.group_send(
                    "chat_OnlineFriends",
                    {
                        "type": "send.message.to.user",
                        "id": self.scope["user_id"],
                    }
                )
            except Exception as e:
                print("error:",  e)
        user_connections[self.scope["user_id"]] += 1
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        user_connections[self.scope["user_id"]] -= 1
        if user_connections[self.scope["user_id"]] == 0:
            del user_connections[self.scope["user_id"]]
            await self.set_last_login(self.scope["user_id"])
            await self.update_online_status(self.scope["user_id"], False)

            channel_layer = get_channel_layer()
            try:
                Conversations = await database_sync_to_async(self.allConversation)(self.scope["user_id"])
                for item in Conversations:
                    room_name = f"chat_{item['id']}"
                    print("===============>", room_name)
                    await channel_layer.group_send(
                        room_name,
                        {
                            "type": "user.lastSeen",
                            "id": item['id']
                        }
                    )
                await channel_layer.group_send(
                    "chat_OnlineFriends",
                    {
                        "type": "send.message.to.user",
                        "id": self.scope["user_id"],
                    }
                )

            except Exception as e:
                print(e)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def receive(self, text_data):
        pass

    @database_sync_to_async
    def update_online_status(self, user_id, is_online):
        user = User.objects.get(id=user_id)
        user.is_online = is_online
        user.save()

    def allConversation(self, id):
        data = {}
        conversations = Conversation.objects.filter(Q(sender__id=id) | Q(
            receiver__id=id)).prefetch_related('sender', 'receiver')
        serialized_data = ConversationSerializer(conversations, many=True).data
        data['conversations'] = serialized_data
        return serialized_data

    @database_sync_to_async
    def set_last_login(self, user_id):
        user = User.objects.get(id=user_id)
        user.last_login = timezone.now()
        user.save()
