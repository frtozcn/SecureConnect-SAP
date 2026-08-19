import hvac
import os
from fastapi import HTTPException

# Gerçek projede bu bilgiler .env dosyasından çekilir (Örn: os.getenv("VAULT_URL"))
VAULT_URL = os.getenv("VAULT_URL", "http://vault:8200") # Vault container'ının adresi
VAULT_TOKEN = os.getenv("VAULT_TOKEN", "root_token")

def get_vault_client():
    client = hvac.Client(url=VAULT_URL, token=VAULT_TOKEN)
    if not client.is_authenticated():
        raise HTTPException(status_code=500, detail="Vault sunucusuna bağlanılamadı!")
    return client

def write_secret_to_vault(path: str, secret_data: dict):
    """Şifreyi Vault'un KV v2 motoruna yazar."""
    client = get_vault_client()
    try:
        # KV v2 için mount_point genelde 'secret' olur
        response = client.secrets.kv.v2.create_or_update_secret(
            path=path,
            secret=secret_data,
            mount_point='secret'
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vault'a yazılamadı: {str(e)}")

def read_secret_from_vault(path: str):
    """Şifreyi Vault'tan okur."""
    client = get_vault_client()
    try:
        response = client.secrets.kv.v2.read_secret_version(
            path=path,
            mount_point='secret'
        )
        return response['data']['data']
    except Exception as e:
        raise HTTPException(status_code=404, detail="Şifre Vault'ta bulunamadı.")