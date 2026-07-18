# QuestOps: AI-Powered Educational Escape Room

![QuestOps](https://img.shields.io/badge/Status-Live-success)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue)
![Django](https://img.shields.io/badge/Backend-Django%20REST-green)

**Live Demo:** [https://quest-ops.vercel.app/](https://quest-ops.vercel.app/)

## Executive Summary
Quest Ops is an AI-powered educational escape room that transforms learning into an interactive adventure. Instead of passively consuming educational content, players solve puzzles, complete missions, and overcome challenges in a story-driven environment.

Powered by **DeepSeek AI**, Quest Ops provides intelligent guidance, adaptive hints, and immersive interactions that encourage critical thinking, teamwork, and problem-solving. Our mission is to make learning exciting by combining education with the thrill of an escape room.

---

## 🎯 The Problem & Our Solution
**The Problem:** Many educational platforms rely on passive learning methods, making it difficult for students to stay engaged and retain information. Learners often lose motivation when lessons feel repetitive or disconnected from real-world problem-solving.

**Our Solution:** Quest Ops turns learning into an escape-room adventure! Players enter themed environments where every puzzle represents a learning challenge. To progress, they must solve problems, analyze clues, think critically, and work together. The platform encourages exploration and discovery while using AI to provide contextual guidance when players become stuck.

---

## ✨ Core Features
- **Story-Driven Escape Rooms:** Players progress through immersive environments by solving educational puzzles and unlocking new areas.
- **DeepSeek AI Guide:** An intelligent guide that provides contextual hints, explains concepts without revealing full solutions, and adapts its guidance to the player's progress.
- **Interactive Learning:** Every challenge is designed to reinforce knowledge while keeping players engaged through gameplay.
- **Team Collaboration:** Players can work together, communicate, and combine their ideas to solve increasingly complex challenges.
- **Progress Tracking:** The platform tracks player progress throughout each escape room, allowing learners to monitor their achievements.

---

## 🛠️ Technology Stack
### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Language:** TypeScript

### Backend
- **Framework:** Python / Django REST Framework
- **AI Integration:** DeepSeek AI
- **Database:** PostgreSQL
- **Storage:** AWS S3 (for media/avatars)

### Deployment
- **Frontend:** Vercel
- **Backend:** AWS EC2 + Nginx + Docker
- **Containerization:** Docker & Docker Compose

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or use the configured SQLite for local testing)

### 1. Clone the repository
```bash
git clone https://github.com/guyasong2/QuestOps.git
cd QuestOps
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧭 User Journey
1. Create an account and set up a profile.
2. Enter an escape room scenario where story elements introduce the mission.
3. Solve puzzles and complete objectives.
4. Interact with the DeepSeek AI guide for hints when needed.
5. Successfully complete challenges to unlock new sections of the adventure.
6. Finish the mission and review your progress!

---

## 🔮 Future Roadmap
- Multiplayer escape rooms
- Teacher-created custom missions
- AI-generated escape room scenarios
- Voice interactions with the AI guide
- Leaderboards and achievements
- Analytics dashboards for educators

## 🌍 Expected Impact
Quest Ops aims to increase learner engagement by making education feel like an adventure. Through AI-assisted gameplay, students develop critical thinking, communication, and problem-solving skills while reinforcing academic concepts in a memorable way.
