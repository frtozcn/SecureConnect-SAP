import { useState } from 'react';

export default function SAPUserPassword({ userId, token }) { // token prop'unu ekledik
  const [password, setPassword] = useState('********');
  const [isMasked, setIsMasked] = useState(true);
  const [timer, setTimer] = useState(null);

  const handleReveal = async () => {
    try {
      const response = await fetch(`http://localhost:8000/sap-users/${userId}/reveal-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // Token'ı gönderiyoruz
        }
      });

      if (!response.ok) {
        // Backend'den gelen GERÇEK hata mesajını yakalıyoruz
        const errorData = await response.json();
        alert(`Backend Hatası: ${errorData.detail || "Bilinmeyen hata"}`);
        return;
      }

      const data = await response.json();
      setPassword(data.password);
      setIsMasked(false);

      if (timer) clearTimeout(timer);

      const newTimer = setTimeout(() => {
        setPassword('********');
        setIsMasked(true);
      }, 15000);
      
      setTimer(newTimer);

    } catch (error) {
      console.error("Şifre çekilemedi:", error);
    }
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(`http://localhost:8000/sap-users/${userId}/copy-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // Token'ı gönderiyoruz
        }
      });

      if (!response.ok) {
        // Backend'den gelen GERÇEK hata mesajını yakalıyoruz
        const errorData = await response.json();
        alert(`Backend Hatası: ${errorData.detail || "Bilinmeyen hata"}`);
        return;
      }

      const data = await response.json();
      await navigator.clipboard.writeText(data.password);
      alert("Şifre başarıyla panoya kopyalandı!");
    } catch (error) {
      console.error("Kopyalama hatası:", error);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', maxWidth: '300px', marginTop: '20px' }}>
      <h3>SAP Kullanıcı Şifresi</h3>
      <div style={{ fontSize: '24px', letterSpacing: isMasked ? '5px' : 'normal', margin: '15px 0' }}>
        {password}
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleReveal} disabled={!isMasked} style={{ padding: '8px', cursor: isMasked ? 'pointer' : 'not-allowed' }}>
          {isMasked ? "Göster" : "Gizleniyor..."}
        </button>
        <button onClick={handleCopy} style={{ padding: '8px', cursor: 'pointer' }}>
          Kopyala
        </button>
      </div>
    </div>
  );
}