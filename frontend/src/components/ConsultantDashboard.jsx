import { useState, useEffect } from 'react';
import SAPUserPassword from './SAPUserPassword';

export default function ConsultantDashboard({ token }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Tüm verileri paralel (aynı anda) çekerek performansı artırıyoruz
        const [custRes, sysRes, cliRes, usrRes, vpnRes] = await Promise.all([
          fetch('http://localhost:8000/customers/', { headers }),
          fetch('http://localhost:8000/sap-systems/', { headers }),
          fetch('http://localhost:8000/sap-clients/', { headers }),
          fetch('http://localhost:8000/sap-users/', { headers }),
          fetch('http://localhost:8000/vpn-profiles/', { headers })
        ]);

        const custData = await custRes.json();
        const sysData = await sysRes.json();
        const cliData = await cliRes.json();
        const usrData = await usrRes.json();
        const vpnData = await vpnRes.json();

        // Backend'den gelen düz listeleri "Müşteri -> Sistem -> Client -> Kullanıcı" şeklinde iç içe yerleştiriyoruz
        const structuredData = custData.map(customer => {
          const vpn = vpnData.find(v => v.customer_id === customer.id);
          const systems = sysData.filter(s => s.customer_id === customer.id).map(sys => {
            const clients = cliData.filter(c => c.system_id === sys.id).map(cli => {
              const users = usrData.filter(u => u.client_id === cli.id);
              return { ...cli, users };
            });
            return { ...sys, clients };
          });
          
          return { 
            ...customer, 
            vpnType: vpn ? vpn.vpn_type : 'Tanımsız',
            vpnAddress: vpn ? vpn.server_address : '',
            systems 
          };
        });

        setCustomers(structuredData);
        setLoading(false);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const getSystemColor = (type) => {
    switch(type) {
      case 'PRD': return '#dc3545';
      case 'QAS': return '#fd7e14';
      case 'DEV': return '#28a745';
      default: return '#6c757d';
    }
  };

  // --- AKILLI OMNI-SEARCH FİLTRESİ ---
  const filteredCustomers = customers.map(customer => {
    // 1. Arama kutusu boşsa müşteriyi olduğu gibi (tüm verileriyle) bırak
    if (!searchTerm.trim()) return customer;

    // 2. Kullanıcının yazdığını küçük harfe çevir ve boşluklardan kelimelere böl 
    // Örn: "s/4HANA dev 100" -> ["s/4hana", "dev", "100"]
    const keywords = searchTerm.toLowerCase().trim().split(/\s+/);

    // 3. İç İçe Ağaç Filtrelemesi (Sistem -> Client -> Kullanıcı)
    const filteredSystems = customer.systems.map(sys => {
      const filteredClients = sys.clients.map(cli => {
        const filteredUsers = cli.users.filter(usr => {
           // ARAMA HAVUZU: Bu satırdaki kullanıcının tüm "soy ağacını" tek bir metne döküyoruz
           const searchPool = `
             ${customer.name || ''} 
             ${sys.sid || ''} ${sys.system_type || ''} ${sys.environment || ''} ${sys.description || ''}
             ${cli.client_number || ''} 
             ${usr.username || ''} ${usr.user_type || ''}
           `.toLowerCase();

           // Kullanıcı havuzu, kullanıcının arama kutusuna yazdığı TÜM kelimeleri içeriyor mu? (AND Mantığı)
           return keywords.every(kw => searchPool.includes(kw));
        });

        // Sadece aranan kelimelerle eşleşen kullanıcıları tut
        return { ...cli, users: filteredUsers };
      }).filter(cli => cli.users.length > 0); // İçi boşalan (kullanıcısı eşleşmeyen) client'ları listeden çıkar

      // Sadece içi dolu client'ı olan sistemleri tut
      return { ...sys, clients: filteredClients };
    }).filter(sys => sys.clients.length > 0); // İçi boşalan sistemleri listeden çıkar

    // Yeni filtrelenmiş (daraltılmış) sistemleri müşteriye ata
    return { ...customer, systems: filteredSystems };
  }).filter(customer => customer.systems.length > 0); // Aramayla eşleşen hiçbir sistemi kalmayan müşteriyi sol menüden gizle

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Sistemler yükleniyor...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Müşteri, SID veya Kullanıcı ara..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px', width: '400px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* SOL PANEL */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3>Atandığım Müşteriler</h3>
          {filteredCustomers.map(customer => (
            <div 
              key={customer.id} 
              onClick={() => { setSelectedCustomer(customer); setSelectedSystem(null); setSelectedUser(null); }}
              style={{ 
                padding: '15px', 
                border: selectedCustomer?.id === customer.id ? '2px solid #007bff' : '1px solid #ddd',
                borderRadius: '8px', cursor: 'pointer', backgroundColor: '#f9f9f9'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{customer.name}</h4>
                <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: '#e2e3e5', borderRadius: '12px' }}>
                  🔒 {customer.vpnType}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>{customer.systems.length} Sistem Bulunuyor</p>
            </div>
          ))}
        </div>

        {/* ORTA PANEL */}
        {selectedCustomer && (
          <div style={{ flex: '1.5', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
            <h2>{selectedCustomer.name} - Sistem Kataloğu</h2>
            
            <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>
              <strong>Genel Açıklama:</strong> {selectedCustomer.description || 'Açıklama girilmemiş.'}
            </div>

            <h4>Sistemler</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedCustomer.systems.map(sys => (
                <div 
                  key={sys.id}
                  onClick={() => { setSelectedSystem(sys); setSelectedUser(null); }}
                  style={{ 
                    borderLeft: `5px solid ${getSystemColor(sys.system_type)}`,
                    padding: '10px 15px',
                    backgroundColor: selectedSystem?.id === sys.id ? '#e9ecef' : '#fff',
                    border: '1px solid #eee', cursor: 'pointer'
                  }}
                >
                  <strong>{sys.sid}</strong> ({sys.system_type})
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{sys.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAĞ PANEL: Sihirbaz */}
        {selectedSystem && (
          <div style={{ flex: '1.5', backgroundColor: '#f4f6f9', padding: '20px', borderRadius: '8px', border: '1px solid #cce5ff' }}>
            <h2 style={{ color: '#004085' }}>Bağlantı Sihirbazı ({selectedSystem.sid})</h2>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Adım 1: VPN'e Bağlan</h4>
              <p style={{ margin: 0, fontSize: '14px' }}>Tür: <strong>{selectedCustomer.vpnType}</strong></p>
              <p style={{ margin: 0, fontSize: '14px' }}>Adres: <strong>{selectedCustomer.vpnAddress}</strong></p>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Adım 2: SAP GUI Bağlantısı</h4>
              <code style={{ display: 'block', backgroundColor: '#eee', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
                App Server: {selectedSystem.app_server} | Inst: {selectedSystem.instance_number} | SysID: {selectedSystem.sid}
              </code>
            </div>

            <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Adım 3: Kullanıcı ve Şifre</h4>
              <select 
                value={selectedUser ? selectedUser.id : ""} // defaultValue yerine bunu kullanıyoruz!
                onChange={(e) => {
                  // Tip uyuşmazlıklarına karşı String() ile garantiye alıyoruz
                  const userId = String(e.target.value);
                  const user = selectedSystem.clients
                    .flatMap(c => c.users)
                    .find(u => String(u.id) === userId);
                  
                  setSelectedUser(user || null);
                }}
                style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
              >
                <option value="" disabled>Kullanıcı Seçin...</option>
                {selectedSystem.clients.map(client => 
                  client.users.map(user => (
                    <option key={user.id} value={user.id}>
                      Client {client.client_number} - {user.username} ({user.user_type})
                    </option>
                  ))
                )}
              </select>

              {selectedUser && (
                <SAPUserPassword userId={selectedUser.id} token={token} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}