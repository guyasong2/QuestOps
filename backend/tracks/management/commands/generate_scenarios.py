"""
Management command: python manage.py generate_scenarios

Generates (or regenerates) one scenario per track using the active AI backend.
Backend is selected by AI_MODE in .env:
    AI_MODE=offline  → Ollama (qwen2.5-coder:7b, local)
    AI_MODE=online   → Groq API (llama-3.3-70b-versatile, cloud)

Override at runtime with --mode:
    python manage.py generate_scenarios --mode online
    python manage.py generate_scenarios --mode offline
    python manage.py generate_scenarios --track cybersecurity
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from tracks.models import Track
from tracks.services import ScenarioGenerator

TRACK_DATA = [
    {
        "slug": "cybersecurity",
        "name": "Cybersecurity",
        "tagline": "Detect threats. Contain damage. Harden the perimeter.",
        "icon": "🔐",
        "accent_color": "#ef4444",
    },
    {
        "slug": "software",
        "name": "Software Engineering",
        "tagline": "Debug production. Find the root cause. Ship the fix.",
        "icon": "💻",
        "accent_color": "#3b82f6",
    },
    {
        "slug": "cloud",
        "name": "Cloud",
        "tagline": "Audit configs. Fix exposures. Lock down your infrastructure.",
        "icon": "☁️",
        "accent_color": "#14b8a6",
    },
]


class Command(BaseCommand):
    help = "Seed tracks and generate AI scenarios via the configured backend (online/offline)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--track',
            type=str,
            help='Only generate for this track slug (cybersecurity | software | cloud)',
        )
        parser.add_argument(
            '--mode',
            type=str,
            choices=['online', 'offline'],
            help='Override AI_MODE from .env for this run only.',
        )

    def handle(self, *args, **options):
        # Allow runtime mode override
        if options.get('mode'):
            settings.AI_MODE = options['mode']

        generator = ScenarioGenerator()
        target_slug = options.get('track')

        self.stdout.write(self.style.MIGRATE_HEADING('\n🧪 Escape the Lab — Scenario Generator'))
        self.stdout.write(f"   Backend : {generator.backend_name}")
        self.stdout.write(f"   Mode    : {generator.mode}\n")

        success_count = 0
        fail_count = 0

        for data in TRACK_DATA:
            slug = data['slug']
            if target_slug and slug != target_slug:
                continue

            # Ensure track row exists / is up to date
            track, created = Track.objects.update_or_create(
                slug=slug,
                defaults={
                    'name': data['name'],
                    'tagline': data['tagline'],
                    'icon': data['icon'],
                    'accent_color': data['accent_color'],
                },
            )
            if created:
                self.stdout.write(f"  + Created track: {track.name}")

            self.stdout.write(f"\n  {data['icon']}  Generating scenario for: {track.name} ...")

            try:
                scenario = generator.generate_scenario(track)
                stage_count = scenario.stages.count()
                self.stdout.write(
                    self.style.SUCCESS(f"     ✓ '{scenario.title}' — {stage_count} stages saved")
                )
                success_count += 1
            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(f"     ✗ Failed for '{track.slug}': {exc}")
                )
                fail_count += 1

        self.stdout.write('')
        if fail_count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Done — {success_count} scenario(s) generated successfully.')
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠  Done — {success_count} succeeded, {fail_count} failed. '
                    f'Check AI_MODE and backend config in .env'
                )
            )
        self.stdout.write('   Visit /admin/ to review and edit generated content.\n')

