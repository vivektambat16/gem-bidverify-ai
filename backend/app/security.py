"""Password hashing, JWT tokens and one-time passwords (standard library + PyJWT)."""
import base64
import hashlib
import hmac
import secrets
import time

import jwt

from . import config

_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        _ITERATIONS, base64.b64encode(salt).decode(), base64.b64encode(digest).decode()
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt_b64, digest_b64 = stored.split("$")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iterations))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_token(user: dict) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user["id"]),
        "username": user["username"],
        "role": user.get("role", "Procurement Officer"),
        "iat": now,
        "exp": now + config.TOKEN_TTL_HOURS * 3600,
    }
    return jwt.encode(payload, config.SECRET_KEY, algorithm="HS256")



def decode_token(token: str) -> dict:
    """Return the token payload or raise jwt.InvalidTokenError."""
    return jwt.decode(token, config.SECRET_KEY, algorithms=["HS256"])


def generate_otp() -> str:
    return str(100000 + secrets.randbelow(900000))


def hash_otp(otp: str) -> str:
    return hmac.new(config.SECRET_KEY.encode(), otp.encode(), hashlib.sha256).hexdigest()


def mask_email(email: str) -> str:
    if "@" not in email:
        return email
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        return f"{local}*@{domain}"
    return local[:2] + "*" * max(2, len(local) - 3) + local[-1] + "@" + domain
