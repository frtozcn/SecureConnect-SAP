from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

# Ortak özellikler (Müşteri oluştururken ve okurken ortak olanlar)
class CustomerBase(BaseModel):
    name: str
    sector: Optional[str] = None
    password_policy_note: Optional[str] = None
    description: Optional[str] = None

# Yeni müşteri oluştururken dışarıdan istenecek veri formatı
class CustomerCreate(CustomerBase):
    pass

# Veritabanından veriyi okuyup dışarıya yollarken kullanılacak format
class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Mevcut müşteriyi güncellerken kullanılacak veri formatı
class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    password_policy_note: Optional[str] = None
    description: Optional[str] = None