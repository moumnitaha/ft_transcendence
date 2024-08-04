import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.cache import cache
from .models import Player, Game, Tournament
from channels.db import database_sync_to_async
import random
import base64
from math import *
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from users.models import User, FinalGameInvite
from django.db.models import Q
import time
import os
from dotenv import load_dotenv

# BOLD COLORS
RED = '\033[1;31m'
GREEN = '\033[1;32m'
CAYAN = '\033[1;36m'
PURPLE = '\033[1;35m'
GRAY = '\033[1;30m'
YELLOW = '\033[1;33m'
BLUE = '\033[1;34m'
END = '\033[0m'


class canvas:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def top(self):
        return int(-self.height / 2)

    def down(self):
        return int(self.height / 2)

    def left(self):
        return int(-self.width / 2)

    def right(self):
        return int(self.width / 2)


class leftPaddle:
    def __init__(self, x, y, width, height, dy, score=0):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.dy = dy
        self.score = score

    def top(self):
        return int(self.y - self.height / 2)

    def down(self):
        return int(self.y + self.height / 2)

    def front(self):
        return int(self.x + self.width / 2)

    def center(self):
        return int(self.y)


class rightPaddle:
    def __init__(self, x, y, width, height, dy, score=0):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.dy = dy
        self.score = score

    def top(self):
        return int(self.y - self.height / 2)

    def down(self):
        return int(self.y + self.height / 2)

    def front(self):
        return int(self.x - self.width / 2)

    def center(self):
        return int(self.y)


class ball:
    def __init__(self, x, y, z, radius, dx, dy):
        self.x = x
        self.y = y
        self.z = z
        self.radius = radius
        self.dx = dx
        self.dy = dy

    def left(self):
        return int(self.x - self.radius)

    def right(self):
        return int(self.x + self.radius)

    def top(self):
        return int(self.y - self.radius)

    def down(self):
        return int(self.y + self.radius)


class ConnectedClients:
    def __init__(self):
        # Dictionary structure: {room_name: {player_name: connection_count}}
        self.clients = {}

    def add_client(self, room_name, player_name):
        if room_name not in self.clients:
            self.clients[room_name] = {}
        if player_name not in self.clients[room_name] and player_name != 'me':
            self.clients[room_name][player_name] = 0
        if player_name in self.clients[room_name]:
            self.clients[room_name][player_name] += 1

    def remove_client(self, room_name, player_name):
        if room_name in self.clients and player_name in self.clients[room_name]:
            self.clients[room_name][player_name] -= 1
            if self.clients[room_name][player_name] <= 0:
                del self.clients[room_name][player_name]
                print(RED, "===> Client deleted permantly", END, player_name)
                if not self.clients[room_name]:  # No more players in this room
                    del self.clients[room_name]

    def is_connected(self, room_name, player_name):
        return room_name in self.clients and player_name in self.clients[room_name]

    def get_clients_in_room(self, room_name):
        if room_name in self.clients:
            return list(self.clients[room_name].keys())
        return []

    def get_connection_count(self, room_name, player_name):
        if room_name in self.clients and player_name in self.clients[room_name]:
            return self.clients[room_name][player_name]
        return 0

    def room_size(self, room_name):
        if room_name in self.clients:
            return len(self.clients[room_name])
        return 0


pong_clients = ConnectedClients()


async def move_ball_periodic(self):
    self.sleep_time = 0
    direction = 1
    inside_l = False
    inside_r = False
    inside_w = False
    time_to_break = 60
    while self.is_ball_move.is_set():
        if self.game.status == "finished" or pong_clients.room_size(self.room_name) < 2:
            print(
                BLUE, "==>Game already finished from PERIODIC", END, self.group_name)
            try:
                self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.game.tournament_name)
                # self.game = await database_sync_to_async(Game.objects.get)(room=self.room_name)
                print(CAYAN, "TOURNAMENT GAMES=>", self.tournament.game1.status,
                      self.tournament.game2.status, END)
                if time_to_break == 0:
                    self.tournament.status = "finished"
                    self.tournament.finished_at = timezone.now()
                    await database_sync_to_async(self.tournament.save)()
                    print(RED, "==>TIME TO BREAK<==", END)
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            'type': 'pong.message',
                            'message': {
                                'type': 'error',
                                'message': 'something went wrong!'
                            }
                        }
                    )
                    break
                try:
                    print(GREEN, "TOURNAMENT UPDTAED", END)
                    self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.game.tournament_name)
                    winner1 = await database_sync_to_async(Player.objects.get)(id=self.tournament.winner1_id)
                    winner2 = await database_sync_to_async(Player.objects.get)(id=self.tournament.winner2_id)
                    print(CAYAN, winner1.user.username,
                          winner2.user.username, END)
                    final_g = await database_sync_to_async(Game.objects.get)(room=self.tournament.final_game.room)
                    if final_g.status != "finished":
                        print(
                            BLUE, "====================> NEW <=================", END, self.player_name)
                        if not FinalGameInvite.objects.filter(room=self.tournament.final_game.room).exists():
                            final_game_invite = FinalGameInvite.objects.create(
                                user1=winner1.user, user2=winner2.user, room=self.tournament.final_game.room)
                            final_game_invite.save()
                        user1 = User.objects.get(
                            username=winner1.user.username)
                        user2 = User.objects.get(
                            username=winner2.user.username)
                        channel_layer = get_channel_layer()
                        if user1.username == self.player_name:
                            await channel_layer.group_send(
                                f'notifications_{user1.id}',
                                {
                                    'type': 'send_notification',
                                    'data': {
                                        'type': 'final_game_invite',
                                        'from_user': 'FINAL',
                                        'room': self.tournament.final_game.room,
                                        'accepted': False
                                    }
                                }
                            )
                        if user2.username == self.player_name:
                            await channel_layer.group_send(
                                f'notifications_{user2.id}',
                                {
                                    'type': 'send_notification',
                                    'data': {
                                        'type': 'final_game_invite',
                                        'from_user': 'FINAL',
                                        'room': self.tournament.final_game.room,
                                        'accepted': False
                                    }
                                }
                            )
                except Player.DoesNotExist:
                    print(RED, "==>WINNERS EXCEPT<==", END)
                    await asyncio.sleep(1)
                    time_to_break -= 1
                    continue
            except Tournament.DoesNotExist:
                self.tournament = None
                print(RED, "===> Tournament not found <===", END)
            print(YELLOW, "STOP GAME", END)
            self.is_ball_move.clear()
            pong_tasks.clear_task(self.room_name)
            break
        self.sleep_time = 0.0075
        cache_key = f'paddle_{self.room_name}_{1}'
        position = cache.get(cache_key)
        if position != None:
            self.leftPaddle.y = position
        cache_key = f'paddle_{self.room_name}_{2}'
        position = cache.get(cache_key)
        if position != None:
            self.rightPaddle.y = position
        self.ball.x += self.ball.dx
        self.ball.y += self.ball.dy
        # ball intersects with canvas
        if self.ball.down() >= self.canvas.down() or self.ball.top() <= self.canvas.top() and not inside_w:
            if self.ball.down() > self.canvas.down() or self.ball.top() < self.canvas.top():
                print("============>INSIDE W<============")
                inside_w = True
            self.ball.dy *= -1
        elif self.ball.down() < self.canvas.down() or self.ball.top() > self.canvas.top():
            inside_w = False
        if self.ball.right() > self.canvas.right() or self.ball.left() < self.canvas.left():
            if self.ball.right() > self.canvas.right():
                self.leftPaddle.score += 1
                # save score in database
                self.game.score1 = self.leftPaddle.score
                await database_sync_to_async(self.game.save)()
            else:
                self.rightPaddle.score += 1
                # save score in database
                self.game.score2 = self.rightPaddle.score
                await database_sync_to_async(self.game.save)()
            message = {
                'type': 'goal',
                'player': 1 if self.ball.right() > self.canvas.right() else 2,
                'l_score': self.leftPaddle.score,
                'r_score': self.rightPaddle.score,
            }
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'pong.message',
                    'message': message,
                }
            )
            self.ball.x = 0
            self.ball.y = 0
            self.ball.z = self.canvas.height / 5
            self.ball.dy = 0.2 * random.choice([-1, 1])
            #
            self.sleep_time = 3
            # send goal message
            # self.ball.dx = 2.5
            # self.ball.dy = 2.5
        # ball intersects with paddle
        if self.ball.left() <= self.leftPaddle.front() and self.ball.left() > self.leftPaddle.x and self.ball.down() >= self.leftPaddle.top() and self.ball.top() <= self.leftPaddle.down() and not inside_l:
            if self.ball.left() < self.leftPaddle.front():
                # print("============>INSIDE L<============")
                inside_l = True
            # print(self.ball.dx)
            self.ball.dx *= -1
            intersectY = self.ball.y - self.leftPaddle.center()
            normilizedIntersectY = intersectY / \
                (self.leftPaddle.height / 2)
            bounceAngle = normilizedIntersectY * (pi / 6)
            self.ball.dy = 5 * sin(bounceAngle)
            direction = 1
        elif self.ball.left() >= self.leftPaddle.front():
            inside_l = False
        if self.ball.right() >= self.rightPaddle.front() and self.ball.right() < (self.rightPaddle.x + self.rightPaddle.width) and self.ball.down() >= self.rightPaddle.top() and self.ball.top() <= self.rightPaddle.down() and not inside_r:
            if self.ball.right() > self.rightPaddle.front():
                # print("============>INSIDE R<============")
                inside_r = True
            self.ball.dx *= -1
            intersectY = self.ball.y - self.rightPaddle.center()
            normilizedIntersectY = intersectY / \
                (self.rightPaddle.height / 2)
            bounceAngle = normilizedIntersectY * (pi / 6)
            self.ball.dy = 5 * sin(bounceAngle)
            direction = -1
        elif self.ball.right() <= self.rightPaddle.front():
            inside_r = False
        self.ball.z = self.set_ball_z(self.ball.x + 360, direction)
        message = {
            'type': 'move_ball',
            'dx': self.ball.dx,
            'dy': self.ball.dy,
            'x': self.ball.x,
            'y': self.ball.y,
            'z': self.ball.z,
        }
        # await self.send(text_data=json.dumps(message))
        # print(ball.x, ball.y, ball.dx, ball.dy)
        try:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'pong.message',
                    'message': message,
                }
            )
        except Exception as e:
            print('Error=>', e)
        if self.leftPaddle.score >= 5 or self.rightPaddle.score >= 5:
            # stop ball
            print(PURPLE, "===> GAME OVER <===", END)
            print(f'game name => {self.game.room}')
            self.game.status = "finished"
            await self.stop_paddle({'direction': 'up', 'player': 1}, "finished")
            await self.stop_paddle({'direction': 'down', 'player': 1}, "finished")
            await self.stop_paddle({'direction': 'up', 'player': 2}, "finished")
            await self.stop_paddle({'direction': 'down', 'player': 2}, "finished")
            self.game.finished_at = timezone.now()
            self.player1.wins += 1 if self.leftPaddle.score >= 5 else 0
            self.player1.xp += 100 if self.leftPaddle.score >= 5 else 0
            self.player2.wins += 1 if self.rightPaddle.score >= 5 else 0
            self.player2.xp += 100 if self.rightPaddle.score >= 5 else 0
            self.player1.losses += 1 if self.leftPaddle.score < 5 else 0
            self.player1.xp -= 30 if self.leftPaddle.score < 5 and self.player1.xp >= 30 else 0
            self.player2.losses += 1 if self.rightPaddle.score < 5 else 0
            self.player2.xp -= 30 if self.rightPaddle.score < 5 and self.player2.xp >= 30 else 0
            self.player1.save()
            self.player2.save()
            self.game.winner = self.player1 if self.leftPaddle.score >= 5 else self.player2
            try:
                await database_sync_to_async(self.game.save)()
                print(CAYAN, "GAME SAVED", END)
            except Exception as e:
                print(RED, "Error SAVING GAME=>", END, e)
            print(RED, "===========>Score=>", END,
                  self.leftPaddle.score, self.rightPaddle.score, self.game.status)
            # send game over message
            message = {
                'type': 'game_over',
                'winner': 1 if self.leftPaddle.score >= 5 else 2,
                'l_score': self.leftPaddle.score,
                'r_score': self.rightPaddle.score,
            }
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'pong.message',
                    'message': message,
                }
            )
            # break
        await asyncio.sleep(self.sleep_time - 0.0003 * (self.leftPaddle.score + self.rightPaddle.score))


async def move_ball(self):
    if self.game.status == "pending":
        self.game.status = "started"
        await database_sync_to_async(self.game.save)()
    clients_num = pong_clients.room_size(self.room_name)
    print("MOVE BALL PLAYERS", clients_num)
    if clients_num < 2:
        self.game.status = "finished"
        self.game.finished_at = timezone.now()
        self.game.winner = self.player1 if self.player1.user.username == self.player_name else self.player2
        self.player1.losses += 1 if self.player1.user.username == self.player_name else 0
        self.player1.xp -= 30 if self.player1.user.username == self.player_name and self.player1.xp >= 30 else 0
        self.player2.losses += 1 if self.player2.user.username == self.player_name else 0
        self.player2.xp -= 30 if self.player2.user.username == self.player_name and self.player2.xp >= 30 else 0
        self.player1.wins += 1 if self.player1.user.username != self.player_name else 0
        self.player1.xp += 100 if self.player1.user.username != self.player_name else 0
        self.player2.wins += 1 if self.player2.user.username != self.player_name else 0
        self.player2.xp += 100 if self.player2.user.username != self.player_name else 0
        await database_sync_to_async(self.player1.save)()
        await database_sync_to_async(self.player2.save)()
        await database_sync_to_async(self.game.save)()
        # send winning message
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'pong.message',
                'message': {
                    'type': 'stop_game',
                    'message': 'game_stopped',
                        'winner': 1 if self.player1.user.username == self.player_name else 2,
                    'win_msg': 'Opponent Disconnected'
                }
            })
    if self.game.tournament_name:
        try:
            self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.game.tournament_name)
            self.tournament.status = "started"
            await database_sync_to_async(self.tournament.save)()
        except Tournament.DoesNotExist:
            self.tournament = None
            print(RED, "===> Tournament not found <===", END)
    self.is_ball_move.set()
    # Ensure only one instance of the periodic task is running
    if not hasattr(self, '_move_ball_task') or not self._move_ball_task:
        self._move_ball_task = asyncio.ensure_future(
            move_ball_periodic(self))


class TaskManager:
    def __init__(self):
        self.tasks = {}

    def add_task(self, task_name, task):
        if task_name not in self.tasks:
            self.tasks[task_name] = asyncio.ensure_future(task)

    def remove_task(self, task_name):
        if task_name in self.tasks:
            del self.tasks[task_name]

    def get_task(self, task_name):
        return self.tasks.get(task_name, None)

    def clear_task(self, task_name):
        if task_name in self.tasks:
            print(RED, "==>Task Cleared<==", END)
            self.tasks[task_name].cancel()
            del self.tasks[task_name]


pong_tasks = TaskManager()


class PongConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.is_ball_move = asyncio.Event()
        self.is_paddle_move_1_up = asyncio.Event()
        self.is_paddle_move_1_down = asyncio.Event()
        self.is_paddle_move_2_up = asyncio.Event()
        self.is_paddle_move_2_down = asyncio.Event()
        self.canvas = canvas(720, 400)
        # self.leftPaddle = leftPaddle(10, self.canvas.height / 2 - 50, 20, 100, 5, 0)
        # self.rightPaddle = rightPaddle(self.canvas.width - 30, self.canvas.height / 2 - 50, 20, 100, 5, 0)
        # self.ball = ball(self.canvas.width / 2, self.canvas.height / 2, 5, 12, -5, 0.75)
        self.leftPaddle = leftPaddle(self.canvas.left() + 30, 0, 10, 48, 4, 0)
        self.rightPaddle = rightPaddle(
            self.canvas.right() - 30, 0, 10, 48, 4, 0)
        self.ball = ball(0, 0, self.canvas.height / 5, 12, -5, 0.2)
        self.game = None
        self.tournament = None
        self.player1 = None
        self.player2 = None

    async def connect(self):
        print(self.scope['url_route']['kwargs'])
        if self.scope['user_id'] == AnonymousUser():
            print(RED, "User not authenticated", END)
            await self.close()
            return
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        playerM = await database_sync_to_async(Player.objects.get)(user=await database_sync_to_async(User.objects.get)(id=self.scope['user_id']))
        print(CAYAN, "player Name=>", END, playerM.user.username)
        self.player_name = playerM.user.username
        if pong_clients.is_connected(self.room_name, self.player_name):
            print(BLUE, "===> Client already connected", END, self.player_name,
                  pong_clients.get_connection_count(self.room_name, self.player_name))
        pong_clients.add_client(self.room_name, self.player_name)
        # await self.close()
        # return
        # encoded_string = self.room_name + "="
        # decoded_string = base64.b64decode(encoded_string.encode('utf-8')).decode('utf-8')
        # print(decoded_string.split('_')[2])
        # room = decoded_string.split('_')[2]
        # print socket id
        # check if it's the same player
        print("Socket ID ==>", self.channel_name, self.scope['user_id'])
        self.group_name = f"group_{self.room_name}"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        try:
            self.game = await database_sync_to_async(Game.objects.get)(room=self.room_name)
        except Game.DoesNotExist:
            self.game = None
            print("Game not found")
            await self.send(text_data=json.dumps({
                'type': 'connect',
                'message': 'room_not_found'
            }))
            return
        print("Game status ==>", self.game.status)
        if self.game.status == "finished":
            load_dotenv()
            await self.send(text_data=json.dumps({
                'type': 'connect',
                'message': {
                    'room': self.game.room,
                    'status': self.game.status,
                    'player1': self.game.player1.user.username,
                    'avatar1': self.game.player1.user.avatar_url,
                    'player2': self.game.player2.user.username,
                    'avatar2': self.game.player2.user.avatar_url,
                    'winner': self.game.winner.user.username,
                    'winner_avatar': self.game.winner.user.avatar_url,
                    'rounds': self.game.rounds,
                    'score1': self.game.score1,
                    'score2': self.game.score2,
                    'bg1': f'{os.getenv("BASE_URL")}/api/media/game/{self.game.player1.bg}.jpg',
                    'bg2': f'{os.getenv("BASE_URL")}/api/media/game/{self.game.player2.bg}.jpg',
                }
            }))
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            return
        try:
            self.player1 = await database_sync_to_async(Player.objects.get)(id=self.game.player1_id)
            self.player2 = await database_sync_to_async(Player.objects.get)(id=self.game.player2_id)
            print(self.player1.user.username, self.player2.user.username)
        except Player.DoesNotExist:
            print(RED, "PLAYER ERROR", END)
        print("GROUP NAME ==>", self.group_name)
        channel_layer = get_channel_layer()
        clients_num = pong_clients.room_size(self.room_name)
        if self.player_name in [self.player1.user.username, self.player2.user.username]:
            await self.send(text_data=json.dumps({
                'type': 'connect',
                'message': 1 if self.player1.user.username == self.player_name else 2,
                'player1': self.player1.user.username,
                'avatar1': self.player1.user.avatar_url,
                'player1_nick': self.player1.nickname if self.player1.user.username == self.player_name else self.player2.nickname,
                'player2': self.player2.user.username,
                'avatar2': self.player2.user.avatar_url,
                'player2_nick': self.player2.nickname if self.player2.user.username != self.player_name else self.player1.nickname,
                'in_trnmt': self.player1.trnmt,
            }))
        else:
            await self.send(text_data=json.dumps({
                'type': 'connect',
                'message': {
                            'room': self.game.room,
                            'status': self.game.status,
                            'player1': self.player1.user.username,
                            'player2': self.player2.user.username,
                            'winner': self.game.winner_id,
                            'rounds': self.game.rounds,
                            }
            }))
        print(CAYAN, "Game Connected Clients ==>", END,
              clients_num, self.player_name)
        if clients_num > 2 and self.player_name not in [self.player1.user.username, self.player2.user.username, 'me']:
            await self.send(text_data=json.dumps({
                'type': 'connect',
                'message': 'room_full'
            }))
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            return
        if self.player_name in [self.player1.user.username, self.player2.user.username]:
            # if self.game.status == "pending":
            # 	self.game.status = "started"
            # await database_sync_to_async(self.game.save)()
            time = 0
            while pong_clients.room_size(self.room_name) == 1:
                print(CAYAN, "Waiting for the second player",
                      END, time, clients_num)
                await self.send(text_data=json.dumps({
                    'type': 'waiting',
                    'message': f'Waiting for the second player...'
                }))
                if time > 20:
                    try:
                        final_game_invite = FinalGameInvite.objects.get(
                            room=self.game.room)
                        if final_game_invite:
                            final_game_invite.delete()
                    except FinalGameInvite.DoesNotExist:
                        print(RED, "===> Final Game Invite not found <===", END)
                    self.game.status = "finished"
                    self.game.finished_at = timezone.now()
                    self.game.winner = self.player1 if self.player1.user.username == self.player_name else self.player2
                    self.player1.losses += 1 if self.player1.user.username != self.player_name else 0
                    self.player1.xp -= 30 if self.player1.user.username != self.player_name and self.player1.xp >= 30 else 0
                    self.player2.losses += 1 if self.player2.user.username != self.player_name else 0
                    self.player2.xp -= 30 if self.player2.user.username != self.player_name and self.player2.xp >= 30 else 0
                    self.player1.wins += 1 if self.player1.user.username == self.player_name else 0
                    self.player1.xp += 100 if self.player1.user.username == self.player_name else 0
                    self.player2.wins += 1 if self.player2.user.username == self.player_name else 0
                    self.player2.xp += 100 if self.player2.user.username == self.player_name else 0
                    await database_sync_to_async(self.player1.save)()
                    await database_sync_to_async(self.player2.save)()
                    await database_sync_to_async(self.game.save)()
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            'type': 'pong.message',
                            'message': {
                                'type': 'stop_game',
                                'message': 'game_stopped',
                                'winner': 1 if self.player1.user.username == self.player_name else 2,
                                'win_msg': 'Opponent Didn\'t show up'
                            }
                        })
                    # await self.channel_layer.group_discard(self.group_name, self.channel_name)
                    return
                time += 0.5
                await asyncio.sleep(0.5)
                clients_num = pong_clients.room_size(self.room_name)
            # delete final game invite
            try:
                final_game_invite = FinalGameInvite.objects.get(
                    room=self.room_name)
                if final_game_invite:
                    final_game_invite.delete()
            except FinalGameInvite.DoesNotExist:
                print(RED, "===> Final Game Invite not found <===", END)
            asyncio.ensure_future(self.wait_for_game())

        # 	await self.move_ball({'type': 'move_ball', 'dx': ball.dx, 'dy': ball.dy, 'x': ball.x, 'y': ball.y})

    async def disconnect(self, close_code):
        if self.scope['user_id'] == AnonymousUser():
            print(RED, "<< Disconnect non authenticated user >>", END)
            return
        pong_clients.remove_client(self.room_name, self.player_name)
        print(RED, "===> Disconnected FROM GAME", END,
              close_code, self.player_name)
        if pong_clients.get_connection_count(self.room_name, self.player_name) == 0:
            try:
                self.game = await database_sync_to_async(Game.objects.get)(room=self.room_name)
                if self.game.status == "finished":
                    print(BLUE, "==>Game already finished", END,
                          self.game.room)
                    return
                if self.game and self.player_name in [self.player1.user.username, self.player2.user.username]:
                    # stop ball
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            'type': 'pong.message',
                            'message': {
                                'type': 'stop_game',
                                'message': 'game_stopped',
                                'winner': 1 if self.player2.user.username == self.player_name else 2,
                                'win_msg': 'Opponent Disconnected'
                            }
                        }
                    )
                    client_num = pong_clients.room_size(self.room_name)
                    print("Clients number", client_num, self.group_name)
                    print("Game found to update status", self.player_name,
                          self.player1.user.username, self.player2.user.username)
                    print("===========>Score=>", self.leftPaddle.score,
                          self.rightPaddle.score, self.game.status)
                    self.game.status = "finished"
                    await self.stop_paddle({'direction': 'up', 'player': 1}, "finished")
                    await self.stop_paddle({'direction': 'up', 'player': 2}, "finished")
                    await self.stop_paddle({'direction': 'down', 'player': 1}, "finished")
                    await self.stop_paddle({'direction': 'down', 'player': 2}, "finished")
                    self.game.finished_at = timezone.now()
                    if client_num == 1:
                        self.game.winner = self.player1 if self.player2.user.username == self.player_name else self.player2
                        self.player1.losses += 1 if self.player1.user.username == self.player_name else 0
                        self.player1.xp -= 30 if self.player1.user.username == self.player_name and self.player1.xp >= 30 else 0
                        self.player2.losses += 1 if self.player2.user.username == self.player_name else 0
                        self.player2.xp -= 30 if self.player2.user.username == self.player_name and self.player2.xp >= 30 else 0
                        self.player1.wins += 1 if self.player1.user.username != self.player_name else 0
                        self.player1.xp += 100 if self.player1.user.username != self.player_name else 0
                        self.player2.wins += 1 if self.player2.user.username != self.player_name else 0
                        self.player2.xp += 100 if self.player2.user.username != self.player_name else 0
                        await database_sync_to_async(self.player1.save)()
                        await database_sync_to_async(self.player2.save)()
                    elif client_num == 0:
                        self.game.winner = self.player1 if self.player1.user.username == self.player_name else self.player2
                    await database_sync_to_async(self.game.save)()
                    try:
                        self.tournament = await database_sync_to_async(Tournament.objects.get)(name=self.game.tournament_name)
                        # if self.tournament.game1_id == self.game.id:
                        #     winner1 = await database_sync_to_async(Player.objects.get)(id=self.game.winner_id)
                        #     self.tournament.winner1 = winner1
                        #     self.tournament.rounds += 1
                        # elif self.tournament.game2_id == self.game.id:
                        #     winner2 = await database_sync_to_async(Player.objects.get)(id=self.game.winner_id)
                        #     self.tournament.winner2 = winner2
                        #     self.tournament.rounds += 1
                        # elif self.tournament.final_game_id == self.game.id:
                        #     f_winner = await database_sync_to_async(Player.objects.get)(id=self.game.winner_id)
                        #     self.tournament.winner = f_winner
                        #     self.tournament.finished_at = timezone.now()
                        #     self.tournament.status = "finished"
                        #     print(GREEN, "===>TOURNAMENT FINISHED<===", END)
                        # await database_sync_to_async(self.tournament.save)()
                    except Tournament.DoesNotExist:
                        self.tournament = None
                        print(
                            RED, "===> Tournament not found from disconnect <===", END)
                    # self.game.score1 = self.leftPaddle.score
                    # self.game.score2 = self.rightPaddle.score
                else:
                    print(RED, "===> Game not found or player is me", END)
                    # self.is_ball_move.clear()
            except Game.DoesNotExist:
                print(RED, "===> Game not found Except", END)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        else:
            print(BLUE, "===> JUST CLOSED TAB", END, pong_clients.get_connection_count(
                self.room_name, self.player_name))

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']
        channel_layer = get_channel_layer()
        try:
            clients_num = pong_clients.room_size(self.room_name)
        except KeyError:
            print(RED, "===> Group not found KeyError <===", END)
            clients_num = 0
        if message_type == "setup_game":
            await self.setup_game()
        elif message_type == "move_paddle":
            await self.move_paddle(data)
        elif message_type == "stop_paddle":
            await self.stop_paddle(data)
        elif message_type == "move_ball":
            await self.move_ball()
        elif message_type == "stop_ball":
            await self.stop_move_ball()
        elif message_type == "rematch":
            print("REMATCH")
        else:
            print(GRAY, "Unknown message type", END)

    async def pong_message(self, event):
        # print("====>pong_Message<====")
        message = event['message']
        # print("===>PONG MSG===>")
        await self.send(text_data=json.dumps(message))

    async def setup_game(self):
        load_dotenv()
        if self.game.status == "finished":
            print(BLUE, "==>Game already finished from setup",
                  END, self.group_name)
            return
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'pong.message',
                'message': {
                    'type': 'setup_game',
                    'canvas_width': self.canvas.width,
                    'canvas_height': self.canvas.height,
                    'leftPaddle_x': self.leftPaddle.x,
                    'leftPaddle_y': cache.get(f'paddle_{self.room_name}_{1}') if cache.get(f'paddle_{self.room_name}_{1}') else self.leftPaddle.y,
                    'leftPaddle_width': self.leftPaddle.width,
                    'leftPaddle_height': self.leftPaddle.height,
                    'rightPaddle_x': self.rightPaddle.x,
                    'rightPaddle_y': cache.get(f'paddle_{self.room_name}_{2}') if cache.get(f'paddle_{self.room_name}_{2}') else self.rightPaddle.y,
                    'rightPaddle_width': self.rightPaddle.width,
                    'rightPaddle_height': self.rightPaddle.height,
                    'ball_x': self.ball.x,
                    'ball_y': self.ball.y,
                            'ball_z': self.ball.z,
                    'ball_radius': self.ball.radius,
                    'ball_dx': self.ball.dx,
                    'ball_dy': self.ball.dy,
                    'bg1': f'{os.getenv("BASE_URL")}/api/media/game/{self.player1.bg}.jpg',
                    'bg2': f'{os.getenv("BASE_URL")}/api/media/game/{self.player2.bg}.jpg',
                }
            }
        )

    async def move_paddle_periodic(self, player, direction):
        try:
            while getattr(self, f'is_paddle_move_{player}_{direction}', False):
                # game = await database_sync_to_async(Game.objects.get)(room=self.room_name)
                # if game.status == "finished":
                #     print(f'is_paddle_move_{player}_{direction}', game.status)
                #     asyncio.ensure_future(self.stop_paddle(
                #         {'direction': direction, 'player': player}, "finished"))
                #     break
                if player == 1:
                    if direction == "up":
                        if self.leftPaddle.top() > self.canvas.top():
                            self.leftPaddle.y -= self.leftPaddle.dy
                    elif direction == "down":
                        if self.leftPaddle.down() < self.canvas.down():
                            self.leftPaddle.y += self.leftPaddle.dy
                elif player == 2:
                    if direction == "up":
                        if self.rightPaddle.top() > self.canvas.top():
                            self.rightPaddle.y -= self.rightPaddle.dy
                    elif direction == "down":
                        if self.rightPaddle.down() < self.canvas.down():
                            self.rightPaddle.y += self.rightPaddle.dy
                # Save the current paddle position in the cache
                cache_key = f'paddle_{self.room_name}_{player}'
                cache.set(cache_key, self.leftPaddle.y if player ==
                          1 else self.rightPaddle.y)
                # print(self.leftPaddle.y, self.rightPaddle.y, direction, player)
                message = {
                    'type': 'move_paddle',
                    'direction': direction,
                    'player': player,
                    'position': self.leftPaddle.y if player == 1 else self.rightPaddle.y
                }
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'pong.message',
                        'message': message,
                    }
                )
                await asyncio.sleep(0.006)
        except asyncio.CancelledError:
            pass
        finally:
            # Ensure the task is cleaned up properly
            setattr(self, f'is_paddle_move_{player}_{direction}', False)
            paddle_task_attr = f'_move_paddle_task_{player}_{direction}'
            setattr(self, paddle_task_attr, None)

    def set_ball_z(self, x, direction=None):
        bounceHeight = self.canvas.height / 5
        bounceFreq = pi / (2 * self.canvas.width / 3)
        if direction == 1:
            thirdIndex = x % (2 * self.canvas.width / 3)
            if x >= 2 * self.canvas.width / 3:
                bounceFreq = pi / (self.canvas.width / 3)
                bounceHeight = self.canvas.height / 10
        elif direction == -1:
            thirdIndex = (self.canvas.width - x) % (2 * self.canvas.width / 3)
            if x <= self.canvas.width / 3:
                bounceFreq = pi / (self.canvas.width / 3)
                bounceHeight = self.canvas.height / 10
        z = sin(bounceFreq * thirdIndex) * bounceHeight
        return z

    async def move_paddle(self, event):
        game = await database_sync_to_async(Game.objects.get)(room=self.room_name)
        print("MOVE=>", game.status)
        direction = event['direction']
        player = event['player']

        # Set the corresponding paddle movement event
        setattr(self, f'is_paddle_move_{player}_{direction}', True)

        # Ensure only one instance of the periodic task is running
        paddle_task_attr = f'_move_paddle_task_{player}_{direction}'
        if not getattr(self, paddle_task_attr, None):
            paddle_task = asyncio.ensure_future(
                self.move_paddle_periodic(player, direction))
            setattr(self, paddle_task_attr, paddle_task)

        # Stop paddle movement if the game is finished
        if game.status == "finished":
            await self.stop_paddle(event, "finished")

    async def stop_paddle(self, event, status=None):
        direction = event['direction']
        player = event['player']

        # Clear the corresponding paddle movement event
        setattr(self, f'is_paddle_move_{player}_{direction}', False)

        # Cancel the periodic task for paddle movement
        if status == "finished":
            for p in [1, 2]:
                for d in ['up', 'down']:
                    setattr(self, f'is_paddle_move_{p}_{d}', False)
                    paddle_task_attr = f'_move_paddle_task_{p}_{d}'
                    paddle_task = getattr(self, paddle_task_attr, None)
                    if paddle_task:
                        paddle_task.cancel()
                        try:
                            await paddle_task
                        except asyncio.CancelledError:
                            pass
                        setattr(self, paddle_task_attr, None)

    async def wait_for_game(self):
        self.game.status = "started"
        await database_sync_to_async(self.game.save)()
        time = 5
        asyncioEvnt = asyncio.Event()
        asyncioEvnt.set()
        while asyncioEvnt.is_set():
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'pong.message',
                    'message': {
                        'type': 'waiting',
                        'message': f'Game will start in {time} seconds'
                    }
                }
            )
            time -= 1
            if time == 0:
                asyncioEvnt.clear()
                break
            await asyncio.sleep(1)
        if pong_clients.room_size(self.room_name) == 2:
            print(YELLOW, "==> Game will start SOON", END,
                  pong_clients.room_size(self.room_name))
            # run move ball task only once
            # if self.player_name == self.player1.user.username and pong_clients.get_connection_count(self.room_name, self.player_name) == 1:
            print(PURPLE, "===>MOVE BALL TASK<===", END)
            # run the game once
            # await asyncio.ensure_future(move_ball(self))
            # task = asyncio.ensure_future(move_ball(self))
            pong_tasks.add_task(self.room_name, move_ball(self))
            # await move_ball(self)

    async def stop_move_ball(self):
        print("STOP MOVE BALL")
        self.is_ball_move.clear()
        if hasattr(self, '_move_ball_task') and self._move_ball_task:
            self._move_ball_task.cancel()
            try:
                await self._move_ball_task
            except asyncio.CancelledError:
                pass
            finally:
                self._move_ball_task = None
        return

# match making queue
