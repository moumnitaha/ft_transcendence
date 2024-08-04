from .imports import *
from ..models import Friendship, Block, GameInvite, FinalGameInvite
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from chat.models import Conversation
from django.db.models import Q
from rest_framework import status
from django.shortcuts import get_object_or_404
from ..serializers import FriendshipSerializer
from rest_framework.permissions import AllowAny
from pong.models import Game, Player
import random
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import random


@api_view(["POST"])
def edit_password(request):
    user = request.user
    if user.is_oauth:
        return Response(
            {
                "message": "If you're an oauth user log in through the oauth login handler"
            },
            status=400,
        )
    old_password = request.data.get("oldPassword")
    new_password = request.data.get("newPassword")
    if not user.check_password(old_password):
        return Response({"old_password": list([str("Invalid password")])}, status=400)
    try:
        password_validation.validate_password(new_password)
    except Exception as e:
        error_message = list(e)[0]
        return Response({"new_password": list([str(error_message)])}, status=400)
    user.set_password(new_password)
    user.save()
    return Response({"message": "Password updated successfully"}, status=201)


@api_view(["POST"])
def edit_name(request):
    user = request.user
    serializer = UserSerializer(instance=user, data={
        "first_name": request.data.get("firstName"),
        "last_name": request.data.get("lastName"),
    }, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Name updated successfully"}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET"])
def get_current_user_info(request):
    user = request.user
    player = Player.objects.get(user=user)
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "avatarUrl": user.avatar_url,
            "email": user.email,
            "wins": player.wins,
            "losses": player.losses,
            "xp": player.xp,
        },
        status=201,
    )


@api_view(["GET"])
def get_user_info(request):
    username = request.query_params.get("username")
    try:
        user = User.objects.get(username=username)
        player = Player.objects.get(user=user)
        played_games = Game.objects.filter(
            player1=player) | Game.objects.filter(player2=player)
        # filter finished games
        played_games = played_games.filter(status='finished')
        # sordted by created_at
        played_games = played_games.order_by('-created_at')
        games = []
        for game in played_games:
            games.append(
                {
                    "id": game.id,
                    "player1": game.player1.user.username,
                    "avatar1": game.player1.user.avatar_url,
                    "player2": game.player2.user.username,
                    "avatar2": game.player2.user.avatar_url,
                    "winner": game.winner.user.username if game.winner else None,
                    "created_at": game.created_at,
                    "finished_at": game.finished_at,
                    "score1": game.score1,
                    "score2": game.score2,
                    "status": game.status,
                }
            )
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "avatarUrl": user.avatar_url,
                "wins": player.wins,
                "losses": player.losses,
                "games": games,
                "nickname": user.nickname,
            },
            status=201,
        )
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)


@api_view(["GET"])
def get_users(request):
    query = request.query_params.get("query")
    limit = int(request.query_params.get("limit"))
    if query:
        users = User.objects.filter(username__icontains=query, is_staff=False)
        users = users[:limit]
        return Response(
            {
                "users": [
                    {
                        "username": user.username,
                        "firstName": user.first_name,
                        "lastName": user.last_name,
                        "avatarUrl": user.avatar_url,
                    }
                    for user in users
                ]
            },
            status=201,
        )


@api_view(["GET"])
def is_oauth(request):
    user = request.user
    return Response({"is_oauth": user.is_oauth}, status=201)


@api_view(["POST"])
def add_friend(request):
    user = request.user
    friend_username = request.data.get("friendUsername")
    try:
        friend = User.objects.get(username=friend_username)
        if user == friend:
            return Response(
                {"message": "You can't add yourself as a friend"}, status=400
            )
        friendship = Friendship.objects.filter(
            Q(from_user=friend, to_user=user) | Q(from_user=user, to_user=friend))
        if friendship.exists():
            if friendship.first().accepted:
                return Response(
                    {"message": "You're already friends with this user"}, status=400
                )
            else:
                return Response(
                    {"message": "You already sent a friend request"}, status=400
                )
        if Block.objects.filter(from_user=user, to_user=friend).exists():
            return Response(
                {"message": "You've blocked this user"}, status=400
            )
        friendship = Friendship(from_user=user, to_user=friend)
        # if friendship:
        friendship.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{friend.id}",
            {
                "type": "send_notification",
                "data": {
                    "type": "friend_request",
                    "from_user": user.username,
                    "from_user_avatar": user.avatar_url,
                },
            },
        )
        return Response({"message": "Friend added successfully"}, status=201)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)


@api_view(["GET"])
def fetch_notifications(request):
    user = request.user
    notifications = []
    for friendship in Friendship.objects.filter(to_user=user, accepted=False):
        notifications.append(
            {
                "type": "friend_request",
                "from_user": friendship.from_user.username,
                "from_user_avatar": friendship.from_user.avatar_url,
            }
        )
    for game_invite in GameInvite.objects.filter(to_user=user, accepted=False):
        notifications.append(
            {
                "type": "game_invite",
                "from_user": game_invite.from_user.username,
                "from_user_avatar": game_invite.from_user.avatar_url,
            }
        )
    for final_game_invite in FinalGameInvite.objects.filter((Q(user1=user) & Q(accepted1=False)) | (Q(user2=user) & Q(accepted2=False))):
        notifications.append(
            {
                "type": "final_game_invite",
                "room": final_game_invite.room,
                "from_user": "PONG_TEAM",
                "from_user_avatar": "final_game_invite.from_user.avatar_url",
            }
        )
    return Response({"notifications": notifications}, status=201)


@api_view(["POST"])
def accept_friend_request(request):
    user = request.user
    friend_username = request.data.get("friendUsername")
    try:
        friend = User.objects.get(username=friend_username)
        friendship = Friendship.objects.get(from_user=friend, to_user=user)
        if friendship.accepted:
            return Response({"message": "Friend request already accepted"}, status=400)
        friendship.accepted = True
        friendship.save()
        conversation = Conversation.objects.create(
            sender=user, receiver=friend)
        conversation.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "chat_OnlineFriends",
            {
                "type": "send.message.to.user",
                        "id": user.id,
            }
        )
        async_to_sync(channel_layer.group_send)(
            f"notifications_{friend.id}",
            {
                "type": "send_notification",
                "data": {
                    "type": "friend_request_accepted",
                    "accepted": True,
                },
            },
        )
        return Response({"message": "Friend request accepted"}, status=201)
    except Friendship.DoesNotExist:
        return Response({"message": "Friend request not found"}, status=404)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)


@api_view(["POST"])
def decline_friend_request(request):
    user = request.user
    friend_username = request.data.get("friendUsername")
    try:
        friend = User.objects.get(username=friend_username)
        Friendship.objects.get(from_user=friend, to_user=user).delete()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{friend.id}",
            {
                "type": "send_notification",
                "data": {
                    "type": "friend_request_accepted",
                    "accepted": False,
                },
            },
        )
        return Response({"message": "Friend request declined"}, status=201)
    except Friendship.DoesNotExist:
        return Response({"message": "Friend request not found"}, status=404)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)

# friend users


@api_view(["GET"])
def friend_user_request(request):
    user = request.user
    data = {}
    try:
        friends = Friendship.objects.filter(
            Q(from_user=user) | Q(to_user=user)).filter(accepted=True)
        if friends.exists():
            friends_list = []
            for friendship in friends:
                friend = friendship.to_user if friendship.from_user == user else friendship.from_user
                friend_data = {
                    'id': friend.id,
                    'username': friend.username,
                    'first_name': friend.first_name,
                    'last_name': friend.last_name,
                    'avatar_url': friend.avatar_url,
                    'is_online': friend.is_online
                }
                friends_list.append(friend_data)
            data['friends'] = friends_list
        else:
            data['friends'] = []
    except Exception as e:
        return Response({"message": "Friend request not found"}, status=status.HTTP_400_BAD_REQUEST)
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
def send_game_invite(request):
    user = request.user
    friend_username = request.data.get("friendUsername")
    print("===>", friend_username, user, "<===")
    try:
        friend = User.objects.get(username=friend_username)
        if user == friend:
            return Response(
                {"message": "You can't invite yourself to a game"}, status=400
            )
        if Friendship.objects.filter(Q(from_user=friend, to_user=user) | Q(from_user=user, to_user=friend), accepted=True).exists():
            game_invite = GameInvite(from_user=user, to_user=friend)
            if GameInvite.objects.filter(Q(from_user=friend, to_user=user) | Q(from_user=user, to_user=friend)).exists():
                return Response(
                    {"message": "You've already invited (by) this user to a game"}, status=400
                )
            game_invite.save()
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"notifications_{friend.id}",
                {
                    "type": "send_notification",
                    "data": {
                            "type": "game_invite",
                            "from_user": user.username,
                            "from_user_avatar": user.avatar_url,
                    },
                },
            )
            return Response({"message": "Game invite sent"}, status=201)
        else:
            print("NOT FRIENDS<=====================")
        return Response(
            {"message": "You're not friends with this user"}, status=400
        )
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)


@api_view(["POST"])
def accept_game_invite(request):
    user = request.user
    friend_username = request.data.get("friendUsername")
    try:
        friend = User.objects.get(username=friend_username)
        game_invite = GameInvite.objects.get(
            Q(from_user=friend, to_user=user) | Q(from_user=user, to_user=friend))
        game_invite.accepted = True
        game_invite.save()
        player1 = Player.objects.get(user=user)
        player2 = Player.objects.get(user=friend)
        room = ''.join(random.choices(
            'abcdefghijklmnopqrstuvwxyz0123456789', k=8))
        game = Game(player1=player1, player2=player2, room=room)
        game.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{user.id}",
            {
                "type": "send_notification",
                "data": {
                    "type": "start_game",
                    "room": room,
                    "player1": user.username,
                    "player2": friend.username,
                },
            },
        )
        async_to_sync(channel_layer.group_send)(
            f"notifications_{friend.id}",
            {
                "type": "send_notification",
                "data": {
                    "type": "start_game",
                    "room": room,
                    "player1": user.username,
                    "player2": friend.username,
                },
            },
        )
        game_invite.delete()
        return Response({"message": "Game invite accepted"}, status=201)
    except GameInvite.DoesNotExist:
        return Response({"message": "Game invite not found"}, status=404)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)


@api_view(["POST"])
def decline_game_invite(request):
    user = request.user
    friend_username = request.data.get("friendUsername")
    try:
        friend = User.objects.get(username=friend_username)
        game_invite = GameInvite.objects.get(
            Q(from_user=friend, to_user=user) | Q(from_user=user, to_user=friend))
        game_invite.delete()
        return Response({"message": "Game invite declined"}, status=201)
    except GameInvite.DoesNotExist:
        return Response({"message": "Game invite not found"}, status=404)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)


@api_view(["POST"])
def accept_final_game_invite(request):
    print(request.data)
    user = request.user
    try:
        final_game_invite = FinalGameInvite.objects.get(
            room=request.data.get("room"))
        # final_game_invite.accepted = True
        final_game_invite.save()
        room = final_game_invite.room
        final_game = Game.objects.get(room=room)
        user1 = final_game.player1.user
        user2 = final_game.player2.user
        channel_layer = get_channel_layer()
        if user.id == user1.id:
            final_game_invite.accepted1 = True
            final_game_invite.save()
            async_to_sync(channel_layer.group_send)(
                f"notifications_{user1.id}",
                {
                    "type": "send_notification",
                    "data": {
                        "type": "start_game",
                        "room": room,
                        "player1": user1.username,
                        "player2": user2.username,
                    },
                },
            )
        if user.id == user2.id:
            final_game_invite.accepted2 = True
            final_game_invite.save()
            async_to_sync(channel_layer.group_send)(
                f"notifications_{user2.id}",
                {
                    "type": "send_notification",
                    "data": {
                        "type": "start_game",
                        "room": room,
                        "player1": user1.username,
                        "player2": user2.username,
                    },
                },
            )
        if final_game_invite.accepted1 and final_game_invite.accepted2:
            final_game_invite.delete()
        return Response({"message": "Final game invite accepted"}, status=201)
    except FinalGameInvite.DoesNotExist:
        return Response({"message": "Final game invite not found"}, status=404)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)


@api_view(["GET"])
def is_friend(request):
    user = request.user
    friend_username = request.query_params.get("friendUsername")
    try:
        friend = User.objects.get(username=friend_username)
        friendship = Friendship.objects.filter(
            Q(from_user=user, to_user=friend) | Q(from_user=friend, to_user=user))
        if friendship.exists():
            if friendship.first().accepted:
                return Response({"is_friend": "accepted"}, status=200)
            else:
                reciever = Friendship.objects.filter(
                    from_user=friend, to_user=user).exists()
                return Response({"is_friend": "pending", "reciever": reciever}, status=200)
        else:
            return Response({"is_friend": "false"}, status=200)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)


@api_view(["POST"])
def delete_account(request):
    user = request.user
    user.delete()
    return Response({"message": "Account deleted successfully"}, status=201)


@api_view(["POST"])
def upload_avatar(request):
    user = request.user
    file = request.FILES.get("avatar")
    if not file:
        return Response({"message": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

    # Validate file type if needed
    if not file.content_type.startswith('image/'):
        return Response({"message": "Invalid file type"}, status=status.HTTP_400_BAD_REQUEST)
    file_extension = os.path.splitext(file.name)[1]
    random_number_to_evade_nextjs_caching = random.randint(1, 100000)
    file_name = os.path.join(
        settings.MEDIA_ROOT, f"avatars/{user.username}_{user.id}{random_number_to_evade_nextjs_caching}{file_extension}")
    try:
        old_filename = f"avatars/{user.avatar_url.split('/')[-1]}"
        if default_storage.exists(old_filename):
            default_storage.delete(old_filename)
        path = default_storage.save(file_name, ContentFile(file.read()))
        load_dotenv()
        user.avatar_url = f'{os.getenv("BASE_URL")}{default_storage.url(path)}'
        user.save()
    except Exception as e:
        return Response({"message": f"Error saving file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"message": "Avatar uploaded successfully", "avatar_url": user.avatar_url}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def get_nickname(request):
    user = request.user
    return Response({"nickname": user.nickname}, status=201)


@api_view(["POST"])
def edit_nickname(request):
    user = request.user
    # get the games of the user
    player = Player.objects.get(user=user)
    if player.trnmt:
        return Response({"message": "You can't change your nickname during a tournament"}, status=400)
    nickname = request.data.get("nickname")
    serializer = UserSerializer(user, {"nickname": nickname}, partial=True)
    if serializer.is_valid():
        user.nickname = nickname
        user.save()
        player.nickname = nickname
        player.save()
        return Response({"message": "Nickname updated successfully"}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET"])
def is_online(request):
    username = request.query_params.get("username")
    user = User.objects.get(username=username)
    return Response({"is_online": user.is_online}, status=201)


@api_view(["GET"])
def players_leaderboard(request):
    players = Player.objects.all().order_by(
        '-xp').filter(user__is_staff=False)[:10]
    data = []
    for player in players:
        data.append({
            'username': player.user.username,
            'avatar_url': player.user.avatar_url,
            'matches': player.wins + player.losses,
            'xp': player.xp,
        })
    return Response({"players": data}, status=201)
