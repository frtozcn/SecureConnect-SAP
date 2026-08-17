from fastapi import FastAPI
import hvac
import os

app = FastAPI(title="SecureConnect API")

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