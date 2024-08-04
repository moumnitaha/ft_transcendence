from django.contrib import admin
from .models import User, Friendship, Block, GameInvite, FinalGameInvite


admin.site.register(User)
admin.site.register(Friendship)
admin.site.register(Block)
admin.site.register(GameInvite)
admin.site.register(FinalGameInvite)


# Register your models here.
