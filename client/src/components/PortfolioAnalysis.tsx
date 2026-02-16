
import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, ComposedChart
} from 'recharts';
import { trpc } from '../lib/trpc';
import { TrendingUp, TrendingDown, Scale, CheckCircle, PlusCircle, MinusCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Custom Tooltip for Equity Chart
const CustomEquityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg text-sm">
                <p className="font-bold text-gray-900 dark:text-white">{data.tag}</p>
                <p className="text-accent">Equity: {data.equity.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                <p className="text-loss">Drawdown: {data.drawdown.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Bar Charts
const CustomPnlTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg text-sm">
                <p className="font-bold text-gray-900 dark:text-white">{label}</p>
                <p className={payload[0].value >= 0 ? 'text-profit' : 'text-loss'}>
                    P&L Netto: {payload[0].value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
        );
    }
    return null;
};

const MetricCard = ({ icon, title, value, colorClass = 'text-foreground' }: { icon: React.ReactNode, title: string, value: string, colorClass?: string }) => (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex items-start">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md mr-4 text-muted-foreground">{icon}</div>
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
            <p className={`text-xl font-bold font-mono ${colorClass}`}>{value}</p>
        </div>
    </div>
);

const PortfolioAnalysis: React.FC = () => {
    const { theme } = useTheme();
    const { data: closedStructures, isLoading } = trpc.optionStructures.list.useQuery({
        status: 'closed',
    });

    // Initial capital - hardcoded for now (can be moved to settings later)
    const initialCapital = 10000;

    const equityChartData = useMemo(() => {
        if (!closedStructures || closedStructures.length === 0) return [];
        const sortedStructures = [...closedStructures].sort((a, b) => {
            const dateA = a.closingDate ? new Date(a.closingDate).getTime() : 0;
            const dateB = b.closingDate ? new Date(b.closingDate).getTime() : 0;
            return dateA - dateB;
        });
        let cumulativePnl = 0;
        let peakEquity = initialCapital;
        const data = sortedStructures.map(structure => {
            cumulativePnl += parseFloat(structure.realizedPnl || '0');
            const currentEquity = initialCapital + cumulativePnl;
            peakEquity = Math.max(peakEquity, currentEquity);
            const drawdown = currentEquity - peakEquity;
            return {
                name: structure.closingDate ? new Date(structure.closingDate).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }) : '',
                tag: structure.tag,
                equity: currentEquity,
                drawdown: drawdown,
            };
        });
        return [{ name: 'Inizio', tag: 'Capitale Iniziale', equity: initialCapital, drawdown: 0 }, ...data];
    }, [closedStructures, initialCapital]);
    
    const keyMetrics = useMemo(() => {
        if (!closedStructures) return { totalNetPnl: 0, profitFactor: 0, winRate: 0, avgWin: 0, avgLoss: 0, maxDrawdown: 0 };
        
        const totalNetPnl = closedStructures.reduce((acc, s) => acc + parseFloat(s.realizedPnl || '0'), 0);
        const winningTrades = closedStructures.filter(s => parseFloat(s.realizedPnl || '0') > 0);
        const losingTrades = closedStructures.filter(s => parseFloat(s.realizedPnl || '0') < 0);
        const grossProfit = winningTrades.reduce((acc, s) => acc + parseFloat(s.realizedPnl || '0'), 0);
        const grossLoss = Math.abs(losingTrades.reduce((acc, s) => acc + parseFloat(s.realizedPnl || '0'), 0));
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : Infinity;
        const winRate = closedStructures.length > 0 ? (winningTrades.length / closedStructures.length) * 100 : 0;
        const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
        const maxDrawdown = equityChartData.length > 1 ? Math.min(0, ...equityChartData.map(d => d.drawdown)) : 0;

        return { totalNetPnl, profitFactor, winRate, avgWin, avgLoss, maxDrawdown };
    }, [closedStructures, equityChartData]);

    const monthlyPnlData = useMemo(() => {
        if (!closedStructures) return [];
        
        const pnlByMonth: { [key: string]: number } = {};
        closedStructures.forEach(structure => {
            if (!structure.closingDate) return;
            const closingDate = new Date(structure.closingDate);
            const monthKey = `${closingDate.getFullYear()}-${String(closingDate.getMonth() + 1).padStart(2, '0')}`;
            pnlByMonth[monthKey] = (pnlByMonth[monthKey] || 0) + parseFloat(structure.realizedPnl || '0');
        });
        return Object.entries(pnlByMonth).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, pnl]) => ({
            name: new Date(key + '-02').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
            pnl
        }));
    }, [closedStructures]);
    
    const individualPnlData = useMemo(() => {
        if (!closedStructures) return [];
        
        return [...closedStructures].sort((a, b) => {
            const dateA = a.closingDate ? new Date(a.closingDate).getTime() : 0;
            const dateB = b.closingDate ? new Date(b.closingDate).getTime() : 0;
            return dateA - dateB;
        }).map(structure => ({
            name: structure.tag,
            pnl: parseFloat(structure.realizedPnl || '0')
        }));
    }, [closedStructures]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                </div>
            </div>
        );
    }

    if (!closedStructures || closedStructures.length === 0) {
        return (
             <div className="max-w-4xl mx-auto text-center py-10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Analisi di Portafoglio</h1>
                <p className="text-muted-foreground">Nessuna struttura chiusa trovata per generare le analisi.</p>
            </div>
        );
    }
    
    const currencyFormatter = (value: number) => `€${Math.round(value / 1000)}k`;
    const barWidth = 80;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: theme === 'light' ? '#111827' : '#ffffff' }}>
                    <TrendingUp className="w-8 h-8" />
                    Dashboard di Performance
                </h1>
            </div>
            <div className="space-y-8">
                 <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Metriche Chiave</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <MetricCard icon={<TrendingUp className="w-5 h-5" />} title="P&L Netto Totale" value={keyMetrics.totalNetPnl.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} colorClass={keyMetrics.totalNetPnl >= 0 ? 'text-profit' : 'text-loss'} />
                        <MetricCard icon={<Scale className="w-5 h-5" />} title="Profit Factor" value={isFinite(keyMetrics.profitFactor) ? keyMetrics.profitFactor.toFixed(2) : '∞'} colorClass={keyMetrics.profitFactor >= 1 ? 'text-profit' : 'text-loss'} />
                        <MetricCard icon={<CheckCircle className="w-5 h-5" />} title="Win Rate" value={`${keyMetrics.winRate.toFixed(1)}%`} colorClass="text-accent"/>
                        <MetricCard icon={<PlusCircle className="w-5 h-5" />} title="Vincita Media" value={keyMetrics.avgWin.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} colorClass="text-profit"/>
                        <MetricCard icon={<MinusCircle className="w-5 h-5" />} title="Perdita Media" value={keyMetrics.avgLoss.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} colorClass="text-loss"/>
                        <MetricCard icon={<TrendingDown className="w-5 h-5" />} title="Max Drawdown" value={keyMetrics.maxDrawdown.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} colorClass="text-loss"/>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Equity Line & Drawdown</h2>
                    <ResponsiveContainer width="100%" height={700}>
                        <ComposedChart data={equityChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                            <XAxis dataKey="name" stroke="#a0a0a0" fontSize={12} />
                            <YAxis stroke="#a0a0a0" fontSize={12} tickFormatter={currencyFormatter} width={50} />
                            <Tooltip content={<CustomEquityTooltip />} />
                            <Legend wrapperStyle={{paddingTop: '20px'}}/>
                            <ReferenceLine y={initialCapital} label={{ value: 'Cap. Iniziale', position: 'insideTopLeft', fill: '#a0a0a0', fontSize: 10 }} stroke="#a0a0a0" strokeDasharray="2 2" />
                            <Bar dataKey="drawdown" name="Drawdown" fill="#ef4444" opacity={0.6} barSize={20} />
                            <Line type="monotone" dataKey="equity" name="Equity" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analisi Temporale (P&L per Mese)</h2>
                    <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={monthlyPnlData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444444" vertical={false} />
                            <XAxis dataKey="name" stroke="#a0a0a0" fontSize={12} />
                            <YAxis stroke="#a0a0a0" fontSize={12} tickFormatter={currencyFormatter} width={50} />
                            <Tooltip content={<CustomPnlTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                            <ReferenceLine y={0} stroke="#6b7280" />
                            <Bar dataKey="pnl" maxBarSize={50}>
                                {monthlyPnlData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Distribuzione P&L per Operazione</h2>
                    <div className="w-full overflow-x-auto">
                        <ResponsiveContainer width={Math.max(individualPnlData.length * barWidth, 400)} height={350}>
                            <BarChart data={individualPnlData} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444444" vertical={false} />
                                <XAxis dataKey="name" stroke="#a0a0a0" fontSize={12} interval={0} angle={-45} textAnchor="end" />
                                <YAxis stroke="#a0a0a0" fontSize={12} tickFormatter={currencyFormatter} width={50} />
                                <Tooltip content={<CustomPnlTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                                <ReferenceLine y={0} stroke="#6b7280" />
                                <Bar dataKey="pnl" maxBarSize={50}>
                                    {individualPnlData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PortfolioAnalysis;
