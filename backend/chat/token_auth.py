from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


@database_sync_to_async
def get_user(token):
    try:
        decoded_token = AccessToken(token)
        print(decoded_token.payload)
        user_id = decoded_token.payload['user_id']
        return user_id
    except TokenError as e:
        # Handle specific token errors
        raise InvalidToken('Token is invalid')


class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        cookie_header = None
        for header in scope['headers']:
            if header[0] == b'cookie':
                cookie_header = header[1].decode('utf-8')
                break
        access_token = None
        refresh_token = None
        if cookie_header:
            # Parse the cookies from the header value
            cookies = cookie_header.split('; ')
            cookie_dict = {cookie.split('=')[0]: cookie.split('=')[
                1] for cookie in cookies}
            # Extract the access_token from the cookies
            access_token = cookie_dict.get('access_token')
            refresh_token = cookie_dict.get('refresh_token')
        if access_token and refresh_token:
            try:
                scope['user_id'] = await get_user(access_token)
            except Exception as e:
                print(f"Authentication failed: {e}")
                try:
                    token = RefreshToken(refresh_token)
                    access_token = str(token.access_token)
                    scope['user_id'] = await get_user(access_token)
                except Exception as e:
                    print(f"Refreshing failed: {e}")
                    scope['user_id'] = AnonymousUser()
        else:
            scope['user_id'] = AnonymousUser()
        return await self.inner(scope, receive, send)


def TokenAuthMiddlewareStack(inner): return TokenAuthMiddleware(
    AuthMiddlewareStack(inner))
