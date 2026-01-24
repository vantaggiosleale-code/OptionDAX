import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CloudDownloadIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';

interface PublicStructuresViewProps {
  setCurrentView: (view: 'dashboard' | 'payoff' | 'greeks' | 'history' | 'settings' | 'detail' | 'analysis' | 'public' | 'test', structureId?: number | 'new' | null) => void;
}

const PublicStructuresView: React.FC<PublicStructuresViewProps> = ({ setCurrentView }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [statusFilter, setStatusFilter] = useState<'active' | 'closed' | 'all'>('all');
  
  const { data: publicStructures, isLoading, refetch } = trpc.optionStructures.listPublic.useQuery({
    status: statusFilter,
  });
  
  const importMutation = trpc.optionStructures.import.useMutation({
    onSuccess: (data) => {
      toast.success('Struttura importata', {
        description: `La struttura "${data.tag}" è stata copiata nel tuo account.`,
      });
      // Redirect to detail view of imported structure
      setCurrentView('detail', data.id);
    },
    onError: (error) => {
      toast.error('Errore importazione', {
        description: error.message,
      });
    },
  });
  
  const handleImport = (structureId: number) => {
    importMutation.mutate({ structureId });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: isDark ? '#ffffff' : '#111827' }}>Strutture Pubbliche</h1>
          <p style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Esplora e importa strutture condivise dagli admin</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
          Torna alle Mie Strutture
        </Button>
      </div>
      
      {/* Status Filter */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
        >
          Tutte
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('active')}
        >
          Attive
        </Button>
        <Button
          variant={statusFilter === 'closed' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('closed')}
        >
          Chiuse
        </Button>
      </div>
      
      {/* Structures Grid */}
      {!publicStructures || publicStructures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Nessuna struttura pubblica disponibile.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicStructures.map((structure) => (
            <Card key={structure.id} className="hover:border-primary transition-colors" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg" style={{ color: isDark ? '#ffffff' : '#111827' }}>{structure.tag}</CardTitle>
                    <CardDescription className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                      {structure.legs.length} gambe • {structure.multiplier}x multiplier
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={structure.status === 'active' ? 'default' : 'secondary'}>
                      {structure.status === 'active' ? 'Attiva' : 'Chiusa'}
                    </Badge>
                    {structure.isTemplate === 1 && (
                      <Badge variant="outline">Template</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Structure Info */}
                <div className="space-y-2 text-sm">
                  {structure.status === 'closed' && structure.realizedPnl && (
                    <div className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: isDark ? '#111827' : '#f3f4f6' }}>
                      <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>P&L Realizzato</span>
                      <span className={`font-semibold ${parseFloat(structure.realizedPnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {parseFloat(structure.realizedPnl) >= 0 ? <TrendingUpIcon className="inline w-4 h-4 mr-1" /> : <TrendingDownIcon className="inline w-4 h-4 mr-1" />}
                        €{parseFloat(structure.realizedPnl).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {structure.closingDate && (
                    <div className="flex justify-between items-center text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                      <span>Chiusa il</span>
                      <span>{structure.closingDate}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    <span>Creata il</span>
                    <span>{new Date(structure.createdAt).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>
                
                {/* Import Button */}
                <Button
                  className="w-full"
                  onClick={() => handleImport(structure.id)}
                  disabled={importMutation.isPending}
                >
                  <CloudDownloadIcon className="w-4 h-4 mr-2" />
                  {importMutation.isPending ? 'Importazione...' : 'Importa nel Mio Account'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicStructuresView;
