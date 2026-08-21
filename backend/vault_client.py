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

def read_secret_history_from_vault(path: str, limit: int = 3) -> list:
    """
    Belirtilen yoldaki (path) şifrenin geçmiş versiyonlarını getirir.
    Silinmiş (destroyed) versiyonları atlar ve en yeniden eskiye doğru sıralar.
    """
    client = get_vault_client()
    try:
        # 1. Önce bu yolun metadata'sını okuyup kaç versiyon olduğunu öğreniyoruz
        metadata = client.secrets.kv.v2.read_secret_metadata(path=path)
        versions_info = metadata['data']['versions']
        
        # 2. Silinmemiş (aktif) versiyon numaralarını bir listeye alıyoruz
        active_versions = []
        for v_num, v_data in versions_info.items():
            if not v_data.get('destroyed') and not v_data.get('deletion_time'):
                active_versions.append(int(v_num))
        
        # 3. Numaraları en yeniden eskiye doğru (Büyükten küçüğe) sırala
        active_versions.sort(reverse=True)
        
        # 4. Sadece istenen limit (örneğin son 3) kadarını al
        top_versions = active_versions[:limit]
        
        # 5. Bu versiyonların içeriklerini (gerçek şifreleri) tek tek Vault'tan çek
        history = []
        for v in top_versions:
            secret = client.secrets.kv.v2.read_secret_version(path=path, version=v)
            password = secret['data']['data'].get('password')
            created_at = secret['data']['metadata']['created_time']
            
            history.append({
                "version": v,
                "password": password,
                "created_at": created_at
            })
            
        return history
    except Exception as e:
        raise Exception(f"Vault versiyon geçmişi okunamadı: {str(e)}")