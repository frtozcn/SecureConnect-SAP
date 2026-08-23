import { useState, useEffect } from 'react';
import './App.css';
import ConsultantDashboard from './components/ConsultantDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Giriş başarısız oldu.');
      }

      const data = await response.json();
      const accessToken = data.access_token;
      
      // JWT Token'ı parçalayıp içindeki rolü alıyoruz (Backend'in token'a role eklediğini varsayıyoruz)
      // Eğer backend token'a role eklemiyorsa, burada ekstra bir "GET /users/me" isteği atman gerekebilir.
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const role = payload.role || (username.includes('admin') ? 'admin' : 'danisman'); // Fallback mantığı

      setToken(accessToken);
      setUserRole(role);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('role', role);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserRole('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  // --- 1. GİRİŞ EKRANI ---
  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' }}>
        <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '350px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Sisteme Giriş</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="E-posta veya Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button type="submit" style={{ padding: '10px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Giriş Yap
            </button>
          </form>
          {error && <p style={{ color: '#dc3545', marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // --- 2. ANA YÖNLENDİRME (ROUTING) ---
  return (
    <div>
      {/* Ortak Üst Bilgi Çubuğu (Header) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 30px', backgroundColor: '#343a40', color: 'white', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>SAP Şifre Yönetim Platformu</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', backgroundColor: userRole === 'admin' ? '#dc3545' : '#28a745', padding: '4px 8px', borderRadius: '4px' }}>
            Yetki: {userRole.toUpperCase()}
          </span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}>
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Rol Kontrolü */}
      {userRole.toLowerCase() === 'admin' ? (
        <AdminDashboard token={token} />
      ) : (
        <ConsultantDashboard token={token} />
      )}
    </div>
  );
}

export default App;