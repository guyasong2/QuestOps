from django.urls import path
from .views import TrackListView, ScenarioDetailView, StageSubmitView, StudentSkillView, LessonChatView

urlpatterns = [
    path('tracks/', TrackListView.as_view(), name='track-list'),
    path('scenarios/<int:pk>/', ScenarioDetailView.as_view(), name='scenario-detail'),
    path('stages/<int:pk>/submit/', StageSubmitView.as_view(), name='stage-submit'),
    path('skills/me/', StudentSkillView.as_view(), name='student-skills'),
    path('scenarios/<int:pk>/chat/', LessonChatView.as_view(), name='lesson-chat'),
]
