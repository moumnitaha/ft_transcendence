from django.shortcuts import render, HttpResponse
from .models import TodoItem, Player, Game
import json
from django.http import JsonResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view

# from .serializer import UserSerializer

# Create your views here.


def home(request):
    return render(request, 'home.html', {'title': 'PING PONG', 'content': 'content from views.py'})
    # return HttpResponse("<h1>Hello, World!</h1>")


def todos(request):
    items = TodoItem.objects.all()
    return render(request, 'todos.html', {'todos': items})


def game(request):
    return HttpResponse(json.dumps({'message': 'pong json'}), content_type='application/json')


@api_view(["POST"])
def games_history(request):
    user = request.user
    try:
        player = Player.objects.get(user=user)
        played_games = Game.objects.filter(
            player1=player) | Game.objects.filter(player2=player)
        played_games = played_games.filter(status='finished')
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
        return Response(games, status=201)
    except Player.DoesNotExist:
        return Response({"message": "Player not found"}, status=404)
    # return Response(
    #     {
    #         "id": user.id,
    #         "username": user.username,
    #         "firstName": user.first_name,
    #         "lastName": user.last_name,
    #         "avatarUrl": user.avatar_url,
    #         "email": user.email,
    #         "wins": player.wins,
    #         "losses": player.losses,
    #     },
    #     status=201,
    # )
# def createUser(request):
#     if request.method == "POST":
#         print(request.POST)
#         username = request.POST.get('username')
#         email = request.POST.get('email')
#         print(email, username)
#         if username and email:
#             return HttpResponse(json.dumps({'message': 'user created'}), content_type='application/json')
#         else:
#             return HttpResponse(json.dumps({'message': 'user not created'}), content_type='application/json')
#     return HttpResponse(json.dumps({'message': 'user not created'}), content_type='application/json')
# class UserCreate(APIView):
#     def post(self, request):
#         serializer = UserSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def live_games(request):
    user = request.user
    try:
        live_games = Game.objects.all()
        live_games = live_games.filter(status='started')
        live_games = live_games.order_by('-created_at')
        games = []
        for game in live_games:
            games.append(
                {
                    "id": game.id,
                    "player1": game.player1.user.username,
                    "avatar1": game.player1.user.avatar_url,
                    "player2": game.player2.user.username,
                    "avatar2": game.player2.user.avatar_url,
                    "score1": game.score1,
                    "score2": game.score2,
                    "status": game.status,
                }
            )
        return Response(games, status=201)
    except Player.DoesNotExist:
        return Response({"message": "Games not found"}, status=404)
