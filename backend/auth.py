from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import models
from database import SessionLocal

# Güvenlik Ayarları (Gerçek projede .env dosyasında tutulur)
SECRET_KEY = "cok-gizli-super-imza-anahtari"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Şifre doğrulama aracı
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Swagger UI'da "Authorize" butonu çıkmasını sağlayan araç
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    """Kullanıcının girdiği şifre ile veritabanındaki hash'lenmiş şifreyi karşılaştırır"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    """Kullanıcıya özel süreli JWT (VIP Bileklik) üretir"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """API'ye gelen isteklerdeki token'ı okur ve hangi kullanıcı olduğunu bulur"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik dogrulanamadi veya suresi doldu.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(models.PlatformUser).filter(models.PlatformUser.email == email).first()
    if user is None:
        raise credentials_exception
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: models.PlatformUser = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Bu islem icin yetkiniz yok. Gerekli roller: {', '.join(self.allowed_roles)}"
            )
        return user