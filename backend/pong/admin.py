from django.contrib import admin
from .models import TodoItem, Player, Game, Tournament, User

# Register your models here.

admin.site.register(TodoItem)
admin.site.register(Player)
admin.site.register(Game)
admin.site.register(Tournament)
# admin.site.register(User)
