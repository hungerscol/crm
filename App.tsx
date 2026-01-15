
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DealCard from './components/DealCard';
import DealDetailModal from './components/DealDetailModal';
import SellerModal from './components/SellerModal';
import { Deal, DealStatus, Country, Seller, Contact, Activity } from './types';
import { INITIAL_DEALS, PIPELINE_STAGES, SELLERS as DEFAULT_SELLERS } from './constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const STORAGE_KEY = 'hungers_crm_v14_deals';
const SELLERS_KEY = 'hungers_crm_v14_sellers';
const CONTACTS_KEY = 'hungers_crm_v14_contacts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Seller | null>(null);
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedSellerForEdit, setSelectedSellerForEdit] = useState<Seller | null>(null);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [draggedOverStage, setDraggedOverStage] = useState<DealStatus | null>(null);
  const [countryFilter, setCountryFilter] = useState<Country | 'All'>('All');
  
  const [viewingSellerId, setViewingSellerId] = useState<string | null>(null);

  const [sellers, setSellers] = useState<Seller[]>(() => {
    const saved = localStorage.getItem(SELLERS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SELLERS;
  });

  const [deals, setDeals] = useState<Deal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DEALS;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem(CONTACTS_KEY);
    if (saved) return JSON.parse(saved);
    return INITIAL_DEALS.map(d => ({
      id: `con-${d.id}`,
      name: d.contactName,
      email: d.email,
      phone: d.phone,
      organization: d.organization,
      createdAt: new Date().toISOString()
    }));
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    localStorage.setItem(SELLERS_KEY, JSON.stringify(sellers));
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }, [deals, sellers, contacts]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = sellers.find(s => s.name === loginData.user && s.password === loginData.pass);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
      setActiveTab('pipeline');
    } else {
      setLoginError('Credenciales incorrectas de Hungers.');
    }
  };

  const handleUpdateDeal = (updatedDeal: Deal) => {
    if (updatedDeal.contactName && updatedDeal.email) {
      setContacts(prev => {
        const existing = prev.find(c => c.email === updatedDeal.email || c.id === updatedDeal.contactId);
        if (existing) {
          return prev.map(c => c.id === existing.id ? {
            ...c,
            name: updatedDeal.contactName,
            phone: updatedDeal.phone,
            organization: updatedDeal.organization
          } : c);
        } else {
          const newContact: Contact = {
            id: `con-${Date.now()}`,
            name: updatedDeal.contactName,
            email: updatedDeal.email,
            phone: updatedDeal.phone,
            organization: updatedDeal.organization,
            createdAt: new Date().toISOString()
          };
          updatedDeal.contactId = newContact.id;
          return [...prev, newContact];
        }
      });
    }

    setDeals(prev => {
      const exists = prev.find(d => d.id === updatedDeal.id);
      if (exists) return prev.map(d => d.id === updatedDeal.id ? updatedDeal : d);
      return [updatedDeal, ...prev];
    });
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Nombre", "Email", "Telefono", "Organizacion", "Creado"];
    const csvContent = [
      headers.join(","),
      ...contacts.map(c => [`"${c.id}"`, `"${c.name}"`, `"${c.email}"`, `"${c.phone}"`, `"${c.organization}"`, `"${c.createdAt}"`].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hungers_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDeals = useMemo(() => {
    if (!currentUser) return [];
    return deals.filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           d.organization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === 'All' || d.country === countryFilter;
      let matchesSeller = viewingSellerId 
        ? d.sellerId === viewingSellerId 
        : (currentUser.role === 'admin' ? true : d.sellerId === currentUser.id);
      return matchesSearch && matchesCountry && matchesSeller;
    });
  }, [deals, searchTerm, countryFilter, currentUser, viewingSellerId]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage] = filteredDeals.filter(d => d.status === stage);
    });
    return grouped;
  }, [filteredDeals]);

  if (!currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-hungers font-sans">
        <div className="w-full max-w-sm bg-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-hungers-medium"></div>
          <div className="w-20 h-20 bg-hungers rounded-3xl flex items-center justify-center text-hungers-dark font-black text-4xl mx-auto mb-8 shadow-xl shadow-hungers-medium/20 border border-hungers-medium transition-transform hover:scale-110">H</div>
          <h1 className="text-3xl font-black text-hungers-dark tracking-tighter text-center mb-1 uppercase">HUNGERS</h1>
          <p className="text-hungers-medium text-[10px] font-black uppercase tracking-[0.3em] text-center mb-12 opacity-60">Internal Sales Platform</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-hungers-medium uppercase tracking-widest ml-4">User</label>
              <input type="text" className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all text-hungers-dark" placeholder="vendedor" value={loginData.user} onChange={e => setLoginData({...loginData, user: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-hungers-medium uppercase tracking-widest ml-4">Password</label>
              <input type="password" className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all text-hungers-dark" placeholder="••••••••" value={loginData.pass} onChange={e => setLoginData({...loginData, pass: e.target.value})} required />
            </div>
            {loginError && <p className="text-red-600 text-[10px] font-black text-center bg-red-50 py-3 rounded-xl border border-red-100">{loginError}</p>}
            <button type="submit" className="w-full bg-hungers-medium text-white font-black py-5 rounded-3xl hover:shadow-2xl hover:bg-hungers-dark active:scale-[0.98] transition-all uppercase text-xs tracking-widest mt-4">Conectar</button>
          </form>
          <p className="mt-8 text-center text-[9px] text-hungers-medium font-bold uppercase tracking-widest italic">Hungers S.A.S © 2025</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-hungers text-hungers-dark overflow-hidden font-sans p-4 gap-4">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={() => setCurrentUser(null)} 
        syncStatus="success"
        userRole={currentUser.role}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        <header className="h-20 bg-white border-b border-zinc-100 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-black uppercase text-hungers-dark tracking-[0.2em]">{activeTab}</h2>
            <div className="h-6 w-px bg-zinc-100"></div>
            <div className="flex bg-zinc-50 p-1 rounded-xl">
              {['All', 'Colombia', 'México'].map(c => (
                <button key={c} onClick={() => setCountryFilter(c as any)} className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all ${countryFilter === c ? 'bg-white text-hungers-dark shadow-sm' : 'text-hungers-medium'}`}>
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <input type="text" placeholder="Buscar..." className="bg-zinc-50 border-none rounded-2xl px-5 pl-10 py-2.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-hungers/30 transition-all outline-none w-64 text-hungers-dark" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-hungers-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <button onClick={() => setSelectedDeal({ id: `d-${Date.now()}`, title: '', value: 0, currency: 'COP', contactName: '', organization: '', phone: '', email: '', address: '', status: DealStatus.LEAD_IN, priority: 'medium', activities: [], nextSteps: '', createdAt: new Date().toISOString(), country: 'Colombia', sellerId: currentUser.id })} className="bg-hungers text-hungers-dark px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-hungers/20 hover:scale-105 active:scale-95 transition-all">+ Negocio</button>
            
            <div className="w-10 h-10 rounded-2xl bg-hungers-medium flex items-center justify-center text-white font-black text-xs shadow-md">{currentUser.name.charAt(0)}</div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative bg-zinc-50/20">
          {activeTab === 'pipeline' && (
            <div className="h-full overflow-x-auto p-6 flex gap-6 custom-scrollbar">
              {PIPELINE_STAGES.map(stage => (
                <div 
                  key={stage} 
                  className={`pipeline-column flex flex-col min-w-[300px] max-w-[300px] rounded-[2rem] border transition-all ${draggedOverStage === stage ? 'border-hungers bg-hungers/5' : 'border-zinc-200 bg-white shadow-sm'}`}
                  onDragOver={e => { e.preventDefault(); setDraggedOverStage(stage as any); }}
                  onDragLeave={() => setDraggedOverStage(null)}
                  onDrop={e => {
                    e.preventDefault();
                    setDraggedOverStage(null);
                    const id = e.dataTransfer.getData('dealId');
                    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: stage as any } : d));
                  }}
                >
                  <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 rounded-t-[2rem]">
                    <h3 className="text-[10px] font-black text-hungers-dark uppercase tracking-[0.2em]">{stage}</h3>
                    <span className="text-[10px] font-black text-hungers-medium">{dealsByStage[stage]?.length || 0}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {dealsByStage[stage]?.map(deal => (
                      <DealCard key={deal.id} deal={deal} onClick={setSelectedDeal} onDragStart={(e, id) => e.dataTransfer.setData('dealId', id)} />
                    ))}
                  </div>
                  <div className="p-4 border-t border-zinc-50 text-[10px] font-black text-hungers-medium text-center uppercase tracking-widest opacity-40">
                    Total: ${(dealsByStage[stage]?.reduce((acc, d) => acc + d.value, 0) || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="p-10 h-full overflow-y-auto bg-white space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Pipeline Total', value: deals.length, icon: '📊', color: 'bg-zinc-50' },
                  { label: 'Won Deals', value: deals.filter(d => d.status === DealStatus.WON).length, icon: '🏆', color: 'bg-hungers/10' },
                  { label: 'Active Leads', value: deals.filter(d => d.status === DealStatus.LEAD_IN).length, icon: '🔥', color: 'bg-orange-50' },
                  { label: 'Revenue Proj.', value: `$${deals.reduce((a, b) => a + b.value, 0).toLocaleString()}`, icon: '💰', color: 'bg-green-50' }
                ].map((stat, i) => (
                  <div key={i} className={`${stat.color} p-8 rounded-[2.5rem] border border-zinc-100 transition-all`}>
                    <p className="text-[10px] font-black uppercase text-hungers-medium tracking-widest mb-4">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-black text-hungers-dark">{stat.value}</p>
                      <span className="text-2xl opacity-60">{stat.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-50 border border-zinc-100 p-10 rounded-[3.5rem] h-[450px]">
                <div className="mb-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-hungers-dark">Distribución de Tratos</h4>
                  <p className="text-[9px] font-bold text-hungers-medium uppercase tracking-widest mt-1">Visión global del motor de ventas Hungers</p>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={PIPELINE_STAGES.map(s => ({ name: s.split(' ')[0], count: dealsByStage[s]?.length || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} stroke="#88d43d" />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="#88d43d" />
                    <Tooltip cursor={{fill: '#f1ffde'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', backgroundColor: '#fff'}} />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={50}>
                      {PIPELINE_STAGES.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#c1ff72' : '#88d43d'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="p-10 h-full overflow-y-auto bg-white custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-3xl font-black text-hungers-dark tracking-tighter uppercase">Directorio de Leads</h3>
                  <p className="text-[10px] font-bold text-hungers-medium uppercase tracking-widest mt-1 italic">Propiedad intelectual de Hungers S.A.S</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleExportCSV} className="px-6 py-2.5 bg-hungers-medium text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-hungers-dark transition-all">Exportar CSV</button>
                  <button className="px-6 py-2.5 bg-hungers text-hungers-dark rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">+ Contacto</button>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-[10px] font-black uppercase text-hungers-medium tracking-widest border-b border-zinc-200">
                    <tr>
                      <th className="p-6">Nombre</th>
                      <th>Email / Tel</th>
                      <th>Organización</th>
                      <th className="p-6 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {contacts.map(c => (
                      <tr key={c.id} className="hover:bg-hungers/5 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-hungers-medium group-hover:bg-hungers group-hover:text-hungers-dark transition-all">{c.name.charAt(0)}</div>
                            <span className="font-black text-hungers-dark text-xs uppercase">{c.name}</span>
                          </div>
                        </td>
                        <td>
                          <p className="text-[10px] font-bold text-hungers-dark">{c.email}</p>
                          <p className="text-[10px] text-hungers-medium">{c.phone}</p>
                        </td>
                        <td className="text-[10px] font-black text-hungers-medium uppercase tracking-tighter">{c.organization}</td>
                        <td className="p-6 text-right">
                          <button className="text-[9px] font-black uppercase px-4 py-2 border border-zinc-200 rounded-xl hover:bg-hungers text-hungers-dark transition-all">Perfil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'team' && currentUser.role === 'admin' && (
            <div className="p-12 h-full overflow-y-auto bg-white custom-scrollbar">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-4xl font-black text-hungers-dark uppercase tracking-tighter">Equipo Hungers</h3>
                <button onClick={() => { setSelectedSellerForEdit(null); setIsSellerModalOpen(true); }} className="bg-hungers text-hungers-dark px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">+ Agregar Miembro</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sellers.map(seller => (
                  <div key={seller.id} className="bg-white border border-zinc-200 p-8 rounded-[3rem] flex flex-col items-center text-center hover:border-hungers transition-all shadow-sm group">
                    <div className="w-20 h-20 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-2xl font-black text-hungers-medium group-hover:bg-hungers group-hover:text-hungers-dark transition-all mb-4">
                      {seller.name.charAt(0)}
                    </div>
                    <h4 className="text-xl font-black text-hungers-dark uppercase">{seller.name}</h4>
                    <p className="text-[10px] font-bold text-hungers-medium uppercase tracking-widest mt-1">{seller.role}</p>
                    <div className="flex gap-4 w-full mt-8">
                       <button onClick={() => { setSelectedSellerForEdit(seller); setIsSellerModalOpen(true); }} className="flex-1 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-hungers text-hungers-dark transition-all">Configurar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedDeal && (
        <DealDetailModal 
          deal={selectedDeal} 
          onClose={() => setSelectedDeal(null)} 
          onUpdateDeal={handleUpdateDeal} 
          sellers={sellers} 
          contacts={contacts}
          onDelete={currentUser.role === 'admin' ? () => {
             if(window.confirm('¿Eliminar negocio?')) {
               setDeals(prev => prev.filter(d => d.id !== selectedDeal.id));
               setSelectedDeal(null);
             }
          } : undefined}
        />
      )}

      {isSellerModalOpen && (
        <SellerModal 
          seller={selectedSellerForEdit} 
          onClose={() => { setIsSellerModalOpen(false); setSelectedSellerForEdit(null); }} 
          onSave={(data) => {
             if(selectedSellerForEdit) {
               setSellers(prev => prev.map(s => s.id === selectedSellerForEdit.id ? {...s, ...data} : s));
             } else {
               const newSeller: Seller = { id: `sel-${Date.now()}`, name: data.name || '', role: (data.role as any) || 'seller', password: data.password };
               setSellers(prev => [...prev, newSeller]);
             }
             setIsSellerModalOpen(false);
          }} 
        />
      )}
    </div>
  );
};

export default App;
