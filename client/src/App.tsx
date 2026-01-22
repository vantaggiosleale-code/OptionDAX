
import React from 'react';
// Navigazione gestita con state locale invece di Zustand
import { useAuth } from './_core/hooks/useAuth';
import { getLoginUrl } from './const';
import { trpc } from './lib/trpc';
import StructureListView from './components/StructureListView';
import StructureDetailView from './components/StructureDetailView';
import SettingsView from './components/SettingsView';
import PortfolioAnalysis from './components/PortfolioAnalysis';
import PublicStructuresView from './components/PublicStructuresView';
import { SettingsIcon, ChartBarIcon } from './components/icons';
import { SimpleGraphicTest } from './components/SimpleGraphicTest';
import { Sidebar } from './components/Sidebar';
import PayoffSimulator from './components/PayoffSimulator';
import GreeksCalculator from './components/GreeksCalculator';
import History from './components/History';

const App: React.FC = () => {
    const [currentView, setCurrentView] = React.useState<'dashboard' | 'payoff' | 'greeks' | 'history' | 'settings' | 'detail' | 'analysis' | 'public' | 'test'>('dashboard');
    const [currentStructureId, setCurrentStructureId] = React.useState<number | 'new' | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    
    const handleSetCurrentView = (view: 'dashboard' | 'payoff' | 'greeks' | 'history' | 'settings' | 'detail' | 'analysis' | 'public' | 'test', structureId?: number | 'new' | null) => {
        setCurrentView(view);
        if (structureId !== undefined) {
            setCurrentStructureId(structureId);
        }
    };

    const handleNavigate = (view: string) => {
        // Map sidebar navigation to views
        if (view === 'dashboard') {
            handleSetCurrentView('dashboard');
        } else {
            handleSetCurrentView(view as any);
        }
    };
    const { user, loading, isAuthenticated, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = getLoginUrl();
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <StructureListView setCurrentView={handleSetCurrentView} />;
            case 'payoff':
                return <PayoffSimulator />;
            case 'greeks':
                return <GreeksCalculator />;
            case 'history':
                return <History />;
            case 'detail':
                return <StructureDetailView structureId={currentStructureId} setCurrentView={handleSetCurrentView} />;
            case 'settings':
                return <SettingsView setCurrentView={handleSetCurrentView} />;
            case 'analysis':
                return <PortfolioAnalysis setCurrentView={handleSetCurrentView} />;
            case 'public':
                return <PublicStructuresView setCurrentView={handleSetCurrentView} />;
            case 'test':
                return <SimpleGraphicTest />;
            default:
                return <StructureListView setCurrentView={handleSetCurrentView} />;
        }
    }

    return (
        <div className="bg-background text-foreground font-sans min-h-screen flex">
            {/* Mobile Overlay (renderizzato PRIMA della sidebar per stacking corretto) */}
            {isAuthenticated && isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/65 z-50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar (renderizzata DOPO l'overlay per stare sopra) */}
            {isAuthenticated && (
                <Sidebar currentView={currentView} onNavigate={(view) => { handleNavigate(view); setIsSidebarOpen(false); }} isOpen={isSidebarOpen} />
            )}
            
            {/* Main Content */}
            <div className={`flex-1 flex flex-col ${isAuthenticated ? 'md:ml-64' : ''}`}>
                <header className="bg-card/50 backdrop-blur-sm border-b border-border p-3 flex items-center justify-between sticky top-0 z-10">
                    {/* Hamburger Menu (Mobile Only) */}
                    {isAuthenticated && (
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    )}
                    <div className="flex items-center space-x-2 ml-auto">
                        {!loading && (
                            isAuthenticated ? (
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-300">{user?.name || user?.email}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <a
                                    href={getLoginUrl()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                >
                                    Login
                                </a>
                            )
                        )}
                    </div>
                </header>
                <main className="flex-1 p-2 sm:p-4">
                    {renderView()}
                </main>
                <div id="modal-root"></div>
            </div>
        </div>
    );
};

export default App;