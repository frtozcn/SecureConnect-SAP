import { useState, useEffect } from 'react';
 
// ---------------------------------------------------------------------------
// TASARIM SİSTEMİ (SAP Fiori referanslı, sadece görsel amaçlı sabitler)
// ---------------------------------------------------------------------------
const theme = {
  shell: '#1d2d3e',
  shellActive: '#0a6ed1',
  primary: '#0a6ed1',
  primaryHover: '#085caf',
  bg: '#eef1f4',
  surface: '#ffffff',
  border: '#d9d9d9',
  borderLight: '#e5e7e9',
  textPrimary: '#32363a',
  textSecondary: '#6a6d70',
  textMuted: '#89929a',
  negative: '#bb0000',
  negativeBg: 'rgba(187,0,0,0.10)',
  critical: '#e9730c',
  criticalBg: 'rgba(233,115,12,0.12)',
  positive: '#107e3e',
  positiveBg: 'rgba(16,126,62,0.12)',
  info: '#0a6ed1',
  infoBg: 'rgba(10,110,209,0.10)',
  font: "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
};
 
const s = {
  page: { display: 'flex', height: 'calc(100vh - 56px)', fontFamily: theme.font },
  nav: { width: '240px', backgroundColor: theme.shell, color: '#e8ebee', paddingTop: '16px', flexShrink: 0 },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '13px 20px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: active ? 600 : 400,
    color: active ? '#ffffff' : '#c3cbd4',
    backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
    borderLeft: active ? `3px solid ${theme.shellActive}` : '3px solid transparent',
  }),
  content: { flex: 1, padding: '28px 32px', overflowY: 'auto', backgroundColor: theme.bg, color: theme.textPrimary },
  container: { maxWidth: '1040px', margin: '0 auto' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' },
  pageTitle: { color: theme.textPrimary, margin: 0, fontSize: '20px', fontWeight: 600 },
  searchWrap: { position: 'relative', flex: 1, minWidth: '280px', maxWidth: '460px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: theme.textMuted, pointerEvents: 'none' },
  searchInput: {
    width: '100%',
    padding: '9px 14px 9px 34px',
    borderRadius: '4px',
    border: `1px solid ${theme.border}`,
    fontSize: '13.5px',
    boxSizing: 'border-box',
    backgroundColor: theme.surface,
    color: theme.textPrimary,
    fontFamily: theme.font,
  },
  btnPrimary: {
    padding: '9px 16px',
    backgroundColor: theme.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '13.5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnSecondary: {
    padding: '8px 16px',
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.textPrimary,
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '13px',
  },
  btnDanger: {
    padding: '8px 16px',
    backgroundColor: theme.negative,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnSuccess: {
    padding: '8px 16px',
    backgroundColor: theme.positive,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  customerCard: {
    border: `1px solid ${theme.border}`,
    marginBottom: '20px',
    borderRadius: '8px',
    backgroundColor: theme.surface,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  customerHeader: {
    backgroundColor: '#f7f8f9',
    padding: '14px 20px',
    borderBottom: `1px solid ${theme.borderLight}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px', display: 'flex', alignItems: 'center', color: theme.textSecondary },
  gearButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '21px', padding: '4px', display: 'flex', alignItems: 'center', color: theme.textSecondary, marginTop: '-6px' },
  customerName: { margin: '0 0 4px 0', color: theme.textPrimary, fontSize: '19px', fontWeight: 700, letterSpacing: '0.1px' },
  customerMeta: { fontSize: '12.5px', color: theme.textSecondary },
  vpnBadge: {
    marginLeft: '8px',
    backgroundColor: theme.criticalBg,
    color: theme.critical,
    padding: '2px 9px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '11.5px',
  },
  systemBlock: { borderLeft: `3px solid ${theme.primary}`, paddingLeft: '16px', marginBottom: '16px' },
  systemTitleRow: { margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' },
  sidText: { fontSize: '14.5px', fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' },
  typeBadge: { fontSize: '11px', backgroundColor: theme.infoBg, color: theme.info, padding: '2px 8px', borderRadius: '10px', fontWeight: 600 },
  envBadge: (color, bg) => ({ fontSize: '11px', backgroundColor: bg, color: color, padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }),
  clientBox: { border: `1px solid ${theme.borderLight}`, borderRadius: '6px', padding: '10px 12px', backgroundColor: '#fcfcfd' },
  clientLabel: { color: theme.textSecondary, display: 'block', borderBottom: `1px solid ${theme.borderLight}`, paddingBottom: '4px', marginBottom: '8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2px' },
  emptyState: { color: theme.textMuted, fontSize: '13.5px', fontStyle: 'italic' },
  emptyCard: { padding: '48px', textAlign: 'center', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` },
 
  credCard: { border: `1px solid ${theme.border}`, width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: theme.surface, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  credRow: { display: 'flex', borderBottom: `1px solid ${theme.borderLight}` },
  credCellUser: { flex: 1, borderRight: `1px solid ${theme.borderLight}`, display: 'flex', flexDirection: 'column' },
  credCellPass: { flex: 1, display: 'flex', flexDirection: 'column' },
  credCellLabel: { borderBottom: `1px solid ${theme.borderLight}`, padding: '3px', textAlign: 'center', fontSize: '10.5px', color: theme.info, fontWeight: 700, letterSpacing: '0.5px', backgroundColor: theme.infoBg },
  credUserValue: { padding: '6px 6px', textAlign: 'center', fontWeight: 700, fontSize: '13px', color: theme.textPrimary, fontFamily: 'monospace' },
  credPassRow: { padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  credCopyBtn: (copied) => ({
    padding: '6px',
    border: 'none',
    background: copied ? theme.positive : '#f4f5f6',
    color: copied ? 'white' : theme.textPrimary,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.5px',
    fontSize: '11px',
    transition: 'background-color 0.2s',
  }),
 
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,40,50,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: theme.surface, padding: '24px', borderRadius: '8px', width: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', fontFamily: theme.font },
  modalWide: { backgroundColor: theme.surface, padding: '22px', borderRadius: '8px', width: '520px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', fontFamily: theme.font },
  modalTitle: { marginTop: 0, marginBottom: '4px', paddingBottom: '14px', borderBottom: `1px solid ${theme.borderLight}`, color: theme.textPrimary, fontSize: '16px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalLabel: { fontSize: '12.5px', fontWeight: 600, color: theme.textSecondary },
  modalInput: { 
    width: '100%', 
    padding: '9px 10px', 
    marginTop: '6px', 
    border: `1px solid ${theme.border}`, 
    borderRadius: '4px', 
    boxSizing: 'border-box', 
    fontSize: '13.5px', 
    fontFamily: theme.font, 
    backgroundColor: '#1d2d3e', 
    color: '#ffffff'           
  },
  modalRow: { display: 'flex', justifyContent: 'space-between', marginTop: '22px' },
  paramRow: { display: 'flex', alignItems: 'center' },
  paramLabel: { width: '160px', fontSize: '13px', color: theme.textSecondary },
  paramInput: (editing) => ({
    flex: 1,
    padding: '7px 9px',
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    backgroundColor: editing ? '#fff' : '#f4f5f6',
    color: theme.textPrimary,
    fontSize: '13px',
    fontFamily: theme.font,
  }),
  paramInputSm: (editing) => ({
    width: '60px',
    padding: '7px 9px',
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    backgroundColor: editing ? '#fff' : '#f4f5f6',
    color: theme.textPrimary,
    fontSize: '13px',
    fontFamily: theme.font,
  }),
};
 
const EyeIcon = ({ open, color }) => (
  open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.8" />
      <line x1="3" y1="21" x2="21" y2="3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
);
 
// 1. KULLANICI KARTI BİLEŞENİ (isAdmin prop'u eklendi)
const UserCredentialCard = ({ user, token, handleUpdatePassword, handleDeleteUser, isAdmin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestHeaders = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // ⏱️ YENİ EKLENEN KISIM: 10 Saniye Sonra Otomatik Gizleme
  useEffect(() => {
    let timeoutId;
    // Eğer şifre görünür durumdaysa sayacı başlat
    if (showPassword) {
      timeoutId = setTimeout(() => {
        setShowPassword(false);
      }, 10000); // 10000 milisaniye = 10 saniye
    }
    // Component kapanırsa veya kullanıcı 10 saniye dolmadan göz ikonuna basıp kapatırsa sayacı temizle
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showPassword]);

  const handleToggleVisibility = async (e) => {
    e.preventDefault(); 
    if (!password) {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/sap-users/${user.id}/reveal-password`, {
          method: 'POST',
          headers: requestHeaders 
        });
        
        if (response.ok) {
          const data = await response.json();
          setPassword(data.password);
          setShowPassword(true);
        } else {
          alert("Vault'ta şifre bulunamadı veya bağlantı hatası!");
        }
      } catch (error) {
        console.error("Gösterme (Reveal) hatası:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowPassword(!showPassword);
    }
  };

  const handleCopyBoth = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8000/sap-users/${user.id}/copy-password`, {
        method: 'POST',
        headers: requestHeaders 
      });

      if (response.ok) {
        const data = await response.json();
        setPassword(data.password);
        const textToCopy = `${user.username}\n${data.password}`;
        navigator.clipboard.writeText(textToCopy);
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert("Şifre kopyalanamadı, Vault'ta kayıtlı olmayabilir.");
      }
    } catch (error) {
      console.error("Kopyalama (Copy) hatası:", error);
    }
  };
 
  return (
    <div style={s.credCard}>
      <div style={s.credRow}>
        <div style={s.credCellUser}>
          <div style={s.credCellLabel}>KULLANICI</div>
          
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {isAdmin && (
              <button 
                type="button"
                onClick={() => handleDeleteUser(user.id, user.username)}
                title="Kullanıcıyı Sil"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 10px', fontSize: '14px', color: theme.negative }}
              >
                🗑️
              </button>
            )}
            <div style={{ ...s.credUserValue, flex: 1, paddingLeft: isAdmin ? '0' : '10px' }}>{user.username}</div>
          </div>
          
        </div>
        <div style={s.credCellPass}>
          <div style={{ ...s.credCellLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', paddingLeft: '10px', paddingRight: '8px' }}>
            <span style={{ flex: 1, textAlign: 'center', paddingLeft: isAdmin ? '16px' : '0' }}>ŞİFRE</span>
            {isAdmin && (
              <button type="button" onClick={() => handleUpdatePassword(user.id)} title="Şifreyi Güncelle" style={{ ...s.iconButton, fontSize: '13px', padding: 0, color: theme.info }}>✏️</button>
            )}
          </div>
          <div style={s.credPassRow}>
            <span style={{ letterSpacing: showPassword ? 'normal' : '2px', fontSize: '14px', fontWeight: showPassword ? 500 : 700, fontFamily: 'monospace', color: theme.textPrimary }}>
              {isLoading ? '...' : (showPassword ? password : '••••••••')}
            </span>
            <button type="button" onClick={handleToggleVisibility} title={showPassword ? "Gizle" : "Göster"} style={{ ...s.iconButton, fontSize: '15px' }}>
              <EyeIcon open={showPassword} color={theme.textSecondary} />
            </button>
          </div>
        </div>
      </div>
      <button type="button" onClick={handleCopyBoth} style={s.credCopyBtn(copied)}>
        {copied ? 'KOPYALANDI ✓' : 'KOPYALA'}
      </button>
    </div>
  );
};
 
 
// 2. ANA BİLEŞEN
export default function AdminDashboard({ token, userRole }) {
  // Admin kontrolü (Prop üzerinden alıyoruz)
  const isAdmin = userRole?.toLowerCase() === 'admin';

  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVpnDetails, setSelectedVpnDetails] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editableCustomerData, setEditableCustomerData] = useState(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', sector: '', description: '' });
  
  const [isAddingSystem, setIsAddingSystem] = useState(false);
  const [selectedCustomerForSystem, setSelectedCustomerForSystem] = useState(null);
  
  // DÜZELTME: client_number eklendi, description kaldırıldı (system_type kullanıyoruz)
  const [newSystemData, setNewSystemData] = useState({
    sid: '', system_type: '', client_number: '', environment: 'PRD', app_server: '', instance_number: '00', sap_router: ''
  });

  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [activeNoteResource, setActiveNoteResource] = useState({ type: '', id: '', name: '' });
  const [notesList, setNotesList] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');


  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedSystemForUser, setSelectedSystemForUser] = useState(null); 
  
  const [newUserData, setNewUserData] = useState({ username: '', password: '', user_type: '' });
  const [selectedSystemDetails, setSelectedSystemDetails] = useState(null); 
  const [isEditingSystem, setIsEditingSystem] = useState(false); 
  const [editableSystemData, setEditableSystemData] = useState(null);


  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`"${username}" SAP kullanıcısını silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/sap-users/${userId}`, { method: 'DELETE', headers });
      if (res.ok) {
        alert("Kullanıcı başarıyla silindi.");
        fetchCustomers();
      } else {
        const errorData = await res.json();
        alert(`Silme başarısız oldu: ${errorData.detail || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error("Kullanıcı silme hatası:", error);
    }
  };


 
  const fetchNotes = async (type, id) => {
    try {
      const res = await fetch(`http://localhost:8000/comments/?resource_type=${type}&resource_id=${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotesList(data);
      }
    } catch (err) {
      console.error("Notlar çekilemedi:", err);
    }
  };

  const openNotesModal = (customer) => {
    setActiveNoteResource({ type: 'customer', id: customer.id, name: customer.name });
    setIsNotesModalOpen(true);
    fetchNotes('customer', customer.id);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/comments/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resource_type: activeNoteResource.type,
          resource_id: activeNoteResource.id,
          text: newNoteText
        })
      });
      if (res.ok) {
        setNewNoteText('');
        fetchNotes(activeNoteResource.type, activeNoteResource.id); 
      } else {
        const err = await res.json();
        alert(`Not eklenemedi: ${err.detail || 'Yetkiniz yok.'}`);
      }
    } catch (err) {
      console.error("Not ekleme hatası:", err);
    }
  };

  const handleDeleteNote = async (commentId) => {
    if (!confirm("Bu notu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`http://localhost:8000/comments/${commentId}`, { method: 'DELETE', headers });
      if (res.ok) {
        fetchNotes(activeNoteResource.type, activeNoteResource.id);
      } else {
        alert("Silme yetkiniz yok.");
      }
    } catch (err) {
      console.error("Not silme hatası:", err);
    }
  };

  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
 
  useEffect(() => {
    fetchCustomers();
    fetchAuditLogs();
  }, [token]);
 
  const getSystemColor = (type) => {
    switch(type) {
      case 'PRD': return theme.negative;
      case 'QAS': return theme.critical;
      case 'DEV': return theme.positive;
      default: return theme.textSecondary;
    }
  };
 
  const getSystemColorBg = (type) => {
    switch(type) {
      case 'PRD': return theme.negativeBg;
      case 'QAS': return theme.criticalBg;
      case 'DEV': return theme.positiveBg;
      default: return '#eef0f1';
    }
  };
 
  const fetchCustomers = async () => {
    try {
      const [custRes, sysRes, usrRes, vpnRes] = await Promise.all([
        fetch('http://localhost:8000/customers/', { headers }),
        fetch('http://localhost:8000/sap-systems/', { headers }),
        fetch('http://localhost:8000/sap-users/', { headers }),
        fetch('http://localhost:8000/vpn-profiles/', { headers })
      ]);
 
      // 🚨 OTURUM KONTROLÜ (401 YAKALAYICI) BURAYA EKLENİYOR 🚨
      if (custRes.status === 401 || sysRes.status === 401 || usrRes.status === 401) {
        alert("Oturum süreniz dolmuştur. Güvenliğiniz için lütfen tekrar giriş yapın.");
        
        // Varsa sizin projenizdeki çıkış yapma fonksiyonunu (handleLogout) çağırabilirsiniz.
        // Yoksa en temiz yöntem token'ı silip sayfayı yenilemektir:
        localStorage.removeItem('token'); 
        window.location.reload(); 
        return; // Fonksiyonun geri kalanını çalıştırma
      }

      if (custRes.ok && sysRes.ok && usrRes.ok) {
        const custData = await custRes.json();
        const sysData = await sysRes.json();
        const usrData = await usrRes.json();
        const vpnData = await (vpnRes.ok ? vpnRes.json() : []);
 
        const structuredData = custData.map(customer => {
          const vpn = vpnData.find ? vpnData.find(v => v.customer_id === customer.id) : null;
          
          const systems = sysData ? sysData.filter(s => s.customer_id === customer.id).map(sys => {
            const users = usrData ? usrData.filter(u => u.system_id === sys.id) : [];
            return { ...sys, users };
          }) : [];
          
          return { ...customer, vpn: vpn || null, systems: systems || [] };
        });
 
        setCustomers(structuredData);
      }
    } catch (error) {
      console.error("Müşteri fetch hatası:", error);
    }
  };
 
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('http://localhost:8000/audit-logs/?limit=50', { headers });
      
      // 🚨 OTURUM KONTROLÜ 🚨
      if (res.status === 401) {
        alert("Oturum süreniz dolmuştur. Lütfen tekrar giriş yapın.");
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Log fetch hatası:", error);
      setAuditLogs([]);
    } finally {
      setIsRefreshingLogs(false);
    }
  };
 
  const handleUpdatePassword = async (userId) => {
    const newPassword = prompt("Vault için YENİ şifreyi girin:");
    if(!newPassword) return;
    const reason = prompt("Değişiklik nedeni (Zorunlu):");
    if(!reason) return;
 
    const res = await fetch(`http://localhost:8000/sap-users/${userId}/update-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ new_password: newPassword, reason: reason })
    });
    
    if(res.ok) {
      alert("Şifre Vault'ta başarıyla güncellendi!");
      fetchAuditLogs();
    } else {
      alert("Şifre güncellenemedi.");
    }
  };
 
  const handleApplySystemChanges = async () => {
    try {
      const res = await fetch(`http://localhost:8000/sap-systems/${editableSystemData.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          sid: editableSystemData.sid,
          system_type: editableSystemData.system_type,
          environment: editableSystemData.environment,
          app_server: editableSystemData.app_server,
          instance_number: editableSystemData.instance_number || editableSystemData.inst_no,
          sap_router: editableSystemData.sap_router,
          description: editableSystemData.description
        })
      });
 
      if (res.ok) {
        alert("Sistem bilgileri başarıyla güncellendi!");
        setIsEditingSystem(false); 
        setSelectedSystemDetails(editableSystemData); 
        fetchCustomers(); 
      } else {
        const errorData = await res.json();
        alert(`Güncelleme başarısız oldu: ${errorData.detail || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error("Sistem güncelleme hatası:", error);
      alert("Bağlantı hatası oluştu.");
    }
  };

  const handleDeleteSystem = async () => {
    if (!confirm(`"${editableSystemData.sid}" sistemini silmek istediğinize emin misiniz?`)) return;
    
    try {
      const res = await fetch(`http://localhost:8000/sap-systems/${editableSystemData.id}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        alert("Sistem başarıyla silindi.");
        setSelectedSystemDetails(null); 
        fetchCustomers(); 
      } else {
        const errorData = await res.json();
        alert(`Silme başarısız oldu: ${errorData.detail || 'Sadece Admin silebilir.'}`);
      }
    } catch (error) {
      console.error("Sistem silme hatası:", error);
      alert("Bağlantı hatası oluştu.");
    }
  };
 
  const filteredCustomers = customers.map(customer => {
    if (!searchTerm.trim()) return customer;
    const keywords = searchTerm.toLowerCase().trim().split(/\s+/);

    const filteredSystems = (customer.systems || []).map(sys => {
      // 1. Sistemin kendi bilgilerini (Müşteri adı dahil) bir arama havuzunda topla
      let envExpanded = (sys.environment || '').toLowerCase();
      if (envExpanded === 'prd') envExpanded += ' canlı canli üretim uretim';
      else if (envExpanded === 'qas') envExpanded += ' qa test kalite';
      else if (envExpanded === 'dev') envExpanded += ' dev geliştirme gelistirme';

      const systemSearchPool = `
        ${customer.name || ''} 
        ${sys.sid || ''} ${sys.system_type || ''} ${envExpanded} 
        ${sys.client_number || ''}
      `.toLowerCase();

      // 2. Sistem (veya müşteri) aranan kelimelerin tamamını tek başına karşılıyor mu?
      const systemMatches = keywords.every(kw => systemSearchPool.includes(kw));

      // 3. Sistem eşleşmiyorsa, bari kullanıcıların içinde aranan kelimeyi karşılayan var mı diye bak
      const filteredUsers = (sys.users || []).filter(usr => {
        const userSearchPool = `${systemSearchPool} ${usr.username || ''} ${usr.user_type || ''}`.toLowerCase();
        return keywords.every(kw => userSearchPool.includes(kw));
      });

      return { 
        ...sys, 
        // Eğer sistem direkt eşleştiyse tüm kullanıcılarını göster, 
        // eşleşmediyse sadece aramayla eşleşen o spesifik kullanıcıları göster
        users: systemMatches ? sys.users : filteredUsers,
        
        // Sistemi ekranda tutma şartımız: Ya sistemin kendisi eşleşecek, ya da içinde eşleşen kullanıcı olacak!
        keepSystem: systemMatches || filteredUsers.length > 0
      };
    }).filter(sys => sys.keepSystem); // Artık "users.length > 0" yerine bu bayrağa bakıyoruz

    return { ...customer, systems: filteredSystems };
  }).filter(customer => {
    if (!searchTerm.trim()) return true;
    const keywords = searchTerm.toLowerCase().trim().split(/\s+/);
    // Müşteri adı eşleşiyorsa veya altında aramayla eşleşen en az 1 sistem varsa müşteriyi ekranda tut
    const customerMatches = keywords.every(kw => (customer.name || '').toLowerCase().includes(kw));
    return customerMatches || (customer.systems && customer.systems.length > 0);
  });
 
  const openSystemModal = (sys) => {
    setSelectedSystemDetails(sys);
    setEditableSystemData(sys);
    setIsEditingSystem(false);
  };
 
  return (
    <div style={s.page}>
      <div style={s.nav}>
        <div onClick={() => setActiveTab('customers')} style={s.navItem(activeTab === 'customers')}>
          <span>📁</span><span>Müşteri &amp; Sistem Kataloğu</span>
        </div>
        {isAdmin && (
        <div onClick={() => setActiveTab('audit')} style={s.navItem(activeTab === 'audit')}>
          <span>🛡️</span><span>Audit Log (Denetim İzi)</span>
        </div>
      )}
      </div>
      <div style={s.content}>
        {activeTab === 'customers' && (
          <div style={s.container}>
            
            <div style={s.toolbar}>
              <h2 style={s.pageTitle}>Müşteri Yönetimi</h2>
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Müşteri, SID, sistem veya kullanıcı ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={s.searchInput}
                />
              </div>
              {/* ADMİN KONTROLÜ: YENİ MÜŞTERİ BUTONU */}
              {isAdmin && (
                <button 
                  onClick={() => setIsAddingCustomer(true)} 
                  style={s.btnPrimary}
                >
                  + Yeni Müşteri
                </button>
              )}
            </div>
 
            {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
              <div key={c.id} style={s.customerCard}>
                <div style={s.customerHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* ADMİN KONTROLÜ: MÜŞTERİ AYAR İKONU */}
                    {isAdmin && (
                      <button 
                        onClick={() => { setEditingCustomer(c); setEditableCustomerData(c); }}
                        title="Müşteri Bilgilerini Düzenle / Sil"
                        style={s.gearButton}
                      >
                        ⚙️
                      </button>
                    )}
                    <div>
                      <h3 style={s.customerName}>{c.name}</h3>
                      <div style={s.customerMeta}>
                        <strong>Açıklama:</strong> {c.description || 'Belirtilmemiş'} &nbsp;·&nbsp; 
                        <strong>VPN:</strong> 
                        {c.vpn ? (
                          <span 
                            onClick={() => setSelectedVpnDetails(c.vpn)}
                            style={s.vpnBadge}
                            title="VPN Bilgilerini Görüntüle"
                          >
                            {c.vpn.vpn_type} 🔗
                          </span>
                        ) : (
                          <span style={{ marginLeft: '8px', color: theme.textMuted }}>Tanımsız</span>
                        )}
                        <span 
                          onClick={() => openNotesModal(c)}
                          style={{
                            marginLeft: '8px',
                            backgroundColor: '#fff3cd', 
                            color: '#856404',           
                            padding: '2px 9px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '11.5px',
                          }}
                          title="Müşteri Notlarını Gör / Ekle"
                        >
                          📝 Notlar
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* ADMİN KONTROLÜ: SİSTEM EKLE BUTONU */}
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setSelectedCustomerForSystem(c);
                        setIsAddingSystem(true);
                      }}
                      style={{ ...s.btnSecondary, padding: '6px 12px', fontSize: '12px', color: theme.primary, borderColor: theme.primary, display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Bu müşteriye yeni sistem ekle"
                    >
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>+</span> Sistem Ekle
                    </button>
                  )}
                </div>
                
                <div style={{ padding: '16px 20px' }}>
                  {c.systems && c.systems.length > 0 ? c.systems.map(sys => (
                    <div key={sys.id} style={s.systemBlock}>
                      
                      {/* SİSTEM VE CLİENT BİLGİLERİ TEK SATIRDA MERKEZLENDİ */}
                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${theme.borderLight}` }}>
                        
                        {/* SOL: SİSTEM BİLGİLERİ */}
                        <div style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={s.sidText}>{sys.sid}</span>
                          <span style={s.typeBadge}>{sys.system_type}</span> {/* Sistem Tanımı */}
                          {sys.environment && (
                            <span style={s.envBadge(getSystemColor(sys.environment), getSystemColorBg(sys.environment))}>
                              {sys.environment}
                            </span>
                          )}
                          <button onClick={() => openSystemModal(sys)} title="Bağlantı Parametrelerini Gör" style={{ ...s.iconButton, fontSize: '15px' }}>
                            🔌
                          </button>
                        </div>

                        {/* ORTA: CLİENT YAZISI */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <strong style={{ color: theme.textSecondary, fontSize: '13px', fontWeight: 700, letterSpacing: '0.2px' }}>
                            Client {sys.client_number}
                          </strong>
                        </div>

                        {/* SAĞ: KULLANICI EKLE BUTONU */}
                        {isAdmin && (
                          <div style={{ position: 'absolute', right: 0 }}>
                            <button 
                              onClick={() => {
                                setSelectedSystemForUser(sys); // State eklenecek
                                setIsAddingUser(true);
                              }}
                              style={{ ...s.btnSecondary, padding: '4px 10px', fontSize: '11.5px', color: theme.primary, borderColor: theme.primary, display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Bu sisteme yeni kullanıcı ekle"
                            >
                              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>+</span> Kullanıcı Ekle
                            </button>
                          </div>
                        )}
                      </div>
 
                      {/* KULLANICI LİSTESİ DOĞRUDAN SİSTEMİN ALTINDA */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sys.users.map(user => (
                          <UserCredentialCard 
                            key={user.id} 
                            user={user} 
                            token={token} 
                            handleUpdatePassword={handleUpdatePassword} 
                            handleDeleteUser={handleDeleteUser} 
                            isAdmin={isAdmin}
                          />
                        ))}
                      </div>
                    </div>
                  )) : (
                    <p style={s.emptyState}>Bu müşteriye ait sistem bulunmuyor.</p>
                  )}
                </div>
              </div>
            )) : (
              <div style={s.emptyCard}>
                <p style={{ color: theme.textMuted, fontSize: '15px' }}>Aradığınız kriterlere uygun sonuç bulunamadı.</p>
              </div>
            )}
          </div>
        )}
 
        {activeTab === 'audit' && (
          <div style={s.container}>
            <div style={{ ...s.toolbar, marginBottom: '16px' }}>
              <h2 style={s.pageTitle}>Sistem Denetim İzleri (Son 50 Kayıt)</h2>
              <button 
                onClick={fetchAuditLogs} 
                disabled={isRefreshingLogs}
                style={{ 
                  ...s.btnSecondary, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  opacity: isRefreshingLogs ? 0.7 : 1,
                  cursor: isRefreshingLogs ? 'wait' : 'pointer'
                }}
                title="Logları Yenile"
              >
                {isRefreshingLogs ? '⏳ Yenileniyor...' : '🔄 Yenile'}
              </button>
            </div>

            {auditLogs && auditLogs.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: theme.surface, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f7f8f9', borderBottom: `1px solid ${theme.borderLight}`, textAlign: 'left', color: theme.textSecondary }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tarih / Saat</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>İşlemi Yapan</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Hedef Kayıt</th> 
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>İşlem Türü</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Detaylar</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => {
                    const actionStr = (log.action || '').toUpperCase();
                    let badgeStyle = { bg: theme.infoBg, color: theme.info };
                    
                    if (actionStr.includes('DELETE') || actionStr.includes('FAIL') || actionStr.includes('ERROR')) {
                      badgeStyle = { bg: theme.negativeBg, color: theme.negative };
                    } else if (actionStr.includes('UPDATE') || actionStr.includes('REVEAL') || actionStr.includes('COPY')) {
                      badgeStyle = { bg: theme.criticalBg, color: theme.critical };
                    } else if (actionStr.includes('CREATE') || actionStr.includes('ADD') || actionStr.includes('SUCCESS')) {
                      badgeStyle = { bg: theme.positiveBg, color: theme.positive };
                    }

                    return (
                      <tr key={log.id || index} style={{ borderBottom: `1px solid ${theme.borderLight}` }}>
                        <td style={{ padding: '12px 16px', color: theme.textPrimary, whiteSpace: 'nowrap' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString('tr-TR') : '-'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: theme.textPrimary }}>
                          {log.user_email || log.username || '-'}
                        </td>
                        
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace', color: theme.textPrimary }}>
                          {log.target_context ? (
                            <span 
                              title={log.target_context} 
                              style={{ cursor: 'help', borderBottom: `1px dashed ${theme.textMuted}` }}
                            >
                              {log.target_name || '-'}
                            </span>
                          ) : (
                            log.target_name || '-'
                          )}
                        </td>
                        
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px', letterSpacing: '0.3px' }}>
                            {log.action || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: theme.textSecondary }}>
                          {log.detail || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={s.emptyCard}>
                <p style={{ color: theme.textMuted, fontSize: '15px' }}>Henüz denetim izi (audit log) bulunmuyor veya yüklenemedi.</p>
              </div>
            )}
          </div>
        )}
      </div>
 
      {selectedSystemDetails && (
        <div style={s.overlay}>
          <div style={s.modalWide}>
            
            <div style={s.modalTitle}>
              <span>Parametre - Sistem bağlantısı</span>
              {/* ADMİN KONTROLÜ: SİSTEM DÜZENLEME İKONU */}
              {isAdmin && (
                <button 
                  onClick={() => setIsEditingSystem(!isEditingSystem)} 
                  title="Sistemi Düzenle" 
                  style={s.iconButton}
                >
                  ✏️
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', fontFamily: theme.font, marginTop: '16px' }}>
              <div style={s.paramRow}>
                <div style={s.paramLabel}>Sistem Tanımı:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.system_type || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, system_type: e.target.value})}
                  style={s.paramInput(isEditingSystem)} 
                />
              </div>
              
              <div style={s.paramRow}>
                <div style={s.paramLabel}>Client Numarası:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  maxLength="3"
                  value={editableSystemData.client_number || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, client_number: e.target.value.replace(/\D/g, '')})}
                  style={s.paramInputSm(isEditingSystem)} 
                />
              </div>
              
              <div style={s.paramRow}>
                <div style={s.paramLabel}>Uygulama sunucusu:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.app_server || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, app_server: e.target.value})}
                  style={s.paramInput(isEditingSystem)} 
                />
              </div>
              
              <div style={s.paramRow}>
                <div style={s.paramLabel}>Birim numarası:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.instance_number || editableSystemData.inst_no || '00'} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, instance_number: e.target.value})}
                  style={s.paramInputSm(isEditingSystem)} 
                />
              </div>
              
              <div style={s.paramRow}>
                <div style={s.paramLabel}>Sistem tn.:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.sid || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, sid: e.target.value.toUpperCase()})}
                  style={s.paramInputSm(isEditingSystem)} 
                />
              </div>
              
              <div style={s.paramRow}>
                <div style={s.paramLabel}>SAProuter dizilimi:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.sap_router || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, sap_router: e.target.value})}
                  style={s.paramInput(isEditingSystem)} 
                />
              </div>
            </div>
 
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <div>
                {isEditingSystem && isAdmin && (
                  <button
                    onClick={handleDeleteSystem}
                    style={s.btnDanger}
                  >
                    Sistemi Sil
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {isEditingSystem && isAdmin && (
                  <button
                    onClick={handleApplySystemChanges}
                    style={s.btnSuccess}
                  >
                    Uygula
                  </button>
                )}
                <button
                  onClick={() => setSelectedSystemDetails(null)}
                  style={s.btnSecondary}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {selectedVpnDetails && (
        <div style={s.overlay}>
          <div style={{ ...s.modalWide, width: '640px', padding: '20px' }}>
            <div style={{ backgroundColor: theme.infoBg, padding: '10px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', color: theme.info, marginBottom: '4px' }}>
              🔐 VPN Kullanıcı Bilgileri
            </div>
            <div style={{ marginTop: '12px', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', backgroundColor: theme.surface, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: theme.font }}>
                <thead>
                  <tr style={{ backgroundColor: '#f4f5f6', borderBottom: `1px solid ${theme.borderLight}`, textAlign: 'left', color: theme.textSecondary }}>
                    <th style={{ padding: '9px 12px', fontWeight: 600, fontSize: '12px' }}>VPN kullanıcı adı</th>
                    <th style={{ padding: '9px 12px', fontWeight: 600, fontSize: '12px' }}>VPN kullanıcı şifresi</th>
                    <th style={{ padding: '9px 12px', fontWeight: 600, fontSize: '12px' }}>VPN bağlantı adresi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: theme.textPrimary }}>{selectedVpnDetails.vpn_username || '-'}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: theme.textPrimary }}>{selectedVpnDetails.vpn_password || '-'}</td>
                    <td style={{ padding: '10px 12px', color: theme.textPrimary }}>{selectedVpnDetails.gateway_address || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setSelectedVpnDetails(null)} style={s.btnSecondary}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {editingCustomer && isAdmin && (
        <div style={s.overlay}>
          <div style={s.modalCard}>
            <h3 style={{ marginTop: 0, borderBottom: `1px solid ${theme.borderLight}`, paddingBottom: '12px', color: theme.textPrimary, fontSize: '16px', fontWeight: 600 }}>Müşteri Yönetimi</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={s.modalLabel}>Müşteri Adı</label>
                <input 
                  type="text" 
                  value={editableCustomerData.name || ''} 
                  onChange={e => setEditableCustomerData({...editableCustomerData, name: e.target.value})}
                  style={s.modalInput} 
                />
              </div>
              <div>
                <label style={s.modalLabel}>Sektör</label>
                <input 
                  type="text" 
                  value={editableCustomerData.sector || ''} 
                  onChange={e => setEditableCustomerData({...editableCustomerData, sector: e.target.value})}
                  style={s.modalInput} 
                />
              </div>
            </div>
 
            <div style={s.modalRow}>
                <button 
                onClick={async () => {
                  if (confirm(`"${editingCustomer.name}" müşterisini silmek istediğinize emin misiniz?`)) {
                    try {
                      const res = await fetch(`http://localhost:8000/customers/${editingCustomer.id}`, {
                        method: 'DELETE',
                        headers
                      });
                      if (res.ok) {
                        alert("Müşteri başarıyla silindi.");
                        setEditingCustomer(null);
                        fetchCustomers();
                      } else {
                        const errData = await res.json();
                        alert(`Silme başarısız: ${errData.detail || 'Bilinmeyen hata'}`);
                      }
                    } catch (error) {
                      console.error("Silme işlemi sırasında ağ hatası:", error);
                    }
                  }
                }}
                style={s.btnDanger}
              >       
                Müşteriyi Sil
              </button>
 
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingCustomer(null)} style={s.btnSecondary}>İptal</button>
                <button 
                  onClick={async () => {
                    const res = await fetch(`http://localhost:8000/customers/${editableCustomerData.id}`, {
                      method: 'PUT',
                      headers,
                      body: JSON.stringify({
                        name: editableCustomerData.name,
                        sector: editableCustomerData.sector,
                        notes: editableCustomerData.notes || ""
                      })
                    });
                    if (res.ok) {
                      alert("Müşteri bilgileri güncellendi!");
                      setEditingCustomer(null);
                      fetchCustomers();
                    } else {
                      alert("Güncelleme başarısız.");
                    }
                  }}
                  style={s.btnSuccess}
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingCustomer && isAdmin && (
        <div style={s.overlay}>
          <div style={s.modalCard}>
            <h3 style={{ marginTop: 0, borderBottom: `1px solid ${theme.borderLight}`, paddingBottom: '12px', color: theme.textPrimary, fontSize: '16px', fontWeight: 600 }}>Yeni Müşteri Ekle</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('http://localhost:8000/customers/', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(newCustomerData)
                });
                if (res.ok) {
                  alert("Yeni müşteri başarıyla eklendi!");
                  setIsAddingCustomer(false);
                  setNewCustomerData({ name: '', sector: '', description: '' });
                  fetchCustomers();
                } else {
                  alert("Müşteri eklenemedi.");
                }
              } catch (err) {
                console.error("Ekleme hatası:", err);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={s.modalLabel}>Müşteri Adı</label>
                <input 
                  type="text" 
                  required
                  value={newCustomerData.name} 
                  onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})}
                  style={s.modalInput} 
                />
              </div>
              <div>
                <label style={s.modalLabel}>Sektör</label>
                <input 
                  type="text" 
                  value={newCustomerData.sector} 
                  onChange={e => setNewCustomerData({...newCustomerData, sector: e.target.value})}
                  style={s.modalInput} 
                />
              </div>
              <div>
                <label style={s.modalLabel}>Açıklama</label>
                <input 
                  type="text" 
                  value={newCustomerData.description} 
                  onChange={e => setNewCustomerData({...newCustomerData, description: e.target.value})}
                  style={s.modalInput} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsAddingCustomer(false)} style={s.btnSecondary}>İptal</button>
                <button type="submit" style={s.btnPrimary}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingSystem && selectedCustomerForSystem && isAdmin && (
        <div style={s.overlay}>
          <div style={s.modalWide}>
            <div style={s.modalTitle}>
              <span>Yeni Sistem Ekle <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 'normal' }}>({selectedCustomerForSystem.name})</span></span>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('http://localhost:8000/sap-systems/', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    ...newSystemData,
                    customer_id: selectedCustomerForSystem.id
                  })
                });
                if (res.ok) {
                  alert("Sistem başarıyla eklendi!");
                  setIsAddingSystem(false);
                  setNewSystemData({ sid: '', system_type: '', environment: 'PRD', app_server: '', instance_number: '00', sap_router: '', description: '' });
                  fetchCustomers(); 
                } else {
                  const errData = await res.json();
                  alert(`Sistem eklenemedi: ${errData.detail || 'Bilinmeyen hata'}`);
                }
              } catch (err) {
                console.error("Sistem ekleme hatası:", err);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div>
                <label style={s.modalLabel}>Sistem Tanımı</label>
                <input type="text" required value={newSystemData.system_type} onChange={e => setNewSystemData({...newSystemData, system_type: e.target.value})} style={s.modalInput} placeholder="" />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={s.modalLabel}>Ortam (Environment)</label>
                  <select value={newSystemData.environment} onChange={e => setNewSystemData({...newSystemData, environment: e.target.value})} style={s.modalInput}>
                    <option value="PRD">PRD (Canlı)</option>
                    <option value="QAS">QAS (Test/Kalite)</option>
                    <option value="DEV">DEV (Geliştirme)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.modalLabel}>Client Numarası</label>
                  <input type="text" required maxLength="3" value={newSystemData.client_number} onChange={e => setNewSystemData({...newSystemData, client_number: e.target.value.replace(/\D/g, '')})} style={s.modalInput} placeholder="Örn: 100, 300..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 2 }}>
                  <label style={s.modalLabel}>Uygulama Sunucusu (App Server)</label>
                  <input type="text" required value={newSystemData.app_server} onChange={e => setNewSystemData({...newSystemData, app_server: e.target.value})} style={s.modalInput} placeholder="192.168.1.10 veya sapprd.local" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.modalLabel}>Instance No</label>
                  <input type="text" required maxLength="2" value={newSystemData.instance_number} onChange={e => setNewSystemData({...newSystemData, instance_number: e.target.value})} style={s.modalInput} placeholder="00" />
                </div>
              </div>
              <div>
                <label style={s.modalLabel}>SAP Router Dizilimi (Opsiyonel)</label>
                <input type="text" value={newSystemData.sap_router} onChange={e => setNewSystemData({...newSystemData, sap_router: e.target.value})} style={s.modalInput} placeholder="/H/192.168.1.1/S/3299/W/pass" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddingSystem(false)} style={s.btnSecondary}>İptal</button>
                <button type="submit" style={s.btnPrimary}>Sistemi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNotesModalOpen && (
        <div style={s.overlay}>
          <div style={s.modalWide}>
            <div style={s.modalTitle}>
              <span>Notlar <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 'normal' }}>({activeNoteResource.name})</span></span>
              <button onClick={() => setIsNotesModalOpen(false)} style={s.iconButton}>✖</button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '12px', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notesList.length > 0 ? notesList.map(note => (
                <div key={note.id} style={{ backgroundColor: '#f9fafb', border: `1px solid ${theme.borderLight}`, borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: theme.textSecondary }}>
                    <span style={{ fontWeight: 600, color: theme.textPrimary }}>{note.author_email || 'Bilinmiyor'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{new Date(note.created_at).toLocaleString('tr-TR')}</span>
                      {/* ADMİN KONTROLÜ: NOT SİLME İKONU */}
                      {isAdmin && (
                        <button onClick={() => handleDeleteNote(note.id)} title="Notu Sil" style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.negative, padding: 0 }}>🗑️</button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: theme.textPrimary, whiteSpace: 'pre-wrap' }}>
                    {note.text}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted, fontSize: '13px', fontStyle: 'italic' }}>
                  Henüz bir not eklenmemiş.
                </div>
              )}
            </div>
            {/* NOT EKLEME FORMU */}
            <form onSubmit={handleAddNote} style={{ marginTop: '16px', borderTop: `1px solid ${theme.borderLight}`, paddingTop: '16px' }}>
              <textarea 
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Bu müşteri hakkında yeni bir not ekleyin..."
                required
                style={{ ...s.modalInput, minHeight: '60px', resize: 'vertical', color: theme.textPrimary, backgroundColor: theme.surface }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" style={s.btnPrimary}>Notu Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {isAddingUser && selectedSystemForUser && isAdmin && (
        <div style={s.overlay}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>
              <span>Yeni Kullanıcı Ekle <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 'normal' }}>({selectedSystemForUser.sid} - Client {selectedSystemForUser.client_number})</span></span>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('http://localhost:8000/sap-users/', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    username: newUserData.username.toUpperCase(),
                    password: newUserData.password,
                    user_type: newUserData.user_type,
                    system_id: selectedSystemForUser.id // <-- ARTIK SİSTEM ID'Sİ GİDİYOR
                  })
                });
                if (res.ok) {
                  alert("Kullanıcı Vault'a kaydedildi ve eklendi!");
                  setIsAddingUser(false);
                  setNewUserData({ username: '', password: '', user_type: 'DIALOG' });
                  fetchCustomers();
                } else {
                  const errData = await res.json();
                  alert(`Kullanıcı eklenemedi: ${errData.detail || 'Bilinmeyen hata'}`);
                }
              } catch (err) {
                console.error("Kullanıcı ekleme hatası:", err);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div>
                <label style={s.modalLabel}>Kullanıcı Adı (Username)</label>
                <input 
                  type="text" 
                  required 
                  value={newUserData.username} 
                  onChange={e => setNewUserData({...newUserData, username: e.target.value.toUpperCase()})} 
                  style={{ ...s.modalInput, backgroundColor: '#1d2d3e', color: '#ffffff', textTransform: 'uppercase' }} 
                  placeholder="Örn: DDIC, SAP*" 
                />
              </div>
              <div>
                <label style={s.modalLabel}>Kullanıcı Tipi</label>
                <input 
                  type="text" 
                  required 
                  value={newUserData.user_type} 
                  onChange={e => setNewUserData({...newUserData, user_type: e.target.value})} 
                  style={{ ...s.modalInput, backgroundColor: '#1d2d3e', color: '#ffffff' }} 
                  placeholder="Örn: Dialog, System, RFC..." 
                />
              </div>
              <div>
                <label style={s.modalLabel}>Vault Şifresi</label>
                <input 
                  type="text" 
                  required 
                  value={newUserData.password} 
                  onChange={e => setNewUserData({...newUserData, password: e.target.value})} 
                  style={{ ...s.modalInput, backgroundColor: '#1d2d3e', color: '#ffffff' }} 
                  placeholder="Başlangıç şifresini girin..." 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddingUser(false)} style={s.btnSecondary}>İptal</button>
                <button type="submit" style={s.btnPrimary}>Kullanıcıyı Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}