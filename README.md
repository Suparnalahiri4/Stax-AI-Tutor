# Brainwave - AI-Powered Learning Platform

An intelligent coding education platform featuring AI-generated questions, personalized mastery tracking, and gamified competitive learning.

## Features

### 1. AI Question Generation
- Questions generated using Google Gemini API
- Verified by DeepSeek Coder 6.7B for quality assurance
- Stored in Supabase (PostgreSQL) after verification

### 2. AI Teacher
- **Topic Mastery Tracking**: Probability-based mastery index per topic, updated based on user interactions
- **Step-wise Problem Solving**: Progressive hints without revealing full solutions
- **Personalized Assignments**: Generated based on mastery level, code quality, and performance metrics

### 3. Gamified Learning
- City, State, and National level contests
- 1v1 Duels and 3v3 Standoffs
- Coding Marathons with XP multipliers
- Leaderboards and rankings

## Tech Stack

- **Backend**: Python FastAPI
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini API + DeepSeek Coder (via Hugging Face)

## Project Structure

```
brainwave/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Config, database
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── package.json
├── supabase/
│   └── schema.sql        # Database schema
├── .env.example
└── .gitignore
```

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase account
- Google Gemini API key
- Hugging Face API key (free tier works)

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <repo-url>
cd brainwave

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env
```

### 2. Backend Setup

```bash
# Create virtual environment
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Return to root
cd ..
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

### 4. Database Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Enable Email Auth in Authentication settings

### 5. Configure Environment Variables

Edit `.env` with your credentials:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Hugging Face (for DeepSeek verification)
HUGGINGFACE_API_KEY=your-huggingface-api-key
DEEPSEEK_MODEL_ID=deepseek-ai/deepseek-coder-6.7b-instruct

# App
SECRET_KEY=generate-a-secure-key
FRONTEND_URL=http://localhost:5173
```

Edit `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Run the Application

**Start Backend:**
```bash
cd backend
# Activate venv first
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Run server
uvicorn app.main:app --reload
```

**Start Frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions/topic/{topic}` - Get questions by topic
- `POST /api/questions/attempt` - Submit answer
- `POST /api/questions/generate` - Generate new questions (AI)

### AI Teacher
- `GET /api/teacher/mastery` - Get mastery profile
- `POST /api/teacher/hint` - Get step-wise hint
- `POST /api/teacher/solve-step` - Solve specific step
- `POST /api/teacher/assignments/generate` - Generate assignment

### Contests
- `GET /api/contests` - List contests
- `POST /api/contests/{id}/join` - Join contest
- `GET /api/contests/{id}/leaderboard` - Get leaderboard

### Duels
- `POST /api/contests/duels` - Create duel
- `POST /api/contests/duels/find-random` - Find random opponent
- `POST /api/contests/duels/{id}/accept` - Accept duel

## Mastery Algorithm

The mastery probability is updated using an adaptive learning rate:

```
if correct:
    delta = learning_rate * difficulty_weight * (1 - current_mastery)
    new_mastery = min(1.0, current_mastery + delta)
else:
    delta = learning_rate * (1/difficulty_weight) * current_mastery
    new_mastery = max(0.0, current_mastery - delta)
```

Where:
- `learning_rate = 0.1 / (1 + 0.1 * total_attempts)` (decreases over time)
- `difficulty_weight`: easy=0.5, medium=1.0, hard=1.5, expert=2.0

## DeepSeek Verification via Hugging Face

Questions are verified using DeepSeek Coder 6.7B through the Hugging Face Inference API:

1. Create a free account at https://huggingface.co
2. Go to Settings > Access Tokens and create a new token
3. Add the token to your `.env` as `HUGGINGFACE_API_KEY`

The model `deepseek-ai/deepseek-coder-6.7b-instruct` is used by default. On first request, the model may take 20-30 seconds to load (cold start).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
