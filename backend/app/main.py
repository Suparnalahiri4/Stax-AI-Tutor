# ABOUTME: Main FastAPI application entry point
# ABOUTME: Configures CORS, routes, and application lifecycle

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import get_settings
from .api import auth, questions, teacher, contests

settings = get_settings()

app = FastAPI(
    title="Brainwave Learning Platform",
    description="AI-powered learning platform with question generation, personalized tutoring, and gamification",
    version="1.0.0"
)

# Configure CORS - allow all localhost ports for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(teacher.router, prefix="/api")
app.include_router(contests.router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Brainwave Learning Platform API",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "environment": settings.environment
    }
