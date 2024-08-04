from django.urls import path, include
from . import views
from rest_framework_simplejwt import views as jwt_views
from rest_framework.authtoken.views import ObtainAuthToken
urlpatterns = [

    # endpoint to allfriendsactive and no-active , all conversations, allgroups and user info  (pk id of user)
    path('<int:pk>/', views.Home, name='Home'),



    # endpoint to messages of simple conversation (pk is id for conversation  )
    path("chat/<int:pk>/<int:id>", views.MessageDetail),

    # user Data
    path("user/<int:pk>/<int:id>", views.userData),

    # delete one  conversation using id of conversation
    path("chat/delete/conversion/<int:pk>",
         views.deleteConversation.as_view()),

    # delete all messages for user  (id : id_conversation , pk : user_id)
    path("chat/delete/<int:id>/<int:pk>", views.deleteAllmessages),

    # make user see  all messages for conversation or group  (id : id_conversation , pk : user_id)
    path("chat/see/<int:id>/<int:pk>", views.readMsgs),



    # filter friend of user and his  groups
    path("filter/<int:id>/", views.FilterView, name="filter_friend"),



]
