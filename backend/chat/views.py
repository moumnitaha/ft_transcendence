from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import User, Conversation, Message, deletefor, Seen
from .Serializers import ConversationSerializer, MessageSerializer
from users.serializers import UserSerializer
from rest_framework import generics, status
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.parsers import FormParser, MultiPartParser
from django.core.paginator import Paginator
from django.utils import timezone


User = get_user_model()


@api_view(['GET'])
def Home(request, pk):
    friends = []
    data = {}
    friends_active = []
    conversations_to_delete = []

    messagenotSeeinConversations = []
    try:
        user = User.objects.get(pk=pk)
    except:
        return Response(data, status=status.HTTP_400_BAD_REQUEST)
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
    conversation = Conversation.objects.exclude(last_msg="").filter(
        Q(sender__id=pk) | Q(receiver__id=pk)).order_by('-date')

    for cvrt in conversation:
        last_msg = Message.objects.filter(conversation=cvrt).last()
        if last_msg is not None:
            is_deleted = last_msg.deletefor.filter(userId=pk)
        else:
            is_deleted = None
        if is_deleted:
            conversations_to_delete.append(cvrt)

    # Delete conversations that need to be deleted
    filtered_conversations = [
        conver for conver in conversation if conver not in conversations_to_delete]
    for cvrt in filtered_conversations:
        seenmsgs = Message.objects.filter(conversation=cvrt).exclude(
            sender=pk).exclude(seen__userId=pk).count()
        unseen_msgs_count = str(seenmsgs)
        messagenotSeeinConversations.append((str(cvrt.id), unseen_msgs_count))
    if user:
        data['friends'] = UserSerializer(friends, many=True).data
        data['friends_active'] = UserSerializer(friends_active, many=True).data
        data['user'] = UserSerializer(user, many=False).data
        data['conversation'] = ConversationSerializer(
            filtered_conversations, many=True).data
        for conversation in data['conversation']:
            for cvt in messagenotSeeinConversations:
                if str(conversation['id']) == cvt[0]:  # Match conversation IDs
                    conversation["counters"] = cvt[1]
    return Response(data)


@api_view(['GET', 'PUT', 'DELETE'])
# pk id of conversation AND ID of user
def MessageDetail(request, pk, id):
    if request.method == 'GET':
        data = {}
        user = {}
        conversation = Conversation.objects.get(id=pk)
        if not conversation:
            return Response({'error': 'Conversation not found.'}, status=404)
        sender = get_object_or_404(User, pk=conversation.sender.id)
        receiver = get_object_or_404(User, pk=conversation.receiver.id)
        if (sender.id == id):
            user = receiver
        else:
            user = sender

        # Get messages related to the conversation
        try:
            delete_instance = deletefor.objects.get(userId=pk)
            messages = Message.objects.filter(conversation__id=conversation.id).exclude(
                deletefor=delete_instance).order_by('datetime')
        except deletefor.DoesNotExist:
            messages = Message.objects.filter(
                conversation__id=conversation.id).order_by('datetime')

        data['messages'] = MessageSerializer(messages, many=True).data
        data['conversation'] = ConversationSerializer(conversation).data
        data['user'] = UserSerializer(user).data
        return Response(data)
    if request.method == 'PUT':
        try:
            obj = Conversation.objects.get(id=pk)
        except:
            raise ValidationError('User ID is required.')
        obj.blocked = id
        obj.save()
        serializer = ConversationSerializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)







class deleteConversation(generics.DestroyAPIView):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer



@api_view(['GET'])
def userData(request, pk, id):
    data = {}

    # Get sender and receiver
    sender = get_object_or_404(User, pk=pk)
    receiver = get_object_or_404(User, pk=id)

    # Check if conversation exists
    conversation = Conversation.objects.filter(
        (Q(sender=sender, receiver=receiver) | Q(sender=receiver, receiver=sender))
    ).first()

    if not conversation:
        return Response({'error': 'Conversation not found.'}, status=404)

    # Get messages related to the conversation
    try:
        delete_instance = deletefor.objects.get(userId=pk)
        messages = Message.objects.filter(
            conversation__id=conversation.id).exclude(deletefor=delete_instance).order_by('datetime')
    except deletefor.DoesNotExist:
        messages = Message.objects.filter(
            conversation__id=conversation.id).order_by('datetime')

    data['messages'] = MessageSerializer(messages, many=True).data
    data['conversation'] = ConversationSerializer(conversation).data
    data['user'] = UserSerializer(sender).data

    return Response(data)

# create user and token for it


@api_view(['GET', 'POST'])
def create_user(request):
    if request.method == 'POST':
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()  # Save the validated data
            return Response({"user": serializer.data}, status=status.HTTP_201_CREATED)
        else:
            # If serializer is not valid, return a response with errors

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({"message": "method not supported", "status": status.HTTP_400_BAD_REQUEST})


@api_view(['GET'])
def FilterView(request, id):
    if (request.method == 'GET'):
        data = {}
        # try:
        target = request.query_params.get('target')
        users = User.objects.filter(first_name__icontains=target.lower()) | \
            User.objects.filter(last_name__icontains=target.lower()) | \
            User.objects.filter(username__icontains=target.lower())
        conversations = Conversation.objects.filter(Q(sender__id=id) | Q(
            receiver__id=id)).prefetch_related('sender', 'receiver')
        user_ids = set()
        conversation_ids = set()
        for conversation in conversations:
            for user in users:
                if user.id == conversation.sender.id or user.id == conversation.receiver.id:
                    if conversation.id not in conversation_ids:
                        conversation_ids.add(conversation.id)
                    if user.id != id:
                        user_ids.add(user.id)
        # Fetch users based on the extracted IDs
        users = User.objects.filter(id__in=user_ids)
        conversations = Conversation.objects.filter(id__in=conversation_ids)
        data["user"] = UserSerializer(users, many=True).data
        data["conversations"] = ConversationSerializer(
            conversations, many=True).data
        return Response(data)


@api_view(['PUT'])
def deleteAllmessages(request, id, pk):
    if request.method == 'PUT':
        try:
            # Get or create the deletefor object for the user
            user_deletefor, created = deletefor.objects.get_or_create(
                userId=pk)

            # Get the conversation and messages
            conversation = get_object_or_404(Conversation, pk=id)
            messages = Message.objects.filter(
                conversation=conversation).exclude(deletefor__userId=pk)

            # Associate each message with the deletefor object
            for message in messages:
                message.deletefor.add(user_deletefor)
                message.save()

            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        except Message.DoesNotExist:
            return Response({"error": "Messages not found for this conversation."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT'])
def readMsgs(request, id, pk):
    if request.method == 'PUT':
        try:
            # Get or create the deletefor object for the user
            user_Seen, created = Seen.objects.get_or_create(userId=pk)

            # Get the conversation and messages
            conversation = get_object_or_404(Conversation, pk=id)
            messages = Message.objects.filter(
                conversation=conversation).exclude(seen__userId=pk)

            # Associate each message with the deletefor object
            for message in messages:
                message.seen.add(user_Seen)
                message.save()

            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        except Message.DoesNotExist:
            return Response({"error": "Messages not found for this conversation."}, status=status.HTTP_404_NOT_FOUND)









