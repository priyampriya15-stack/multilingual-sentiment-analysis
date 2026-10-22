"""
Automated Integration Tests for Authentication Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_auth_login_success():
    """Verify demo researcher login succeeds with valid credentials."""
    payload = {
        "email": "researcher@medai.org",
        "password": "Research@123"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "researcher@medai.org"
    assert "Dr. Ananya Sharma" in data["user"]["name"]


def test_auth_login_invalid_password():
    """Verify login failure with wrong password."""
    payload = {
        "email": "researcher@medai.org",
        "password": "WrongPassword!99"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_auth_login_unknown_user():
    """Verify login failure for non-existent user."""
    payload = {
        "email": "unknown.user@medai.org",
        "password": "Research@123"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_auth_me_with_valid_token():
    """Verify /api/auth/me returns current user when presented with a valid bearer token."""
    # First login to obtain token
    login_res = client.post("/api/auth/login", json={
        "email": "researcher@medai.org",
        "password": "Research@123"
    })
    token = login_res.json()["access_token"]

    # Call /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["email"] == "researcher@medai.org"
    assert user["role"] == "Lead NLP Researcher"


def test_auth_me_invalid_token():
    """Verify /api/auth/me rejects invalid bearer token."""
    headers = {"Authorization": "Bearer invalid.fake.token"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401


def test_auth_me_missing_header():
    """Verify /api/auth/me rejects request missing authorization header."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
