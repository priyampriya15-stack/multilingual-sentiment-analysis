"""
Authentication Service.

Provides secure credential verification, password hashing with bcrypt,
and signed JWT token issuance for the research platform.
"""

import time
import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

# Secret key for local development signing; can be overridden via JWT_SECRET env var
JWT_SECRET = os.getenv("JWT_SECRET", "indic-sentiment-research-platform-jwt-secret-key-2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Demo Researcher Account
# Password: Research@123 (hashed with bcrypt; never stored in plaintext)
DEMO_USERS = {
    "researcher@medai.org": {
        "email": "researcher@medai.org",
        "name": "Dr. Ananya Sharma",
        "role": "Lead NLP Researcher",
        "institution": "Center for Indic NLP & AI Research",
        "password_hash": "$2b$12$YghI5JTeIV38bztTI2AFGeSOrqJ/Y3p2JFK4DhusmmD0pv9sX7He6"
    }
}


class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plaintext password against a bcrypt hash."""
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
        except Exception:
            return False

    @staticmethod
    def authenticate(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user credentials."""
        clean_email = email.strip().lower()
        user = DEMO_USERS.get(clean_email)
        if not user:
            return None

        if not AuthService.verify_password(password, user["password_hash"]):
            return None

        return {
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "institution": user["institution"]
        }

    @staticmethod
    def create_token(user: Dict[str, Any], expires_hours: int = ACCESS_TOKEN_EXPIRE_HOURS) -> str:
        """Create a signed JWT access token."""
        expire = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
        payload = {
            "sub": user["email"],
            "name": user["name"],
            "role": user["role"],
            "institution": user["institution"],
            "exp": int(expire.timestamp()),
            "iat": int(datetime.now(timezone.utc).timestamp())
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT access token."""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return {
                "email": payload.get("sub"),
                "name": payload.get("name"),
                "role": payload.get("role"),
                "institution": payload.get("institution")
            }
        except jwt.PyJWTError:
            return None
