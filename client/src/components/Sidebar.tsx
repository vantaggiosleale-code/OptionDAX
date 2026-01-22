import { LayoutDashboard, TrendingUp, Calculator, History, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen?: boolean;
}

export function Sidebar({ currentView, onNavigate, isOpen = false }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'payoff', label: 'Simulatore Payoff', icon: TrendingUp },
    { id: 'greeks', label: 'Calcolatore Greche', icon: Calculator },
    { id: 'history', label: 'Storico', icon: History },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-60 transition-transform duration-300 shadow-lg ${
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    }`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Option DAX
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Professional Trading Software
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${isActive 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p className="text-[10px] leading-relaxed">
            Software by Opzionetika<br />
            Copyright Vito Tarantini
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
