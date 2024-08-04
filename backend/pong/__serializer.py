# # from django.contrib.auth.models import User
# from .models import User
# from rest_framework import serializers


# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ['username', 'password', 'email',
#                   'first_name', 'last_name', 'avatar_url']
#         extra_kwargs = {'password': {'write_only': True}}

#     def create(self, validated_data):
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data['email'],
#             password=validated_data['password'],
#             login=validated_data['username'],
#             avatar_url=validated_data['avatar_url'],
#             first_name=validated_data['first_name'],
#             last_name=validated_data['last_name'],
#         )
#         return user
