# ABOUTME: API dependencies for authentication and authorization
# ABOUTME: Provides reusable dependency functions for route protection

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from uuid import UUID
from ..services.auth_service import auth_service
from ..schemas.user import UserProfile

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserProfile:
    """
    Get the current authenticated user from the JWT token.
    Raises 401 if not authenticated.
    """
    token = credentials.credentials
    user = await auth_service.get_user_by_token(token)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
) -> Optional[UserProfile]:
    """
    Get the current user if authenticated, None otherwise.
    Does not raise errors for unauthenticated requests.
    """
    if credentials is None:
        return None
    
    try:
        return await auth_service.get_user_by_token(credentials.credentials)
    except Exception:
        return None
