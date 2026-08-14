# SecureConnect - Analiz ve Tasarım Dokümanı (Gün 1)

## 1. Teknoloji Önerisi ve Altyapı Planı

Projenin gereksinimlerini, güvenlik standartlarını ve yönergelerde belirtilen teknik rotayı dikkate alarak oluşturduğum teknoloji yığını ve altyapı önerim aşağıda detaylandırılmıştır.

### 1.1 Teknoloji Yığını (Stack) Seçimi

*   **Backend (Python / FastAPI):** Ekipte yaygın kullanılması ana tercih sebebidir. Bunun yanında, projede istenen yapay zekâ asistanı katmanının geliştirilmesinde, Python'un sunduğu geniş LLM ve veri işleme ekosistemi büyük avantaj sağlayacaktır.
*   **Frontend (React + TypeScript + Vite + Tailwind CSS):** Kurumsal SAP uygulamaları geliştirmek için standart çatılar olsa da, bu projedeki 15 saniyelik şifre maskeleme sayacı, dinamik bağlantı sihirbazı ve AI sohbet paneli gibi özel UI/UX gereksinimleri, React'in esnek state ve component mimarisini zorunlu kılmaktadır.
*   **Veritabanı (PostgreSQL + SQLAlchemy):** Müşteri, SAP sistemleri ve kullanıcılar arasındaki karmaşık bire-çok ve polimorfik ilişkileri tutarlı bir şekilde yönetmek için sağlam bir ilişkisel veritabanı kullanılacaktır. SQLAlchemy ORM ile SQL injection riskleri sıfıra indirilecektir.

### 1.2 Sır Yönetimi (Vault)

Sıfır-güven (zero-trust) mimarisine uygun olarak, hiçbir şifre veritabanına plaintext yazılmayacaktır. Bu amaçla **HashiCorp Vault** kullanılacaktır. 
*   Şifre rotasyonunda geçmişin kaybolmaması için **KV secrets engine v2** aktif edilecektir.
*   Backend servisimiz Vault'a resmi `hvac` istemcisi ile erişecektir.

### 1.3 Altyapı ve Konteynerizasyon

Sistemin donanım bağımsız çalışabilmesi ve final demosunun sorunsuz geçmesi için **Docker Compose** kullanılacaktır. `docker-compose.yml` dosyası sayesinde; backend (`app`), veritabanı (`db`) ve kasa (`vault`) servisleri birbirlerine aynı sanal ağ üzerinden bağlanacak ve tek bir `docker-compose up` komutu ile çalışır hale gelecektir.

### 1.4 Veri Yükleme (Seed Script)

Dummy müşteri ve sistem verilerinin manuel girilmesini önlemek amacıyla bir otomasyon betiği hazırlanacaktır. `make seed` komutu çalıştırıldığında; betik öncelikle şifreleri güvenli bir şekilde Vault'a yazacak, Vault'tan dönen referans yollarını (`vault_secret_path`) ve diğer yapısal müşteri verilerini ise PostgreSQL veritabanına yükleyecektir.

---

## 2. Veri Modeli (ER Diyagramı)

Aşağıdaki diyagram, uygulamanın PostgreSQL veritabanı mimarisini göstermektedir. Şifreler veritabanında tutulmamakta, Vault path referansları olarak (`vault_secret_path`) ilişkilendirilmektedir.

```mermaid
erDiagram
    PlatformUser ||--o{ Assignment : "has"
    Customer ||--o{ Assignment : "has"
    
    Customer ||--o| VpnProfile : "has"
    Customer ||--o{ SapSystem : "owns"
    
    SapSystem ||--o{ SapClient : "contains"
    SapClient ||--o{ SapUser : "contains (1:N)"
    
    PlatformUser ||--o{ AuditLog : "performs"
    PlatformUser ||--o{ Comment : "writes"

    PlatformUser {
        uuid id PK
        string email UK
        string password_hash "bcrypt/argon2"
        string role "Admin, Lead, Consultant"
        timestamp created_at
    }

    Customer {
        uuid id PK
        string name "e.g. Anadolu Kimya"
        string sector
        text password_policy_note
        text description
        timestamp created_at
    }

    Assignment {
        uuid id PK
        uuid user_id FK "PlatformUser.id"
        uuid customer_id FK "Customer.id"
        timestamp created_at
    }

    VpnProfile {
        uuid id PK
        uuid customer_id FK "Customer.id"
        string vpn_type "FortiClient, OpenVPN, vb."
        string gateway_address
        string vault_secret_path "Vault Reference"
        string config_file_url
        text instructions
        text description
        timestamp created_at
    }

    SapSystem {
        uuid id PK
        uuid customer_id FK "Customer.id"
        string sid "3-char code"
        string environment "DEV, QAS, PRD"
        string system_type "ECC, S/4HANA"
        string app_server "IP/Hostname"
        string instance_number "2-digit"
        string sap_router "Optional"
        text description
        timestamp created_at
    }

    SapClient {
        uuid id PK
        uuid system_id FK "SapSystem.id"
        string client_number "3-digit (e.g. 100)"
        text description
        timestamp created_at
    }

    SapUser {
        uuid id PK
        uuid client_id FK "SapClient.id"
        string username
        string user_type "Dialog, RFC, Support"
        string vault_secret_path "Vault Reference"
        text notes
        timestamp last_modified_date
        text description
        timestamp created_at
    }

    AuditLog {
        uuid id PK
        uuid user_id FK "PlatformUser.id"
        string action "LOGIN, READ_SECRET, vb."
        string target_resource
        string ip_address
        timestamp timestamp
    }

    Comment {
        uuid id PK
        uuid author_id FK "PlatformUser.id"
        string target_type "Polymorphic: Customer, SapSystem, vs."
        uuid target_id "Polymorphic ID"
        text content
        timestamp timestamp
    }