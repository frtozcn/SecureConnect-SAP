import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Docker-compose dosyamızda verdiğimiz veritabanı URL'sini alır
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://secureconnect_user:supersecretpassword@localhost:5432/secureconnect_db")

# Veritabanı motorunu (engine) oluşturur
engine = create_engine(DATABASE_URL)

# Veritabanında işlem (sorgu) yapabilmek için bir oturum (session) fabrikası kurar
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tablolarımızın miras alacağı ana sınıf
Base = declarative_base()