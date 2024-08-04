from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
# from users.models import User
from users.models import User
import os
from dotenv import load_dotenv

# Create your models here.


class TodoItem(models.Model):
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)

# class User(AbstractUser):
#     id = models.AutoField(primary_key=True)
#     username = models.CharField(max_length=50, unique=True)
#     email = models.EmailField(max_length=50, unique=True)
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     avatar_url = models.URLField(max_length=200, blank=True, null=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     login = models.CharField(max_length=100, unique=True, blank=True, null=True)
#     is_oauth = models.BooleanField(default=False)
#     is_2fa = models.BooleanField(default=False)
#     last_login = models.DateTimeField(null=True, blank=True, auto_now_add=True)
#     # otp_secret = models.CharField(
#     #     max_length=50, default=base64.b32encode(os.urandom(16)).decode("utf-8")
#     # )

#     def __str__(self):
#             return f'{self.id}_{self.username}'

# class Player(models.Model):
#     name = models.CharField(max_length=200)
#     # id = models.CharField(max_length=200, primary_key=True)
#     score = models.PositiveIntegerField(default=0)
#     room = models.CharField(max_length=200, default='default')
#     wins = models.IntegerField(default=0)
#     losses = models.IntegerField(default=0)
#     created_at = models.DateTimeField(default=timezone.now)
#     def __str__(self):
#         return "player_" + self.name


load_dotenv()


class Player(models.Model):
    # id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    score = models.PositiveIntegerField(default=0)
    trnmt = models.BooleanField(default=False)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    nickname = models.CharField(max_length=200, null=True, blank=True)
    bg = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)

    def __str__(self):
        return f'player_{self.id}_{self.user.username}'


class Game(models.Model):
    player1 = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='player1', null=True)
    player2 = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='player2', null=True)
    winner = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='winner', null=True)
    # pending, started, finished
    status = models.CharField(max_length=200, default='pending')
    room = models.CharField(max_length=200, default='default')
    created_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True)
    rounds = models.PositiveIntegerField(default=1)
    tournament_name = models.CharField(max_length=200, default=None, null=True)
    score1 = models.PositiveIntegerField(default=0)
    score2 = models.PositiveIntegerField(default=0)
    # bg1 = models.CharField(
    #     max_length=200, default=f'{os.getenv("BASE_URL")}/api/media/game/4.jpg')
    # bg2 = models.CharField(
    #     max_length=200, default=f'{os.getenv("BASE_URL")}/api/media/game/6.jpg')
    # method to save the game in database
    # def save(self):

    def __str__(self):
        # return
        return f'game_{self.room}_[ {self.status} ]'


class Tournament(models.Model):
    name = models.CharField(max_length=200)
    game1 = models.ForeignKey(
        Game, on_delete=models.CASCADE, related_name='game1')
    player1 = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='player1_tournament')
    player2 = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='player2_tournament')
    winner1 = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='winner1', null=True)
    game2 = models.ForeignKey(
        Game, on_delete=models.CASCADE, related_name='game2')
    player3 = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='player3_tournament')
    player4 = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='player4_tournament')
    winner2 = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='winner2', null=True)
    final_game = models.ForeignKey(
        Game, on_delete=models.CASCADE, related_name='final', null=True)
    winner = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='winner_final', null=True)
    created_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True)
    rounds = models.PositiveIntegerField(default=0)
    # pending, started, finished
    status = models.CharField(max_length=200, default='pending')

    def __str__(self):
        return f'tournament_{self.id}_{self.name}'
