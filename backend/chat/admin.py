# Register your models here.
from .models import Message, Conversation, deletefor, Seen
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import UserCreationForm, UserChangeForm




admin.site.register(Message)
admin.site.register(Conversation)
admin.site.register(deletefor)
admin.site.register(Seen)