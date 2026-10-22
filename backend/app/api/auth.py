"""
Authentication Endpoints.

Provides /api/auth/login and /api/auth/me for user authentication
in the Multilingual Sentiment Analysis research platform.
"""

from fastapi import APIRouter, HTTPException, Header, status
from typing import Optional

from backend.app.schemas.api_schemas import LoginRequest, LoginResponse, UserInfo
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse, summary="Authenticate researcher")
def login(payload: LoginRequest):
    """
    Authenticate user with email and password.
    Returns access token and user profile on success.
    """
    if not payload.email or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    user = AuthService.authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = AuthService.create_token(user)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserInfo(**user)
    )


@router.get("/me", response_model=UserInfo, summary="Get current authenticated user")
def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Verify bearer token and return user profile.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header."
        )

    token = authorization.split(" ", 1)[1].strip()
    user = AuthService.verify_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token."
        )

    return UserInfo(**user)
