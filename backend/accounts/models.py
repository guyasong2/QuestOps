from django.db import models
from django.contrib.auth.models import User
from tracks.models import Track

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    career_paths = models.ManyToManyField(Track, related_name='interested_users', blank=True)
    avatar = models.ImageField(upload_to='', null=True, blank=True)
    bio = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Profile: {self.user.username}"
