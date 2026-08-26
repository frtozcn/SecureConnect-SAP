import { useState, useEffect } from 'react';

// 1. KULLANICI KARTI BİLEŞENİ
const UserCredentialCard = ({ user, token, handleUpdatePassword }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleVisibility = async (e) => {
    e.preventDefault(); 
    if (!password) {
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:8000/customers/', {
          method: 'POST',
          headers,
          body: JSON.stringify(newCustomerData)
        });
        if (res.ok) {
          const newCustomer = await res.json(); // Backend'den dönen yeni müşteri objesi
          alert("Yeni müşteri başarıyla eklendi!");
          setIsAddingCustomer(false);
          setNewCustomerData({ name: '', sector: '', description: '' });
          
          // Listeyi baştan fetch etmek yerine anında state'e ekliyoruz ki hemen ekranda belirsin:
          setCustomers(prevCustomers => [...prevCustomers, { ...newCustomer, systems: [], vpn: null }]);
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
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
    <div style={{ border: '2px solid #000', width: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
        <div style={{ flex: 1, borderRight: '2px solid #000', display: 'flex', flexDirection: 'column' }}>
          <div style={{ borderBottom: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '12px' }}>Kullanıcı</div>
          <div style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px' }}>{user.username}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ borderBottom: '1px solid #000', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ flex: 1, textAlign: 'center', paddingLeft: '16px' }}>Şifre</span>
            <button type="button" onClick={() => handleUpdatePassword(user.id)} title="Şifreyi Güncelle" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>✏️</button>
          </div>
          <div style={{ padding: '12px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ letterSpacing: showPassword ? 'normal' : '2px', fontSize: '14px', fontWeight: showPassword ? 'normal' : 'bold' }}>
              {isLoading ? '...' : (showPassword ? password : '••••••••')}
            </span>
            <button type="button" onClick={handleToggleVisibility} title={showPassword ? "Gizle" : "Göster"} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px' }}>
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
        </div>
      </div>
      <button type="button" onClick={handleCopyBoth} style={{ padding: '10px', border: 'none', background: copied ? '#198754' : '#f8f9fa', color: copied ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', transition: 'background-color 0.2s' }}>
        {copied ? 'KOPYALANDI ✓' : 'KOPYALA'}
      </button>
    </div>
  );
};


// 2. ANA BİLEŞEN
export default function AdminDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVpnDetails, setSelectedVpnDetails] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editableCustomerData, setEditableCustomerData] = useState(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', sector: '', description: '' });
  
  // POP-UP ve DÜZENLEME STATELERİ
  const [selectedSystemDetails, setSelectedSystemDetails] = useState(null); // Görüntülenen sistem
  const [isEditingSystem, setIsEditingSystem] = useState(false); // Düzenleme modunda mıyız?
  const [editableSystemData, setEditableSystemData] = useState(null); // Düzenlenen veriler

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
      case 'PRD': return '#dc3545';
      case 'QAS': return '#fd7e14';
      case 'DEV': return '#28a745';
      default: return '#6c757d';
    }
  };

  const fetchCustomers = async () => {
    try {
      const [custRes, sysRes, cliRes, usrRes, vpnRes] = await Promise.all([
        fetch('http://localhost:8000/customers/', { headers }),
        fetch('http://localhost:8000/sap-systems/', { headers }),
        fetch('http://localhost:8000/sap-clients/', { headers }),
        fetch('http://localhost:8000/sap-users/', { headers }),
        fetch('http://localhost:8000/vpn-profiles/', { headers })
      ]);

      if (custRes.ok && sysRes.ok && cliRes.ok && usrRes.ok) {
        const custData = await custRes.json();
        const sysData = await sysRes.json();
        const cliData = await cliRes.json();
        const usrData = await usrRes.json();
        const vpnData = await (vpnRes.ok ? vpnRes.json() : []);

        const structuredData = custData.map(customer => {
          const vpn = vpnData.find ? vpnData.find(v => v.customer_id === customer.id) : null;
          
          // Sistemleri güvenli filtrele (Eğer sistem yoksa boş dizi ata ki kod patlamasın)
          const systems = sysData ? sysData.filter(s => s.customer_id === customer.id).map(sys => {
            const clients = cliData ? cliData.filter(c => c.system_id === sys.id).map(cli => {
              const users = usrData ? usrData.filter(u => u.client_id === cli.id) : [];
              return { ...cli, users };
            }) : [];
            return { ...sys, clients };
          }) : [];
          
          return { ...customer, vpn: vpn || null, systems: systems || [] };
        });

        setCustomers(structuredData);

        setCustomers(structuredData);
      }
    } catch (error) {
      console.error("Müşteri fetch hatası:", error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('http://localhost:8000/audit-logs/?limit=50', { headers });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      setAuditLogs([]);
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

  // UYGULA BUTONUNA BASILINCA ÇALIŞACAK FONKSİYON
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
        setIsEditingSystem(false); // Düzenleme modundan çık
        setSelectedSystemDetails(editableSystemData); // Pop-up verilerini güncelle
        fetchCustomers(); // Arka plandaki listeyi yenile
      } else {
        const errorData = await res.json();
        alert(`Güncelleme başarısız oldu: ${errorData.detail || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error("Sistem güncelleme hatası:", error);
      alert("Bağlantı hatası oluştu.");
    }
  };

  const filteredCustomers = customers.map(customer => {
    if (!searchTerm.trim()) return customer;

    const keywords = searchTerm.toLowerCase().trim().split(/\s+/);

    const filteredSystems = (customer.systems || []).map(sys => {
      const filteredClients = (sys.clients || []).map(cli => {
        const filteredUsers = (cli.users || []).filter(usr => {
           const searchPool = `
             ${customer.name || ''} 
             ${sys.sid || ''} ${sys.system_type || ''} ${sys.environment || ''} ${sys.description || ''}
             ${cli.client_number || ''} 
             ${usr.username || ''} ${usr.user_type || ''}
           `.toLowerCase();

           return keywords.every(kw => searchPool.includes(kw));
        });

        return { ...cli, users: filteredUsers };
      }).filter(cli => cli.users.length > 0);

      return { ...sys, clients: filteredClients };
    }).filter(sys => sys.clients.length > 0);

    return { ...customer, systems: filteredSystems };
  });

  // Pop-up'ı açma fonksiyonu
  const openSystemModal = (sys) => {
    setSelectedSystemDetails(sys);
    setEditableSystemData(sys);
    setIsEditingSystem(false);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* SOL MENÜ */}
      <div style={{ width: '250px', backgroundColor: '#212529', color: 'white', paddingTop: '20px' }}>
        <div onClick={() => setActiveTab('customers')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeTab === 'customers' ? '#343a40' : 'transparent', borderLeft: activeTab === 'customers' ? '4px solid #0d6efd' : '4px solid transparent' }}>📁 Müşteri & Sistem Kataloğu</div>
        <div onClick={() => setActiveTab('audit')} style={{ padding: '15px 20px', cursor: 'pointer', backgroundColor: activeTab === 'audit' ? '#343a40' : 'transparent', borderLeft: activeTab === 'audit' ? '4px solid #0d6efd' : '4px solid transparent' }}>🛡️ Audit Log (Denetim İzi)</div>
      </div>

      {/* SAĞ İÇERİK */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
        {activeTab === 'customers' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ color: '#333', margin: 0 }}>Müşteri Yönetimi</h2>
              <input 
                type="text" 
                placeholder="Müşteri, SID, sistem veya kullanıcı ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: '300px', maxWidth: '500px', padding: '10px 15px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
              />
              <button 
                onClick={() => setIsAddingCustomer(true)} 
                style={{ padding: '10px 16px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Yeni Müşteri
              </button>
            </div>

            {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
              <div key={c.id} style={{ border: '1px solid #dee2e6', marginBottom: '25px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {/* MÜŞTERİ BAŞLIĞI (ÇARK İKONU EKLENDİ, SİL BUTONU KALDIRILDI) */}
                <div style={{ backgroundColor: '#e9ecef', padding: '15px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      onClick={() => { setEditingCustomer(c); setEditableCustomerData(c); }}
                      title="Müşteri Bilgilerini Düzenle / Sil"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: 0 }}
                    >
                      ⚙️
                    </button>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#212529' }}>{c.name}</h3>
                      <div style={{ fontSize: '13px', color: '#495057' }}>
                        <strong>Açıklama:</strong> {c.description || 'Belirtilmemiş'} | 
                        <strong>VPN:</strong> 
                        {c.vpn ? (
                          <span 
                            onClick={() => setSelectedVpnDetails(c.vpn)}
                            style={{ 
                              marginLeft: '8px', 
                              backgroundColor: '#ffc107', 
                              color: '#000', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                            title="VPN Bilgilerini Görüntüle"
                          >
                            {c.vpn.vpn_type} 🔗
                          </span>
                        ) : (
                          <span style={{ marginLeft: '8px', color: '#6c757d' }}>Tanımsız</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '20px' }}>
                  {c.systems && c.systems.length > 0 ? c.systems.map(sys => (
                    <div key={sys.id} style={{ borderLeft: '4px solid #0dcaf0', paddingLeft: '15px', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {sys.sid} 
                        <span style={{ fontSize: '12px', backgroundColor: '#6c757d', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                          {sys.system_type}
                        </span>
                        {sys.environment && (
                          <span style={{ fontSize: '12px', backgroundColor: getSystemColor(sys.environment), color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {sys.environment}
                          </span>
                        )}
                        
                        {/* 🔌 GÖRÜNTÜLEME İKONU (TIKLANDIĞINDA POP-UP AÇAR) */}
                        <button 
                          onClick={() => openSystemModal(sys)} 
                          title="Bağlantı Parametrelerini Gör" 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px', display: 'flex', alignItems: 'center' }}
                        >
                          🔌
                        </button>
                      </h4>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontFamily: 'monospace', backgroundColor: '#f8f9fa', display: 'inline-block', padding: '4px 8px', borderRadius: '4px' }}>
                        App Server: {sys.app_server} | Inst: {sys.instance_number || sys.inst_no || '00'}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sys.clients.map(cli => (
                          <div key={cli.id} style={{ border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
                            <strong style={{ color: '#495057', display: 'block', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Client {cli.client_number}</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              {cli.users.map(user => (
                                <UserCredentialCard key={user.id} user={user} token={token} handleUpdatePassword={handleUpdatePassword} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: '#6c757d', fontSize: '14px', fontStyle: 'italic' }}>Bu müşteriye ait sistem bulunmuyor.</p>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <p style={{ color: '#6c757d', fontSize: '16px' }}>Aradığınız kriterlere uygun sonuç bulunamadı.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2>Sistem Denetim İzleri (Son 50 Kayıt)</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
               {/* Loglar */}
            </table>
          </div>
        )}
      </div>

      {/* SAP LOGON POP-UP (MODAL) */}
      {selectedSystemDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '4px', width: '500px', border: '1px solid #999', boxShadow: '2px 2px 10px rgba(0,0,0,0.2)' }}>
            
            {/* BAŞLIK VE DÜZENLEME İKONU YAN YANA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>
                Parametre - Sistem bağlantısı
              </h3>
              <button 
                onClick={() => setIsEditingSystem(!isEditingSystem)} 
                title="Sistemi Düzenle" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0 }}
              >
                ✏️
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontFamily: 'sans-serif', marginTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '150px' }}>Tanım:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.description || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, description: e.target.value})}
                  style={{ flex: 1, padding: '4px', border: '1px solid #ccc', backgroundColor: isEditingSystem ? '#fff' : '#e9ecef', color: '#333' }} 
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '150px' }}>Uygulama sunucusu:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.app_server || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, app_server: e.target.value})}
                  style={{ flex: 1, padding: '4px', border: '1px solid #ccc', backgroundColor: isEditingSystem ? '#fff' : '#e9ecef', color: '#333' }} 
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '150px' }}>Birim numarası:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.instance_number || editableSystemData.inst_no || '00'} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, instance_number: e.target.value})}
                  style={{ width: '50px', padding: '4px', border: '1px solid #ccc', backgroundColor: isEditingSystem ? '#fff' : '#e9ecef', color: '#333' }} 
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '150px' }}>Sistem tn.:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.sid || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, sid: e.target.value.toUpperCase()})}
                  style={{ width: '50px', padding: '4px', border: '1px solid #ccc', backgroundColor: isEditingSystem ? '#fff' : '#e9ecef', color: '#333' }} 
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '150px' }}>SAProuter dizilimi:</div>
                <input 
                  readOnly={!isEditingSystem} 
                  value={editableSystemData.sap_router || ''} 
                  onChange={(e) => setEditableSystemData({...editableSystemData, sap_router: e.target.value})}
                  style={{ flex: 1, padding: '4px', border: '1px solid #ccc', backgroundColor: isEditingSystem ? '#fff' : '#e9ecef', color: '#333' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', gap: '10px' }}>
              {isEditingSystem && (
                <button
                  onClick={handleApplySystemChanges}
                  style={{ padding: '6px 20px', cursor: 'pointer', border: 'none', backgroundColor: '#198754', color: 'white', fontWeight: 'bold', borderRadius: '2px' }}
                >
                  Uygula
                </button>
              )}
              <button
                onClick={() => setSelectedSystemDetails(null)}
                style={{ padding: '6px 20px', cursor: 'pointer', border: '1px solid #999', backgroundColor: '#e1e1e1', fontWeight: 'bold', color: '#333' }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 VPN BİLGİLERİ POP-UP'I (GÖRSELE BİREBİR UYGUN) */}
      {selectedVpnDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '2px', width: '750px', border: '1px solid #999', boxShadow: '2px 2px 10px rgba(0,0,0,0.2)' }}>
            
            {/* Üst Başlık Şeridi */}
            <div style={{ backgroundColor: '#c3d6eb', padding: '6px 10px', border: '1px solid #a6a6a6', fontWeight: 'bold', fontSize: '13px', color: '#333' }}>
              VPN Kullanıcı Bilgileri
            </div>
            
            {/* Tablo Alanı */}
            <div style={{ marginTop: '10px', border: '1px solid #a6a6a6', backgroundColor: '#fff', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'sans-serif' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e4e4e4', borderBottom: '1px solid #a6a6a6', textAlign: 'left', color: '#333' }}>
                    <th style={{ padding: '6px 8px', borderRight: '1px solid #ccc', fontWeight: 'normal' }}>VPN kullanıcı adı</th>
                    <th style={{ padding: '6px 8px', borderRight: '1px solid #ccc', fontWeight: 'normal' }}>VPN kullanıcı şifresi</th>
                    <th style={{ padding: '6px 8px', fontWeight: 'normal' }}>VPN bağlantı adresi</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Seçili satır (Sarımtırak arka plan) */}
                  <tr style={{ backgroundColor: '#ffeeba', borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #ccc' }}>{selectedVpnDetails.vpn_username || '-'}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #ccc' }}>{selectedVpnDetails.vpn_password || '-'}</td>
                    <td style={{ padding: '6px 8px' }}>{selectedVpnDetails.gateway_address || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Kapat Butonu */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button
                onClick={() => setSelectedVpnDetails(null)}
                style={{ padding: '4px 15px', cursor: 'pointer', border: '1px solid #999', backgroundColor: '#e1e1e1', color: '#333' }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ⚙️ MÜŞTERİ DÜZENLEME VE SİLME POP-UP'I */}
      {editingCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px', color: '#212529' }}>Müşteri Yönetimi</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>Müşteri Adı</label>
                <input 
                  type="text" 
                  value={editableCustomerData.name || ''} 
                  onChange={e => setEditableCustomerData({...editableCustomerData, name: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>Sektör</label>
                <input 
                  type="text" 
                  value={editableCustomerData.sector || ''} 
                  onChange={e => setEditableCustomerData({...editableCustomerData, sector: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px' }}>
              {/* SİL BUTONU SOL KÖŞEDE */}
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
                        // BACKEND'DEN GELEN DETAYLI HATAYI YAKALA VE GÖSTER
                        const errData = await res.json();
                        alert(`Silme başarısız: ${errData.detail || 'Bilinmeyen hata'}`);
                      }
                    } catch (error) {
                      console.error("Silme işlemi sırasında ağ hatası:", error);
                    }
                  }
                }}
                style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >       
                Müşteriyi Sil
              </button>

              {/* KAYDET VE İPTAL BUTONLARI */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setEditingCustomer(null)}
                  style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#f8f9fa', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                >
                  İptal
                </button>
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
                  style={{ padding: '8px 16px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Kaydet
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* ➕ YENİ MÜŞTERİ EKLEME POP-UP'I */}
      {isAddingCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px', color: '#212529' }}>Yeni Müşteri Ekle</h3>
            
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
                  fetchCustomers(); // Listeyi güncelle
                } else {
                  alert("Müşteri eklenemedi.");
                }
              } catch (err) {
                console.error("Ekleme hatası:", err);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>Müşteri Adı</label>
                <input 
                  type="text" 
                  required
                  value={newCustomerData.name} 
                  onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>Sektör</label>
                <input 
                  type="text" 
                  value={newCustomerData.sector} 
                  onChange={e => setNewCustomerData({...newCustomerData, sector: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>Açıklama</label>
                <input 
                  type="text" 
                  value={newCustomerData.description} 
                  onChange={e => setNewCustomerData({...newCustomerData, description: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddingCustomer(false)}
                  style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#f8f9fa', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '8px 16px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}