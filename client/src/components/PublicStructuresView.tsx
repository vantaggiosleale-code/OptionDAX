import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CloudDownloadIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PublicStructuresViewProps {
  setCurrentView: (view: 'list' | 'detail' | 'settings' | 'analysis' | 'public', structureId?: number | 'new' | null) => void;
}

const PublicStructuresView: React.FC<PublicStructuresViewProps> = ({ setCurrentView }) => {
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
          <h1 className="text-3xl font-bold text-foreground">Strutture Pubbliche</h1>
          <p className="text-muted-foreground">Esplora e importa strutture condivise dagli admin</p>
        </div>
        <Button variant="outline" onClick={() => setCurrentView('list')}>
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
            <p className="text-muted-foreground">Nessuna struttura pubblica disponibile.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicStructures.map((structure) => (
            <Card key={structure.id} className="bg-card border-border hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{structure.tag}</CardTitle>
                    <CardDescription className="text-sm">
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
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-muted-foreground">P&L Realizzato</span>
                      <span className={`font-semibold ${parseFloat(structure.realizedPnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {parseFloat(structure.realizedPnl) >= 0 ? <TrendingUpIcon className="inline w-4 h-4 mr-1" /> : <TrendingDownIcon className="inline w-4 h-4 mr-1" />}
                        €{parseFloat(structure.realizedPnl).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {structure.closingDate && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Chiusa il</span>
                      <span>{structure.closingDate}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
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
