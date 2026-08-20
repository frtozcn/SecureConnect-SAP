from fastapi import FastAPI, Depends, HTTPException, Request
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
from vault_client import write_secret_to_vault, read_secret_from_vault

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
    vault_url = os.getenv("VAULT_URL", "http://vault:8200")
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



# ==========================================
# SAP SYSTEM CRUD İŞLEMLERİ
# ==========================================

@app.post("/sap-systems/", response_model=schemas.SapSystemResponse)
def create_sap_system(
    system: schemas.SapSystemCreate, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="Yetkiniz yok.")
        
    db_system = models.SapSystem(**system.model_dump())
    db.add(db_system)
    db.commit()
    db.refresh(db_system)
    return db_system

@app.get("/sap-systems/", response_model=list[schemas.SapSystemResponse])
def get_sap_systems(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    user_role = current_user.role.lower()

    if user_role in ["admin", "lead", "uzman"]:
        return db.query(models.SapSystem).offset(skip).limit(limit).all()
    
    # Danışmansa, sadece sorumlu olduğu müşterilerin sistemlerini görsün
    if not current_user.assigned_customer_ids:
        return []
    
    allowed_ids = [cid.strip() for cid in current_user.assigned_customer_ids.split(",") if cid.strip()]
    return db.query(models.SapSystem).filter(models.SapSystem.customer_id.in_(allowed_ids)).offset(skip).limit(limit).all()

@app.put("/sap-systems/{system_id}", response_model=schemas.SapSystemResponse)
def update_sap_system(
    system_id: str,
    system_update: schemas.SapSystemUpdate, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    # 1. Yetki kontrolü (Admin veya Uzman yapabilir)
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="Sistem güncelleme yetkiniz yok.")
    
    # 2. İlgili kaydı veritabanında bul
    db_system = db.query(models.SapSystem).filter(models.SapSystem.id == system_id).first()
    if not db_system:
        raise HTTPException(status_code=404, detail="SAP Sistemi bulunamadı.")
    
    # 3. Gelen verilerdeki dolu alanları (None olmayanları) güncelle
    update_data = system_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_system, key, value)
        
    db.commit()
    db.refresh(db_system)
    return db_system

@app.delete("/sap-systems/{system_id}")
def delete_sap_system(
    system_id: str,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    # Sadece Admin silebilir (Ekstra güvenlik)
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Sadece Admin silme işlemi yapabilir.")
        
    db_system = db.query(models.SapSystem).filter(models.SapSystem.id == system_id).first()
    if not db_system:
        raise HTTPException(status_code=404, detail="SAP Sistemi bulunamadı.")
        
    db.delete(db_system)
    db.commit()
    return {"message": "SAP Sistemi başarıyla silindi."}


# ==========================================
# SAP CLIENT UÇ NOKTALARI
# ==========================================

@app.post("/sap-clients/", response_model=schemas.SapClientResponse)
def create_sap_client(
    client_data: schemas.SapClientCreate, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="Yetkiniz yok.")
        
    db_client = models.SapClient(**client_data.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@app.get("/sap-clients/", response_model=list[schemas.SapClientResponse])
def get_sap_clients(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    user_role = current_user.role.lower()

    if user_role in ["admin", "lead", "uzman"]:
        return db.query(models.SapClient).offset(skip).limit(limit).all()
    
    # Danışmansa, sadece sorumlu olduğu müşterilerin sistemlerini görsün
    if not current_user.assigned_customer_ids:
        return []
    
    allowed_ids = [cid.strip() for cid in current_user.assigned_customer_ids.split(",") if cid.strip()]
    return db.query(models.SapClient).join(models.SapSystem).filter(models.SapSystem.customer_id.in_(allowed_ids)).offset(skip).limit(limit).all()

@app.put("/sap-clients/{client_id}", response_model=schemas.SapClientResponse)
def update_sap_client(
    client_id: str,
    client_update: schemas.SapClientUpdate, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    # 1. Yetki kontrolü (Admin veya Uzman yapabilir)
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="Client güncelleme yetkiniz yok.")
    
    # 2. İlgili kaydı veritabanında bul
    db_client = db.query(models.SapClient).filter(models.SapClient.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="SAP Client bulunamadı.")
    
    # 3. Gelen verilerdeki dolu alanları (None olmayanları) güncelle
    update_data = client_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_client, key, value)
        
    db.commit()
    db.refresh(db_client)
    return db_client

@app.delete("/sap-clients/{client_id}")
def delete_sap_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    # Sadece Admin silebilir (Ekstra güvenlik)
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Sadece Admin silme işlemi yapabilir.")
        
    db_client = db.query(models.SapClient).filter(models.SapClient.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="SAP Client bulunamadı.")
        
    db.delete(db_client)
    db.commit()
    return {"message": "SAP Client başarıyla silindi."}

# ==========================================
# VPN PROFILE UÇ NOKTALARI
# ==========================================

@app.post("/vpn-profiles/", response_model=schemas.VpnProfileResponse)
def create_vpn_profile(
    vpn: schemas.VpnProfileCreate, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    # Sadece Admin ve Uzman (Lead) VPN profili oluşturabilir
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="Yetkiniz yok.")
    
    db_vpn = models.VpnProfile(**vpn.model_dump())
    db.add(db_vpn)
    db.commit()
    db.refresh(db_vpn)
    return db_vpn

@app.get("/vpn-profiles/", response_model=list[schemas.VpnProfileResponse])
def get_vpn_profiles(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    user_role = current_user.role.lower()

    if user_role in ["admin", "lead", "uzman"]:
        return db.query(models.VpnProfile).offset(skip).limit(limit).all()
    
    # Danışmansa, sadece sorumlu olduğu müşterilerin vpn'lerini görsün
    if not current_user.assigned_customer_ids:
        return []
    
    allowed_ids = [cid.strip() for cid in current_user.assigned_customer_ids.split(",") if cid.strip()]
    return db.query(models.VpnProfile).filter(models.VpnProfile.customer_id.in_(allowed_ids)).offset(skip).limit(limit).all()

@app.put("/vpn-profiles/{vpn_id}", response_model=schemas.VpnProfileResponse)
def update_vpn_profile(
    vpn_id: str,
    vpn_update: schemas.VpnProfileUpdate, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    # 1. Yetki kontrolü (Admin veya Uzman yapabilir)
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="VPN güncelleme yetkiniz yok.")
    
    # 2. İlgili kaydı veritabanında bul
    db_vpn = db.query(models.VpnProfile).filter(models.VpnProfile.id == vpn_id).first()
    if not db_vpn:
        raise HTTPException(status_code=404, detail="VPN bulunamadı.")
    
    # 3. Gelen verilerdeki dolu alanları (None olmayanları) güncelle
    update_data = vpn_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vpn, key, value)
        
    db.commit()
    db.refresh(db_vpn)
    return db_vpn

@app.delete("/vpn-profiles/{vpn_id}")
def delete_vpn_profile(
    vpn_id: str,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    # Sadece Admin silebilir (Ekstra güvenlik)
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Sadece Admin silme işlemi yapabilir.")
        
    db_vpn = db.query(models.VpnProfile).filter(models.VpnProfile.id == vpn_id).first()
    if not db_vpn:
        raise HTTPException(status_code=404, detail="VPN bulunamadı.")
        
    db.delete(db_vpn)
    db.commit()
    return {"message": "VPN başarıyla silindi."}

# ==========================================
# SAP USER (VAULT ENTEGRASYONLU) UÇ NOKTALARI
# ==========================================

@app.get("/sap-users/", response_model=list[schemas.SapUserResponse])
def get_sap_users(
    client_id: UUID | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    query = db.query(models.SapUser).join(models.SapClient).join(models.SapSystem)

    user_role = current_user.role.lower()
    if user_role not in ["admin", "lead", "uzman"]:
        allowed_ids = _get_allowed_customer_ids(current_user)
        if not allowed_ids:
            return []
        query = query.filter(models.SapSystem.customer_id.in_(allowed_ids))

    if client_id is not None:
        query = query.filter(models.SapUser.client_id == client_id)

    return query.offset(skip).limit(limit).all()

@app.post("/sap-users/", response_model=schemas.SapUserResponse)
def create_sap_user(
    user_data: schemas.SapUserCreate, 
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="Yetkiniz yok.")

    # 1. Veritabanına kaydedilecek kullanıcı nesnesini oluştur (Şifre HARİÇ!)
    db_user_data = user_data.model_dump(exclude={"password"})
    db_user = models.SapUser(**db_user_data)
    
    # 2. Önce DB'ye kaydedip ona bir ID (UUID) almamız lazım ki Vault yolunu oluşturalım
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 3. Vault için benzersiz bir yol (path) oluştur (Örn: sap_users/1234-5678-uuid)
    secret_path = f"sap_users/{str(db_user.id)}"

    # 4. Şifreyi Vault'a gönder
    write_secret_to_vault(path=secret_path, secret_data={"password": user_data.password})

    # 5. Vault yolunu DB'deki kullanıcıya kaydet
    db_user.vault_secret_path = secret_path
    db.commit()
    db.refresh(db_user)

    return db_user

# ==========================================
# SAP USER — ŞİFRE OKUMA AKIŞI (GÖSTER / KOPYALA)
# ==========================================

def _get_allowed_customer_ids(current_user: models.PlatformUser) -> list[str]:
    if not current_user.assigned_customer_ids:
        return []
    return [cid.strip() for cid in current_user.assigned_customer_ids.split(",") if cid.strip()]


def _get_sap_user_or_404(db: Session, user_id: str) -> models.SapUser:
    db_user = db.query(models.SapUser).filter(models.SapUser.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="SAP kullanıcısı bulunamadı.")
    return db_user


def _check_customer_access(db_user: models.SapUser, current_user: models.PlatformUser):
    """Danışman, sadece atandığı müşterinin SAP kullanıcısına erişebilir."""
    role = current_user.role.lower()
    if role in ["admin", "lead", "uzman"]:
        return
    customer_id = str(db_user.client.system.customer_id)
    if customer_id not in _get_allowed_customer_ids(current_user):
        raise HTTPException(status_code=403, detail="Bu kaydın müşterisine erişim yetkiniz yok.")


def _log_audit(db: Session, current_user: models.PlatformUser, action: str,
                resource_type: str, resource_id, request: Request, detail: str = None):
    log = models.AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=request.client.host if request.client else None,
        detail=detail,
    )
    db.add(log)
    db.commit()


@app.post("/sap-users/{user_id}/reveal-password", response_model=schemas.SapUserPasswordResponse)
def reveal_sap_user_password(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    """'Göster' butonu. Frontend 15 saniye açık tutup sonra maskeleyecek — süre UI tarafında."""
    db_user = _get_sap_user_or_404(db, user_id)
    _check_customer_access(db_user, current_user)

    # RFC/technical kullanıcı şifresi danışmana GÖSTERİLMEZ, sadece admin görebilir (F3)
    if db_user.user_type and db_user.user_type.lower() == "rfc" and current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=403,
            detail="RFC/technical kullanıcı şifresi sadece kopyalanabilir, görüntülenemez."
        )

    if not db_user.vault_secret_path:
        raise HTTPException(status_code=404, detail="Bu kullanıcı için Vault'ta kayıtlı şifre yok.")

    secret_data = read_secret_from_vault(path=db_user.vault_secret_path)
    password = secret_data.get("password")

    _log_audit(db, current_user, "PASSWORD_VIEWED", "sap_user", db_user.id, request)

    return {"password": password, "last_modified_date": db_user.last_modified_date}


@app.post("/sap-users/{user_id}/copy-password", response_model=schemas.SapUserPasswordResponse)
def copy_sap_user_password(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    """'Kopyala' butonu. RFC kullanıcı dahil herkes kopyalayabilir (F3) — frontend değeri ekranda göstermeden panoya yazacak."""
    db_user = _get_sap_user_or_404(db, user_id)
    _check_customer_access(db_user, current_user)

    if not db_user.vault_secret_path:
        raise HTTPException(status_code=404, detail="Bu kullanıcı için Vault'ta kayıtlı şifre yok.")

    secret_data = read_secret_from_vault(path=db_user.vault_secret_path)
    password = secret_data.get("password")

    _log_audit(db, current_user, "PASSWORD_COPIED", "sap_user", db_user.id, request)

    return {"password": password, "last_modified_date": db_user.last_modified_date}

# ==========================================
# YORUMLAR (Comment) — polimorfik, tarihçeli
# ==========================================

ALLOWED_RESOURCE_TYPES = {"customer", "vpn_profile", "sap_system", "sap_client", "sap_user"}

def _resolve_resource_customer_id(db: Session, resource_type: str, resource_id) -> str:
    """Yorumun hangi müşteriye ait olduğunu bulur — danışman yetki kontrolü için."""
    if resource_type == "customer":
        return str(resource_id)
    if resource_type == "vpn_profile":
        obj = db.query(models.VpnProfile).filter(models.VpnProfile.id == resource_id).first()
    elif resource_type == "sap_system":
        obj = db.query(models.SapSystem).filter(models.SapSystem.id == resource_id).first()
    elif resource_type == "sap_client":
        obj = db.query(models.SapClient).filter(models.SapClient.id == resource_id).first()
        return str(obj.system.customer_id) if obj else None
    elif resource_type == "sap_user":
        obj = db.query(models.SapUser).filter(models.SapUser.id == resource_id).first()
        return str(obj.client.system.customer_id) if obj else None
    else:
        return None
    return str(obj.customer_id) if obj else None


@app.post("/comments/", response_model=schemas.CommentResponse)
def create_comment(
    comment: schemas.CommentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    # Sadece Admin ve Lead yorum ekleyebilir (F2)
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="Yorum ekleme yetkiniz yok.")

    if comment.resource_type not in ALLOWED_RESOURCE_TYPES:
        raise HTTPException(status_code=400, detail="Geçersiz kayıt türü.")

    customer_id = _resolve_resource_customer_id(db, comment.resource_type, comment.resource_id)
    if customer_id is None:
        raise HTTPException(status_code=404, detail="İlgili kayıt bulunamadı.")

    db_comment = models.Comment(
        resource_type=comment.resource_type,
        resource_id=comment.resource_id,
        author_id=current_user.id,
        author_email=current_user.email,
        text=comment.text,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    _log_audit(db, current_user, "COMMENT_ADDED", comment.resource_type, comment.resource_id, request, detail=comment.text[:200])

    return db_comment


@app.get("/comments/", response_model=list[schemas.CommentResponse])
def get_comments(
    resource_type: str,
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    if resource_type not in ALLOWED_RESOURCE_TYPES:
        raise HTTPException(status_code=400, detail="Geçersiz kayıt türü.")

    role = current_user.role.lower()
    if role not in ["admin", "lead", "uzman"]:
        customer_id = _resolve_resource_customer_id(db, resource_type, resource_id)
        if customer_id not in _get_allowed_customer_ids(current_user):
            raise HTTPException(status_code=403, detail="Bu kaydın yorumlarına erişim yetkiniz yok.")

    return (
        db.query(models.Comment)
        .filter(models.Comment.resource_type == resource_type, models.Comment.resource_id == resource_id)
        .order_by(models.Comment.created_at.desc())
        .all()
    )


@app.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.PlatformUser = Depends(auth.get_current_user)
):
    if current_user.role.lower() not in ["admin", "lead", "uzman"]:
        raise HTTPException(status_code=403, detail="Yorum silme yetkiniz yok.")

    db_comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")

    _log_audit(db, current_user, "COMMENT_DELETED", db_comment.resource_type, db_comment.resource_id, request, detail=db_comment.text[:200])

    db.delete(db_comment)
    db.commit()
    return {"message": "Yorum silindi."}