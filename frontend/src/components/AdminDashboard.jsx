import { useState, useEffect } from 'react';
import SAPUserPassword from './SAPUserPassword'; // Şifre göster/kopyala bileşenini Admin'e de getirdik!

export default function AdminDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    fetchCustomers();
    fetchAuditLogs();
  }, [token]);

  const fetchCustomers = async () => {
    try {
      // VPN dahil TÜM detayları paralel çekiyoruz
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
          const vpn = vpnData.find(v => v.customer_id === customer.id);
          const systems = sysData.filter(s => s.customer_id === customer.id).map(sys => {
            const clients = cliData.filter(c => c.system_id === sys.id).map(cli => {
              const users = usrData.filter(u => u.client_id === cli.id);
              return { ...cli, users };
            });
            return { ...sys, clients };
          });
          return { ...customer, vpn, systems };
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#333' }}>Müşteri Yönetimi</h2>
              <button style={{ padding: '8px 16px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>+ Yeni Müşteri</button>
            </div>

            {customers.map(c => (
              <div key={c.id} style={{ border: '1px solid #dee2e6', marginBottom: '25px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {/* MÜŞTERİ BAŞLIĞI */}
                <div style={{ backgroundColor: '#e9ecef', padding: '15px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#212529' }}>{c.name}</h3>
                    <div style={{ fontSize: '13px', color: '#495057' }}>
                      <strong>Açıklama:</strong> {c.description || 'Belirtilmemiş'} | 
                      <strong style={{ marginLeft: '10px' }}>VPN:</strong> {c.vpn ? `${c.vpn.vpn_type} (${c.vpn.server_address})` : 'Tanımsız'}
                    </div>
                  </div>
                  <button style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}>Sil</button>
                </div>
                
                {/* SİSTEMLER */}
                <div style={{ padding: '20px' }}>
                  {c.systems && c.systems.length > 0 ? c.systems.map(sys => (
                    <div key={sys.id} style={{ borderLeft: '4px solid #0dcaf0', paddingLeft: '15px', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {sys.sid} <span style={{ fontSize: '12px', backgroundColor: '#6c757d', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{sys.system_type}</span>
                      </h4>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontFamily: 'monospace', backgroundColor: '#f8f9fa', display: 'inline-block', padding: '4px 8px', borderRadius: '4px' }}>
                        App Server: {sys.app_server} | Inst: {sys.instance_number}
                      </div>

                      {/* CLİENTLAR */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sys.clients.map(cli => (
                          <div key={cli.id} style={{ border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
                            <strong style={{ color: '#495057', display: 'block', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Client {cli.client_number}</strong>
                            
                            {/* KULLANICILAR */}
                            {cli.users.map(user => (
                              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '5px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 'bold' }}>{user.username}</span>
                                  <span style={{ fontSize: '11px', color: '#6c757d' }}>Tür: {user.user_type}</span>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                  {/* Danışman ekranındaki Göster/Kopyala bileşenini doğrudan Admin'e de koyduk */}
                                  <SAPUserPassword userId={user.id} token={token} />
                                  
                                  <button 
                                    onClick={() => handleUpdatePassword(user.id)}
                                    style={{ padding: '6px 12px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    Vault Şifre Belirle
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: '#6c757d', fontSize: '14px', fontStyle: 'italic' }}>Bu müşteriye ait sistem bulunmuyor.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audit' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Audit Log kısmı aynı kalıyor */}
            <h2>Sistem Denetim İzleri (Son 50 Kayıt)</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
               {/* ... */}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}