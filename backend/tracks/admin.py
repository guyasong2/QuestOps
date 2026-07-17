from django.contrib import admin
from .models import Track, Scenario, Stage, Attempt, StudentSkill


class StageInline(admin.TabularInline):
    model = Stage
    extra = 0
    readonly_fields = ('order', 'label')
    fields = ('order', 'label', 'prompt', 'artifact', 'answer_type', 'correct_answer', 'hint')


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'accent_color')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Scenario)
class ScenarioAdmin(admin.ModelAdmin):
    list_display = ('title', 'track', 'time_limit_seconds', 'is_active', 'created_at')
    list_filter = ('track', 'is_active')
    inlines = [StageInline]


@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'answer_type', 'order')
    list_filter = ('scenario__track', 'answer_type', 'label')
    search_fields = ('prompt', 'correct_answer')


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'stage', 'is_correct', 'time_taken_seconds', 'created_at')
    list_filter = ('is_correct', 'stage__scenario__track')
    search_fields = ('user__username',)
    readonly_fields = ('created_at',)


@admin.register(StudentSkill)
class StudentSkillAdmin(admin.ModelAdmin):
    list_display = ('user', 'track', 'xp', 'level')
    list_filter = ('track',)
    search_fields = ('user__username',)

