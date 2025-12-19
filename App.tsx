
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DealCard from './components/DealCard';
import DealDetailModal from './components/DealDetailModal';
import { Deal, DealStatus, Country, GithubSyncState } from './types';
import { INITIAL_DEALS, PIPELINE_STAGES, SELLERS } from './constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const STORAGE_KEY = 'hungers_crm_deals_v1';
const GITHUB_KEY = 'hungers_crm_github_config';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: 'admin@hungers.com', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [deals, setDeals] = useState<Deal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DEALS;
  });

  const [githubConfig, setGithubConfig] = useState(() => {
    const saved = localStorage.getItem(GITHUB_KEY);
    return saved ? JSON.parse(saved) : { token: '', repo: 'hungerscol/CRM' };
  });

  const [syncState, setSyncState] = useState<GithubSyncState>({
    isSyncing: false,
    lastSync: localStorage.getItem('last_github_sync'),
    status: 'idle'
  });

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedOverStage, setDraggedOverStage] = useState<DealStatus | null>(null);
  
  const [filterCountry, setFilterCountry] = useState<Country | 'All'>('All');
  const [filterSeller, setFilterSeller] = useState<string | 'All'>('All');

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passUpdateStatus, setPassUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    localStorage.setItem(GITHUB_KEY, JSON.stringify(githubConfig));
  }, [githubConfig]);

  const getCleanRepo = () => {
    return githubConfig.repo.replace('https://github.com/', '').replace('.git', '');
  };

  const handleGithubSync = async () => {
    if (!githubConfig.token) {
      setActiveTab('profile');
      alert("⚠️ Error: Falta el Token de GitHub. Por favor, ingrésalo en la pestaña de Configuración.");
      return;
    }

    const ownerRepo = getCleanRepo();
    if (!ownerRepo.includes('/')) {
      alert("⚠️ Error: Formato de repositorio inválido. Usa 'usuario/repositorio'.");
      return;
    }

    setSyncState(prev => ({ ...prev, isSyncing: true, status: 'idle' }));
    
    try {
      const path = 'deals.json';
      const url = `https://api.github.com/repos/${ownerRepo}/contents/${path}`;
      
      let sha: string | null = null;
      try {
        const getRes = await fetch(url, {
          headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (getRes.ok) {
          const data = await getRes.json();
          sha = data.sha;
        }
      } catch (e) {
        console.log("File likely doesn't exist yet.");
      }

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(deals, null, 2))));
      const body = {
        message: `🔄 Hungers Sync: ${new Date().toISOString()}`,
        content: content,
        sha: sha || undefined
      };

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(body)
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(errData.message || "Error al subir a GitHub");
      }

      const now = new Date().toLocaleString();
      localStorage.setItem('last_github_sync', now);
      setSyncState({
        isSyncing: false,
        lastSync: now,
        status: 'success'
      });
      alert("✅ Sincronización exitosa con GitHub!");
    } catch (error: any) {
      console.error("Sync Error:", error);
      setSyncState(prev => ({ ...prev, isSyncing: false, status: 'error' }));
      alert(`❌ Error de Sincronización: ${error.message}`);
    }
  };

  const handleGithubPull = async () => {
    if (!githubConfig.token) {
      setActiveTab('profile');
      alert("⚠️ Error: Falta el Token de GitHub.");
      return;
    }

    const ownerRepo = getCleanRepo();
    setSyncState(prev => ({ ...prev, isSyncing: true }));

    try {
      const path = 'deals.json';
      const url = `https://api.github.com/repos/${ownerRepo}/contents/${path}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) {
        throw new Error("No se encontró el archivo de base de datos en el repositorio.");
      }

      const data = await res.json();
      const decodedContent = decodeURIComponent(escape(atob(data.content)));
      const pulledDeals = JSON.parse(decodedContent);

      if (Array.isArray(pulledDeals)) {
        if (confirm("⚠️ ¿Estás seguro? Los datos actuales serán sobrescritos por los de GitHub.")) {
          setDeals(pulledDeals);
          setSyncState({
            isSyncing: false,
            lastSync: new Date().toLocaleString(),
            status: 'success'
          });
          alert("✅ Datos restaurados exitosamente desde GitHub.");
        } else {
           setSyncState(prev => ({ ...prev, isSyncing: false }));
        }
      }
    } catch (error: any) {
      console.error("Pull Error:", error);
      setSyncState(prev => ({ ...prev, isSyncing: false, status: 'error' }));
      alert(`❌ Error al importar: ${error.message}`);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password.length >= 4) {
      setIsLoggedIn(true);
    } else {
      alert("Credenciales inválidas (admin@hungers.com / pass: 1234)");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginForm({ ...loginForm, password: '' });
  };

  const handleUpdateDeal = (updatedDeal: Deal) => {
    setDeals(prevDeals => {
      const exists = prevDeals.some(d => d.id === updatedDeal.id);
      if (exists) {
        return prevDeals.map(d => d.id === updatedDeal.id ? updatedDeal : d);
      } else {
        return [...prevDeals, updatedDeal];
      }
    });
  };

  const createNewDeal = () => {
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      title: 'Nuevo Prospecto',
      value: 0,
      contactName: '',
      organization: '',
      phone: '',
      email: '',
      address: '',
      status: DealStatus.LEAD_IN,
      priority: 'medium',
      activities: [],
      nextSteps: '',
      createdAt: new Date().toISOString(),
      country: 'Colombia',
      sellerId: SELLERS[0].id
    };
    setSelectedDeal(newDeal);
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDrop = (e: React.DragEvent, stage: DealStatus) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const dealId = e.dataTransfer.getData('dealId');
    setDeals(prevDeals => prevDeals.map(deal => 
      deal.id === dealId ? { ...deal, status: stage } : deal
    ));
  };

  const exportCSV = () => {
    const headers = "ID,Empresa,Contacto,Email,Telefono,Pais,Vendedor,USD,Estado\n";
    const rows = deals.map(d => {
      const seller = SELLERS.find(s => s.id === d.sellerId)?.name || 'N/A';
      return `"${d.id}","${d.organization}","${d.contactName}","${d.email}","${d.phone}","${d.country}","${seller}",${d.value},"${d.status}"`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `HungersCRM_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(d => 
      (searchTerm === '' || d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       d.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
       d.contactName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCountry === 'All' || d.country === filterCountry) &&
      (filterSeller === 'All' || d.sellerId === filterSeller)
    );
  }, [deals, searchTerm, filterCountry, filterSeller]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStatus, Deal[]> = {} as any;
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage] = filteredDeals.filter(d => d.status === stage);
    });
    return grouped;
  }, [filteredDeals]);

  const totalValue = useMemo(() => {
    return filteredDeals.reduce((acc, curr) => acc + curr.value, 0);
  }, [filteredDeals]);

  const chartDataStages = useMemo(() => {
    return PIPELINE_STAGES.map(stage => ({
      name: stage,
      value: filteredDeals.filter(d => d.status === stage).reduce((a, b) => a + b.value, 0),
    }));
  }, [filteredDeals]);

  const chartDataPriority = useMemo(() => {
    return ['low', 'medium', 'high'].map(p => ({
      name: p.toUpperCase(),
      value: filteredDeals.filter(d => d.priority === p).length
    }));
  }, [filteredDeals]);

  const PRIORITY_COLORS = ['#3b82f6', '#eab308', '#ef4444'];

  const renderLogin = () => (
    <div className="flex h-screen w-full items-center justify-center bg-dark">
      <div className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-hungers rounded-3xl flex items-center justify-center text-dark font-black text-3xl shadow-2xl shadow-hungers/40 mb-6 animate-pulse">H</div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">HUNGERS <span className="text-hungers">CRM</span></h1>
          <p className="text-zinc-500 text-sm mt-2">Internal Management Suite</p>
        </div>
        <form onSubmit={handleLogin} className="bg-dark-lighter border border-dark-border p-8 rounded-3xl shadow-2xl space-y-6">
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Usuario Administrador</label>
            <input type="email" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white outline-none focus:border-hungers/50 transition-all shadow-inner" value={loginForm.email} onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Código de Acceso</label>
            <input type="password" required placeholder="••••••••" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white outline-none focus:border-hungers/50 transition-all shadow-inner" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-hungers text-dark font-black py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-hungers/20 uppercase text-xs tracking-[0.2em]">Acceder</button>
        </form>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-dark custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-lighter border border-dark-border p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Valor Pipeline Filtrado</p>
          <p className="text-3xl font-black text-white">${totalValue.toLocaleString()}</p>
          <p className="text-xs text-hungers mt-2 font-bold">~ $ {(totalValue * 4200).toLocaleString()} COP</p>
        </div>
        <div className="bg-dark-lighter border border-dark-border p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Tratos Activos</p>
          <p className="text-3xl font-black text-white">{filteredDeals.length}</p>
          <p className="text-xs text-zinc-400 mt-2 font-bold">En vista actual</p>
        </div>
        <div className="bg-dark-lighter border border-dark-border p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">País Destacado</p>
          <p className="text-3xl font-black text-white">CO</p>
          <p className="text-xs text-zinc-400 mt-2 font-bold">65% del volumen</p>
        </div>
        <div className="bg-dark-lighter border border-dark-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
            <div className={`w-2 h-2 rounded-full animate-ping ${syncState.status === 'success' ? 'bg-hungers' : 'bg-red-500'}`}></div>
          </div>
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">GitHub Status</p>
          <p className={`text-3xl font-black ${syncState.status === 'success' ? 'text-hungers' : 'text-zinc-500'}`}>{syncState.status === 'success' ? 'LIVE' : 'OFFLINE'}</p>
          <p className="text-[10px] text-zinc-400 mt-2 font-bold truncate">Sync: {syncState.lastSync || 'Pendiente'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-dark-lighter border border-dark-border p-6 rounded-2xl h-[400px] flex flex-col">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Monto por Etapa (Actual)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataStages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} itemStyle={{ color: '#c1ff72', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="value" fill="#c1ff72" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-dark-lighter border border-dark-border p-6 rounded-2xl h-[400px] flex flex-col">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Prioridades del Pipeline</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartDataPriority} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {chartDataPriority.map((entry, index) => <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-dark custom-scrollbar">
       <div className="flex flex-col md:flex-row gap-4 items-center bg-dark-lighter border border-dark-border p-6 rounded-2xl shadow-xl">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Filtrar por País</label>
            <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-hungers/50 transition-all" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value as any)}>
              <option value="All">Todos los Países</option>
              <option value="Colombia">Colombia</option>
              <option value="México">México</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Filtrar por Vendedor</label>
            <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-hungers/50 transition-all" value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)}>
              <option value="All">Todos los Vendedores</option>
              {SELLERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-end h-full">
            <button 
              onClick={handleGithubSync}
              disabled={syncState.isSyncing}
              className={`flex items-center gap-3 bg-white text-dark text-[10px] font-black uppercase px-6 py-4 rounded-xl transition-all tracking-widest ${syncState.isSyncing ? 'opacity-50' : 'hover:bg-hungers'}`}
            >
              <svg className={`w-4 h-4 ${syncState.isSyncing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {syncState.isSyncing ? 'Subiendo...' : 'Push to GitHub'}
            </button>
            <button onClick={exportCSV} className="bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase px-6 py-4 rounded-xl border border-zinc-700 transition-all tracking-widest">Reporte CSV</button>
          </div>
       </div>

       <div className="bg-dark-lighter border border-dark-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-dark-border bg-zinc-900/40 flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Performance de Ventas</h3>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Mostrando {filteredDeals.length} resultados</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4">Vendedor</th>
                <th className="p-4">País</th>
                <th className="p-4">Cliente / Empresa</th>
                <th className="p-4">Valor USD</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredDeals.map(d => (
                <tr key={d.id} className="hover:bg-zinc-900/50 cursor-pointer transition-colors" onClick={() => setSelectedDeal(d)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-hungers/10 flex items-center justify-center text-hungers font-bold text-xs">{SELLERS.find(s => s.id === d.sellerId)?.name.charAt(0)}</div>
                      <span className="font-bold text-white">{SELLERS.find(s => s.id === d.sellerId)?.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.country === 'México' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>{d.country}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white">{d.organization}</div>
                    <div className="text-[10px] text-zinc-500">{d.contactName}</div>
                  </td>
                  <td className="p-4 font-black text-white">${d.value.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );

  const renderPipeline = () => (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
      <div className="flex gap-6 h-full min-w-max">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage} className={`w-80 flex flex-col h-full bg-zinc-900/20 rounded-2xl border transition-all duration-200 ${draggedOverStage === stage ? 'border-hungers/50 bg-hungers/5' : 'border-white/5'}`}
            onDragOver={(e) => { e.preventDefault(); setDraggedOverStage(stage); }}
            onDrop={(e) => handleDrop(e, stage)}
            onDragLeave={() => setDraggedOverStage(null)}>
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">{stage}</h3>
                <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full">{dealsByStage[stage]?.length || 0}</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-500">${(dealsByStage[stage]?.reduce((a, b) => a + b.value, 0) || 0).toLocaleString()}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {dealsByStage[stage]?.map((deal) => (
                <DealCard key={deal.id} deal={deal} onClick={setSelectedDeal} onDragStart={handleDragStart} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <div className="bg-dark-lighter rounded-2xl border border-dark-border overflow-hidden shadow-2xl">
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
           <h3 className="text-xs font-black text-white uppercase tracking-widest">Base de Datos de Clientes</h3>
           <button onClick={exportCSV} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition-all font-bold">Descargar .CSV</button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-4">Contacto</th>
              <th className="p-4">Organización</th>
              <th className="p-4">Canal</th>
              <th className="p-4">País</th>
              <th className="p-4">Vendedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {filteredDeals.map(d => (
              <tr key={d.id} className="hover:bg-zinc-900/50 cursor-pointer transition-colors" onClick={() => setSelectedDeal(d)}>
                <td className="p-4">
                  <div className="font-bold text-white">{d.contactName}</div>
                  <div className="text-[10px] text-zinc-600 font-mono">{d.email}</div>
                </td>
                <td className="p-4 text-zinc-400">{d.organization}</td>
                <td className="p-4 text-zinc-400">{d.phone}</td>
                <td className="p-4 text-zinc-500 text-xs uppercase font-bold">{d.country}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded bg-hungers/10 text-hungers text-[10px] font-bold uppercase tracking-wider">
                    {SELLERS.find(s => s.id === d.sellerId)?.name.split(' ')[0]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const allActivities = deals.flatMap(d => d.activities.map(a => ({ ...a, dealTitle: d.title, org: d.organization, dealId: d.id })));
    const today = new Date().toISOString().split('T')[0];
    return (
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-dark">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
          <div className="lg:col-span-3">
             <div className="grid grid-cols-7 gap-px bg-dark-border border border-dark-border rounded-2xl overflow-hidden shadow-2xl">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="bg-zinc-900 p-4 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">{d}</div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const day = (i % 31) + 1;
                const isToday = day === parseInt(today.split('-')[2]);
                return (
                  <div key={i} className={`bg-dark-lighter min-h-[140px] p-2 transition-colors group relative border-r border-b border-zinc-800/20 ${isToday ? 'bg-hungers/[0.03]' : 'hover:bg-zinc-900'}`}>
                    <span className={`text-[10px] font-mono ${isToday ? 'text-hungers font-black' : 'text-zinc-700 group-hover:text-zinc-400'}`}>{day}</span>
                    <div className="mt-2 space-y-1">
                      {allActivities.filter(act => new Date(act.date).getDate() === day).map(act => (
                        <div key={act.id} className="p-1 px-2 bg-zinc-800 border-l-2 border-hungers text-[9px] text-zinc-300 rounded cursor-pointer hover:bg-zinc-700" onClick={() => setSelectedDeal(deals.find(de => de.id === act.dealId) || null)}>
                          {act.dealTitle}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-dark-lighter border border-dark-border rounded-2xl p-6 flex flex-col">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Próximos Pasos</h3>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
              {allActivities.filter(a => new Date(a.date).getTime() >= new Date().getTime()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(a => (
                 <div key={a.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-hungers transition-all cursor-pointer" onClick={() => setSelectedDeal(deals.find(de => de.id === a.dealId) || null)}>
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[9px] font-bold text-hungers uppercase">{a.type}</span>
                     <span className="text-[9px] text-zinc-600 font-mono">{a.date}</span>
                   </div>
                   <p className="text-[11px] text-white font-bold">{a.org}</p>
                   <p className="text-[10px] text-zinc-500 truncate">{a.content}</p>
                 </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="flex-1 p-8 flex flex-col items-center overflow-y-auto bg-dark custom-scrollbar space-y-8">
      <div className="w-full max-w-2xl bg-dark-lighter rounded-2xl border border-dark-border p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-hungers"></div>
        <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">Configuración de Seguridad</h2>
        <div className="space-y-8">
          <div className="flex flex-col items-center p-6 bg-zinc-950/40 border border-zinc-800 rounded-2xl">
            <div className="relative">
              <img src="https://picsum.photos/seed/user/140" className="w-24 h-24 rounded-2xl border-2 border-hungers p-1" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-hungers rounded-lg flex items-center justify-center text-dark shadow-lg">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <h3 className="text-white font-black mt-4 uppercase">Admin Hungers</h3>
            <p className="text-zinc-500 text-xs font-mono">ID: SEC-88912-X</p>
          </div>
          <div className="pt-4 border-t border-dark-border">
            <h4 className="text-xs font-black text-zinc-500 mb-6 uppercase tracking-[0.2em]">Cambio de Contraseña</h4>
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordUpdate(); }} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Contraseña Actual</label>
                <input type="password" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-hungers/50 outline-none transition-all" value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Nueva Contraseña</label>
                  <input type="password" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-hungers/50 outline-none transition-all" value={passwordForm.next} onChange={(e) => setPasswordForm({...passwordForm, next: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Repetir Contraseña</label>
                  <input type="password" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-hungers/50 outline-none transition-all" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-zinc-800 text-white font-black py-4 rounded-xl hover:bg-zinc-700 transition-all uppercase text-xs tracking-widest">Actualizar Seguridad</button>
            </form>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-dark-lighter rounded-2xl border border-dark-border p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Integración GitHub</h2>
        <p className="text-zinc-500 text-xs mb-8">Respalda automáticamente tu pipeline de ventas en un repositorio privado usando GitHub API.</p>
        
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">GitHub Personal Access Token (PAT)</label>
            <input 
              type="password" 
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-white/50 outline-none transition-all" 
              value={githubConfig.token} 
              onChange={(e) => setGithubConfig({...githubConfig, token: e.target.value})} 
            />
            <p className="text-[9px] text-zinc-600 mt-2 italic">* El token requiere permisos 'repo' para escribir en el repositorio.</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Repositorio (Owner/Repo)</label>
            <input 
              type="text" 
              placeholder="hungerscol/CRM"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-white/50 outline-none transition-all" 
              value={githubConfig.repo} 
              onChange={(e) => setGithubConfig({...githubConfig, repo: e.target.value})} 
            />
          </div>
          
          <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col gap-6">
            <div className="flex items-center gap-4">
               <div className={`w-4 h-4 rounded-full ${syncState.status === 'success' ? 'bg-hungers shadow-[0_0_15px_#c1ff72]' : 'bg-zinc-700'}`}></div>
               <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Estado de Respaldo</p>
                  <p className="text-[10px] text-zinc-500">Última Sincronización: {syncState.lastSync || 'Pendiente de primer push'}</p>
               </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={handleGithubSync}
                disabled={syncState.isSyncing}
                className={`flex-1 px-8 py-3 rounded-xl text-xs font-black uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${syncState.isSyncing ? 'bg-zinc-800 text-zinc-600' : 'bg-white text-dark hover:bg-hungers'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                {syncState.isSyncing ? 'Subiendo...' : 'Push to GitHub'}
              </button>
              <button 
                onClick={handleGithubPull}
                disabled={syncState.isSyncing}
                className={`flex-1 px-8 py-3 rounded-xl text-xs font-black uppercase transition-all shadow-lg border border-zinc-700 flex items-center justify-center gap-2 hover:bg-zinc-800 text-white`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {syncState.isSyncing ? 'Bajando...' : 'Pull from GitHub'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handlePasswordUpdate = () => {
    setPassUpdateStatus('loading');
    setTimeout(() => setPassUpdateStatus('success'), 1000);
  };

  if (!isLoggedIn) {
    return renderLogin();
  }

  return (
    <div className="flex h-screen w-full bg-dark overflow-hidden font-sans selection:bg-hungers selection:text-dark">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} syncStatus={syncState.isSyncing ? 'syncing' : syncState.status} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-dark-border bg-dark-lighter px-8 flex items-center justify-between sticky top-0 z-10 shadow-lg shadow-black/40">
          <div className="flex items-center gap-10 flex-1">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              {activeTab === 'dashboard' && 'Dashboard Operativo'}
              {activeTab === 'admin' && 'Panel Administrativo'}
              {activeTab === 'pipeline' && 'Pipeline de Ventas'}
              {activeTab === 'leads' && 'Directorio de Clientes'}
              {activeTab === 'activities' && 'Agenda Operativa'}
              {activeTab === 'profile' && 'Perfil de Seguridad'}
            </h1>
            <div className="relative w-full max-w-md hidden md:block">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Buscar clientes o vendedores..." className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-hungers focus:ring-1 focus:ring-hungers/20 transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={createNewDeal} className="bg-hungers text-dark px-8 py-3 rounded-2xl font-black text-[10px] uppercase hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-hungers/30 tracking-widest">
              + Nuevo Lead
            </button>
            <div className="w-px h-10 bg-zinc-800 mx-2"></div>
            <button onClick={() => setActiveTab('profile')} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-zinc-800 hover:border-hungers transition-all shadow-xl shadow-black/40 p-0.5">
              <img src="https://picsum.photos/seed/user/48" alt="Profile" className="w-full h-full rounded-xl object-cover" />
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'admin' && renderAdmin()}
        {activeTab === 'pipeline' && renderPipeline()}
        {activeTab === 'leads' && renderContacts()}
        {activeTab === 'activities' && renderCalendar()}
        {activeTab === 'profile' && renderProfile()}
      </main>
      <DealDetailModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onUpdateDeal={handleUpdateDeal} />
    </div>
  );
};

export default App;
