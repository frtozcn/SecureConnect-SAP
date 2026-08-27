# SecureConnect - Kurumsal SAP Şifre Yönetim Platformu

Bu proje, SAP sistemlerindeki teknik ve diyalog kullanıcılarına ait kritik şifreleri HashiCorp Vault üzerinde şifrelenmiş olarak saklayan ve yöneten tam yığın (full-stack) bir web uygulamasıdır. Danışmanlar ve yöneticiler için rol bazlı erişim kontrolü sunarak, kurumların parola güvenlik politikalarını modernize etmeyi hedefler.

## 🚀 Teknolojiler ve Mimari
* **Frontend:** React, Vite
* **Backend:** FastAPI (Python), SQLAlchemy
* **Veritabanı:** PostgreSQL
* **Sır Yönetimi (Secret Management):** HashiCorp Vault (KV v2)
* **Konteynerizasyon:** Docker Compose

## 📋 Gereksinimler
Sistemi sorunsuz bir şekilde ayağa kaldırmak için bilgisayarınızda aşağıdakilerin kurulu olması gerekmektedir:
* Docker Desktop (Windows ortamı için WSL2 entegrasyonu aktif edilmelidir)
* Node.js (v18 veya üzeri)
* WSL (Windows Subsystem for Linux) - Sadece Windows kullanıcıları için.

## ⚡ Hızlı Kurulum (Windows)
Windows ortamında tüm sistemi (konteynerlerin temizlenmesi, başlatılması, veritabanı tohumlaması ve arayüzün ayağa kaldırılması) tek adımda otomatize eden bir VBScript hazırlanmıştır.

1. Proje ana dizininde bulunan `SecureConnect-SAP.vbs` dosyasına çift tıklayın.
2. Açılan terminal ekranında arka planda şu işlemler sırasıyla gerçekleşecektir:
   * Eski konteynerler temizlenir (`docker compose down`).
   * Veritabanı, Vault ve API ayağa kalkar (`docker compose up -d`).
   * 5 saniyelik senkronizasyon beklemesinin ardından test verileri kasaya yazılır (`seed.py`).
   * React arayüzü başlatılır (`npm run dev`).
3. İşlem tamamlandığında tarayıcınızdan terminalde gözüken localhost adresine (Örn: http://localhost:5173) giderek platforma erişebilirsiniz.

## 🛠️ Manuel Kurulum (Linux / macOS)
VBScript kullanmak istemiyorsanız veya farklı bir işletim sistemindeyseniz aşağıdaki adımları terminalinizde sırasıyla çalıştırın:

**1. Altyapıyı Başlatın:**
```bash
cd backend
docker compose down
docker compose up -d

**2. Test Verilerini Yükleyin:**
docker compose exec backend python seed.py

**3. Frontendi Çalıştırın:**
cd ../frontend
npm run dev

**🔑 Giriş Bilgileri: Veri tohumlama aşamasında oluşturulan test kullanıcılarının e-posta adresleri backend/seed_data/platform_users.csv dosyasında yer almaktadır. 
**Tüm test kullanıcıları için varsayılan şifre: "Ndbs_Test_123!" olarak belirlenmiştir.

## ⚠️ Yönetici / Entegratör Notu (Gerçek Veritabanına Geçiş)
Sistem şu anda yerel geliştirme (mock) veritabanı ile çalışacak şekilde yapılandırılmıştır. Bu sebeple `SecureConnect-SAP.vbs` dosyası, her çalıştırıldığında çakışmaları önlemek adına konteynerleri sıfırlar (`down`) ve örnek test verilerini kasaya yeniden yükler (`seed.py`).

Şirketin **gerçek/kalıcı veritabanına** entegrasyon sağlandığında, `SecureConnect-SAP.vbs` dosyasındaki bu sıfırlama ve tohumlama komutları **mutlaka silinmelidir**.

Canlı ortamda `SecureConnect-SAP.vbs` dosyasından çıkartılacak komutlar (dosya içinde yorum satırıyla da işaretlenmiştir):
* `docker compose down && `
* `docker compose exec -T backend python seed.py && `

Geçiş yapıldıktan sonra seed.py dosyası kullanılmamalı ve sistem sadece `docker compose up -d` komutuyla, mevcut verileri koruyarak başlatılmalıdır.