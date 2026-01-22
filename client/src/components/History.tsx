import React, { useState, useMemo } from 'react';
import { Clock, Download, ArrowUpDown } from 'lucide-react';
import { trpc } from '../lib/trpc';

type SortField = 'tag' | 'closedAt' | 'closedPnl';
type SortDirection = 'asc' | 'desc';

const History: React.FC = () => {
    const [sortField, setSortField] = useState<SortField>('closedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [filterPnl, setFilterPnl] = useState<'all' | 'positive' | 'negative'>('all');

    const { data: closedStructures, isLoading } = trpc.optionStructures.list.useQuery({
        status: 'closed',
    });

    // Sort and filter structures
    const filteredAndSortedStructures = useMemo(() => {
        if (!closedStructures) return [];

        let filtered = [...closedStructures];

        // Filter by P/L
        if (filterPnl === 'positive') {
            filtered = filtered.filter(s => parseFloat(s.realizedPnl || '0') > 0);
        } else if (filterPnl === 'negative') {
            filtered = filtered.filter(s => parseFloat(s.realizedPnl || '0') < 0);
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal, bVal;

            switch (sortField) {
                case 'tag':
                    aVal = a.tag.toLowerCase();
                    bVal = b.tag.toLowerCase();
                    break;
                case 'closedAt':
                    aVal = a.closingDate ? new Date(a.closingDate).getTime() : 0;
                    bVal = b.closingDate ? new Date(b.closingDate).getTime() : 0;
                    break;
                case 'closedPnl':
                    aVal = parseFloat(a.realizedPnl || '0');
                    bVal = parseFloat(b.realizedPnl || '0');
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [closedStructures, sortField, sortDirection, filterPnl]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleExportCSV = () => {
        if (!filteredAndSortedStructures || filteredAndSortedStructures.length === 0) return;

        const headers = ['Nome', 'Data Chiusura', 'P/L (€)', 'PDC', 'Gamma', 'Theta', 'Vega'];
        const rows = filteredAndSortedStructures.map(s => [
            s.tag,
            s.closingDate || '',
            parseFloat(s.realizedPnl || '0').toFixed(2),
            parseFloat(s.pdc || '0').toFixed(2),
            parseFloat(s.gamma || '0').toFixed(3),
            parseFloat(s.theta || '0').toFixed(2),
            parseFloat(s.vega || '0').toFixed(2),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `storico_strutture_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg p-8">
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Clock className="w-8 h-8 text-sky-500" />
                        <h1 className="text-3xl font-bold text-white">Storico Operazioni</h1>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={!filteredAndSortedStructures || filteredAndSortedStructures.length === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-4 mb-6">
                    <label className="text-sm text-gray-400">Filtra per P/L:</label>
                    <select
                        value={filterPnl}
                        onChange={(e) => setFilterPnl(e.target.value as typeof filterPnl)}
                        className="bg-[#0a0a0f] border border-[#2a2a2f] text-white rounded px-3 py-1 text-sm"
                    >
                        <option value="all">Tutte</option>
                        <option value="positive">Solo Positive</option>
                        <option value="negative">Solo Negative</option>
                    </select>
                </div>

                {/* Table */}
                {!filteredAndSortedStructures || filteredAndSortedStructures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center">
                            <Clock className="w-8 h-8 text-sky-500" />
                        </div>
                        <h2 className="text-2xl font-semibold text-white">Nessuna Struttura Chiusa</h2>
                        <p className="text-gray-400 text-center max-w-md">
                            Non ci sono ancora strutture chiuse nello storico.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#2a2a2f]">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                        <button
                                            onClick={() => handleSort('tag')}
                                            className="flex items-center space-x-1 hover:text-white transition-colors"
                                        >
                                            <span>Nome</span>
                                            {sortField === 'tag' && <ArrowUpDown className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                                        <button
                                            onClick={() => handleSort('closedAt')}
                                            className="flex items-center space-x-1 hover:text-white transition-colors"
                                        >
                                            <span>Data Chiusura</span>
                                            {sortField === 'closedAt' && <ArrowUpDown className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">
                                        <button
                                            onClick={() => handleSort('closedPnl')}
                                            className="flex items-center justify-end space-x-1 hover:text-white transition-colors ml-auto"
                                        >
                                            <span>P/L</span>
                                            {sortField === 'closedPnl' && <ArrowUpDown className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">PDC</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Γ Gamma</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Θ Theta</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">ν Vega</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedStructures.map((structure) => (
                                    <tr key={structure.id} className="border-b border-[#2a2a2f] hover:bg-[#0a0a0f] transition-colors">
                                        <td className="py-3 px-4 text-white font-medium">{structure.tag}</td>
                                        <td className="py-3 px-4 text-gray-400">
                                            {structure.closingDate || '-'}
                                        </td>
                                        <td className={`py-3 px-4 text-right font-semibold ${
                                            parseFloat(structure.realizedPnl || '0') >= 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                            {parseFloat(structure.realizedPnl || '0') >= 0 ? '+' : ''}{parseFloat(structure.realizedPnl || '0').toFixed(2)} €
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-400">
                                            {parseFloat(structure.pdc || '0').toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-400">
                                            {parseFloat(structure.gamma || '0').toFixed(3)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-400">
                                            {parseFloat(structure.theta || '0').toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-400">
                                            {parseFloat(structure.vega || '0').toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
