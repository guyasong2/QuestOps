from django.urls import path
from .views import RegisterView, LoginView, MeView, UpdateProfileView, UpdateAvatarView, ChangePasswordView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('profile/', UpdateProfileView.as_view(), name='auth-profile-update'),
    path('profile/avatar/', UpdateAvatarView.as_view(), name='auth-profile-avatar'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
]
