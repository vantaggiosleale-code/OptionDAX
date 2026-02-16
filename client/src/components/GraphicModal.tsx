import React, { useState, useRef, useEffect } from 'react';
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
  isClosed?: boolean; // Se true, mostra solo tipo "Chiusura"
}

type GraphicType = 'apertura' | 'aggiustamento' | 'chiusura';

export function GraphicModal({ isOpen, onClose, structureId, structureTag, isClosed = false }: GraphicModalProps) {
  const [selectedType, setSelectedType] = useState<GraphicType>('apertura');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Reset quando modal si apre
  useEffect(() => {
    if (isOpen) {
      setGeneratedImageUrl(null);
      // Se struttura chiusa, imposta tipo "chiusura", altrimenti "apertura"
      setSelectedType(isClosed ? 'chiusura' : 'apertura');
    }
  }, [isOpen, isClosed]);

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
        const closingPrice = leg.closingPrice || 0;
        const pnlPoints = leg.quantity > 0
          ? (closingPrice - leg.tradePrice) * leg.quantity
          : (leg.tradePrice - closingPrice) * Math.abs(leg.quantity);
        totalPnlPoints += pnlPoints;
      });

      const pnlEuro = totalPnlPoints * structure.multiplier;

      // Usa closingDate se disponibile, altrimenti now
      const closedAtStr = structure.closingDate 
        ? new Date(structure.closingDate).toISOString()
        : now.toISOString();
      
      // Calcola durata operazione
      const openDate = new Date(createdAtStr);
      const closeDate = new Date(closedAtStr);
      const durationDays = Math.floor((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        tag: structure.tag,
        openingDate: createdAtStr,
        closingDate: closedAtStr,
        daxSpot: marketData.daxSpot,
        legs: structure.legs as OptionLeg[],
        pnlPoints: totalPnlPoints,
        pnlEuro,
        duration: durationDays,
      };
    }

    return null;
  };

  const handleGenerate = async () => {
    if (!templateRef.current) {
      toast.error('Template non pronto');
      return;
    }

    setIsGenerating(true);

    try {
      // Converti HTML a PNG
      const dataUrl = await toPng(templateRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#1e293b', // Sfondo blu navy come nel template
      });

      // Salva su S3 via backend
      await saveGraphicMutation.mutateAsync({
        structureId,
        type: selectedType,
        imageBase64: dataUrl,
      });
    } catch (error) {
      console.error('Errore generazione:', error);
      toast.error('Errore durante la generazione');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `${structureTag}-${selectedType}.png`;
    link.click();
  };

  const handleCopyLink = () => {
    if (!generatedImageUrl) return;
    navigator.clipboard.writeText(generatedImageUrl);
    toast.success('Link copiato!');
  };

  const graphicData = prepareGraphicData();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Genera Grafica Telegram</DialogTitle>
        </DialogHeader>

        {/* Pulsanti tipo grafica - SFONDO BIANCO, BORDO NERO SPESSO, TESTO NERO */}
        <div className="flex gap-2 mb-4">
          {!isClosed && (
            <>
              <button
                onClick={() => setSelectedType('apertura')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-base transition-all ${
                  selectedType === 'apertura'
                    ? 'bg-blue-600 text-white border-4 border-blue-700'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-4 border-gray-900 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Apertura
              </button>
              <button
                onClick={() => setSelectedType('aggiustamento')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-base transition-all ${
                  selectedType === 'aggiustamento'
                    ? 'bg-blue-600 text-white border-4 border-blue-700'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-4 border-gray-900 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Aggiustamento
              </button>
            </>
          )}
          {isClosed && (
            <button
              onClick={() => setSelectedType('chiusura')}
              className="flex-1 px-4 py-3 rounded-lg font-semibold text-base transition-all bg-blue-600 text-white border-4 border-blue-700"
              disabled
            >
              Chiusura
            </button>
          )}
        </div>

        {/* Preview template */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600">
          <div ref={templateRef} className="inline-block">
            {graphicData && (
              <GraphicTemplate
                type={selectedType}
                data={graphicData}
              />
            )}
          </div>
        </div>

        {/* Pulsanti azione */}
        <div className="flex gap-2 mt-4">
          {!generatedImageUrl && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !graphicData}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generazione...
                </>
              ) : (
                '📸 Genera Grafica'
              )}
            </Button>
          )}

          {generatedImageUrl && (
            <>
              <Button onClick={handleDownload} variant="outline" className="flex-1 border-2 border-gray-900 dark:border-gray-600 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-gray-700">
                <Download className="mr-2 h-4 w-4" />
                Scarica PNG
              </Button>
              <Button onClick={handleCopyLink} variant="outline" className="flex-1 border-2 border-gray-900 dark:border-gray-600 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-gray-700">
                <Copy className="mr-2 h-4 w-4" />
                Copia Link
              </Button>
            </>
          )}
        </div>

        {/* Immagine generata */}
        {generatedImageUrl && (
          <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600">
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Immagine Generata:</h3>
            <img src={generatedImageUrl} alt="Grafica generata" className="w-full rounded border-2 border-gray-400" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
