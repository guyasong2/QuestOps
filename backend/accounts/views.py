from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from PIL import Image
import logging

from .models import UserProfile
from tracks.models import Track

logger = logging.getLogger(__name__)


# ─── Serializers ──────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    fullname = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    career_paths = serializers.ListField(child=serializers.CharField(), required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class UpdateProfileSerializer(serializers.Serializer):
    fullname = serializers.CharField(max_length=150, required=False, allow_blank=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        user = self.context['request'].user
        if value and User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        user = self.context['request'].user
        if value and User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Email already in use.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


# ─── Views ────────────────────────────────────────────────────────────────────

def _user_data(user, request=None):
    """Returns a consistent user dict for all endpoints."""
    profile = getattr(user, 'profile', None)
    career_paths = [t.slug for t in profile.career_paths.all()] if profile else []
    avatar_url = None
    if profile and profile.avatar:
        if request:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        else:
            avatar_url = profile.avatar.url
    return {
        'username': user.username,
        'email': user.email,
        'fullname': f"{user.first_name} {user.last_name}".strip(),
        'bio': profile.bio if profile else '',
        'career_paths': career_paths,
        'avatar': avatar_url,
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
            )
            parts = data['fullname'].split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            user.save()

            profile = UserProfile.objects.create(user=user)
            if data.get('career_paths'):
                tracks = Track.objects.filter(slug__in=data['career_paths'])
                profile.career_paths.set(tracks)

            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'username': user.username}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password'],
            )
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({'token': token.key, 'username': user.username})
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_user_data(request.user, request))


class UpdateProfileView(APIView):
    """PATCH /api/auth/profile/ — update name, username, email, bio."""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if 'fullname' in data and data['fullname']:
            parts = data['fullname'].split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
        if 'username' in data and data['username']:
            user.username = data['username']
        if 'email' in data and data['email']:
            user.email = data['email']
        user.save()

        if 'bio' in data:
            profile.bio = data['bio']
            profile.save()

        return Response(_user_data(user, request))


class UpdateAvatarView(APIView):
    """POST /api/auth/profile/avatar/ — upload a new profile picture."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if 'avatar' not in request.FILES:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        avatar_file = request.FILES['avatar']

        # Size check first (cheap)
        if avatar_file.size > 5 * 1024 * 1024:  # 5MB
            return Response({'error': 'Image must be under 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify actual image bytes with Pillow — MIME header from client is not trusted
        try:
            img = Image.open(avatar_file)
            img.verify()  # raises if not a valid image
        except Exception:
            return Response({'error': 'File must be a valid image.'}, status=status.HTTP_400_BAD_REQUEST)
        finally:
            avatar_file.seek(0)  # reset stream so Django can save it

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.avatar = avatar_file
        profile.save()

        return Response(_user_data(request.user, request))


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        # Re-issue token so user stays logged in after password change
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        return Response({'message': 'Password changed successfully.', 'token': token.key})
