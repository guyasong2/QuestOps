from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import UserProfile
from tracks.models import Track

class RegisterSerializer(serializers.Serializer):
    fullname = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    career_paths = serializers.ListField(
        child=serializers.CharField(), required=False
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Create user
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password']
            )
            
            # The fullname might be split, or just use first_name
            # For simplicity, store the whole thing in first_name or split it
            parts = data['fullname'].split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            user.save()

            # Create profile
            profile = UserProfile.objects.create(user=user)
            
            # Add career paths
            career_paths = data.get('career_paths', [])
            if career_paths:
                tracks = Track.objects.filter(slug__in=career_paths)
                profile.career_paths.set(tracks)
            
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({'token': token.key, 'username': user.username}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({'token': token.key, 'username': user.username})
            return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        career_paths = []
        if hasattr(user, 'profile'):
            career_paths = [t.slug for t in user.profile.career_paths.all()]
            
        return Response({
            'username': user.username,
            'email': user.email,
            'fullname': f"{user.first_name} {user.last_name}".strip(),
            'career_paths': career_paths
        })
