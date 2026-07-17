from rest_framework import serializers
from .models import Track, Scenario, Stage, Attempt, StudentSkill


class StageListSerializer(serializers.ModelSerializer):
    """
    Stage data sent to the frontend — correct_answer intentionally excluded.

    answer_type drives which UI component the frontend renders:
        mcq       → radio group (4 options)
        drag_drop → draggable card list (student reorders)
        free_text → textarea (AI-graded)
    """
    mcq_options = serializers.SerializerMethodField()
    drag_items = serializers.SerializerMethodField()

    class Meta:
        model = Stage
        fields = [
            'id',
            'order',
            'label',
            'prompt',
            'artifact',
            'answer_type',
            # MCQ support
            'mcq_options',
            # Drag & drop support
            'drag_items',
            # Shown after wrong answer
            'hint',
            # correct_answer is intentionally EXCLUDED from this serializer
        ]

    def get_mcq_options(self, obj) -> list:
        return obj.get_mcq_options()

    def get_drag_items(self, obj) -> list:
        return obj.get_drag_items()


class ScenarioListSerializer(serializers.ModelSerializer):
    """Lightweight scenario info for the Catalog page grid."""

    class Meta:
        model = Scenario
        fields = ['id', 'title', 'narrative', 'time_limit_seconds', 'is_active', 'created_at']


class ScenarioDetailSerializer(serializers.ModelSerializer):
    """Full scenario with all stages — answers excluded."""
    stages = StageListSerializer(many=True, read_only=True)

    class Meta:
        model = Scenario
        fields = ['id', 'title', 'narrative', 'lesson_content', 'time_limit_seconds', 'stages']


class TrackSerializer(serializers.ModelSerializer):
    """Full track with its scenarios — used by the Catalog page."""
    scenarios = ScenarioListSerializer(many=True, read_only=True)

    class Meta:
        model = Track
        fields = ['id', 'slug', 'name', 'tagline', 'icon', 'accent_color', 'scenarios']


# ---------------------------------------------------------------------------
# Submit / result serializers
# ---------------------------------------------------------------------------

class StageSubmitSerializer(serializers.Serializer):
    answer = serializers.CharField(
        help_text=(
            "mcq: the chosen option string | "
            "drag_drop: JSON-encoded list of items in student's order | "
            "free_text: plain text explanation"
        )
    )
    time_taken_seconds = serializers.IntegerField(default=0, min_value=0)


class AttemptResultSerializer(serializers.Serializer):
    """
    Returned after a stage submission.

    is_correct    — boolean
    ai_feedback   — AI-generated explanation (free_text stages) or empty string
    hint          — static hint from DB (shown when incorrect)
    xp_earned     — XP points awarded for this attempt
    correct_answer— revealed only when is_correct=True
    answer_type   — echoed back so frontend knows how to show the reveal
    """
    is_correct = serializers.BooleanField()
    ai_feedback = serializers.CharField(allow_blank=True)
    hint = serializers.CharField(allow_blank=True)
    xp_earned = serializers.IntegerField()
    correct_answer = serializers.CharField(allow_blank=True)
    answer_type = serializers.CharField()


class StudentSkillSerializer(serializers.ModelSerializer):
    track_slug = serializers.CharField(source='track.slug')
    track_name = serializers.CharField(source='track.name')
    track_icon = serializers.CharField(source='track.icon')
    track_color = serializers.CharField(source='track.accent_color')
    level = serializers.CharField()
    level_index = serializers.IntegerField()

    class Meta:
        model = StudentSkill
        fields = [
            'id', 'track_slug', 'track_name', 'track_icon',
            'track_color', 'xp', 'level', 'level_index',
        ]
