from django.db import models
from django.contrib.auth.models import User
import json


class Track(models.Model):
    TRACK_SLUGS = [
        ('cybersecurity', 'Cybersecurity'),
        ('software', 'Software Engineering'),
        ('cloud', 'Cloud'),
    ]

    slug = models.SlugField(unique=True, choices=TRACK_SLUGS)
    name = models.CharField(max_length=100)
    tagline = models.CharField(max_length=200, blank=True)
    icon = models.CharField(max_length=10, default='🔐')
    accent_color = models.CharField(max_length=20, default='#ef4444')

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name


class Scenario(models.Model):
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='scenarios')
    title = models.CharField(max_length=200)
    narrative = models.TextField(
        help_text="Opening scene-setting text shown to the student before the incident starts."
    )
    lesson_content = models.TextField(
        blank=True,
        default="",
        help_text="AI-generated lesson explaining the concepts in this scenario."
    )
    time_limit_seconds = models.PositiveIntegerField(default=600)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['track', 'id']

    def __str__(self):
        return f"[{self.track.slug}] {self.title}"


class Stage(models.Model):
    ANSWER_TYPES = [
        ('mcq',         'Multiple Choice (4 options, deterministic check)'),
        ('drag_drop',   'Drag & Drop Sequence (order items, deterministic check)'),
        ('free_text',   'Free Text (AI semantic grading)'),
        ('code_editor', 'Code Editor (AI semantic grading)'),
        ('terminal',    'Terminal Simulator (AI semantic grading)'),
    ]

    STAGE_LABELS = [
        ('detect',     'Detect'),
        ('assess',     'Assess'),
        ('root_cause', 'Root Cause'),
        ('fix',        'Fix'),
    ]

    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name='stages')
    order = models.PositiveSmallIntegerField()           # 1–4
    label = models.CharField(max_length=20, choices=STAGE_LABELS)
    prompt = models.TextField(
        help_text="The question/challenge shown to the student."
    )
    artifact = models.TextField(
        blank=True,
        help_text="Log snippet, code block, or JSON config shown alongside the prompt."
    )

    # --- answer type ---
    answer_type = models.CharField(max_length=20, choices=ANSWER_TYPES, default='mcq')

    # MCQ: JSON list of 4 option strings
    mcq_options = models.TextField(blank=True, default='[]')

    # drag_drop: JSON list of items in SCRAMBLED order (shown to student)
    drag_items = models.TextField(
        blank=True, default='[]',
        help_text="JSON list of draggable items shown to the student in scrambled order."
    )

    # Stored answer:
    #   mcq       → the correct option string
    #   drag_drop → JSON array of items in CORRECT order
    #   free_text → reference answer the AI grades against
    correct_answer = models.TextField()

    hint = models.TextField(
        blank=True,
        help_text="Shown to the student after a wrong answer."
    )

    class Meta:
        ordering = ['scenario', 'order']
        unique_together = [['scenario', 'order']]

    # --- helpers ---

    def get_mcq_options(self) -> list:
        try:
            return json.loads(self.mcq_options)
        except (json.JSONDecodeError, TypeError):
            return []

    def get_drag_items(self) -> list:
        try:
            return json.loads(self.drag_items)
        except (json.JSONDecodeError, TypeError):
            return []

    def get_correct_order(self) -> list:
        """For drag_drop stages — returns the correct ordered list."""
        try:
            return json.loads(self.correct_answer)
        except (json.JSONDecodeError, TypeError):
            return []

    def __str__(self):
        return f"Stage {self.order} ({self.label} / {self.answer_type}) — {self.scenario.title}"


class Attempt(models.Model):
    stage = models.ForeignKey(Stage, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    answer_given = models.TextField()
    is_correct = models.BooleanField()
    ai_feedback = models.TextField(blank=True, default='')
    time_taken_seconds = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{status} {self.user.username} → Stage {self.stage.order}"


class StudentSkill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='skills')
    xp = models.PositiveIntegerField(default=0)

    LEVELS = [
        (0,   'Novice'),
        (100, 'Analyst'),
        (250, 'Specialist'),
        (500, 'Expert'),
    ]

    class Meta:
        unique_together = [['user', 'track']]
        ordering = ['track']

    @property
    def level(self):
        level_name = 'Novice'
        for threshold, name in self.LEVELS:
            if self.xp >= threshold:
                level_name = name
        return level_name

    @property
    def level_index(self):
        idx = 0
        for i, (threshold, _) in enumerate(self.LEVELS):
            if self.xp >= threshold:
                idx = i
        return idx

    def __str__(self):
        return f"{self.user.username} / {self.track.slug}: {self.xp} XP ({self.level})"


class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name='chat_messages', null=True, blank=True)
    role = models.CharField(max_length=20, choices=[('user', 'User'), ('assistant', 'Assistant')])
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.role}] {self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


