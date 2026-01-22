import { LayoutDashboard, TrendingUp, Calculator, History, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen?: boolean;
}

export function Sidebar({ currentView, onNavigate, isOpen = false }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'payoff', label: 'Simulatore Payoff', icon: TrendingUp },
    { id: 'greeks', label: 'Calcolatore Greche', icon: Calculator },
    { id: 'history', label: 'Storico', icon: History },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen w-64 border-r flex flex-col z-60 transition-transform duration-300 shadow-lg ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
      style={{
        backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
        borderColor: theme === 'light' ? '#e5e7eb' : '#1f2937',
      }}
    >
      {/* Logo */}
      <div 
        className="p-6 border-b"
        style={{
          borderColor: theme === 'light' ? '#e5e7eb' : '#1f2937',
        }}
      >
        <h1 
          className="text-xl font-bold antialiased"
          style={{ color: theme === 'light' ? '#111827' : '#ffffff' }}
        >
          Option DAX
        </h1>
        <p 
          className="text-xs mt-1"
          style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}
        >
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
                ${isActive ? 'bg-blue-50 font-medium' : 'hover:bg-gray-100'}
              `}
              style={{
                backgroundColor: isActive 
                  ? (theme === 'light' ? '#eff6ff' : '#1f2937')
                  : 'transparent',
                color: isActive
                  ? (theme === 'light' ? '#2563eb' : '#60a5fa')
                  : (theme === 'light' ? '#374151' : '#d1d5db'),
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div 
        className="p-4 border-t space-y-3"
        style={{
          borderColor: theme === 'light' ? '#e5e7eb' : '#1f2937',
        }}
      >
        {/* Theme Toggle */}
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: theme === 'light' ? '#f3f4f6' : '#1f2937',
              color: theme === 'light' ? '#111827' : '#ffffff',
            }}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4" />
                <span className="text-xs font-medium">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                <span className="text-xs font-medium">Light Mode</span>
              </>
            )}
          </button>
        )}
        
        {/* Copyright */}
        <div 
          className="text-xs text-center"
          style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}
        >
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
