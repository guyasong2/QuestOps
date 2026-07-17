// Type definitions for API models

export interface Stage {
  id: number;
  order: number;
  label: 'detect' | 'assess' | 'root_cause' | 'fix';
  prompt: string;
  artifact: string;
  answer_type: 'mcq' | 'drag_drop' | 'free_text' | 'code_editor' | 'terminal';
  mcq_options: string[];
  drag_items: string[];
  hint: string;
}

export interface ScenarioDetail {
  id: number;
  title: string;
  narrative: string;
  lesson_content: string;
  time_limit_seconds: number;
  stages: Stage[];
}

export interface ScenarioList {
  id: number;
  title: string;
  narrative: string;
  time_limit_seconds: number;
  is_active: boolean;
  created_at: string;
}

export interface Track {
  id: number;
  slug: 'cybersecurity' | 'software' | 'cloud';
  name: string;
  tagline: string;
  icon: string;
  accent_color: string;
  scenarios: ScenarioList[];
}

export interface AttemptResult {
  is_correct: boolean;
  ai_feedback: string;
  hint: string;
  xp_earned: number;
  correct_answer: string;
  answer_type: string;
}

export interface StudentSkill {
  id: number;
  track_slug: string;
  track_name: string;
  track_icon: string;
  track_color: string;
  xp: number;
  level: string;
  level_index: number;
}

// API methods
// API methods
const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
}

export async function login(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function register(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
}

export async function getMe(): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/me/`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load user profile');
  return res.json();
}

export async function getTracks(): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/tracks/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load tracks');
  return res.json();
}

export async function getScenario(id: string): Promise<ScenarioDetail> {
  const res = await fetch(`${API_BASE}/scenarios/${id}/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load scenario');
  return res.json();
}

export async function submitAnswer(stageId: number, answer: string, timeTakenSeconds: number): Promise<AttemptResult> {
  const res = await fetch(`${API_BASE}/stages/${stageId}/submit/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ answer, time_taken_seconds: timeTakenSeconds }),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

export async function getSkills(): Promise<StudentSkill[]> {
  const res = await fetch(`${API_BASE}/skills/me/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load skills');
  return res.json();
}

export async function lessonChat(
  scenarioId: number,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/chat/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('AI tutor is unavailable');
  return res.json();
}
