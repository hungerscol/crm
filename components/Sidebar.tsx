
import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  syncStatus: 'idle' | 'success' | 'error' | 'syncing';
  userRole?: 'admin' | 'seller';
  onOpenImport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, syncStatus, userRole, onOpenImport }) => {
  const allMenuItems = [
    { id: 'pipeline', label: 'Negocios', icon: 'M4 6h16M4 12h16M4 18h7' },
    { id: 'dashboard', label: 'Insights', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
    { id: 'leads', label: 'Personas', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'activities', label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'team', label: 'Equipo', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true },
  ];

  const menuItems = allMenuItems.filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <aside className="w-16 lg:w-52 bg-white/20 backdrop-blur-sm lg:bg-transparent h-full flex flex-col transition-all duration-300 z-20">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6">
        <div className="w-10 h-10 bg-hungers-medium rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">H</div>
        <span className="hidden lg:block ml-3 font-black text-[10px] tracking-tight text-hungers-dark uppercase">HUNGERS</span>
      </div>
      
      <nav className="flex-1 px-2 py-8 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center lg:px-5 py-3 rounded-2xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-hungers text-hungers-dark shadow-md ring-1 ring-hungers-medium/30' 
                : 'text-hungers-dark hover:bg-white/40'
            }`}
          >
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
              <svg className={`w-5 h-5 ${activeTab === item.id ? 'text-hungers-dark' : 'text-hungers-medium'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
              </svg>
            </div>
            <span className="hidden lg:block ml-4 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-hungers-medium/10 space-y-2">
        <button
          onClick={onOpenImport}
          className="w-full flex items-center lg:px-5 py-3 rounded-2xl text-hungers-dark hover:bg-hungers/20 transition-all"
        >
          <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
            <svg className="w-5 h-5 text-hungers-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
            </svg>
          </div>
          <span className="hidden lg:block ml-4 text-[10px] font-black uppercase tracking-widest">Importar CSV</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center lg:px-5 py-3 rounded-2xl text-hungers-dark hover:text-red-700 hover:bg-red-50 transition-all"
        >
          <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </div>
          <span className="hidden lg:block ml-4 text-[10px] font-black uppercase tracking-widest">Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
