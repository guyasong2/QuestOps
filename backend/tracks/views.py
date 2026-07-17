from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Track, Scenario, Stage, Attempt, StudentSkill
from .serializers import (
    TrackSerializer,
    ScenarioDetailSerializer,
    StageSubmitSerializer,
    StudentSkillSerializer,
)
from .services import AIAnswerChecker, XPService, ScenarioGenerator


class TrackListView(generics.ListAPIView):
    """
    GET /api/tracks/
    Returns all tracks with their scenarios (used by the Catalog page).
    """
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
    POST /api/scenarios/<id>/chat/
    Handles a conversational AI tutoring session about a scenario's lesson.
    Body: { "message": "...", "history": [{"role": "user"|"assistant", "content": "..."}] }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        scenario = get_object_or_404(
            Scenario.objects.select_related('track'), pk=pk
        )

        message = request.data.get('message', '').strip()
        history = request.data.get('history', [])

        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

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

        messages = [{"role": "system", "content": system_prompt}]
        for entry in history[-10:]:  # cap history at 10 exchanges
            if entry.get('role') in ('user', 'assistant') and entry.get('content'):
                messages.append({'role': entry['role'], 'content': entry['content']})
        messages.append({'role': 'user', 'content': message})

        try:
            generator = ScenarioGenerator()
            reply = generator._backend._chat(messages, expect_json=False, timeout=60)
        except Exception as exc:
            return Response(
                {'error': f'AI tutor is unavailable: {exc}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response({'reply': reply})
