import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Componente TEST semplificato per verificare html-to-image
 * Genera immagine da un div visibile senza complessità
 */
export function SimpleGraphicTest() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    console.log('[SimpleTest] Starting generation...');
    console.log('[SimpleTest] targetRef.current:', targetRef.current);

    if (!targetRef.current) {
      console.error('[SimpleTest] No target element!');
      toast.error('Elemento non trovato');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('[SimpleTest] Calling toPng...');
      const dataUrl = await toPng(targetRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#1a1a2e',
      });
      
      console.log('[SimpleTest] toPng success! DataURL length:', dataUrl.length);
      setImageUrl(dataUrl);
      toast.success('Immagine generata!');
    } catch (error) {
      console.error('[SimpleTest] Error:', error);
      toast.error(`Errore: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">Test Generazione Immagine</h2>

      {/* Elemento da convertire in immagine */}
      <div
        ref={targetRef}
        className="p-8 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg text-white"
        style={{ width: '600px', height: '400px' }}
      >
        <h1 className="text-4xl font-bold mb-4">🇩🇪 DAX Options</h1>
        <div className="text-2xl mb-2">Test Grafica</div>
        <div className="text-xl opacity-80">Data: {new Date().toLocaleDateString('it-IT')}</div>
        <div className="mt-8 p-4 bg-white/10 rounded">
          <div className="text-sm opacity-70">Struttura:</div>
          <div className="text-3xl font-bold">Long Call 24700</div>
        </div>
      </div>

      {/* Pulsante generazione */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        size="lg"
      >
        {isGenerating ? 'Generazione...' : '📸 Genera Immagine'}
      </Button>

      {/* Risultato */}
      {imageUrl && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Immagine Generata:</h3>
          <img src={imageUrl} alt="Generated" className="border rounded-lg" />
          <div className="text-sm text-gray-500">
            DataURL length: {imageUrl.length} chars
          </div>
        </div>
      )}
    </div>
  );
}
