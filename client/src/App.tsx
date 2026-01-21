
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

const App: React.FC = () => {
    const [currentView, setCurrentView] = React.useState<'list' | 'detail' | 'settings' | 'analysis' | 'public' | 'test'>('list');
    const [currentStructureId, setCurrentStructureId] = React.useState<number | 'new' | null>(null);
    
    const handleSetCurrentView = (view: 'list' | 'detail' | 'settings' | 'analysis' | 'public' | 'test', structureId?: number | 'new' | null) => {
        setCurrentView(view);
        if (structureId !== undefined) {
            setCurrentStructureId(structureId);
        }
    };
    const { user, loading, isAuthenticated, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = getLoginUrl();
    };

    const renderView = () => {
        switch (currentView) {
            case 'list':
                return <StructureListView setCurrentView={handleSetCurrentView} />;
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
        <div className="bg-gray-900 text-gray-200 font-sans min-h-screen flex flex-col">
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-3 flex items-center justify-between sticky top-0 z-10">
                <div 
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => handleSetCurrentView('list')}
                >
                    <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center font-bold text-xl">O</div>
                    <h1 className="text-xl font-bold text-white">Option DAX</h1>
                </div>
                 <div className="flex items-center space-x-2">
                    {isAuthenticated && (
                        <>
                            <button 
                                onClick={() => handleSetCurrentView('test')} 
                                className="text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
                                title="TEST Generazione"
                            >
                                🧪 TEST
                            </button>
                            <button 
                                onClick={() => handleSetCurrentView('public')} 
                                className="text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
                                title="Strutture Pubbliche"
                            >
                                🌐 Pubbliche
                            </button>
                            <button 
                                onClick={() => handleSetCurrentView('analysis')} 
                                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition"
                                title="Analisi Portafoglio"
                            >
                                <ChartBarIcon />
                            </button>
                            <button 
                                onClick={() => handleSetCurrentView('settings')} 
                                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition"
                                title="Impostazioni"
                            >
                                <SettingsIcon />
                            </button>
                        </>
                    )}
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
    );
};

export default App;