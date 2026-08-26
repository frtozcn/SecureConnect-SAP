import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base

class PlatformUser(Base):
    __tablename__ = "platform_users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(50)) # Admin, Lead, Consultant
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_customer_ids = Column(Text, default="")

class Customer(Base):
    __tablename__ = "customers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255))
    sector = Column(String(100))
    password_policy_note = Column(Text)
    description = Column(Text)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    vpn_profile = relationship("VpnProfile", back_populates="customer", uselist=False)
    sap_systems = relationship("SapSystem", back_populates="customer")

class VpnProfile(Base):
    __tablename__ = "vpn_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    vpn_type = Column(String(100))
    gateway_address = Column(String(255))
    vpn_username = Column(String, nullable=True)
    vpn_password = Column(String, nullable=True)
    vault_secret_path = Column(String(255)) # Şifre Vault'ta durur, burada sadece yolu var
    config_file_url = Column(String(255))
    instructions = Column(Text)
    description = Column(Text)
    comment = Column(Text)
    
    customer = relationship("Customer", back_populates="vpn_profile")

class SapSystem(Base):
    __tablename__ = "sap_systems"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    sid = Column(String(3))
    environment = Column(String(10)) # DEV, QAS, PRD
    system_type = Column(String(50)) # ECC, S/4HANA
    app_server = Column(String(255))
    instance_number = Column(String(2))
    sap_router = Column(String(255), nullable=True)
    description = Column(Text)
    comment = Column(Text)
    
    customer = relationship("Customer", back_populates="sap_systems")
    clients = relationship("SapClient", back_populates="system")

class SapClient(Base):
    __tablename__ = "sap_clients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    system_id = Column(UUID(as_uuid=True), ForeignKey("sap_systems.id"))
    client_number = Column(String(3))
    description = Column(Text)
    comment = Column(Text)
    
    system = relationship("SapSystem", back_populates="clients")
    users = relationship("SapUser", back_populates="client")

class SapUser(Base):
    __tablename__ = "sap_users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("sap_clients.id"))
    username = Column(String(50))
    user_type = Column(String(50)) # Dialog, RFC, Ortak
    vault_secret_path = Column(String(255)) # Şifre kasada durur
    notes = Column(Text)
    last_modified_date = Column(DateTime, default=datetime.utcnow)
    description = Column(Text)
    comment = Column(Text)
    
    client = relationship("SapClient", back_populates="users")

# Assignment (Danışman-Müşteri Eşleştirmesi) ve diğer tablolar (AuditLog, Comment)
class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("platform_users.id"))
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("platform_users.id"), nullable=True)
    user_email = Column(String(255))  # kullanıcı silinse bile iz kalsın diye ayrıca tutuyoruz
    action = Column(String(100))      # PASSWORD_VIEWED, PASSWORD_COPIED, LOGIN, ...
    resource_type = Column(String(50))   # "sap_user", "vpn_profile" vb.
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    ip_address = Column(String(45))      # IPv6 için 45 karakter yeter
    detail = Column(Text, nullable=True) # ŞİFRE ASLA BURAYA YAZILMAYACAK
    created_at = Column(DateTime, default=datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_type = Column(String(50))   # "customer", "vpn_profile", "sap_system", "sap_client", "sap_user"
    resource_id = Column(UUID(as_uuid=True))  # gerçek FK değil — polimorfik olduğu için tek tabloya bağlanamaz
    author_id = Column(UUID(as_uuid=True), ForeignKey("platform_users.id"))
    author_email = Column(String(255))   # yazan kullanıcı silinse bile isim kalsın
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)