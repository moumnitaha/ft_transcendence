from django.db import models
from django.core.validators import MinLengthValidator
from django.contrib.auth.models import AbstractUser
import pyotp
import base64
import os
from django.core.validators import RegexValidator

alpha = RegexValidator(
    r'^[a-zA-Z\s]*$',  # Updated regex pattern
    message='Only alphabets and spaces are allowed.'
)
# nickname = RegexValidator(r'^[A-Za-z0-9._-]{3,15}$', message='Only alphabets, numbers, and ._- are allowed. length should be between 3 to 15.')
usernamev = RegexValidator(
    r'^[a-zA-Z]*$',  # Updated regex pattern
    message='Only alphabets are allowed.'
)
#


class User(AbstractUser):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True, validators=[
                                MinLengthValidator(2), usernamev])
    nickname = models.CharField(max_length=50, blank=True, null=True, validators=[
                                MinLengthValidator(3), alpha], unique=True)
    email = models.EmailField(max_length=50, unique=True)
    first_name = models.CharField(
        max_length=50, validators=[MinLengthValidator(2), alpha])
    last_name = models.CharField(max_length=50, validators=[
                                 MinLengthValidator(2), alpha])
    avatar_url = models.URLField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_online = models.BooleanField(default=True)
    last_login = models.DateTimeField(auto_now_add=True)
    is_oauth = models.BooleanField(default=False)
    is_2fa = models.BooleanField(default=False)
    otp_secret = models.CharField(
        max_length=50, default=base64.b32encode(os.urandom(16)).decode("utf-8")
    )

    def __str__(self):
        return f"{self.username}_{self.id}"

    def verify_otp(self, otp):
        if otp == (pyotp.TOTP((self.otp_secret).encode("utf-8"))).now():
            return True
        return False

    def send_friend_request(self, to_user):
        Friendship.objects.create(from_user=self, to_user=to_user)

    def accept_friend_request(self, from_user):
        friendship = Friendship.objects.get(from_user=from_user, to_user=self)
        friendship.accepted = True
        friendship.save()

    def decline_friend_request(self, from_user):
        Friendship.objects.get(from_user=from_user, to_user=self).delete()

    def block_user(self, to_user):
        Block.objects.create(from_user=self, to_user=to_user)

    def is_blocked(self, to_user):
        return Block.objects.filter(from_user=self, to_user=to_user).exists()

    def unblock_user(self, to_user):
        Block.objects.filter(from_user=self, to_user=to_user).delete()

    def is_friend(self, to_user):
        return Friendship.objects.filter(
            from_user=self, to_user=to_user, accepted=True
        ).exists()

    def send_game_invite(self, to_user):
        GameInvite.objects.create(from_user=self, to_user=to_user)

    def accept_game_invite(self, from_user):
        game_invite = GameInvite.objects.get(from_user=from_user, to_user=self)
        game_invite.accepted = True
        game_invite.save()

    def decline_game_invite(self, from_user):
        game_invite = GameInvite.objects.get(from_user=from_user, to_user=self)
        game_invite.delete()

    def is_invited(self, from_user):
        return GameInvite.objects.filter(from_user=from_user, to_user=self).exists()


class Friendship(models.Model):
    from_user = models.ForeignKey(
        User, related_name="from_user", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name="to_user", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted = models.BooleanField(default=False)

    class Meta:
        unique_together = ["from_user", "to_user"]

    def __str__(self):
        status = "Accepted" if self.accepted else "Pending"
        return f"{self.from_user} -> {self.to_user} : {status}"


class Block(models.Model):
    from_user = models.ForeignKey(
        User, related_name="block_from_user", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name="block_to_user", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["from_user", "to_user"]


class GameInvite(models.Model):
    id = models.AutoField(primary_key=True)
    from_user = models.ForeignKey(
        User, related_name="game_invite_from_user", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name="game_invite_to_user", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted = models.BooleanField(default=False)

    class Meta:
        unique_together = ["from_user", "to_user"]


class FinalGameInvite(models.Model):
    id = models.AutoField(primary_key=True)
    user1 = models.ForeignKey(
        User, related_name="final_game_invite_user1", on_delete=models.CASCADE
    )
    user2 = models.ForeignKey(
        User, related_name="final_game_invite_user2", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted1 = models.BooleanField(default=False)
    accepted2 = models.BooleanField(default=False)
    room = models.CharField(max_length=50, blank=True, null=True)
