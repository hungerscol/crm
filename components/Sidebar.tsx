
import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  syncStatus: 'idle' | 'success' | 'error' | 'syncing';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, syncStatus }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
    { id: 'admin', label: 'Administración', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'pipeline', label: 'Ventas', icon: 'M4 6h16M4 12h16M4 18h7' },
    { id: 'leads', label: 'Contactos', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'activities', label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'profile', label: 'Configuración', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-dark-lighter border-r border-dark-border h-screen flex flex-col transition-all duration-300 z-20">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-hungers rounded-2xl flex items-center justify-center text-dark font-black text-xl shadow-lg shadow-hungers/20">H</div>
        <span className="hidden lg:block font-black text-xl tracking-tighter text-white">HUNGERS <span className="text-hungers">CRM</span></span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-hungers text-dark font-black shadow-lg shadow-hungers/10' 
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-white'
            }`}
          >
            <svg className={`w-6 h-6 transition-transform group-hover:scale-110`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
            </svg>
            <span className="hidden lg:block text-xs uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-dark-border bg-zinc-950/20 space-y-4">
        {/* GitHub Status Indicator */}
        <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800">
           <svg className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin text-hungers' : 'text-zinc-600'}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
           </svg>
           <div className="hidden lg:block overflow-hidden">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">GitHub Sync</p>
              <p className="text-[8px] text-zinc-600 truncate">
                {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'success' ? 'Actualizado' : 'Desconectado'}
              </p>
           </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
        </button>

        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">AD</div>
          <div className="hidden lg:block">
            <p className="text-[10px] font-black text-white uppercase tracking-wider">Perfil Administrador</p>
            <p className="text-[9px] text-hungers font-bold">Acceso Total</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
