from .imports import *
from django.conf import settings
from datetime import timedelta


# function to DRY the code
def generate_successful_login_response(user, message="Login successful"):
    access = AccessToken.for_user(user)
    refresh = RefreshToken.for_user(user)
    response = Response(
        {
            "message": message,
        },
        status=201,
    )

    response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE"],
        value=str(access),
        httponly=True,
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
    )

    response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
        value=str(refresh),
        httponly=True,
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
    )

    return response


@api_view(["GET"])
def check_session(request):
    return Response({"detail": "Session is valid."})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def signup(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    first_name = request.data.get("first_name")
    last_name = request.data.get("last_name")
    serializer = UserSerializer(data=request.data)
    load_dotenv()
    avatar_url = f'{os.getenv("BASE_URL")}/api/media/player.webp'
    errors = {}
    try:
        serializer.is_valid(raise_exception=True)
    except Exception as e:
        errors.update(serializer.errors)
    try:
        password_validation.validate_password(password)
    except Exception as e:
        error_message = list(e)[0]
        errors.update({"password": list([str(error_message)])})
    if errors:
        return Response(errors, status=400)
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            avatar_url=avatar_url,
        )
        user.save()
    except Exception as e:
        return Response({"message": str(e)}, status=400)
    return Response({"message": "User created successfully"})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def login(request):
    username = request.data.get("username")
    user_oauth_check = User.objects.filter(username=username)
    if user_oauth_check.exists():
        user = user_oauth_check.first()
        if user.is_oauth:
            return Response(
                {
                    "message": "If you're an oauth user log in through the oauth login handler"
                },
                status=400,
            )
    password = request.data.get("password")
    user = authenticate(username=username, password=password)
    if user is not None:
        if user.is_superuser:
            return Response(
                {
                    "message": "If you're a super user log in through django's built-in admin login handler"
                },
                status=400,
            )
        if user.is_2fa:
            return otp_process(user)
        return generate_successful_login_response(user)
    else:
        return Response({"message": "Invalid credentials"}, status=400)


def oauth_actual_authentication(user_data):
    user = User.objects.filter(username=user_data["login"])
    if user.exists():
        user = user.first()
        if not user.is_oauth:
            return Response(
                {"message": "User already exists with this username"}, status=400
            )
        if user.is_2fa:
            return otp_process(user)
        return generate_successful_login_response(user)
    else:
        user = User.objects.create_user(
            id=user_data["id"],
            username=user_data["login"],
            email=user_data["email"],
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            avatar_url=user_data["image"]["versions"]["medium"],
            is_oauth=True,
        )
        user.save()
    return generate_successful_login_response(user)
    # everything prior to this works, now i need to check if the user is in the database to choose wether to log in or to sign up


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def oauth(request):
    # use the code to get the access token
    code = request.data.get("code")
    state = request.data.get("state")
    if code is None:
        return Response({"message": "Code not provided"}, status=400)
    # make a request to 42 to get the access token
    load_dotenv()
    base_url = os.getenv("BASE_URL")
    response = requests.post(
        "https://api.intra.42.fr/oauth/token",
        data={
            "grant_type": "authorization_code",
            "client_id": os.getenv("_42_UID"),
            "client_secret": os.getenv("_42_SECRET"),
            "code": code,
            "state": state,
            "redirect_uri": f"{base_url}/oauth/42/callback",
        },
    )

    if response.status_code != 200:
        return Response({"message": "Invalid code"}, status=400)
    # make a request to 42 to get the user data
    access_token = response.json()["access_token"]
    response = requests.get(
        "https://api.intra.42.fr/v2/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if response.status_code != 200:
        return Response({"message": "Invalid code"}, status=400)
    user_data = response.json()
    return oauth_actual_authentication(user_data)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def refresh_tokens(request):
    refresh = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"])
    if refresh is None:
        return Response({"message": "Refresh token not provided"}, status=400)
    try:
        token = RefreshToken(refresh)
        user = User.objects.get(id=token["user_id"])
    except Exception as e:
        return Response({"message": "Invalid refresh token"}, status=400)
    return generate_successful_login_response(user, "Token refreshed successfully")


@api_view(["GET"])
def get_2fa_qr_code(request):
    user = request.user
    return Response({"otp_secret": user.otp_secret}, status=201)


@api_view(["POST"])
def enable_2fa(request):
    user = request.user
    user.is_2fa = True
    user.save()
    return Response({"message": "2FA enabled successfully"}, status=201)


@api_view(["POST"])
def disable_2fa(request):
    user = request.user
    user.is_2fa = False
    user.save()
    return Response({"message": "2FA disabled successfully"}, status=201)


@api_view(["GET"])
def is_2fa_enabled(request):
    user = request.user
    return Response({"is_2fa": user.is_2fa}, status=201)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def logout(request):
    access_string = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"])
    refresh_string = request.COOKIES.get(
        settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"])
    if access_string is None or refresh_string is None:
        return Response({"message": "No token provided"}, status=400)
    refresh = RefreshToken(refresh_string)
    refresh.blacklist()
    response = Response({"message": "Logout successful"})
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"])
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"])
    return response


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def verify_otp(request):
    username = request.data.get("username")
    user = User.objects.get(username=username)
    otp = request.data.get("otp")
    if user.verify_otp(otp):
        return generate_successful_login_response(user)
    return Response({"message": "Invalid OTP"}, status=400)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def can_access_2fa(request):
    username = request.query_params.get("username")
    cookie_str = request.COOKIES.get("otp_token")
    if cookie_str is not None:
        try:
            otp_token = AccessToken(cookie_str)
        except Exception as e:
            return Response({"message": "Invalid OTP token"}, status=400)
    else:
        otp_token = None
    if otp_token is None or username is None or username != otp_token["username"]:
        return Response({"can_access_2fa": False}, status=400)
    return Response({"can_access_2fa": True}, status=201)


def otp_process(user):
    otp_token = AccessToken.for_user(user)
    otp_token.lifetime = timedelta(seconds=45)
    otp_token.payload.update({"username": user.username})
    otp_token.set_exp(from_time=otp_token.current_time,
                      lifetime=otp_token.lifetime)
    response = Response(
        {"status": "otp_required", "username": user.username}, status=201
    )
    response.set_cookie(
        key="otp_token",
        value=str(otp_token),
        httponly=True,
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
    )
    return response
