# ABOUTME: Authentication service using Supabase Auth
# ABOUTME: Handles user registration, login, and token management

from typing import Optional
from uuid import UUID
from ..core.database import get_supabase, get_supabase_admin
from ..schemas.user import UserCreate, UserLogin, UserProfile, AuthResponse
# Import AuthApiError - path varies by supabase version
try:
    from supabase_auth.errors import AuthApiError
except ImportError:
    # Fallback for different package versions
    class AuthApiError(Exception):
        pass


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self):
        self.supabase = get_supabase()
        self.admin = get_supabase_admin()
    
    async def register(self, user_data: UserCreate) -> AuthResponse:
        """Register a new user with Supabase Auth."""
        try:
            # Create auth user
            auth_response = self.supabase.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password,
                "options": {
                    "data": {
                        "username": user_data.username,
                        "display_name": user_data.display_name or user_data.username
                    }
                }
            })
            
            if auth_response.user is None:
                raise ValueError("Failed to create user")
            
            # Check if user already exists (email confirmation pending case)
            if auth_response.user.identities is not None and len(auth_response.user.identities) == 0:
                raise ValueError("User already exists. Please login instead.")
            
            # Create user profile in our users table
            profile_data = {
                "id": str(auth_response.user.id),
                "email": user_data.email,
                "username": user_data.username,
                "display_name": user_data.display_name or user_data.username,
                "total_xp": 0,
                "current_level": 1,
                "streak_days": 0
            }
            
            # Try to insert, ignore if already exists
            try:
                self.admin.table("users").insert(profile_data).execute()
                
                # Initialize mastery profile
                self.admin.table("user_mastery").insert({
                    "user_id": str(auth_response.user.id),
                    "overall_mastery": 0.5,
                    "topics": []
                }).execute()
            except Exception as e:
                # User profile might already exist
                if "duplicate key" not in str(e).lower():
                    raise
            
            # If no session (email confirmation required), auto-login
            if auth_response.session is None:
                # Try to login immediately (works if email confirmation is disabled)
                try:
                    login_response = self.supabase.auth.sign_in_with_password({
                        "email": user_data.email,
                        "password": user_data.password
                    })
                    if login_response.session:
                        return AuthResponse(
                            access_token=login_response.session.access_token,
                            refresh_token=login_response.session.refresh_token,
                            user=UserProfile(
                                id=login_response.user.id,
                                email=user_data.email,
                                username=user_data.username,
                                display_name=user_data.display_name or user_data.username,
                                created_at=login_response.user.created_at,
                                total_xp=0,
                                current_level=1,
                                streak_days=0
                            )
                        )
                except Exception:
                    pass
                raise ValueError("Please check your email to confirm your account, then login.")
            
            return AuthResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                user=UserProfile(
                    id=auth_response.user.id,
                    email=user_data.email,
                    username=user_data.username,
                    display_name=user_data.display_name or user_data.username,
                    created_at=auth_response.user.created_at,
                    total_xp=0,
                    current_level=1,
                    streak_days=0
                )
            )
        except AuthApiError as e:
            raise ValueError(f"Registration failed: {str(e)}")
    
    async def login(self, credentials: UserLogin) -> AuthResponse:
        """Login user with email and password."""
        try:
            auth_response = self.supabase.auth.sign_in_with_password({
                "email": credentials.email,
                "password": credentials.password
            })
            
            if auth_response.user is None:
                raise ValueError("Invalid credentials")
            
            # Try to get user profile, create if doesn't exist
            profile_result = self.admin.table("users").select("*").eq(
                "id", str(auth_response.user.id)
            ).execute()
            
            if not profile_result.data:
                # User exists in Auth but not in users table - create profile
                user_meta = auth_response.user.user_metadata or {}
                username = user_meta.get("username", credentials.email.split("@")[0])
                display_name = user_meta.get("display_name", username)
                
                profile_data = {
                    "id": str(auth_response.user.id),
                    "email": credentials.email,
                    "username": username,
                    "display_name": display_name,
                    "total_xp": 0,
                    "current_level": 1,
                    "streak_days": 0
                }
                self.admin.table("users").insert(profile_data).execute()
                
                # Also initialize mastery
                self.admin.table("user_mastery").insert({
                    "user_id": str(auth_response.user.id),
                    "overall_mastery": 0.5,
                    "topics": []
                }).execute()
                
                profile_data["created_at"] = auth_response.user.created_at
                profile = type('obj', (object,), {'data': profile_data})()
            else:
                profile = type('obj', (object,), {'data': profile_result.data[0]})()
            
            return AuthResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                user=UserProfile(**profile.data)
            )
        except AuthApiError as e:
            raise ValueError(f"Login failed: {str(e)}")
    
    async def logout(self, access_token: str) -> bool:
        """Logout user and invalidate token."""
        try:
            self.supabase.auth.sign_out()
            return True
        except Exception:
            return False
    
    async def get_user_by_token(self, access_token: str) -> Optional[UserProfile]:
        """Get user profile from access token."""
        try:
            user_response = self.supabase.auth.get_user(access_token)
            if user_response.user is None:
                return None
            
            profile = self.admin.table("users").select("*").eq(
                "id", str(user_response.user.id)
            ).single().execute()
            
            return UserProfile(**profile.data)
        except Exception:
            return None
    
    async def refresh_token(self, refresh_token: str) -> AuthResponse:
        """Refresh access token using refresh token."""
        try:
            auth_response = self.supabase.auth.refresh_session(refresh_token)
            
            profile = self.admin.table("users").select("*").eq(
                "id", str(auth_response.user.id)
            ).single().execute()
            
            return AuthResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                user=UserProfile(**profile.data)
            )
        except AuthApiError as e:
            raise ValueError(f"Token refresh failed: {str(e)}")


auth_service = AuthService()
