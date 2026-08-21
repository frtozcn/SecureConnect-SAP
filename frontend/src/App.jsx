import { useState } from 'react';
import './App.css';
import SAPUserPassword from './components/SAPUserPassword.jsx';

function App() {
  // LocalStorage'da token varsa onu al, yoksa boş başlat
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('ayse.kaya@ndbs.example'); // Test için varsayılan
  const [password, setPassword] = useState('Ndbs_Test_123!');
  const [error, setError] = useState('');

  // Giriş Yapma Fonksiyonu
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // FastAPI form-urlencoded data bekler
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Backend'deki giriş (login/token) uç noktana istek at
      // EĞER uç noktan /login ise burayı değiştir
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        // Backend'den gelen asıl hatayı yakalayıp ekrana basalım ki ne olduğunu anlayalım
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Giriş başarısız oldu.');
      }

      const data = await response.json();
      setToken(data.access_token); // Token'ı state'e kaydet
      localStorage.setItem('token', data.access_token); // Sayfa yenilenirse kaybolmasın diye kaydet
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  // Test edeceğin SAP kullanıcısının ID'si
  const testUserId = "d9118d2e-7c1f-41f5-808a-8a01087648d9"; 

  // Eğer token yoksa GİRİŞ EKRANI göster
  if (!token) {
    return (
      <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
        <h2>Sisteme Giriş</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="E-posta veya Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '10px' }}
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px' }}
          />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            Giriş Yap
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    );
  }

  // Token varsa ANA EKRAN göster
  return (
    <div style={{ padding: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Frontend - Backend Bağlantı Testi</h1>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
          Çıkış Yap
        </button>
      </div>
      
      {/* Şifre bileşenimize token'ı aktarıyoruz */}
      <SAPUserPassword userId={testUserId} token={token} />
    </div>
  );
}

export default App;