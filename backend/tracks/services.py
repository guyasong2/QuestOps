"""
services.py — Two-model AI backend for Escape the Lab.

Backends:
  OnlineModelService  — DeepSeek cloud API (requires internet + DEEPSEEK_API_KEY)
                        Default model: deepseek-v4-flash
  OfflineModelService — Ollama local inference (fully offline)
                        Default model: qwen2.5-coder:7b

ScenarioGenerator picks the active backend from settings.AI_MODE:
    AI_MODE=online   → OnlineModelService  (DeepSeek)
    AI_MODE=offline  → OfflineModelService (Ollama)

Both backends implement:
    .generate_scenario(track: Track) -> Scenario
    .check_answer(stage: Stage, answer: str) -> (is_correct: bool, feedback: str)

AIAnswerChecker dispatches to the right method per answer_type:
    mcq       → deterministic exact match
    drag_drop → deterministic JSON array comparison
    free_text → AI semantic grading via the active backend
"""

import json
import logging
import requests
from django.conf import settings
from .models import Track, Scenario, Stage, StudentSkill

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Shared prompts
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are a technical curriculum designer for an escape-room learning platform. "
    "You generate realistic incident scenarios that teach practical skills. "
    "Return ONLY valid JSON — no markdown, no explanation, no code fences."
)

SCENARIO_PROMPT_TEMPLATE = """Generate a realistic technical incident scenario for the track: {track_name}.

STAGE ANSWER TYPE CONTRACT (follow this exactly):
  Stage 1 (detect)     → answer_type = "mcq"       — 4 options, student identifies what is happening
  Stage 2 (assess)     → answer_type = "drag_drop"  — student sequences 4–5 items in correct order
  Stage 3 (root_cause) → answer_type = "free_text"  — student explains the root cause in their own words
  Stage 4 (fix)        → If track is "software", answer_type = "code_editor". If track is "cybersecurity" or "cloud", answer_type = "terminal".

Return ONLY this JSON schema (no extra keys, no markdown fences):
{{
  "title": "Short incident title (5–8 words)",
  "narrative": "2–3 sentence scene-setting paragraph shown to the student before they start",
  "lesson_content": "A detailed, structured lesson (using Markdown) teaching the core concepts and background needed to understand and solve this scenario. Use headers, bullet points, and code snippets where appropriate.",
  "time_limit_seconds": 600,
  "stages": [
    {{
      "order": 1,
      "label": "detect",
      "answer_type": "mcq",
      "prompt": "Specific actionable question to identify the incident",
      "artifact": "Detailed realistic log/command output/config (multi-line)",
      "mcq_options": ["Correct answer text", "Wrong option B", "Wrong option C", "Wrong option D"],
      "drag_items": [],
      "correct_answer": "Correct answer text",
      "hint": "Hint shown after a wrong answer — guide without giving away"
    }},
    {{
      "order": 2,
      "label": "assess",
      "answer_type": "drag_drop",
      "prompt": "Arrange the following items in the correct order to assess the situation",
      "artifact": "Context/evidence the student needs to determine the order",
      "mcq_options": [],
      "drag_items": ["Item C (shown scrambled)", "Item A", "Item D", "Item B"],
      "correct_answer": "[\"Item A\", \"Item B\", \"Item C (shown scrambled)\", \"Item D\"]",
      "hint": "Hint about the correct sequence logic"
    }},
    {{
      "order": 3,
      "label": "root_cause",
      "answer_type": "free_text",
      "prompt": "Explain the root cause of this incident. What went wrong and why?",
      "artifact": "Additional evidence or config the student needs",
      "mcq_options": [],
      "drag_items": [],
      "correct_answer": "The reference answer the AI will grade against — 2–4 sentences covering the key technical facts",
      "hint": "Hint pointing to the key evidence the student should reference"
    }},
    {{
      "order": 4,
      "label": "fix",
      "answer_type": "code_editor",
      "prompt": "Write the exact command or code to fix the issue.",
      "artifact": "Current state / environment context",
      "mcq_options": [],
      "drag_items": [],
      "correct_answer": "The exact bash command sequence or python code that fixes the issue.",
      "hint": "Hint about the command or code logic"
    }}
  ]
}}

Track-specific guidance:
- cybersecurity: SSH brute-force, log analysis, iptables/firewall, fail2ban, Tor exit nodes
- software: Django/Python, production traceback, database migration, deployment runbook
- cloud: AWS S3 misconfiguration, IAM policy, Terraform, CloudTrail, public bucket

Requirements:
- Artifacts must be realistic and detailed (real-looking log lines, valid command output, JSON/YAML)
- drag_items must be the SAME items as correct_answer but in a DIFFERENT scrambled order
- correct_answer for drag_drop MUST be a valid JSON array string
- free_text correct_answer must be a complete technical reference answer (not just keywords)
- Hints must be helpful but not give away the answer directly"""


ANSWER_CHECK_PROMPT_TEMPLATE = """You are grading a student's answer for a technical incident response scenario.

Track: {track_name}
Stage: {stage_label} (Stage {stage_order} of 4)
Question: {prompt}
Reference answer: {correct_answer}
Student's answer: {student_answer}

Evaluate whether the student's answer demonstrates correct technical understanding.
- Be lenient on wording and phrasing — focus on whether the core technical concept is right
- Be strict on technical accuracy — wrong commands, wrong root causes, wrong tools = incorrect
- A partial answer covering the main point(s) counts as correct

Return ONLY this JSON (no markdown, no explanation):
{{"is_correct": true_or_false, "feedback": "1–2 sentence feedback explaining what was right or what key concept was missing"}}"""


# ---------------------------------------------------------------------------
# Shared validation + persistence
# ---------------------------------------------------------------------------

def _validate_scenario_dict(data: dict) -> None:
    """Raises ValueError if the generated JSON does not match our schema."""
    for key in ("title", "narrative", "lesson_content", "time_limit_seconds", "stages"):
        if key not in data:
            raise ValueError(f"Missing required top-level key: '{key}'")

    stages = data["stages"]
    if len(stages) != 4:
        raise ValueError(f"Expected exactly 4 stages, got {len(stages)}")

    expected = {
        1: ("detect",     ["mcq"]),
        2: ("assess",     ["drag_drop"]),
        3: ("root_cause", ["free_text"]),
        4: ("fix",        ["code_editor", "terminal", "drag_drop"]),
    }

    for stage in stages:
        order = stage.get("order")
        for key in ("order", "label", "answer_type", "prompt", "artifact", "correct_answer", "hint"):
            if key not in stage:
                raise ValueError(f"Stage {order} missing key: '{key}'")

        exp_label, exp_types = expected.get(order, (None, None))
        if exp_label and stage.get("label") != exp_label:
            raise ValueError(f"Stage {order}: expected label '{exp_label}', got '{stage.get('label')}'")
        if exp_types and stage.get("answer_type") not in exp_types:
            raise ValueError(
                f"Stage {order}: expected answer_type in {exp_types}, got '{stage.get('answer_type')}'"
            )

        if stage["answer_type"] == "mcq":
            options = stage.get("mcq_options", [])
            if len(options) != 4:
                raise ValueError(f"MCQ stage {order} must have exactly 4 options, got {len(options)}")
            if stage["correct_answer"] not in options:
                raise ValueError(f"MCQ stage {order}: correct_answer not found in mcq_options")

        if stage["answer_type"] == "drag_drop":
            drag_items = stage.get("drag_items", [])
            if len(drag_items) < 3:
                raise ValueError(f"drag_drop stage {order} needs at least 3 drag_items")
            try:
                correct_order = json.loads(stage["correct_answer"])
            except (json.JSONDecodeError, TypeError):
                raise ValueError(f"drag_drop stage {order}: correct_answer must be a valid JSON array string")
            if sorted(drag_items) != sorted(correct_order):
                raise ValueError(
                    f"drag_drop stage {order}: drag_items and correct_answer must contain the same items"
                )


def _save_scenario(track: Track, data: dict) -> Scenario:
    """Persist a validated scenario dict to the database."""
    Scenario.objects.filter(track=track).delete()

    scenario = Scenario.objects.create(
        track=track,
        title=data["title"],
        narrative=data["narrative"],
        lesson_content=data.get("lesson_content", ""),
        time_limit_seconds=data.get("time_limit_seconds", 600),
    )

    for s in data["stages"]:
        options = s.get("mcq_options", [])
        drag = s.get("drag_items", [])
        Stage.objects.create(
            scenario=scenario,
            order=s["order"],
            label=s["label"],
            prompt=s["prompt"],
            artifact=s.get("artifact", ""),
            answer_type=s["answer_type"],
            mcq_options=json.dumps(options) if isinstance(options, list) else options,
            drag_items=json.dumps(drag) if isinstance(drag, list) else drag,
            correct_answer=s["correct_answer"],
            hint=s.get("hint", ""),
        )

    logger.info("Saved scenario '%s' for track '%s'", data["title"], track.slug)
    return scenario


def _strip_json_fences(text: str) -> str:
    """Remove accidental markdown code fences from model output."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # drop first line (```json or ```) and last line (```)
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
    return text.strip()


# ---------------------------------------------------------------------------
# Online backend — DeepSeek (OpenAI-compatible REST API)
# ---------------------------------------------------------------------------

class OnlineModelService:
    """
    Scenario generation and AI answer grading via DeepSeek cloud API.

    Requires:
        DEEPSEEK_API_KEY      — set in .env
        DEEPSEEK_MODEL        — default: deepseek-v4-flash
        DEEPSEEK_API_BASE_URL — default: https://api.deepseek.com
    """

    def __init__(self):
        self.api_key = getattr(settings, "DEEPSEEK_API_KEY", "")
        self.model = getattr(settings, "DEEPSEEK_MODEL", "deepseek-v4-flash")
        self.base_url = getattr(settings, "DEEPSEEK_API_BASE_URL", "https://api.deepseek.com")

    def _chat(self, messages: list, expect_json: bool = True, timeout: int = 90) -> str:
        """Makes a single chat completion call. Returns raw content string."""
        if not self.api_key:
            raise RuntimeError(
                "DEEPSEEK_API_KEY is not set. Add it to your .env or switch AI_MODE=offline."
            )
        endpoint = f"{self.base_url.rstrip('/')}/v1/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 4096,
        }
        if expect_json:
            payload["response_format"] = {"type": "json_object"}

        resp = requests.post(
            endpoint,
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    def generate_scenario(self, track: Track) -> Scenario:
        logger.info("[DeepSeek] Generating scenario for track '%s'", track.slug)
        prompt = SCENARIO_PROMPT_TEMPLATE.format(track_name=track.name)
        content = self._chat([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ])
        data = json.loads(_strip_json_fences(content))
        _validate_scenario_dict(data)
        logger.info("[DeepSeek] ✓ Scenario '%s' validated", data.get("title"))
        return _save_scenario(track, data)

    def check_answer(self, stage: Stage, student_answer: str) -> tuple[bool, str]:
        """AI semantic grading for free_text stages."""
        logger.info("[DeepSeek] Grading free_text answer for stage %s", stage.order)
        prompt = ANSWER_CHECK_PROMPT_TEMPLATE.format(
            track_name=stage.scenario.track.name,
            stage_label=stage.label,
            stage_order=stage.order,
            prompt=stage.prompt,
            correct_answer=stage.correct_answer,
            student_answer=student_answer,
        )
        content = self._chat([
            {"role": "system", "content": "You are a fair and technical grader. Return only JSON."},
            {"role": "user", "content": prompt},
        ], timeout=30)
        result = json.loads(_strip_json_fences(content))
        is_correct = bool(result.get("is_correct", False))
        feedback = str(result.get("feedback", ""))
        logger.info("[DeepSeek] Grading result: %s", "correct" if is_correct else "incorrect")
        return is_correct, feedback


# ---------------------------------------------------------------------------
# Offline backend — Ollama (local inference)
# ---------------------------------------------------------------------------

class OfflineModelService:
    """
    Scenario generation and AI answer grading via local Ollama.

    Requires:
        ollama serve  +  ollama pull qwen2.5-coder:7b

    Configured via:
        OLLAMA_BASE_URL  — default: http://localhost:11434
        OLLAMA_MODEL     — default: qwen2.5-coder:7b
    """

    def __init__(self):
        self.base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = getattr(settings, "OLLAMA_MODEL", "qwen2.5-coder:7b")

    def _generate(self, prompt: str, timeout: int = 180) -> str:
        """Calls Ollama /api/generate. Returns raw response string."""
        resp = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.7, "num_predict": 4096},
            },
            timeout=timeout,
        )
        resp.raise_for_status()
        content = resp.json().get("response", "")
        if not content:
            raise ValueError("Ollama returned an empty response")
        return _strip_json_fences(content)

    def generate_scenario(self, track: Track) -> Scenario:
        logger.info("[Ollama] Generating scenario for track '%s' with model '%s'", track.slug, self.model)
        full_prompt = f"{SYSTEM_PROMPT}\n\n{SCENARIO_PROMPT_TEMPLATE.format(track_name=track.name)}"
        content = self._generate(full_prompt)
        data = json.loads(content)
        _validate_scenario_dict(data)
        logger.info("[Ollama] ✓ Scenario '%s' validated", data.get("title"))
        return _save_scenario(track, data)

    def check_answer(self, stage: Stage, student_answer: str) -> tuple[bool, str]:
        """AI semantic grading for free_text stages."""
        logger.info("[Ollama] Grading free_text answer for stage %s", stage.order)
        prompt = (
            "You are a fair and technical grader. Return only JSON.\n\n"
            + ANSWER_CHECK_PROMPT_TEMPLATE.format(
                track_name=stage.scenario.track.name,
                stage_label=stage.label,
                stage_order=stage.order,
                prompt=stage.prompt,
                correct_answer=stage.correct_answer,
                student_answer=student_answer,
            )
        )
        content = self._generate(prompt, timeout=60)
        result = json.loads(content)
        is_correct = bool(result.get("is_correct", False))
        feedback = str(result.get("feedback", ""))
        return is_correct, feedback


# ---------------------------------------------------------------------------
# ScenarioGenerator — picks the active backend from settings.AI_MODE
# ---------------------------------------------------------------------------

class ScenarioGenerator:
    """
    Facade used by views and the management command.

    AI_MODE=online   → OnlineModelService  (DeepSeek)
    AI_MODE=offline  → OfflineModelService (Ollama)
    """

    def __init__(self):
        mode = getattr(settings, "AI_MODE", "offline").lower()
        if mode == "online":
            self._backend = OnlineModelService()
            self.mode = "online"
        else:
            self._backend = OfflineModelService()
            self.mode = "offline"
        logger.info("ScenarioGenerator initialised with backend: %s", self.mode)

    def generate_scenario(self, track: Track) -> Scenario:
        return self._backend.generate_scenario(track)

    @property
    def backend_name(self) -> str:
        if self.mode == "online":
            return f"DeepSeek ({getattr(settings, 'DEEPSEEK_MODEL', 'deepseek-v4-flash')})"
        return f"Ollama ({getattr(settings, 'OLLAMA_MODEL', 'qwen2.5-coder:7b')})"


# ---------------------------------------------------------------------------
# AIAnswerChecker — dispatches per answer_type
# ---------------------------------------------------------------------------

class AIAnswerChecker:
    """
    Central answer checker. Dispatches based on stage.answer_type:

    mcq       → deterministic case-insensitive exact match
    drag_drop → deterministic JSON array comparison (order matters)
    free_text → calls AI backend for semantic grading
    """

    @staticmethod
    def check(stage: Stage, answer: str) -> tuple[bool, str]:
        """
        Returns (is_correct, feedback).
        feedback is an AI-generated explanation (free_text) or empty string (mcq/drag_drop).
        """
        atype = stage.answer_type

        if atype == "mcq":
            return AIAnswerChecker._check_mcq(stage, answer)
        elif atype == "drag_drop":
            return AIAnswerChecker._check_drag_drop(stage, answer)
        elif atype in ("free_text", "code_editor", "terminal"):
            return AIAnswerChecker._check_free_text(stage, answer)
        else:
            # Legacy safety — treat unknown types as keyword match
            logger.warning("Unknown answer_type '%s' on stage %s — falling back to keyword check", atype, stage.id)
            keywords = [k.strip().lower() for k in stage.correct_answer.split(",") if k.strip()]
            return all(kw in answer.lower() for kw in keywords), ""

    @staticmethod
    def _check_mcq(stage: Stage, answer: str) -> tuple[bool, str]:
        is_correct = answer.strip().lower() == stage.correct_answer.strip().lower()
        return is_correct, ""

    @staticmethod
    def _check_drag_drop(stage: Stage, answer: str) -> tuple[bool, str]:
        """
        Compares the student's submitted JSON array against the stored correct order.
        answer must be a JSON-encoded list matching the items in stage.get_correct_order().
        """
        try:
            student_order = json.loads(answer)
        except (json.JSONDecodeError, TypeError):
            return False, "Answer could not be parsed. Please ensure items are submitted in order."

        correct_order = stage.get_correct_order()
        is_correct = student_order == correct_order
        return is_correct, ""

    @staticmethod
    def _check_free_text(stage: Stage, answer: str) -> tuple[bool, str]:
        """Delegates to the active AI backend for semantic grading."""
        try:
            generator = ScenarioGenerator()
            return generator._backend.check_answer(stage, answer)
        except Exception as exc:
            logger.error("AI answer grading failed for stage %s: %s", stage.id, exc)
            # Fail open with a message so the student isn't stuck
            return False, f"Could not grade automatically. Try again or check your answer against the hint."


# ---------------------------------------------------------------------------
# XPService
# ---------------------------------------------------------------------------

XP_TABLE = {
    1: {"correct": 25,  "incorrect": 5},
    2: {"correct": 35,  "incorrect": 5},
    3: {"correct": 50,  "incorrect": 8},
    4: {"correct": 75,  "incorrect": 10},
}


from django.contrib.auth.models import User

class XPService:
    @staticmethod
    def award(user: User, track: Track, is_correct: bool, stage_order: int) -> int:
        row = XP_TABLE.get(stage_order, {"correct": 25, "incorrect": 5})
        xp_delta = row["correct"] if is_correct else row["incorrect"]
        skill, _ = StudentSkill.objects.get_or_create(user=user, track=track)
        skill.xp += xp_delta
        skill.save()
        return xp_delta
