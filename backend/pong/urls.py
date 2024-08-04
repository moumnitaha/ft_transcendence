from django.urls import path
from . import views
# from .views import UserCreate

urlpatterns = [
    path('', views.home, name='home'),
    path('todos/', views.todos, name='todos'),
    path('game/', views.game, name='game'),
    path('game/<int:game_id>/', views.game, name='game'),
    path('games_history/', views.games_history, name='games_history'),
    path('live_games/', views.live_games, name='live_games'),
    # path('users/', UserCreate.as_view(), name='user-create'),
]
