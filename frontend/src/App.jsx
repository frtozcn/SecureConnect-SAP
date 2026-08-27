import { useState } from 'react';
import './App.css';
import AdminDashboard from './components/AdminDashboard.jsx';

// ---------------------------------------------------------------------------
// TASARIM SİSTEMİ (SAP Fiori referanslı, sadece görsel amaçlı sabitler)
// ---------------------------------------------------------------------------
const theme = {
  shell: '#1d2d3e',
  shellAccent: '#0a6ed1',
  primary: '#0a6ed1',
  primaryHover: '#085caf',
  bg: '#eef1f4',
  surface: '#ffffff',
  border: '#d9d9d9',
  borderLight: '#eaecee',
  textPrimary: '#32363a',
  textSecondary: '#6a6d70',
  negative: '#bb0000',
  negativeBg: 'rgba(187,0,0,0.12)',
  positive: '#107e3e',
  positiveBg: 'rgba(16,126,62,0.12)',
  font: "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
};

const styles = {
  loginPage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: theme.bg,
    backgroundImage: `linear-gradient(180deg, ${theme.shell} 0%, ${theme.shell} 220px, ${theme.bg} 220px)`,
    fontFamily: theme.font,
  },
  loginCard: {
    width: '380px',
    backgroundColor: theme.surface,
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    overflow: 'hidden',
  },
  loginCardTopBar: {
    height: '4px',
    backgroundColor: theme.shellAccent,
  },
  loginCardBody: {
    padding: '36px 36px 30px 36px',
  },
  loginBrandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  loginBrandIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    backgroundColor: theme.shell,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '16px',
    flexShrink: 0,
  },
  loginTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: theme.textPrimary,
  },
  loginSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '12.5px',
    color: theme.textSecondary,
  },
  fieldGroup: {
    marginBottom: '18px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: 600,
    color: theme.textSecondary,
    marginBottom: '6px',
  },
  fieldInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    boxSizing: 'border-box',
    color: theme.textPrimary,
    backgroundColor: '#fbfbfb',
    fontFamily: theme.font,
  },
  loginButton: {
    width: '100%',
    padding: '11px',
    marginTop: '6px',
    backgroundColor: theme.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14.5px',
    letterSpacing: '0.2px',
  },
  loginError: {
    marginTop: '16px',
    padding: '10px 12px',
    backgroundColor: theme.negativeBg,
    color: theme.negative,
    borderRadius: '4px',
    fontSize: '13px',
    textAlign: 'center',
  },
  shellBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: '56px',
    backgroundColor: theme.shell,
    color: '#fff',
    fontFamily: theme.font,
  },
  shellLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  shellIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    flexShrink: 0,
  },
  shellTitle: {
    margin: 0,
    fontSize: '15.5px',
    fontWeight: 600,
    letterSpacing: '0.2px',
  },
  shellRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  roleBadge: (isAdmin) => ({
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    backgroundColor: isAdmin ? theme.negativeBg : theme.positiveBg,
    color: isAdmin ? '#ff8a8a' : '#7be0a6',
    padding: '5px 10px',
    borderRadius: '4px',
  }),
  logoutButton: {
    padding: '7px 14px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
};

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
      
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const role = payload.role || (username.includes('admin') ? 'admin' : 'danisman'); 

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

  if (!token) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.loginCardTopBar} />
          <div style={styles.loginCardBody}>
            <div style={styles.loginBrandRow}>
              <div style={styles.loginBrandIcon}>SAP</div>
              <div>
                <h2 style={styles.loginTitle}>Sisteme Giriş</h2>
                <p style={styles.loginSubtitle}>SecureConnect - SAP Şifre Yönetim Platformu</p>
              </div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel} htmlFor="login-username">Kullanıcı Adı</label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="E-posta veya kullanıcı adı"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.fieldInput}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel} htmlFor="login-password">Şifre</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.fieldInput}
                />
              </div>
              <button type="submit" style={styles.loginButton}>
                Giriş Yap
              </button>
            </form>
            {error && <p style={styles.loginError}>{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // YÖNLENDİRME ARTIK SADECE ADMİNDASHBOARD'A (Prop olarak userRole gidiyor)
  return (
    <div style={{ fontFamily: theme.font, backgroundColor: theme.bg, minHeight: '100vh' }}>
      <div style={styles.shellBar}>
        <div style={styles.shellLeft}>
          <div style={styles.shellIcon}>SAP</div>
          <h3 style={styles.shellTitle}>SecureConnect - SAP Şifre Yönetim Platformu</h3>
        </div>
        <div style={styles.shellRight}>
          <span style={styles.roleBadge(userRole === 'admin')}>
            Yetki: {userRole.toUpperCase()}
          </span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Çıkış Yap
          </button>
        </div>
      </div>

      <AdminDashboard token={token} userRole={userRole} />
    </div>
  );
}

export default App;