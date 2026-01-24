
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useStructures } from '../hooks/useStructures';
import { Structure, MarketData, CalculatedGreeks, Settings } from '../types';
import { BlackScholes, getTimeToExpiry } from '../services/blackScholes';
import { PlusIcon, ArchiveIcon, ScanIcon, PortfolioIcon, UploadIcon, EditIcon, TrashIcon, CloudDownloadIcon } from './icons';
import ImageAnalysisModal from './ImageAnalysisModal';
import HistoricalImportModal from './HistoricalImportModal';
import { GraphicModal } from './GraphicModal';
import useSettingsStore from '../store/settingsStore';
import { useMarketDataStore } from '../stores/marketDataStore';
import { trpc } from '../lib/trpc';
import { useTheme } from '../contexts/ThemeContext';


// This function now calculates all Greeks in their "points" or standard format.
// Monetization is handled separately in the component's render method.
const calculateTotalGreeks = (structure: Structure, marketData: MarketData): CalculatedGreeks => {
    const initialGreeks = { delta: 0, gamma: 0, theta: 0, vega: 0 };
    if (!structure.legs || structure.legs.length === 0) return initialGreeks;

    return structure.legs.reduce((acc, leg) => {
        const timeToExpiry = getTimeToExpiry(leg.expiryDate);
        const bs = new BlackScholes(marketData.daxSpot, leg.strike, timeToExpiry, marketData.riskFreeRate, leg.impliedVolatility);
        const greeks = leg.optionType === 'Call' ? bs.callGreeks() : bs.putGreeks();
        
        acc.delta += greeks.delta * leg.quantity;
        acc.gamma += greeks.gamma * leg.quantity;
        acc.theta += greeks.theta * leg.quantity; // Now in points
        acc.vega += greeks.vega * leg.quantity;   // Now in points
        
        return acc;
    }, initialGreeks);
};

const calculateNetPremium = (structure: Structure): number => {
    if (!structure.legs || structure.legs.length === 0) return 0;
    const totalPremium = structure.legs.reduce((acc, leg) => {
        // A positive quantity (long position) means a debit (cost).
        // A negative quantity (short position) means a credit (income).
        // The algebraic sum gives a positive value for net debit and negative for net credit.
        return acc + (leg.tradePrice * leg.quantity);
    }, 0);
    // The value is shown in index points, so the contract multiplier is not applied here.
    return totalPremium;
};

const calculateUnrealizedPnlForStructure = (structure: Structure, marketData: MarketData, settings: Settings): number => {
    if (structure.status !== 'active') {
        return 0;
    }

    const totalNetPnl = structure.legs.reduce((acc, leg) => {
        // Check if leg has manual closing price
        const hasManualClosingPrice = leg.closingPrice !== null && leg.closingPrice !== undefined;
        
        let currentPrice = 0;
        if (hasManualClosingPrice) {
            // Use manual closing price if present
            currentPrice = leg.closingPrice!;
        } else {
            // Calculate theoretical price with Black-Scholes
            const timeToExpiry = getTimeToExpiry(leg.expiryDate);
            if (timeToExpiry > 0) {
                const bs = new BlackScholes(marketData.daxSpot, leg.strike, timeToExpiry, marketData.riskFreeRate, leg.impliedVolatility);
                currentPrice = leg.optionType === 'Call' ? bs.callPrice() : bs.putPrice();
            } else {
                currentPrice = leg.optionType === 'Call'
                    ? Math.max(0, marketData.daxSpot - leg.strike)
                    : Math.max(0, leg.strike - marketData.daxSpot);
            }
        }

        let pnlPoints = 0;
        if (leg.quantity > 0) { // Long
            pnlPoints = (currentPrice - leg.tradePrice) * leg.quantity;
        } else { // Short
            pnlPoints = (leg.tradePrice - currentPrice) * Math.abs(leg.quantity);
        }

        const grossPnl = pnlPoints * structure.multiplier;
        const openingCommission = (leg.openingCommission ?? settings.defaultOpeningCommission) * Math.abs(leg.quantity);
        const closingCommission = (leg.closingCommission ?? settings.defaultClosingCommission) * Math.abs(leg.quantity);
        const netPnl = grossPnl - openingCommission - closingCommission;
        
        return acc + netPnl;
    }, 0);

    return totalNetPnl;
};


interface StructureListViewProps {
    setCurrentView: (view: 'dashboard' | 'payoff' | 'greeks' | 'history' | 'settings' | 'detail' | 'analysis' | 'public' | 'test', structureId?: number | 'new' | null) => void;
}

const StructureListView: React.FC<StructureListViewProps> = ({ setCurrentView }) => {
    const { theme } = useTheme();
    
    // Colori testo basati su tema
    const textPrimary = theme === 'light' ? '#374151' : '#6b7280';
    const textSecondary = theme === 'light' ? '#6b7280' : '#6b7280';
    const textMuted = theme === 'light' ? '#9ca3af' : '#9ca3af';
    const bgCard = theme === 'light' ? '#ffffff' : '#111827';
    const bgContainer = theme === 'light' ? '#ffffff' : '#030712';
    const borderColor = theme === 'light' ? '#e5e7eb' : '#1f2937';
    
    const { structures, deleteStructures, isLoading } = useStructures();
    const { settings } = useSettingsStore();
    
    // Market data gestito con store globale Zustand
    const { marketData, setMarketData } = useMarketDataStore();
    
    // Fetch DAX price via tRPC
    const { data: daxPriceData, isLoading: isLoadingSpot, refetch: refetchDaxPrice } = trpc.marketData.getDaxPrice.useQuery(undefined, {
        refetchInterval: 60000, // Refresh ogni minuto
    });
    
    // Aggiorna store quando dati cambiano
    useEffect(() => {
        if (daxPriceData?.price) {
            setMarketData((prev) => ({ ...prev, daxSpot: daxPriceData.price }));
        }
    }, [daxPriceData, setMarketData]);
    
    // setCurrentView ora viene passata come prop da App.tsx
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isBulkEditMode, setIsBulkEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [graphicModalStructure, setGraphicModalStructure] = useState<{ id: number; tag: string; isClosed: boolean } | null>(null);

    const activeStructures = structures.filter(s => s.status === 'active');
    const closedStructures = structures.filter(s => s.status === 'closed');

    const totalPortfolioGreeks = useMemo(() => {
        const initialGreeks = { delta: 0, gamma: 0, theta: 0, vega: 0 };

        if (activeStructures.length === 0) {
            return initialGreeks;
        }

        return activeStructures.reduce((acc, structure) => {
            const structureGreeks = calculateTotalGreeks(structure, marketData);
            acc.delta += structureGreeks.delta;
            acc.gamma += structureGreeks.gamma;
            acc.theta += structureGreeks.theta * structure.multiplier; // Monetize here
            acc.vega += structureGreeks.vega * structure.multiplier;   // Monetize here
            return acc;
        }, initialGreeks);

    }, [activeStructures, marketData]);
    
    const totalPortfolioUnrealizedPnl = useMemo(() => {
        return activeStructures.reduce((acc, structure) => {
            return acc + calculateUnrealizedPnlForStructure(structure, marketData, settings);
        }, 0);
    }, [activeStructures, marketData, settings]);

    const handleSelect = useCallback((id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedIds(new Set(closedStructures.map(s => s.id)));
        } else {
            setSelectedIds(new Set());
        }
    }, [closedStructures]);
    
    const handleSpotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMarketData({ daxSpot: value === '' ? 0 : parseFloat(value), riskFreeRate: marketData.riskFreeRate });
    };

    const handleSpotStep = (amount: number) => {
        setMarketData({ daxSpot: parseFloat((marketData.daxSpot + amount).toFixed(2)), riskFreeRate: marketData.riskFreeRate });
    };


    return (
        <>
            <ImageAnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
            />
            <HistoricalImportModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
            />
            <div 
                className={`max-w-4xl mx-auto space-y-8 ${isBulkEditMode && selectedIds.size > 0 ? 'pb-24' : ''}`}
                style={{
                    backgroundColor: theme === 'light' ? '#ffffff' : '#030712',
                    color: theme === 'light' ? '#111827' : '#f9fafb',
                }}
            >

                 <div className="border rounded-lg p-4" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                    <div className="flex flex-wrap gap-y-3 justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                            <PortfolioIcon />
                            <h1 className="text-2xl font-bold" style={{ color: theme === 'light' ? '#374151' : '#f9fafb' }}>Analisi di Portafoglio</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium  flex items-center" style={{ color: textSecondary }}>
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Spot DAX:
                            </div>
                            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-md text-sm">
                                <button onClick={() => handleSpotStep(-10)} className="px-2 py-1  hover:bg-gray-100 rounded-l-md font-mono" style={{ color: textSecondary }}>-10</button>
                                <button onClick={() => handleSpotStep(-1)} className="px-2 py-1  hover:bg-gray-100 border-l border-r border-gray-200 font-mono" style={{ color: textSecondary }}>-1</button>
                                <input
                                    type="number"
                                    value={marketData.daxSpot}
                                    onChange={handleSpotChange}
                                    className="bg-transparent w-24 text-center  font-mono focus:outline-none" style={{ color: textPrimary }}
                                    step="0.01"
                                />
                                <button onClick={() => handleSpotStep(1)} className="px-2 py-1  hover:bg-gray-100 border-l border-r border-gray-200 font-mono" style={{ color: textSecondary }}>+1</button>
                                <button onClick={() => handleSpotStep(10)} className="px-2 py-1  hover:bg-gray-100 border-r border-gray-200 font-mono" style={{ color: textSecondary }}>+10</button>
                                <button 
                                    onClick={() => refetchDaxPrice()} 
                                    disabled={isLoadingSpot}
                                    className="px-2 py-1 text-accent hover: hover:bg-gray-100 rounded-r-md transition disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: textPrimary }}
                                    title="Aggiorna Prezzo Live (Yahoo Finance)"
                                >
                                    <div className={isLoadingSpot ? "animate-spin" : ""}>
                                        <CloudDownloadIcon />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="border p-4 rounded-lg grid grid-cols-2 md:grid-cols-5 gap-4 text-center" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                         <div>
                            <span className="text-sm -foreground" style={{ color: textSecondary }}>P/L Aperto Totale</span>
                            <p className={`font-mono text-lg md:text-xl font-bold ${totalPortfolioUnrealizedPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                €{totalPortfolioUnrealizedPnl.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm -foreground" style={{ color: textSecondary }}>Δ Delta Totale</span>
                            <p className="font-mono text-lg md:text-xl font-bold " style={{ color: textPrimary }}>{totalPortfolioGreeks.delta.toFixed(2)}</p>
                        </div>
                        <div>
                            <span className="text-sm -foreground" style={{ color: textSecondary }}>Γ Gamma Totale</span>
                            <p className="font-mono text-lg md:text-xl font-bold " style={{ color: textPrimary }}>{totalPortfolioGreeks.gamma.toFixed(3)}</p>
                        </div>
                        <div>
                            <span className="text-sm -foreground" style={{ color: textSecondary }}>Θ Theta Totale</span>
                            <p className={`font-mono text-lg md:text-xl font-bold ${totalPortfolioGreeks.theta >= 0 ? 'text-profit' : 'text-loss'}`}>€{totalPortfolioGreeks.theta.toFixed(2)}</p>
                        </div>
                        <div>
                            <span className="text-sm -foreground" style={{ color: textSecondary }}>ν Vega Totale</span>
                             <p className={`font-mono text-lg md:text-xl font-bold ${totalPortfolioGreeks.vega >= 0 ? 'text-profit' : 'text-loss'}`}>€{totalPortfolioGreeks.vega.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="border rounded-lg p-4" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                    <div className="flex flex-wrap gap-y-3 justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold " style={{ color: textPrimary }}>Strutture Attive</h1>
                        <div className="flex items-center space-x-2">
                             <button 
                                onClick={() => setIsHistoryModalOpen(true)}
                                className="flex items-center justify-center bg-gray-100 hover:bg-gray-100  font-semibold p-2 md:py-2 md:px-3 rounded-md transition" style={{ color: textPrimary }}
                                title="Importa Storico da Immagini"
                            >
                                <UploadIcon />
                                <span className="hidden md:inline ml-2">Importa Storico</span>
                            </button>
                             <button 
                                onClick={() => setIsAnalysisModalOpen(true)}
                                className="flex items-center justify-center bg-gray-100 hover:bg-gray-100  font-semibold p-2 md:py-2 md:px-3 rounded-md transition" style={{ color: textPrimary }}
                                title="Carica Screenshot di un Trade"
                            >
                                <ScanIcon />
                                <span className="hidden md:inline ml-2">Carica Screenshot</span>
                            </button>
                            <button 
                                onClick={() => setCurrentView('detail', 'new')}
                                className="flex items-center justify-center bg-accent hover:bg-accent  font-semibold p-2 md:py-2 md:px-3 rounded-md transition" style={{ color: textPrimary }}
                                title="Crea Nuova Struttura"
                            >
                                <PlusIcon />
                                <span className="hidden md:inline ml-2">Crea Nuova</span>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {activeStructures.length > 0 ? (
                            activeStructures.map(structure => {
                                const totalGreeks = calculateTotalGreeks(structure, marketData);
                                const netPremium = calculateNetPremium(structure);
                                const unrealizedPnl = calculateUnrealizedPnlForStructure(structure, marketData, settings);
                                return (
                                    <div 
                                        key={structure.id} 
                                        className="border p-4 rounded-lg cursor-pointer hover:border-sky-500 transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center"
                                        style={{ backgroundColor: bgCard, borderColor: borderColor }}
                                        onClick={() => setCurrentView('detail', structure.id)}
                                    >
                                        <div className="flex-shrink-0 mb-3 sm:mb-0 w-full sm:w-auto">
                                            <h2 className="font-bold text-lg " style={{ color: textPrimary }}>{structure.tag}</h2>
                                            <p className="text-sm -foreground" style={{ color: textSecondary }}>{structure.legs.length} gamba/e</p>
                                        </div>
                                        <div className="w-full sm:w-auto grid grid-cols-3 gap-x-4 gap-y-2 sm:flex sm:gap-2 font-mono text-sm text-left sm:text-right">
                                            <div className="sm:w-32">
                                                <span className="text-xs  block" style={{ color: textSecondary }}>P/L Aperto</span>
                                                <p className={`font-bold ${unrealizedPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                    €{unrealizedPnl.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="sm:w-20">
                                                <span className="text-xs  block" style={{ color: textSecondary }}>PDC</span>
                                                <p className={netPremium > 0 ? 'text-loss' : 'text-profit'}>
                                                    {netPremium.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="sm:w-16">
                                                <span className="text-xs  block" style={{ color: textSecondary }}>Δ Delta</span>
                                                <p className="" style={{ color: textPrimary }}>{totalGreeks.delta.toFixed(2)}</p>
                                            </div>
                                            <div className="sm:w-16">
                                                <span className="text-xs  block" style={{ color: textSecondary }}>Γ Gamma</span>
                                                <p className="" style={{ color: textPrimary }}>{totalGreeks.gamma.toFixed(3)}</p>
                                            </div>
                                            <div className="sm:w-32">
                                                <span className="text-xs  block" style={{ color: textSecondary }}>Θ Theta</span>
                                                <div className="" style={{ color: textPrimary }}>
                                                    <div>{totalGreeks.theta.toFixed(2)}</div>
                                                    <div className="text-sm">(€{(totalGreeks.theta * structure.multiplier).toFixed(2)})</div>
                                                </div>
                                            </div>
                                            <div className="sm:w-32">
                                                <span className="text-xs  block" style={{ color: textSecondary }}>ν Vega</span>
                                                <div className="" style={{ color: textPrimary }}>
                                                    <div>{totalGreeks.vega.toFixed(2)}</div>
                                                    <div className="text-sm">(€{(totalGreeks.vega * structure.multiplier).toFixed(2)})</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-10">
                                <p className="-foreground" style={{ color: textSecondary }}>Nessuna struttura attiva trovata.</p>
                                <p className=" text-sm" style={{ color: textSecondary }}>Clicca su "Crea Nuova Struttura" per iniziare.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border rounded-lg p-4" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                            <ArchiveIcon />
                            <h1 className="text-2xl font-bold " style={{ color: textPrimary }}>Strutture Chiuse</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {isBulkEditMode && (
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="select-all-closed"
                                        type="checkbox"
                                        className="h-5 w-5 bg-gray-100 border-gray-200 text-accent focus:ring-accent rounded cursor-pointer"
                                        checked={closedStructures.length > 0 && selectedIds.size === closedStructures.length}
                                        onChange={handleSelectAll}
                                    />
                                    <label htmlFor="select-all-closed" className="text-sm  cursor-pointer" style={{ color: textSecondary }}>Seleziona tutti</label>
                                </div>
                            )}
                            {closedStructures.length > 0 && (
                                <button
                                    onClick={() => {
                                        setIsBulkEditMode(!isBulkEditMode);
                                        setSelectedIds(new Set()); // Reset selection on toggle
                                    }}
                                    className="flex items-center space-x-2 text-sm bg-gray-100 hover:bg-gray-100  font-semibold py-1 px-3 rounded-md transition" style={{ color: textPrimary }}
                                >
                                    {isBulkEditMode ? <span>Annulla</span> : <><EditIcon /><span>Modifica</span></>}
                                </button>
                            )}
                        </div>
                    </div>
                     <div className="space-y-3">
                        {closedStructures.length > 0 ? (
                            closedStructures.map(structure => {
                                const isSelected = selectedIds.has(structure.id);
                                return (
                                    <div
                                        key={structure.id}
                                        className={`rounded-lg flex items-center transition-all cursor-pointer ${isBulkEditMode ? (isSelected ? 'bg-sky-500 border-2 border-sky-500' : 'border hover:border-sky-500') : 'border hover:border-sky-500'}`}
                                        style={{
                                            backgroundColor: isBulkEditMode && isSelected ? undefined : bgCard,
                                            borderColor: isBulkEditMode && isSelected ? undefined : borderColor,
                                        }}
                                        onClick={() => {
                                            if (isBulkEditMode) {
                                                handleSelect(structure.id);
                                            } else {
                                                setCurrentView('detail', structure.id);
                                            }
                                        }}
                                    >
                                        {isBulkEditMode && (
                                            <div className="px-4 py-4 flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 bg-gray-100 border-gray-200 text-accent focus:ring-accent rounded cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelect(structure.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        )}
                                        <div className={`flex justify-between items-center w-full ${isBulkEditMode ? 'py-4 pr-4' : 'p-4'}`}>
                                            <div className="flex-1">
                                                <h2 className="font-semibold text-lg -foreground" style={{ color: textSecondary }}>{structure.tag}</h2>
                                                <p className="text-sm -foreground" style={{ color: textSecondary }}>Chiusa il: {structure.closingDate}</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <span className={`font-mono font-bold text-lg ${structure.realizedPnl && Number(structure.realizedPnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                        {structure.realizedPnl != null ? Number(structure.realizedPnl).toFixed(2) : 'N/A'} €
                                                    </span>
                                                </div>
                                                {!isBulkEditMode && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setGraphicModalStructure({ id: structure.id, tag: structure.tag, isClosed: true });
                                                        }}
                                                        className="bg-sky-500 hover:bg-sky-600  font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors" style={{ color: textPrimary }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                        </svg>
                                                        <span>📸 Grafica</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10">
                                <p className="-foreground" style={{ color: textSecondary }}>Nessuna struttura chiusa.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isBulkEditMode && selectedIds.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 border-t p-4 z-40 transition-transform duration-300 ease-in-out" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <span className="font-semibold " style={{ color: textPrimary }}>{selectedIds.size} {selectedIds.size === 1 ? 'struttura selezionata' : 'strutture selezionate'}</span>
                        <button
                            onClick={() => {
                                if (selectedIds.size > 0 && window.confirm(`Sei sicuro di voler eliminare permanentemente ${selectedIds.size} strutture? L'azione è irreversibile.`)) {
                                    deleteStructures(Array.from(selectedIds));
                                    setIsBulkEditMode(false);
                                    setSelectedIds(new Set());
                                }
                            }}
                            className="flex items-center space-x-2 bg-loss hover:bg-loss  font-bold py-2 px-4 rounded-md transition" style={{ color: textPrimary }}
                        >
                            <TrashIcon />
                            <span>Elimina Selezionate</span>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Modal Grafica per strutture chiuse */}
            {graphicModalStructure && (
                <GraphicModal
                    isOpen={true}
                    onClose={() => setGraphicModalStructure(null)}
                    structureId={graphicModalStructure.id}
                    structureTag={graphicModalStructure.tag}
                    isClosed={graphicModalStructure.isClosed}
                />
            )}
        </>
    );
};

export default StructureListView;
