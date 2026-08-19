from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

# ==========================================
# 1. MÜŞTERİLER
# ==========================================
class CustomerBase(BaseModel):
    name: str
    sector: Optional[str] = None
    password_policy_note: Optional[str] = None
    description: Optional[str] = None
    comment: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    password_policy_note: Optional[str] = None
    description: Optional[str] = None
    comment: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# 2. VPN PROFİLLERİ
# ==========================================
class VpnProfileBase(BaseModel):
    vpn_type: Optional[str] = None # OpenVPN, IPsec vb.
    vpn_address: Optional[str] = None
    description: Optional[str] = None
    comment: Optional[str] = None

class VpnProfileCreate(VpnProfileBase):
    customer_id: UUID

class VpnProfileUpdate(BaseModel):
    vpn_type: Optional[str] = None
    vpn_address: Optional[str] = None
    description: Optional[str] = None
    comment: Optional[str] = None

class VpnProfileResponse(VpnProfileBase):
    id: UUID
    customer_id: UUID

    class Config:
        from_attributes = True


# ==========================================
# 3. SAP SİSTEMLERİ
# ==========================================
class SapSystemBase(BaseModel):
    system_type: str # S/4HANA, ECC 6.0 vb.
    app_server: Optional[str] = None
    description: Optional[str] = None
    comment: Optional[str] = None

class SapSystemCreate(SapSystemBase):
    customer_id: UUID

class SapSystemUpdate(BaseModel):
    system_type: Optional[str] = None
    app_server: Optional[str] = None
    description: Optional[str] = None
    comment: Optional[str] = None

class SapSystemResponse(SapSystemBase):
    id: UUID
    customer_id: UUID

    class Config:
        from_attributes = True


# ==========================================
# 4. SAP CLIENT'LARI
# ==========================================
class SapClientBase(BaseModel):
    client_number: str # "100", "300", "400"
    description: Optional[str] = None
    comment: Optional[str] = None

class SapClientCreate(SapClientBase):
    system_id: UUID

class SapClientUpdate(BaseModel):
    client_number: Optional[str] = None
    description: Optional[str] = None
    comment: Optional[str] = None

class SapClientResponse(SapClientBase):
    id: UUID
    system_id: UUID

    class Config:
        from_attributes = True


# ==========================================
# 5. SAP KULLANICILARI (Vault Köprüsü İçerenler)
# ==========================================
class SapUserBase(BaseModel):
    username: str
    user_type: Optional[str] = "Dialog" # Dialog, RFC, Ortak
    description: Optional[str] = None
    comment: Optional[str] = None

class SapUserCreate(SapUserBase):
    client_id: UUID
    password: str # Formdan gelen ham şifre (Vault'a yazılacak, DB'ye gitmeyecek)

class SapUserUpdate(BaseModel):
    username: Optional[str] = None
    user_type: Optional[str] = None
    password: Optional[str] = None # Güncellenecekse yeni şifre
    description: Optional[str] = None
    comment: Optional[str] = None

class SapUserResponse(SapUserBase):
    id: UUID
    client_id: UUID
    vault_secret_path: Optional[str] = None
    last_modified_date: datetime

    class Config:
        from_attributes = True