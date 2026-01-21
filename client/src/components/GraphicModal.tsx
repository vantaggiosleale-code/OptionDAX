import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Download, Copy, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { GraphicTemplate } from './GraphicTemplate';
import { toast } from 'sonner';
import { useMarketDataStore } from '../stores/marketDataStore';
import { OptionLeg } from '@/types';

interface GraphicModalProps {
  isOpen: boolean;
  onClose: () => void;
  structureId: number;
  structureTag: string;
}

type GraphicType = 'apertura' | 'aggiustamento' | 'chiusura';

export function GraphicModal({ isOpen, onClose, structureId, structureTag }: GraphicModalProps) {
  const [selectedType, setSelectedType] = useState<GraphicType>('apertura');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Reset quando modal si apre
  useEffect(() => {
    if (isOpen) {
      setGeneratedImageUrl(null);
      setSelectedType('apertura');
    }
  }, [isOpen]);

  const utils = trpc.useUtils();
  const { marketData } = useMarketDataStore();

  // Query per ottenere dati struttura
  const { data: structure } = trpc.optionStructures.getById.useQuery(
    { id: structureId },
    { enabled: isOpen }
  );

  // Mutation per salvare grafica su S3
  const saveGraphicMutation = trpc.graphics.saveFromClient.useMutation({
    onSuccess: (data) => {
      setGeneratedImageUrl(data.url);
      toast.success('Grafica salvata su S3!');
      utils.graphics.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Errore salvataggio: ${error.message}`);
    },
  });

  const prepareGraphicData = () => {
    if (!structure) return null;

    const now = new Date();
    const createdAtStr = typeof structure.createdAt === 'string' ? structure.createdAt : new Date(structure.createdAt).toISOString();

    if (selectedType === 'apertura') {
      return {
        tag: structure.tag,
        date: createdAtStr,
        daxSpot: marketData.daxSpot,
        legs: structure.legs as OptionLeg[],
      };
    }

    if (selectedType === 'aggiustamento') {
      const closedLegs = (structure.legs as OptionLeg[]).filter((leg: OptionLeg) => leg.closingPrice !== null);
      const addedLegs = (structure.legs as OptionLeg[]).filter((leg: OptionLeg) => leg.closingPrice === null);

      // Calcola P&L parziale delle gambe chiuse
      let totalPnlPoints = 0;
      closedLegs.forEach((leg: OptionLeg) => {
        const pnlPoints = leg.quantity > 0
          ? (leg.closingPrice! - leg.tradePrice) * leg.quantity
          : (leg.tradePrice - leg.closingPrice!) * Math.abs(leg.quantity);
        totalPnlPoints += pnlPoints;
      });

      const pnlEuro = totalPnlPoints * structure.multiplier;

      return {
        tag: structure.tag,
        date: now.toISOString(),
        daxSpot: marketData.daxSpot,
        closedLegs: closedLegs as OptionLeg[],
        addedLegs: addedLegs as OptionLeg[],
        pnlPoints: totalPnlPoints,
        pnlEuro,
      };
    }

    // Chiusura
    if (selectedType === 'chiusura') {
      // Calcola P&L totale
      let totalPnlPoints = 0;
      (structure.legs as OptionLeg[]).forEach((leg: OptionLeg) => {
        const closingPrice = leg.closingPrice || leg.tradePrice;
        const pnlPoints = leg.quantity > 0
          ? (closingPrice - leg.tradePrice) * leg.quantity
          : (leg.tradePrice - closingPrice) * Math.abs(leg.quantity);
        totalPnlPoints += pnlPoints;
      });

      const pnlEuro = totalPnlPoints * structure.multiplier;

      const openingDate = new Date(structure.createdAt);
      const closingDate = structure.closingDate ? new Date(structure.closingDate) : now;
      const duration = Math.ceil((closingDate.getTime() - openingDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        tag: structure.tag,
        openingDate: createdAtStr,
        closingDate: closingDate.toISOString(),
        pnlPoints: totalPnlPoints,
        pnlEuro,
        duration,
      };
    }

    return null;
  };

  const handleGenerate = async () => {
    console.log('[GraphicModal] Starting generation...');
    console.log('[GraphicModal] templateRef.current:', templateRef.current);

    if (!templateRef.current || !structure) {
      console.error('[GraphicModal] Missing ref or structure');
      toast.error('Errore: template non pronto');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('[GraphicModal] Calling toPng...');
      
      // Converti HTML → PNG
      const dataUrl = await toPng(templateRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#1a1a2e',
      });

      console.log('[GraphicModal] toPng success! Length:', dataUrl.length);

      // Invia al backend per upload S3
      await saveGraphicMutation.mutateAsync({
        structureId,
        type: selectedType,
        imageBase64: dataUrl,
      });

      toast.success('Grafica generata con successo!');
    } catch (error) {
      console.error('[GraphicModal] Error:', error);
      toast.error(`Errore durante la generazione: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;

    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `${structureTag}-${selectedType}-${Date.now()}.png`;
    link.click();
    toast.success('Download avviato!');
  };

  const handleCopyLink = () => {
    if (!generatedImageUrl) return;

    navigator.clipboard.writeText(generatedImageUrl);
    toast.success('Link copiato negli appunti!');
  };

  const graphicData = prepareGraphicData();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Genera Grafica Telegram</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selezione Tipo */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo Grafica</label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={selectedType === 'apertura' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedType('apertura');
                  setGeneratedImageUrl(null);
                }}
                className={`h-auto py-3 ${selectedType !== 'apertura' ? 'bg-card hover:bg-accent' : ''}`}
              >
                <div className="text-center">
                  <div className="font-semibold">Apertura</div>
                  <div className="text-xs opacity-70">Nuova Operazione</div>
                </div>
              </Button>

              <Button
                variant={selectedType === 'aggiustamento' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedType('aggiustamento');
                  setGeneratedImageUrl(null);
                }}
                className={`h-auto py-3 ${selectedType !== 'aggiustamento' ? 'bg-card hover:bg-accent' : ''}`}
              >
                <div className="text-center">
                  <div className="font-semibold">Aggiustamento</div>
                  <div className="text-xs opacity-70">Roll/Modifica</div>
                </div>
              </Button>

              <Button
                variant={selectedType === 'chiusura' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedType('chiusura');
                  setGeneratedImageUrl(null);
                }}
                className={`h-auto py-3 ${selectedType !== 'chiusura' ? 'bg-card hover:bg-accent' : ''}`}
              >
                <div className="text-center">
                  <div className="font-semibold">Chiusura</div>
                  <div className="text-xs opacity-70">Risultato Finale</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Preview Template (visibile) */}
          {!generatedImageUrl && graphicData && (
            <div>
              <label className="text-sm font-medium mb-2 block">Anteprima:</label>
              <div className="flex justify-center">
                <div ref={templateRef} className="inline-block">
                  <GraphicTemplate type={selectedType} data={graphicData} />
                </div>
              </div>
            </div>
          )}

          {/* Immagine Generata */}
          {generatedImageUrl && (
            <div className="space-y-4">
              <label className="text-sm font-medium block">Immagine Generata:</label>
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={generatedImageUrl}
                  alt="Grafica generata"
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Scarica PNG
                </Button>
                <Button onClick={handleCopyLink} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copia Link
                </Button>
              </div>
            </div>
          )}

          {/* Pulsante Genera */}
          {!generatedImageUrl && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !structure || !graphicData}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  📸 Genera Grafica
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
