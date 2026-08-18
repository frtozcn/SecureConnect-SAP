from fastapi import FastAPI, Depends, HTTPException
import hvac
import os
import models
import schemas
from database import SessionLocal, engine
from sqlalchemy.orm import Session
from uuid import UUID
from sqlalchemy.exc import IntegrityError
from fastapi.security import OAuth2PasswordRequestForm
import auth

app = FastAPI(title="SecureConnect API")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "SecureConnect Backend Ayakta!"}

@app.get("/vault-test")
def test_vault_connection():
    vault_url = os.getenv("VAULT_URL", "http://localhost:8200")
    vault_token = os.getenv("VAULT_TOKEN", "root_token")
    
    try:
        # Vault'a bağlan
        client = hvac.Client(url=vault_url, token=vault_token)
        
        if not client.is_authenticated():
            return {"status": "error", "message": "Vault kimlik doğrulaması başarısız."}

        # Test amaçlı basit bir secret yazıyoruz
        secret_data = {"password": "test_sifresi_123", "note": "Bu bir denemedir"}
        
        client.secrets.kv.v2.create_or_update_secret(
            path='test_secret',
            secret=secret_data,
        )

        # Yazdığımız secret'ı geri okuyoruz
        read_response = client.secrets.kv.v2.read_secret_version(path='test_secret')
        retrieved_data = read_response['data']['data']

        return {
            "status": "success",
            "message": "Vault ile iletişim başarılı!",
            "written_and_read_data": retrieved_data
        }
    except Exception as e:
            return {"status": "error", "message": str(e)}


# --- KİMLİK DOĞRULAMA (AUTH) ---

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Kullanıcıyı e-posta adresinden bul (Swagger form_data.username kullanır)
    user = db.query(models.PlatformUser).filter(models.PlatformUser.email == form_data.username).first()
    
    # 2. Kullanıcı yoksa veya şifre yanlışsa hata ver
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="E-posta veya sifre hatali.")
    
    # 3. Şifre doğruysa Token (Bileklik) üret ve gönder
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- CUSTOMER (MÜŞTERİ) CRUD İŞLEMLERİ ---

# 1. Tüm Müşterileri Getir (READ)
@app.get("/customers/", response_model=list[schemas.CustomerResponse])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.PlatformUser = Depends(auth.get_current_user)):
    user_role = current_user.role.lower()

    # Admin veya Uzman ise tüm müşterileri döndür
    if user_role in ["admin", "lead", "uzman"]:
        return db.query(models.Customer).offset(skip).limit(limit).all()
    
    # Danışman ise: Virgülle ayrılmış ID'leri split et
    # Örn: "uuid-1,uuid-2" -> ["uuid-1", "uuid-2"]
    if not current_user.assigned_customer_ids:
        return [] # Hiç atanmış müşterisi yoksa boş liste dön
    
    allowed_ids = [cid.strip() for cid in current_user.assigned_customer_ids.split(",") if cid.strip()]
    
    # Sadece bu ID'ye sahip müşterileri veritabanından çek
    customers = db.query(models.Customer).filter(models.Customer.id.in_(allowed_ids)).offset(skip).limit(limit).all()
    return customers

# 2. Yeni Müşteri Ekle (CREATE)
@app.post("/customers/", response_model=schemas.CustomerResponse)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db), current_user: models.PlatformUser = Depends(auth.RoleChecker(["admin", "uzman"]))):
    # Aynı isimde müşteri var mı kontrolü
    existing_customer = db.query(models.Customer).filter(models.Customer.name == customer.name).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Bu isimde bir musteri zaten kayitli.")
    
    new_customer = models.Customer(**customer.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@app.put("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(customer_id: UUID, customer_update: schemas.CustomerUpdate, db: Session = Depends(get_db), current_user: models.PlatformUser = Depends(auth.RoleChecker(["admin", "uzman"]))):
    # 1. Önce veritabanında bu ID'ye sahip bir müşteri var mı diye bak
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    
    if not db_customer:
        # Müşteri yoksa 404 Bulunamadı hatası ver
        raise HTTPException(status_code=404, detail="Musteri bulunamadi.")
    
    # 2. Sadece kullanıcının gönderdiği (doldurduğu) alanları al
    # exclude_unset=True -> "Gönderilmeyen (boş bırakılan) alanları yoksay" demektir.
    update_data = customer_update.model_dump(exclude_unset=True)
    
    # 3. Gönderilen verileri mevcut müşterinin üzerine yaz
    for key, value in update_data.items():
        setattr(db_customer, key, value)
    
    # 4. Değişiklikleri kaydet ve yeni halini dışarı gönder
    db.commit()
    db.refresh(db_customer)
    return db_customer
        
# 4. Müşteri Sil (DELETE)
@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: UUID, db: Session = Depends(get_db), current_user: models.PlatformUser = Depends(auth.RoleChecker(["admin"]))):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    
    if not db_customer:
        raise HTTPException(status_code=404, detail="Musteri bulunamadi.")
    
    try:
        db.delete(db_customer)
        db.commit()
        return {"status": "success", "message": f"{db_customer.name} basariyla silindi."}
    except IntegrityError:
        db.rollback() # İşlemi geri al ki veritabanı kilitlenmesin
        raise HTTPException(
            status_code=400, 
            detail="Bu musteriye bagli VPN, SAP sistemleri veya kullanici atamalari var! Once o kayitlari silmelisiniz."
        )

