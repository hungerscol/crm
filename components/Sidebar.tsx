
import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  syncStatus: 'idle' | 'success' | 'error' | 'syncing';
  userRole?: 'admin' | 'seller';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, syncStatus, userRole }) => {
  const allMenuItems = [
    { id: 'pipeline', label: 'Negocios', icon: 'M4 6h16M4 12h16M4 18h7' },
    { id: 'dashboard', label: 'Insights', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
    { id: 'leads', label: 'Personas', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'activities', label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'team', label: 'Equipo', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true },
  ];

  const menuItems = allMenuItems.filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <aside className="w-16 lg:w-52 bg-[#f8f9fa] border-r border-zinc-200 h-screen flex flex-col transition-all duration-300 z-20">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6">
        <div className="w-8 h-8 bg-hungers rounded-lg flex items-center justify-center text-zinc-950 font-black text-lg shadow-sm">H</div>
        <span className="hidden lg:block ml-3 font-black text-xs tracking-tight text-zinc-950">HUNGER CRM</span>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center lg:px-4 py-2.5 rounded-lg transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200' 
                : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-950'
            }`}
          >
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
              <svg className={`w-4 h-4 ${activeTab === item.id ? 'text-zinc-950' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
              </svg>
            </div>
            <span className="hidden lg:block ml-3 text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            {activeTab === item.id && <div className="hidden lg:block ml-auto w-1 h-1 rounded-full bg-hungers"></div>}
          </button>
        ))}
      </nav>

      <div className="p-2 space-y-1 border-t border-zinc-200">
        <button 
          onClick={onLogout}
          className="w-full flex items-center lg:px-4 py-3 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </div>
          <span className="hidden lg:block ml-3 text-[10px] font-black uppercase tracking-wider">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
