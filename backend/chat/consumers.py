import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from .models import Conversation, Message
from users.models import User
from django.db.models import Q
from users.serializers import UserSerializer
from .Serializers import ConversationSerializer, MessageSerializer
import datetime
from django.utils import timezone
from collections import defaultdict
import json
import random
from pong.models import Player, Game, Tournament
from django.core.cache import cache


class DateTimeEncoder(json.JSONEncoder):
    def default(self, z):
        if isinstance(z, datetime.datetime):
            return (str(z))
        else:
            return super().default(z)


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.play = False  # Initialize play state
        self.lst = list()

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["id"]
        self.room_group_name = f"chat_{self.room_name}"
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )
        if self.scope["user_id"]:
            self.lst.append(self.scope["user_id"])

            await self.accept()
        else:
            # Accept connection
            await self.close()

    async def disconnect(self, close_code):
        self.lst.remove(self.scope['user_id'])
        if (len(self.lst) == 0):
            cache.set(self.room_name, False)
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        type = data['type']
        Conversation_user = await database_sync_to_async(self.LastSeen)(self.room_name)
        if (type == "conversation.block"):
            id = data['userID']
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "conversation.block",
                    "message": {
                        "text_message": "block",
                        "user_id": id

                    },
                },
            )
        elif (type == "conversation.deblock"):
            id = data['conversation']
            obj = Conversation.objects.get(id=id)
            obj.blocked = 0
            obj.save()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "conversation.deblock",
                    "message": {
                        "text_message": "deblock",
                        "Conversation_user": Conversation_user

                    },
                },
            )
        elif (type == "message.play"):
            self.play = True
            reciever = data['reciever']
            cache.set(self.room_name, self.play)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "message.play",

                },
            )
        elif (type == "accept.game"):
            self.play = False
            cache.set(self.room_name, self.play)
            message = data['conversation_id']
            roomName = await database_sync_to_async(self.createGamme)(message)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "accept.game",
                    "message": roomName,

                },
            )
        elif (type == "cancel.play"):
            id = data['id'] 
            self.play = False
            cache.set(self.room_name, self.play)
            message = Message.objects.get(id=id)
            message.join = True
            message.save()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "cancel.play",

                },
            )
        elif (type == "user.lastSeen"):
            Conversation_user = await database_sync_to_async(self.LastSeen)(self.room_name)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "user.lastSeen",
                    "Conversation_user": Conversation_user
                },
            )
        else:
            message = data['data']
            receiver = data['receiver']
            sender = data['sender']
            conversation = data['conversation']
            username = data["username"]
            if (message == "@game" and cache.get(self.room_name)):
                print("now play is forbidden", self.play)
                return
            avatar_url = await database_sync_to_async(self.save_msg)(message, receiver, sender, conversation)
            id = Message.objects.last().id
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "message.chat",
                    "message": {
                        "id" : id,
                        "sender": sender,
                        "receiver": receiver,
                        "text_message": message,
                        "Conversation_user": Conversation_user,
                        "datetime":  timezone.now(),
                        "conversation":
                        {
                            "avatar_url": avatar_url
                        }
                    },
                },
            )

    async def message_chat(self, event):
        message = event['message']
        type = event['type']
        await self.send(text_data=json.dumps({

            'message':  message,
            'type': type
        }, cls=DateTimeEncoder))

    async def accept_game(self, event):
        message = event['message']
        type = event['type']
        await self.send(text_data=json.dumps({
            'message':  message,
            'type': type
        }, cls=DateTimeEncoder))

    async def cancel_play(self, event):
        type = event['type']
        await self.send(text_data=json.dumps({
            'type': type
        }, cls=DateTimeEncoder))

    async def conversation_block(self, event):
        message = event['message']
        type = event['type']

        await self.send(text_data=json.dumps({
            'message':  message,
            'type': type
        }, cls=DateTimeEncoder))

    async def conversation_deblock(self, event):

        message = event['message']
        type = event['type']
        await self.send(text_data=json.dumps({
            'message':  message,
            'type': type
        }, cls=DateTimeEncoder))

    async def message_play(self, event):
        # message = event['message']
        type = event['type']
        await self.send(text_data=json.dumps({
            # 'message':  message,
            'type': type
        }, cls=DateTimeEncoder))

    async def accept_game(self, event):
        message = event['message']

        type = event['type']
        await self.send(text_data=json.dumps({
            'message':  message,
            'type': type
        }, cls=DateTimeEncoder))

    async def user_lastSeen(self, event):
        type = event['type']
        id = event['id']
        Conversation_user = await database_sync_to_async(self.LastSeen)(id)

        await self.send(text_data=json.dumps({
            "type": type,
            "message": {
                "data": Conversation_user
            },
        }, cls=DateTimeEncoder))

    def save_msg(self, message, receiver, sender, conversation):
        conv = Conversation.objects.get(id=conversation)
        if (message != "@game"):
            conv.last_msg = message
            conv.date = timezone.now()
            conv.save()
        obj = Message()
        obj.conversation = conv
        obj.text_message = message
        obj.sender = sender
        obj.reciever = receiver
        obj.save()
        return conv.sender.avatar_url

    def LastSeen(self, conversationId):
        conversation = Conversation.objects.get(id=conversationId)
        serialized_data = ConversationSerializer(conversation).data
        return serialized_data

    def createGamme(self, message):
        conversation = Conversation.objects.get(id=message)
        lstMsgs = Message.objects.filter(conversation=conversation)
        for msg in lstMsgs:
            if msg.text_message == "@game":
                msg.join = True
                msg.save()
        if conversation is not None:
            sender = conversation.sender
            reciever = conversation.receiver
        if sender and reciever:
            user1 = User.objects.get(username=sender.username)
            player1 = Player.objects.get(user=user1)
            user2 = User.objects.get(username=reciever.username)
            player2 = Player.objects.get(user=user2)
            room = ''.join(random.choices(
                'abcdefghijklmnopqrstuvwxyz0123456789', k=8))
            game = Game(player1=player1, player2=player2, room=room)
            game.save()
        return room


class UsersConsumer(AsyncWebsocketConsumer):
    connected_users_by_room = defaultdict(list)

    async def connect(self):
        self.room_name = "OnlineFriends"
        self.room_group_name = f"chat_{self.room_name}"
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )
        if self.scope["user_id"]:
            # Reject connection if user is not authenticated

            await self.accept()
            # self.connected_users_by_room[self.room_name].append(self.scope['user_id'])
            # associate the user with the websocket connection
            await self.associate_user()
        else:
            await self.close()
            # Accept connection

    async def associate_user(self):
        user_id = self.scope['user_id']
        await self.channel_layer.group_add(
            f"user_{user_id}", self.channel_name
        )

    async def disconnect(self, close_code):
        # Remove the connection from the room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )
    # If the user is authenticated, remove the connection from the user group
        if self.scope["user_id"]:
            user_id = self.scope['user_id']
            await self.channel_layer.group_discard(
                f"user_{user_id}", self.channel_name
            )

    async def receive(self, text_data):
        # Parse the incoming message (assuming it's JSON)
        message_data = json.loads(text_data)
        message_type = message_data.get('type')
        id = message_data['id']
        if message_type == 'send_message_to_user':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "send.message.to.user",
                    "id": id,
                },
            )
        elif message_type == 'other_action':
            # Handle other types of messages
            pass
        else:
            # Invalid message type, handle accordingly
            pass

    async def send_message_to_user(self, event):
        # Retrieve the WebSocket connections for the recipient user's group
        id = event['id']
        message = await database_sync_to_async(self.get_OnlineUser)(id)
        user_group_name = f"user_{id}"
        channel_layer = self.channel_layer
    # Send the message to the user's group
        await channel_layer.group_send(user_group_name, {
            'type': "user.update",
            'message': message  # Ensure that 'message' argument is passed here
        })
        data = await database_sync_to_async(self.get_active_users)(id)
        if data:
            for user in data['friends_active']:
                id = user['id']
                message = await database_sync_to_async(self.get_OnlineUser)(id)
                user_group_name = f"user_{id}"
                channel_layer = self.channel_layer

                await channel_layer.group_send(user_group_name, {
                    'type': "user.update",
                    'message': message  # Ensure that 'message' argument is passed here
                })

    async def user_update(self, event):
        type = event['type']
        message = event['message']
        # Formulate your response
        response = {
            "type": type,
            "message": message,
        }

        # Convert the response dictionary to JSON string
        response_json = json.dumps(response)

        # Send the JSON response back
        await self.send(text_data=response_json)

    async def user_disconnected(self, event):
        user_id = event["user_id"]
        await self.send(text_data=json.dumps({
            "type": "user.disconnected",
            'message':  user_id
        }, cls=DateTimeEncoder))

    def get_active_users(self, pk):
        friends = []
        friends_active = []
        data = {}
        try:
            conversations = Conversation.objects.filter(Q(sender__id=pk) | Q(
                receiver__id=pk)).prefetch_related('sender', 'receiver')
            for conversation in conversations:
                if conversation.sender.id != pk:
                    friends.append(conversation.sender)
                    if conversation.sender.is_online == True:
                        friends_active.append(conversation.sender)
                if conversation.receiver.id != pk:
                    friends.append(conversation.receiver)
                    if conversation.receiver.is_online == True:
                        friends_active.append(conversation.receiver)
        except:
            return []
        data['friends_active'] = UserSerializer(friends_active, many=True).data
        return data

    def get_OnlineUser(self, pk):
        friends = []
        data = {}
        friends_active = []
        conversations_to_delete = []
        group_to_delete = []
        messagenotSeeinConversations = []
        messagenotSeeinGroups = []
        try:
            conversations = Conversation.objects.filter(Q(sender__id=pk) | Q(
                receiver__id=pk)).prefetch_related('sender', 'receiver')
            for conversation in conversations:
                if conversation.sender.id != pk:
                    friends.append(conversation.sender)
                    if conversation.sender.is_online == True:
                        friends_active.append(conversation.sender)
                if conversation.receiver.id != pk:
                    friends.append(conversation.receiver)
                    if conversation.receiver.is_online == True:
                        friends_active.append(conversation.receiver)
            user = User.objects.get(pk=pk)
            conversation = Conversation.objects.exclude(last_msg="").filter(
                Q(sender__id=pk) | Q(receiver__id=pk)).order_by('-date')

            for cvrt in conversation:
                last_msg = Message.objects.filter(conversation=cvrt).last()
                is_deleted = last_msg.deletefor.filter(userId=pk)
                if is_deleted:
                    conversations_to_delete.append(cvrt)

            # Delete conversations that need to be deleted
            filtered_conversations = [
                conver for conver in conversation if conver not in conversations_to_delete]
            for cvrt in filtered_conversations:
                seenmsgs = Message.objects.filter(conversation=cvrt).exclude(
                    sender=pk).exclude(seen__userId=pk).count()
                unseen_msgs_count = str(seenmsgs)
                messagenotSeeinConversations.append(
                    (str(cvrt.id), unseen_msgs_count))
        except:
            return []

        if user:
            data['friends'] = UserSerializer(friends, many=True).data
            data['friends_active'] = UserSerializer(
                friends_active, many=True).data
            data['user'] = UserSerializer(user, many=False).data
            data['conversation'] = ConversationSerializer(
                filtered_conversations, many=True).data
            for conversation in data['conversation']:
                for cvt in messagenotSeeinConversations:
                    if str(conversation['id']) == cvt[0]:  # Match conversation IDs
                        conversation["counters"] = cvt[1]
            return data



