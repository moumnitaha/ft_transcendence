from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import Group, Permission
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from users.models import User


     
class Conversation(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_conversations')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_conversations')
    last_msg = models.TextField(default='', null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    blocked = models.IntegerField(null=True) 

    def __str__(self):
        return f'{self.id}_conversations'






    



    
class deletefor(models.Model):
    userId = models.IntegerField(default='', blank=True)

    
    def __str__(self):
        return f'{self.userId}_deleted'
    
class Seen(models.Model):
    userId = models.IntegerField(default='', blank=True)

    
    def __str__(self):
        return f'{self.userId}_Seen'

class Message(models.Model):
    conversation = models.ForeignKey(Conversation,  on_delete=models.CASCADE, related_name='conversations', default='', blank=True, null=True)
    deletefor = models.ManyToManyField(deletefor, related_name='messageDeleted', default='', blank=True)
    sender = models.IntegerField()
    reciever = models.IntegerField()
    text_message = models.TextField(default='')
    datetime  = models.DateTimeField(auto_now_add=True)
    seen =  models.ManyToManyField(Seen, related_name='messageSee', default='', blank=True)
    join = models.BooleanField(default=False, null=True)

    def __str__(self):
        return f'{self.id}_mesages'







