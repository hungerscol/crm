import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DealCard from './components/DealCard';
import DealDetailModal from './components/DealDetailModal';
import SellerModal from './components/SellerModal';
import { Deal, DealStatus, Country, Seller, Currency, Contact, Activity } from './types';
import { INITIAL_DEALS, PIPELINE_STAGES, SELLERS as DEFAULT_SELLERS } from './constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const STORAGE_KEY = 'hungers_crm_v8_deals';
const SELLERS_KEY = 'hungers_crm_v8_sellers';
const CONTACTS_KEY = 'hungers_crm_v8_contacts';

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
  
  // Admin supervision state
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

  // Persistencia de datos - Garantiza que usuarios y deals se guarden siempre
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
      setViewingSellerId(null);
      setActiveTab('pipeline');
    } else {
      setLoginError('Credenciales incorrectas de Hungers.');
    }
  };

  const handleUpdateDeal = (updatedDeal: Deal) => {
    // Sincronizar contacto automáticamente
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

  const handleDeleteDeal = (id: string) => {
    if (currentUser?.role !== 'admin') return;
    if (window.confirm('¿Eliminar este negocio permanentemente?')) {
      setDeals(prev => prev.filter(d => d.id !== id));
      if (selectedDeal?.id === id) setSelectedDeal(null);
    }
  };

  const handleSaveSeller = (sellerData: Partial<Seller>) => {
    if (currentUser?.role !== 'admin') return;
    if (selectedSellerForEdit) {
      setSellers(prev => prev.map(s => s.id === selectedSellerForEdit.id ? { ...s, ...sellerData } : s));
    } else {
      const newSeller: Seller = {
        id: `sel-${Date.now()}`,
        name: sellerData.name || '',
        password: sellerData.password || '',
        role: (sellerData.role as 'admin' | 'seller') || 'seller',
        avatar: sellerData.avatar
      };
      setSellers(prev => [...prev, newSeller]);
    }
    setIsSellerModalOpen(false);
    setSelectedSellerForEdit(null);
  };

  const handleAddContact = () => {
    const name = prompt("Nombre del contacto:");
    if (name) {
      const newContact: Contact = {
        id: `con-${Date.now()}`,
        name,
        organization: 'Nueva Org',
        email: 'email@ejemplo.com',
        phone: '300...',
        createdAt: new Date().toISOString()
      };
      setContacts(prev => [...prev, newContact]);
    }
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           d.organization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === 'All' || d.country === countryFilter;
      
      let matchesSeller = true;
      if (viewingSellerId) {
        matchesSeller = d.sellerId === viewingSellerId;
      } else if (currentUser?.role !== 'admin') {
        matchesSeller = d.sellerId === currentUser?.id;
      }
      
      return matchesSearch && matchesCountry && matchesSeller;
    });
  }, [deals, searchTerm, countryFilter, currentUser, viewingSellerId]);

  const allActivities = useMemo(() => {
    const acts: (Activity & { dealTitle: string, dealId: string })[] = [];
    deals.forEach(d => {
      if (currentUser?.role === 'admin' || d.sellerId === currentUser?.id) {
        d.activities.forEach(a => {
          acts.push({ ...a, dealTitle: d.title, dealId: d.id });
        });
      }
    });
    return acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [deals, currentUser]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage] = filteredDeals.filter(d => d.status === stage);
    });
    return grouped;
  }, [filteredDeals]);

  if (!currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 font-sans">
        <div className="w-full max-sm:px-4 max-w-sm bg-white p-10 rounded-[3rem] shadow-2xl border border-zinc-200">
          <div className="w-24 h-24 bg-hungers rounded-[2.5rem] flex items-center justify-center text-zinc-950 font-black text-5xl mx-auto mb-10 shadow-xl shadow-hungers/30">H</div>
          <h1 className="text-3xl font-black text-zinc-950 tracking-tighter text-center mb-1 uppercase">Hunger CRM</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] text-center mb-10 opacity-60">Internal Sales Engine</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-3">Username</label>
              <input type="text" className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all" placeholder="vendedor.nombre" value={loginData.user} onChange={e => setLoginData({...loginData, user: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-3">Contraseña</label>
              <input type="password" className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all" placeholder="••••••••" value={loginData.pass} onChange={e => setLoginData({...loginData, pass: e.target.value})} required />
            </div>
            {loginError && <p className="text-red-600 text-[10px] font-black text-center bg-red-50 py-3 rounded-xl border border-red-100">{loginError}</p>}
            <button type="submit" className="w-full bg-hungers text-zinc-950 font-black py-6 rounded-3xl hover:shadow-2xl hover:shadow-hungers/40 active:scale-[0.98] transition-all uppercase text-xs tracking-widest mt-8">Acceder al Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  const selectedSeller = viewingSellerId ? sellers.find(s => s.id === viewingSellerId) : null;

  return (
    <div className="flex h-screen w-full bg-white text-zinc-950 overflow-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'pipeline') setViewingSellerId(null);
        }} 
        onLogout={() => setCurrentUser(null)} 
        syncStatus="success"
        userRole={currentUser.role}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-zinc-100 bg-white px-10 flex items-center justify-between z-10">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <h2 className="text-xs font-black uppercase text-zinc-950 tracking-[0.3em]">{activeTab}</h2>
              {viewingSellerId && selectedSeller && (
                <span className="text-[9px] font-black text-zinc-950 uppercase flex items-center gap-2 mt-1 px-3 py-1 bg-hungers rounded-full shadow-sm">
                   <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse"></div> Supervisando: {selectedSeller.name}
                </span>
              )}
            </div>
            <div className="h-8 w-px bg-zinc-100"></div>
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 p-1.5 rounded-2xl">
              {['All', 'Colombia', 'México'].map(c => (
                <button key={c} onClick={() => setCountryFilter(c as any)} className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all ${countryFilter === c ? 'bg-white text-zinc-950 shadow-md ring-1 ring-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}>{c === 'All' ? 'GLOBAL' : c.toUpperCase()}</button>
              ))}
            </div>
            {viewingSellerId && (
              <button onClick={() => setViewingSellerId(null)} className="text-[9px] font-black text-red-600 uppercase px-4 py-2 border border-red-100 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                Regresar
              </button>
            )}
          </div>

          <div className="flex items-center gap-8">
            <div className="relative group">
              <input type="text" placeholder="Buscar en Hungers..." className="bg-zinc-50 border border-zinc-100 rounded-2xl px-5 pl-12 py-3 text-xs font-bold focus:bg-white focus:border-hungers transition-all outline-none w-72" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <svg className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <button onClick={() => setSelectedDeal({ id: `d-${Date.now()}`, title: '', value: 0, currency: 'COP', contactName: '', organization: '', phone: '', email: '', address: '', status: DealStatus.LEAD_IN, priority: 'medium', activities: [], nextSteps: '', createdAt: new Date().toISOString(), country: 'Colombia', sellerId: viewingSellerId || currentUser.id })} className="bg-hungers text-zinc-950 w-12 h-12 rounded-[1.5rem] flex items-center justify-center font-black shadow-xl shadow-hungers/30 hover:scale-110 active:scale-95 transition-all text-2xl">+</button>
            <div className="flex items-center gap-4 group cursor-pointer">
               <div className="text-right">
                 <p className="text-[11px] font-black leading-none text-zinc-950 uppercase">{currentUser.name}</p>
                 <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{currentUser.role}</p>
               </div>
               <div className="w-12 h-12 rounded-[1.5rem] bg-zinc-50 border border-zinc-200 flex items-center justify-center text-lg font-black text-zinc-400 shadow-sm group-hover:bg-hungers group-hover:text-zinc-950 transition-all">{currentUser.name.charAt(0)}</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-zinc-50/50">
          {activeTab === 'pipeline' && (
            <div className="h-full overflow-x-auto p-8 flex gap-8 custom-scrollbar">
              {PIPELINE_STAGES.map(stage => (
                <div key={stage} className={`pipeline-column flex flex-col rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden bg-zinc-50 ${draggedOverStage === stage ? 'ring-4 ring-hungers bg-hungers/10' : ''}`} onDragOver={e => { e.preventDefault(); setDraggedOverStage(stage as any); }} onDragLeave={() => setDraggedOverStage(null)} onDrop={e => { e.preventDefault(); setDraggedOverStage(null); const id = e.dataTransfer.getData('dealId'); setDeals(prev => prev.map(d => d.id === id ? { ...d, status: stage as any } : d)); }}>
                  <div className="p-6 bg-zinc-100/50 border-b border-zinc-200 flex justify-between items-center">
                    <h3 className="text-[11px] font-black text-zinc-950 uppercase tracking-[0.2em]">{stage}</h3>
                    <span className="text-[10px] font-black text-zinc-950 bg-white border border-zinc-200 px-3 py-1 rounded-full shadow-sm">{dealsByStage[stage]?.length || 0}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {dealsByStage[stage]?.map(deal => <DealCard key={deal.id} deal={deal} onClick={setSelectedDeal} onDragStart={(e, id) => e.dataTransfer.setData('dealId', id)} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="p-12 h-full overflow-y-auto bg-white">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-4xl font-black tracking-tighter text-zinc-950 uppercase">Directorio de Personas</h3>
                  <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mt-2 opacity-60 italic">Base central de Hungers S.A.S</p>
                </div>
                <button onClick={handleAddContact} className="bg-hungers text-zinc-950 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">+ Nuevo Contacto</button>
              </div>
              <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-zinc-950 font-black uppercase text-[10px] border-b border-zinc-100 tracking-widest">
                    <tr>
                      <th className="p-8">Contacto</th>
                      <th>Organización</th>
                      <th>Credenciales</th>
                      <th className="p-8 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {contacts.map(c => (
                      <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="p-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.2rem] bg-zinc-100 flex items-center justify-center font-black text-zinc-400 group-hover:bg-hungers group-hover:text-zinc-950 transition-all">{c.name.charAt(0)}</div>
                            <span className="font-black text-zinc-950 text-sm uppercase tracking-tight">{c.name}</span>
                          </div>
                        </td>
                        <td className="text-zinc-600 font-bold text-xs uppercase tracking-tighter">{c.organization}</td>
                        <td className="space-y-1">
                          <p className="text-[10px] text-zinc-400 font-bold">{c.email}</p>
                          <p className="text-[10px] text-zinc-800 font-black tracking-widest">{c.phone}</p>
                        </td>
                        <td className="p-8 text-right">
                          <button className="text-[9px] font-black uppercase px-6 py-3 rounded-xl border border-zinc-200 hover:bg-hungers hover:text-zinc-950 transition-all">Ver Perfil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="p-12 h-full overflow-y-auto bg-white">
              <h3 className="text-4xl font-black mb-12 tracking-tighter text-zinc-950 uppercase">Agenda de Ventas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allActivities.map(act => (
                  <div key={act.id} className="flex flex-col gap-4 bg-zinc-50 border border-zinc-100 p-8 rounded-[2.5rem] hover:border-hungers transition-all group shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center border border-zinc-100 text-3xl shadow-sm group-hover:scale-110 transition-transform">
                        {act.type === 'Llamada' ? '📞' : act.type === 'Reunión' ? '🤝' : '📄'}
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[8px] font-black tracking-[0.2em] ${act.completed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {act.completed ? 'OK' : 'PENDIENTE'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-hungers uppercase tracking-[0.2em] mb-2">{act.dealTitle}</p>
                      <p className="text-sm font-black text-zinc-950 leading-tight line-clamp-2">{act.content}</p>
                      <div className="flex items-center gap-4 mt-6">
                        <span className="text-[10px] text-zinc-500 font-black uppercase">📅 {act.dueDate ? new Date(act.dueDate).toLocaleDateString() : 'Pronto'}</span>
                      </div>
                    </div>
                    <button onClick={() => {
                      const deal = deals.find(d => d.id === act.dealId);
                      if (deal) setSelectedDeal(deal);
                    }} className="w-full text-[10px] font-black uppercase text-zinc-950 bg-hungers py-4 rounded-[1.2rem] transition-all hover:shadow-lg shadow-hungers/20">Ir al Deal</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'team' && currentUser.role === 'admin' && (
            <div className="p-12 h-full overflow-y-auto bg-white flex flex-col items-center">
              <div className="w-full max-w-5xl">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-12 mb-12">
                  <div>
                    <h3 className="text-5xl font-black text-zinc-950 tracking-tighter uppercase">Panel de Control</h3>
                    <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mt-2 italic">Supervisión táctica de representantes Hungers.</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedSellerForEdit(null); setIsSellerModalOpen(true); }} 
                    className="bg-hungers text-zinc-950 px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:shadow-xl shadow-hungers/30 transition-all flex items-center gap-3"
                  >
                    + Agregar Miembro
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sellers.map(seller => (
                    <div key={seller.id} className="bg-white border border-zinc-200 p-10 rounded-[3rem] flex flex-col items-center gap-8 group hover:border-hungers transition-all shadow-xl shadow-zinc-100/50">
                      <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-3xl font-black text-zinc-400 group-hover:bg-hungers group-hover:text-zinc-950 transition-all">
                        {seller.name.charAt(0)}
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-zinc-950 leading-none mb-1 uppercase tracking-tight">{seller.name}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em]">{seller.role}</p>
                      </div>
                      
                      <div className="flex items-center gap-10 w-full border-t border-zinc-50 pt-8 mt-2">
                        <div className="flex-1 text-center cursor-pointer hover:bg-zinc-50 rounded-2xl p-4 transition-all border border-transparent hover:border-hungers" onClick={() => { setViewingSellerId(seller.id); setActiveTab('pipeline'); }}>
                          <p className="text-3xl font-black text-zinc-950">{deals.filter(d => d.sellerId === seller.id).length}</p>
                          <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Pipeline</p>
                        </div>
                        <div className="w-px h-12 bg-zinc-100"></div>
                        <div className="flex-1 text-center">
                          <p className="text-3xl font-black text-zinc-950">{deals.filter(d => d.sellerId === seller.id && d.status === DealStatus.WON).length}</p>
                          <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Won</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 w-full mt-4">
                        <button onClick={() => { setSelectedSellerForEdit(seller); setIsSellerModalOpen(true); }} className="flex-1 text-[10px] font-black uppercase py-4 bg-hungers text-zinc-950 rounded-2xl hover:shadow-lg transition-all">Configurar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="p-12 h-full overflow-y-auto bg-white space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: 'Pipeline Global', value: deals.length, icon: '📈' },
                  { label: 'Contactos Base', value: contacts.length, icon: '👥' },
                  { label: 'Acciones Pendientes', value: allActivities.filter(a => !a.completed).length, icon: '⚡' },
                  { label: 'Valor Proyectado', value: `$${deals.reduce((a, b) => a + b.value, 0).toLocaleString()}`, icon: '💵' }
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-50 text-zinc-950 p-10 rounded-[3rem] border border-zinc-100 hover:border-hungers hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-4xl">{s.icon}</span>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                    <p className="text-4xl font-black text-zinc-950 tracking-tighter">{s.value}</p>
                  </div>
                ))}
              </div>
              
              <div className="h-[500px] border border-zinc-100 p-12 rounded-[3.5rem] shadow-xl bg-white relative">
                <div className="mb-10">
                  <h4 className="text-[12px] font-black uppercase text-zinc-950 tracking-[0.4em] mb-2">Salud del Embudo de Ventas</h4>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest italic opacity-50">Distribución táctica por estados</p>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={PIPELINE_STAGES.map(s => ({ name: s.substring(0, 15), count: (filteredDeals.filter(d => d.status === s)).length }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} stroke="#94a3b8" />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="#94a3b8" />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900'}} />
                    <Bar dataKey="count" fill="#c1ff72" radius={[16, 16, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
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
          onDelete={currentUser.role === 'admin' ? () => handleDeleteDeal(selectedDeal.id) : undefined}
        />
      )}

      {isSellerModalOpen && (
        <SellerModal 
          seller={selectedSellerForEdit} 
          onClose={() => { setIsSellerModalOpen(false); setSelectedSellerForEdit(null); }} 
          onSave={handleSaveSeller} 
        />
      )}
    </div>
  );
};

export default App;