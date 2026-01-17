# ABOUTME: Authentication API endpoints
# ABOUTME: Handles user registration, login, logout, and token refresh

from fastapi import APIRouter, HTTPException, status, Depends
from ..schemas.user import UserCreate, UserLogin, AuthResponse, UserProfile
from ..services.auth_service import auth_service
from .deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    """Register a new user account."""
    try:
        return await auth_service.register(user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """Login with email and password."""
    try:
        return await auth_service.login(credentials)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout")
async def logout(current_user: UserProfile = Depends(get_current_user)):
    """Logout the current user."""
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(refresh_token: str):
    """Refresh the access token."""
    try:
        return await auth_service.refresh_token(refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    """Get the current user's profile."""
    return current_user
