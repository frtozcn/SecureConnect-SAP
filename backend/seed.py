import os
import csv
import hvac
import random
import string
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import engine, SessionLocal, Base
from models import PlatformUser, Customer, VpnProfile, SapSystem, SapClient, SapUser, Assignment
import re

# Şifre hash'leme ayarları
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_dummy_password(length=12):
    """Rastgele güvenli şifre üretici"""
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(chars) for _ in range(length))

def get_safe_path_name(name):
    # Türkçe karakter haritası
    tr_map = str.maketrans("çğıöşü", "cgiosu")
    
    # Önce küçük harfe çevir, sonra Türkçe karakterleri değiştir
    safe_name = name.lower().translate(tr_map)
    
    # Alfanümerik olmayanları alt çizgi yap
    safe_name = "".join(c if c.isalnum() else "_" for c in safe_name)
    
    # Yan yana oluşan birden fazla alt çizgiyi teke düşür ve baştaki/sondaki alt çizgileri temizle
    return re.sub(r'_+', '_', safe_name).strip("_")

def seed_data():
    print("Veri tohumlama (CSV'den okuma) basliyor...")

    # 1. Vault Bağlantısı
    vault_url = os.getenv("VAULT_URL", "http://vault:8200")
    vault_token = os.getenv("VAULT_TOKEN", "root_token")
    client = hvac.Client(url=vault_url, token=vault_token)
    
    if not client.is_authenticated():
        print("Vault baglantisi basarisiz!")
        return

    # Veritabanını temizle (Test aşamasında olduğumuz için her seed işleminde tabloları sıfırlıyoruz)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()

    try:
        customers_map = {} # name -> Customer nesnesi
        systems_map = {}   # sid -> SapSystem nesnesi
        clients_map = {}   # (sid, client_number) -> SapClient nesnesi
        users_map = {}     # email -> PlatformUser nesnesi

        # ---------------------------------------------------------
        # AŞAMA 1: PLATFORM KULLANICILARI
        # ---------------------------------------------------------
        print("Platform kullanicilari yukleniyor...")
        with open("seed_data/platform_users.csv", mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Kullanıcı için dummy şifre oluştur ve hash'le
                hashed_pw = pwd_context.hash("Ndbs_Test_123!")
                new_user = PlatformUser(
                    email=row["email"],
                    password_hash=hashed_pw,
                    role=row["role"]
                )
                db.add(new_user)
                users_map[row["email"]] = {"user": new_user, "assigned": row["assigned_customers"]}
        db.commit()

        # ---------------------------------------------------------
        # AŞAMA 2: MÜŞTERİLER VE VPN PROFİLLERİ
        # ---------------------------------------------------------
        print("Musteriler ve VPN profilleri yukleniyor...")
        with open("seed_data/customers_vpn.csv", mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Müşteriyi Oluştur
                customer = Customer(name=row["name"], sector=row["sector"])
                db.add(customer)
                db.flush() # ID'nin oluşması için veritabanına it, ama henüz commit etme
                customers_map[customer.name] = customer

                # Yönerge kuralı: Her müşteri için 2'şer dummy hesap üret
                vpn_secrets = {
                    "user_1": f"vpn_user1_{get_safe_path_name(customer.name)}",
                    "pass_1": generate_dummy_password(),
                    "user_2": f"vpn_user2_{get_safe_path_name(customer.name)}",
                    "pass_2": generate_dummy_password()
                }
                
                # Vault'a yaz
                vault_path = f"vpn/{get_safe_path_name(customer.name)}"
                client.secrets.kv.v2.create_or_update_secret(path=vault_path, secret=vpn_secrets)

                # VPN Profilini Oluştur
                vpn_profile = VpnProfile(
                    customer_id=customer.id,
                    vpn_type=row["vpn_type"],
                    gateway_address=row["vpn_gateway"],
                    vault_secret_path=vault_path
                )
                db.add(vpn_profile)
        db.commit()

        # ---------------------------------------------------------
        # AŞAMA 3: SAP SİSTEMLERİ VE CLIENT'LAR
        # ---------------------------------------------------------
        print("SAP Sistemleri ve Client'lari yukleniyor...")
        with open("seed_data/sap_systems.csv", mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cust_name = row["customer_name"]
                if cust_name not in customers_map:
                    continue
                
                customer_id = customers_map[cust_name].id
                
                # Sistemi Oluştur
                sap_sys = SapSystem(
                    customer_id=customer_id,
                    sid=row["sid"],
                    environment=row["environment"],
                    system_type=row["system_type"],
                    app_server=row["app_server"],
                    instance_number=row["instance_number"]
                )
                db.add(sap_sys)
                db.flush()
                systems_map[sap_sys.sid] = sap_sys

                # CSV'deki "100,200" gibi client'ları virgül ile ayırıp tek tek oluştur
                client_numbers = [c.strip() for c in row["clients"].split(",")]
                for c_num in client_numbers:
                    sap_client = SapClient(system_id=sap_sys.id, client_number=c_num)
                    db.add(sap_client)
                    db.flush()
                    clients_map[(sap_sys.sid, c_num)] = sap_client
        db.commit()

        # ---------------------------------------------------------
        # AŞAMA 4: SAP KULLANICILARI VE VAULT ŞİFRELERİ
        # ---------------------------------------------------------
        print("SAP Kullanicilari yukleniyor...")
        
        # Yönerge kuralı: Her sistem-client kombinasyonu için en az 1 kullanıcı olacak şekilde seed'i tamamla
        # Önce CSV'de olanları ekleyelim, eklenen client'ların kaydını tutalım
        populated_clients = set()
        
        with open("seed_data/sap_users.csv", mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sid = row["system_sid"]
                c_num = row["client"]
                
                if (sid, c_num) in clients_map:
                    sap_client = clients_map[(sid, c_num)]
                    populated_clients.add((sid, c_num))
                    
                    vault_path = f"sap/{sid.lower()}/{c_num}/{row['username'].lower()}"
                    client.secrets.kv.v2.create_or_update_secret(
                        path=vault_path, 
                        secret={"password": generate_dummy_password()}
                    )
                    
                    db.add(SapUser(
                        client_id=sap_client.id,
                        username=row["username"],
                        user_type=row["user_type"],
                        notes=row["note"],
                        vault_secret_path=vault_path
                    ))
        
        # CSV'de olmayan ama "en az 1 kullanıcı" kuralı gereği boş kalan client'lara otomatik kullanıcı atama
        for (sid, c_num), sap_client in clients_map.items():
            if (sid, c_num) not in populated_clients:
                vault_path = f"sap/{sid.lower()}/{c_num}/default_admin"
                client.secrets.kv.v2.create_or_update_secret(
                    path=vault_path, 
                    secret={"password": generate_dummy_password()}
                )
                db.add(SapUser(
                    client_id=sap_client.id,
                    username="DEFAULT_ADMIN",
                    user_type="Dialog",
                    notes="Otomatik uretilmis yedek kullanici.",
                    vault_secret_path=vault_path
                ))
        db.commit()

        # ---------------------------------------------------------
        # AŞAMA 5: YETKİLENDİRME (ASSIGNMENTS)
        # ---------------------------------------------------------
        print("Kullanici yetkilendirmeleri ayarlaniyor...")
        for email, data in users_map.items():
            user = data["user"]
            assigned_str = data["assigned"]
            
            if assigned_str.lower() == "tümü":
                # Admin ve Lead için tüm müşterileri ata
                for cust_name, customer in customers_map.items():
                    db.add(Assignment(user_id=user.id, customer_id=customer.id))
            else:
                # Danışmanlar için sadece CSV'de virgülle ayrılmış müşterileri ata
                assigned_list = [c.strip() for c in assigned_str.split(",")]
                for cust_name in assigned_list:
                    if cust_name in customers_map:
                        db.add(Assignment(user_id=user.id, customer_id=customers_map[cust_name].id))
        db.commit()

        print("Muhtesem! Tum veriler CSV'den okunarak Vault ve PostgreSQL'e islendi.")

    except Exception as e:
        print(f"Hata olustu: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()