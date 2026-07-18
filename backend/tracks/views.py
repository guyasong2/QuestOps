from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

from .models import Track, Scenario, Stage, Attempt, StudentSkill, ChatMessage
from .serializers import (
    TrackSerializer,
    ScenarioDetailSerializer,
    StageSubmitSerializer,
    StudentSkillSerializer,
)
from .services import AIAnswerChecker, XPService, ScenarioGenerator

logger = logging.getLogger(__name__)


class TrackListView(generics.ListAPIView):
    """
    GET /api/tracks/
    Returns all tracks with their scenarios (used by the Catalog page).
    """
    permission_classes = [IsAuthenticated]
    queryset = Track.objects.prefetch_related('scenarios').all()
    serializer_class = TrackSerializer


class ScenarioDetailView(generics.RetrieveAPIView):
    """
    GET /api/scenarios/<id>/
    Returns a full scenario with its stages (correct answers excluded).

    Stage answer_type tells the frontend which component to render:
        mcq       → radio group (4 options from mcq_options)
        drag_drop → draggable list (items from drag_items, student reorders)
        free_text → textarea (AI-graded open answer)
    """
    permission_classes = [IsAuthenticated]
    queryset = Scenario.objects.prefetch_related('stages').all()
    serializer_class = ScenarioDetailSerializer


class StageSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        stage = get_object_or_404(
            Stage.objects.select_related('scenario__track'), pk=pk
        )
        serializer = StageSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        answer = serializer.validated_data['answer']
        time_taken = serializer.validated_data['time_taken_seconds']

        is_correct, ai_feedback = AIAnswerChecker.check(stage, answer)

        Attempt.objects.create(
            stage=stage,
            user=request.user,
            answer_given=answer,
            is_correct=is_correct,
            ai_feedback=ai_feedback,
            time_taken_seconds=time_taken,
        )

        xp_earned = XPService.award(
            user=request.user,
            track=stage.scenario.track,
            is_correct=is_correct,
            stage_order=stage.order,
        )

        return Response({
            "is_correct": is_correct,
            "ai_feedback": ai_feedback,
            "hint": "" if is_correct else stage.hint,
            "xp_earned": xp_earned,
            "correct_answer": stage.correct_answer if is_correct else "",
            "answer_type": stage.answer_type,
        })


class StudentSkillView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tracks = Track.objects.all()
        for track in tracks:
            StudentSkill.objects.get_or_create(user=request.user, track=track)

        skills = StudentSkill.objects.filter(user=request.user).select_related('track')
        serializer = StudentSkillSerializer(skills, many=True)
        return Response(serializer.data)

class LessonChatView(APIView):
    """
    GET /api/scenarios/<id>/chat/
    Returns chat history for this scenario and user.
    POST /api/scenarios/<id>/chat/
    Handles a conversational AI tutoring session about a scenario's lesson.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        scenario = get_object_or_404(Scenario, pk=pk)
        history = ChatMessage.objects.filter(user=request.user, scenario=scenario).order_by('created_at')
        return Response([
            {'id': msg.id, 'role': msg.role, 'content': msg.content}
            for msg in history
        ])

    def post(self, request, pk):
        scenario = get_object_or_404(
            Scenario.objects.select_related('track'), pk=pk
        )

        message = request.data.get('message', '').strip()

        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(message) > 4000:
            return Response({'error': 'Message too long (max 4000 characters).'}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message
        ChatMessage.objects.create(user=request.user, scenario=scenario, role='user', content=message)

        system_prompt = (
            f"You are an expert AI tutor for the QuestOps Escape-the-Lab platform.\n"
            f"The student is studying the following incident scenario before attempting it:\n\n"
            f"Track: {scenario.track.name}\n"
            f"Scenario: {scenario.title}\n"
            f"Context: {scenario.narrative}\n\n"
            f"Lesson Content:\n{scenario.lesson_content}\n\n"
            f"Answer the student's questions clearly and in detail. Use bullet points, code blocks, "
            f"and examples where helpful. Do NOT give away answers to the quiz stages — guide them "
            f"to think critically instead."
        )

        history_qs = ChatMessage.objects.filter(user=request.user, scenario=scenario).order_by('created_at')
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in list(history_qs)[-10:]:  # cap history at 10 exchanges for context
            messages.append({'role': msg.role, 'content': msg.content})

        try:
            generator = ScenarioGenerator()
            reply = generator._backend._chat(messages, expect_json=False, timeout=60)
            
            # Save assistant reply
            ChatMessage.objects.create(user=request.user, scenario=scenario, role='assistant', content=reply)
        except Exception as exc:
            logger.error("AI tutor error (scenario %s): %s", pk, exc, exc_info=True)
            return Response(
                {'error': 'AI tutor is temporarily unavailable. Please try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response({'reply': reply})


class GlobalChatView(APIView):
    """
    GET /api/chat/
    Returns global chat history.
    POST /api/chat/
    Handles a global conversational AI tutoring session.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = ChatMessage.objects.filter(user=request.user, scenario__isnull=True).order_by('created_at')
        return Response([
            {'id': msg.id, 'role': msg.role, 'content': msg.content}
            for msg in history
        ])

    def post(self, request):
        message = request.data.get('message', '').strip()

        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(message) > 4000:
            return Response({'error': 'Message too long (max 4000 characters).'}, status=status.HTTP_400_BAD_REQUEST)

        ChatMessage.objects.create(user=request.user, scenario=None, role='user', content=message)

        system_prompt = (
            "You are an expert AI assistant for the QuestOps Escape-the-Lab platform. "
            "Help the user with general cybersecurity, software engineering, and cloud infrastructure questions. "
            "Provide detailed answers, examples, and code blocks."
        )

        history_qs = ChatMessage.objects.filter(user=request.user, scenario__isnull=True).order_by('created_at')
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in list(history_qs)[-10:]:
            messages.append({'role': msg.role, 'content': msg.content})

        try:
            generator = ScenarioGenerator()
            reply = generator._backend._chat(messages, expect_json=False, timeout=60)
            ChatMessage.objects.create(user=request.user, scenario=None, role='assistant', content=reply)
        except Exception as exc:
            logger.error("Global AI chat error: %s", exc, exc_info=True)
            return Response(
                {'error': 'AI assistant is temporarily unavailable. Please try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response({'reply': reply})
