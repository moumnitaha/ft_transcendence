import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.cache import cache
from .models import Player, Game, Tournament
from users.models import User, GameInvite, FinalGameInvite
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
import random
import base64
from math import *
from django.db.models import Q


# BOLD COLORS
RED = '\033[1;31m'
GREEN = '\033[1;32m'
CAYAN = '\033[1;36m'
PURPLE = '\033[1;35m'
GRAY = '\033[1;30m'
YELLOW = '\033[1;33m'
BLUE = '\033[1;34m'
END = '\033[0m'


class MatchMakingQueue:
    def __init__(self):
        self.queue = []
        self.tournment_queue = []
        self.sockets_queue = []

    def add(self, player):
        self.queue.append(player)

    def remove(self, player):
        self.queue.remove(player)

    def get(self):
        return self.queue.pop(0)

    def size(self):
        return len(self.queue)

    def already_in_game(self, player):
        for p in self.queue:
            if p[0] == player:
                return True
        return False

    def getBg(self, player):
        for p in self.queue:
            if p[0] == player:
                return p[2]
        return 1


class TournamentQueue:
    def __init__(self):
        self.queue = []

    def add(self, player):
        self.queue.append(player)

    def remove(self, player):
        self.queue.remove(player)

    def get(self):
        return self.queue.pop(0)

    def size(self):
        return len(self.queue)

    def getBg(self, player):
        for p in self.queue:
            if p[0] == player:
                return p[2]

    def already_in_game(self, player):
        for p in self.queue:
            if p[0] == player:
                return True
        return False

    def update_socket(self, player, socket):
        for p in self.queue:
            if p[0] == player:
                p[1] = socket
                return True
        return False


match_making_queue = MatchMakingQueue()
tournament_queue = TournamentQueue()


class MatchMaking(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.player_name = None
        self.room = None
        # self.match_making_queue = MatchMakingQueue()

    async def connect(self):
        # get player linked to this user
        # user = await database_sync_to_async(User.objects.get)(username='tmoumni')
        # print("user=>", user.avatar_url)
        # player = await database_sync_to_async(Player.objects.get)(user=user)
        # print("player=>", player)
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.group_name = f"group_{self.room_name}"
        print(self.group_name)
        self.channel_layer = get_channel_layer()
        # check if anonymous user
        if self.scope['user_id'] == AnonymousUser():
            print(RED, "User not authenticated", END)
            await self.close()
            return
        print(GREEN, "MatchMaking Connected", END,
              self.scope['user_id'])
        playerM = await database_sync_to_async(Player.objects.get)(user=await database_sync_to_async(User.objects.get)(id=self.scope['user_id']))
        print("playerM=>", playerM.user.username)
        self.player_name = playerM.user.username
        match_making_queue.sockets_queue.append(
            [playerM.user.username, self])
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        await self.send(
            text_data=json.dumps({
                'type': 'connect',
                'message': 'connected to match making'
            })
        )
        avatars = []
        for p in match_making_queue.queue:
            user = await database_sync_to_async(User.objects.get)(username=p[0])
            avatars.append(user.avatar_url)
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'match_making.message',
                'message': {
                    'type': 'in_queue',
                    'queue': avatars,
                }
            }
        )
        avatars = []
        for p in tournament_queue.queue:
            user = await database_sync_to_async(User.objects.get)(username=p[0])
            avatars.append(user.avatar_url)
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'match_making.message',
                'message': {
                    'type': 'tournament_queue',
                    'queue': avatars,
                }
            })
        avatars = []
        for p in match_making_queue.sockets_queue:
            user = await database_sync_to_async(User.objects.get)(username=p[0])
            avatars.append({
                'username': user.username,
                'avatar': user.avatar_url,
            })
        avatars = list({v['username']: v for v in avatars}.values())
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'match_making.message',
                'message': {
                    'type': 'online_players',
                    'queue': avatars,
                }
            }
        )
        if tournament_queue.size() % 4 == 0:
            await self.send(text_data=json.dumps({
                'type': 'no_live_tournaments',
            }))
        if tournament_queue.already_in_game(playerM.user.username):
            # update the player socket
            tournament_queue.update_socket(playerM.user.username, self)
            if tournament_queue.already_in_game(playerM.user.username):
                print(GREEN, "XXPlayer already in tournament",
                      playerM.user.username, END)
                await self.send(text_data=json.dumps({
                    'type': 'already_in_tournament',
                    'queue': tournament_queue.size(),
                }))
        games = await database_sync_to_async(Game.objects.filter)((Q(player1=playerM) | Q(player2=playerM)) & (Q(status="started") | Q(status="pending")))
        if match_making_queue.already_in_game(playerM.user.username) or games.exists():
            print(RED, "ALREADY IN GAME", END)
            await self.send(text_data=json.dumps({
                'type': 'already_in_game',
                'room_name': games[0].room if games.exists() else None,
                'bg': match_making_queue.getBg(playerM.user.username),
                # 'player1': games[0].player1.user.username,
                # 'player2': games[0].player2.user.username,
                # 'avatar1': games[0].player1.user.avatar_url,
                # 'avatar2': games[0].player2.user.avatar_url,
            }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']
        # self.self.sockets_queue = []
        if message_type == "enter_queue":
            player = data['player']
            bg = data['bg']
            self.player_name = player
            match_making_queue.add([player, self, bg])
            # match_making_queue.sockets_queue.append([player, self])
            for p in match_making_queue.sockets_queue:
                print("Socketplayer=>", p[0])
                if p[0] == player:
                    try:
                        await p[1].send(text_data=json.dumps({
                            'type': 'joined_queue',
                            'queue': match_making_queue.size(),
                            'player': player,
                        }))
                    except:
                        print(RED, "Error sending message", END)
            print("Player added to queue", match_making_queue.size(),
                  len(match_making_queue.sockets_queue), "bg =>", bg)
            # send message to players
            avatars = []
            for p in match_making_queue.queue:
                user = await database_sync_to_async(User.objects.get)(username=p[0])
                avatars.append(user.avatar_url)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'match_making.message',
                    'message': {
                        'type': 'in_queue',
                        'queue': avatars,
                    }
                }
            )
            avatars = []
            for p in match_making_queue.sockets_queue:
                user = await database_sync_to_async(User.objects.get)(username=p[0])
                avatars.append({
                    'username': user.username,
                    'avatar': user.avatar_url,
                })
            avatars = list({v['username']: v for v in avatars}.values())
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'match_making.message',
                    'message': {
                        'type': 'online_players',
                        'queue': avatars,
                    }
                }
            )
            if match_making_queue.size() >= 2:
                player1_name = match_making_queue.get()
                print("Player1 name=>", player1_name[0])
                player1 = await database_sync_to_async(Player.objects.get)(user=await database_sync_to_async(User.objects.get)(username=player1_name[0]))
                player1.bg = player1_name[2]
                await database_sync_to_async(player1.save)()
                player2_name = match_making_queue.get()
                print("Player2 name=>", player2_name[0])
                player2 = await database_sync_to_async(Player.objects.get)(user=await database_sync_to_async(User.objects.get)(username=player2_name[0]))
                player2.bg = player2_name[2]
                await database_sync_to_async(player2.save)()
                print(CAYAN, player1.user.username, player2.user.username, END)
                avatars = []
                for p in match_making_queue.queue:
                    user = await database_sync_to_async(User.objects.get)(username=p[0])
                    avatars.append(user.avatar_url)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'match_making.message',
                        'message': {
                            'type': 'in_queue',
                            'queue': avatars,
                        }
                    }
                )
                avatars = []
                for p in match_making_queue.sockets_queue:
                    user = await database_sync_to_async(User.objects.get)(username=p[0])
                    avatars.append({
                        'username': user.username,
                        'avatar': user.avatar_url,
                    })
                avatars = list({v['username']: v for v in avatars}.values())
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'match_making.message',
                        'message': {
                            'type': 'online_players',
                            'queue': avatars,
                        }
                    }
                )
                # generate random room name
                self.room = ''.join(random.choices(
                    'abcdefghijklmnopqrstuvwxyz0123456789', k=8))
                # create a game
                game = Game(player1=player1, player2=player2, room=self.room)
                await database_sync_to_async(game.save)()
                # await player1_name[1].send(text_data=json.dumps({
                #     'type': 'start_game',
                #     'player1': player1.user.username,
                #     'avatar1': player1.user.avatar_url,
                #     'player2': player2.user.username,
                #     'avatar2': player2.user.avatar_url,
                #     'room_name': game.room,
                # }))
                # await player2_name[1].send(text_data=json.dumps({
                #     'type': 'start_game',
                #     'player1': player1.user.username,
                #     'avatar1': player1.user.avatar_url,
                #     'player2': player2.user.username,
                #     'avatar2': player2.user.avatar_url,
                #     'room_name': game.room,
                # }))
                for p in match_making_queue.sockets_queue:
                    if p[0] == player1_name[0] or p[0] == player2_name[0]:
                        print("START GAME =>", p[0])
                        await p[1].send(text_data=json.dumps({
                            'type': 'start_game',
                            'player1': player1.user.username,
                            'avatar1': player1.user.avatar_url,
                            'player2': player2.user.username,
                            'avatar2': player2.user.avatar_url,
                            'room_name': game.room,
                        }))
                        # match_making_queue.sockets_queue.remove(p)
                await self.channel_layer.group_discard(self.group_name, self.channel_name)

        if message_type == "enter_tournament":
            player = data['player']
            self.player_name = player
            if not tournament_queue.already_in_game(player):
                bg = data['bg']
                tournament_queue.add([player, self, bg])
                ply = await database_sync_to_async(Player.objects.get)(user=await database_sync_to_async(User.objects.get)(username=player))
                ply.trnmt = True
                ply.save()
                for p in match_making_queue.sockets_queue:
                    print("Socketplayer=>", p[0])
                    if p[0] == player:
                        try:
                            await p[1].send(text_data=json.dumps({
                                'type': 'in_tournament',
                                'queue': tournament_queue.size(),
                                'player': player,
                            }))
                        except:
                            print(RED, "Error sending message", END)
                await self.send(
                    text_data=json.dumps({
                        'type': 'in_tournament',
                        'queue': tournament_queue.size(),
                    })
                )
                print("Player added to tournament",
                      tournament_queue.size(), player)
            else:
                print(CAYAN, "Player already in tournament", player, END)
            avatars = []
            for p in tournament_queue.queue:
                user = await database_sync_to_async(User.objects.get)(username=p[0])
                avatars.append(user.avatar_url)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'match_making.message',
                    'message': {
                        'type': 'tournament_queue',
                        'queue': avatars,
                    }
                })
            avatars = []
            for p in match_making_queue.sockets_queue:
                user = await database_sync_to_async(User.objects.get)(username=p[0])
                avatars.append({
                    'username': user.username,
                    'avatar': user.avatar_url,
                })
            avatars = list({v['username']: v for v in avatars}.values())
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'match_making.message',
                    'message': {
                        'type': 'online_players',
                        'queue': avatars,
                    }
                }
            )
            if tournament_queue.size() >= 4:
                # random tournament name
                tournament_name = ''.join(random.choices(
                    'abcdefghijklmnopqrstuvwxyz0123456789', k=10))
                print("Tournament name=>", tournament_name)
                # create a game for each pair
                players = []
                sockets = []
                for i in range(0, 4):
                    sockets.append(tournament_queue.get())
                    player = await database_sync_to_async(Player.objects.get)(user=await database_sync_to_async(User.objects.get)(username=sockets[i][0]))
                    player.bg = sockets[i][2]
                    await database_sync_to_async(player.save)()
                    players.append(player)
                # shuffle players
                print("players=>", players[0].user.username, players[1].user.username,
                      players[2].user.username, players[3].user.username)
                random.shuffle(players)
                print("players=>", players[0].user.username, players[1].user.username,
                      players[2].user.username, players[3].user.username)
                # generate random room name
                # create 2 games
                room1 = ''.join(random.choices(
                    'abcdefghijklmnopqrstuvwxyz0123456789', k=8))
                game1 = Game(
                    player1=players[0], player2=players[1], room=room1, tournament_name=tournament_name)
                await database_sync_to_async(game1.save)()
                f_g_i_1 = FinalGameInvite(
                    user1=players[0].user, user2=players[1].user, room=room1)
                await database_sync_to_async(f_g_i_1.save)()
                room2 = ''.join(random.choices(
                    'abcdefghijklmnopqrstuvwxyz0123456789', k=8))
                game2 = Game(
                    player1=players[2], player2=players[3], room=room2, tournament_name=tournament_name)
                await database_sync_to_async(game2.save)()
                f_g_i_1 = FinalGameInvite(
                    user1=players[2].user, user2=players[3].user, room=room2)
                await database_sync_to_async(f_g_i_1.save)()
                room3 = ''.join(random.choices(
                    'abcdefghijklmnopqrstuvwxyz0123456789', k=8))
                final_game = Game(room=room3, player1=None,
                                  player2=None, tournament_name=tournament_name)
                await database_sync_to_async(final_game.save)()
                touranament = Tournament(name=tournament_name, game1=game1, game2=game2,
                                         player1=players[0], player2=players[1], player3=players[2], player4=players[3], final_game=final_game)
                await database_sync_to_async(touranament.save)()
                # send game start message to both players
                print(players[0].user.username, players[1].user.username, "room [", game1.room, "]",
                      players[2].user.username, players[3].user.username, "room [", game2.room, "]")
                channel_layer = get_channel_layer()
                for i in range(0, 4):
                    await sockets[i][1].send(text_data=json.dumps({
                        'type': 'start_tournament',
                        'room_name': game1.room if sockets[i][0] == players[0].user.username or sockets[i][0] == players[1].user.username else game2.room,
                        "player1": players[0].user.username if sockets[i][0] == players[0].user.username or sockets[i][0] == players[1].user.username else players[2].user.username,
                        "avatar1": players[0].user.avatar_url if sockets[i][0] == players[0].user.username or sockets[i][0] == players[1].user.username else players[2].user.avatar_url,
                        "player2": players[1].user.username if sockets[i][0] == players[0].user.username or sockets[i][0] == players[1].user.username else players[3].user.username,
                        "avatar2": players[1].user.avatar_url if sockets[i][0] == players[0].user.username or sockets[i][0] == players[1].user.username else players[3].user.avatar_url,
                    }))
                    await channel_layer.group_send(
                        f'notifications_{players[i].user.id}',
                        {
                            'type': 'send_notification',
                            'data': {
                                'type': 'final_game_invite',
                                "from_user": "PONG_TEAM",
                                "room": room1 if i < 2 else room2,
                                'tournament_name': tournament_name,
                                'player1': players[0].user.username,
                                'player2': players[1].user.username,
                                'room_1_name': game1.room,
                                'player3': players[2].user.username,
                                'player4': players[3].user.username,
                                'room_2_name': game2.room,
                            }
                        }
                    )
                # remove this group
                await self.channel_layer.group_discard(self.group_name, self.channel_name)

        if message_type == "leave_touranament_queue":
            if tournament_queue.already_in_game(self.player_name):
                bg = tournament_queue.getBg(self.player_name)
                print(RED, "REMOVED FROM TOURNAMENT",
                      "======>", END, self.player_name, bg)
                tournament_queue.remove([self.player_name, self, bg])
                ply = await database_sync_to_async(Player.objects.get)(user=await database_sync_to_async(User.objects.get)(username=self.player_name))
                ply.trnmt = False
                ply.save()
                for p in match_making_queue.sockets_queue:
                    if p[0] == self.player_name:
                        await p[1].send(text_data=json.dumps({
                            'type': 'left_tournament',
                            'queue': tournament_queue.size(),
                        }))
                avatars = []
                for p in tournament_queue.queue:
                    user = await database_sync_to_async(User.objects.get)(username=p[0])
                    avatars.append(user.avatar_url)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'match_making.message',
                        'message': {
                            'type': 'tournament_queue',
                            'queue': avatars,
                        }
                    })
                avatars = []
                for p in match_making_queue.sockets_queue:
                    user = await database_sync_to_async(User.objects.get)(username=p[0])
                    avatars.append({
                        'username': user.username,
                        'avatar': user.avatar_url,
                    })
                avatars = list({v['username']: v for v in avatars}.values())
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'match_making.message',
                        'message': {
                            'type': 'online_players',
                            'queue': avatars,
                        }
                    }
                )

        print("type =>", message_type)

    async def disconnect(self, close_code):
        bg = match_making_queue.getBg(self.player_name)
        print("\033[1;31m===> MatchMaking Disconnected\033[0m",
              close_code, self.player_name, bg)
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if [self.player_name, self, bg] in match_making_queue.queue:
            print(RED, "REMOVED FROM QUEUE", "======>", END, self.player_name)
            match_making_queue.remove([self.player_name, self, bg])
        for p in match_making_queue.sockets_queue:
            if p[0] == self.player_name:
                match_making_queue.sockets_queue.remove(p)
        avatars = []
        for p in match_making_queue.sockets_queue:
            user = await database_sync_to_async(User.objects.get)(username=p[0])
            avatars.append({
                'username': user.username,
                'avatar': user.avatar_url,
            })
        avatars = list({v['username']: v for v in avatars}.values())
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'match_making.message',
                'message': {
                    'type': 'online_players',
                    'queue': avatars,
                }
            }
        )

    async def match_making_message(self, event):
        message = event['message']
        print("match message==>", message)
        await self.send(text_data=json.dumps(message))
