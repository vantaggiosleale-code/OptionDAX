import { trpc } from '../lib/trpc';
import { Structure, OptionLeg } from '../types';

/**
 * Hook personalizzato per gestire le strutture di opzioni tramite tRPC
 * Sostituisce completamente portfolioStore con chiamate al database
 */
export function useStructures() {
  // Query per ottenere tutte le strutture (active + closed)
  const structuresQuery = trpc.optionStructures.list.useQuery({ status: 'all' });
  
  // Mutations
  const createMutation = trpc.optionStructures.create.useMutation();
  const updateMutation = trpc.optionStructures.update.useMutation();
  const deleteMutation = trpc.optionStructures.delete.useMutation();
  const shareMutation = trpc.optionStructures.share.useMutation();

  const utils = trpc.useUtils();

  // Funzione per invalidare cache e ricaricare strutture
  const refetch = () => {
    utils.optionStructures.list.invalidate();
  };

  // Aggiungi struttura
  const addStructure = async (structure: Omit<Structure, 'id' | 'status'>) => {
    try {
      await createMutation.mutateAsync({
        tag: structure.tag,
        multiplier: structure.multiplier,
        legsPerContract: 2,
        legs: structure.legs.map(leg => ({
          optionType: leg.optionType,
          strike: leg.strike,
          expiryDate: leg.expiryDate,
          openingDate: leg.openingDate,
          quantity: leg.quantity,
          tradePrice: leg.tradePrice,
          impliedVolatility: leg.impliedVolatility,
          openingCommission: leg.openingCommission || 2,
          closingCommission: leg.closingCommission || 2,
        })),
      });
      refetch();
    } catch (error) {
      console.error('Errore durante la creazione della struttura:', error);
      throw error;
    }
  };

  // Aggiorna struttura
  const updateStructure = async (structure: Structure) => {
    try {
      await updateMutation.mutateAsync({
        id: structure.id,
        tag: structure.tag,
        multiplier: structure.multiplier,
        legs: structure.legs.map(leg => ({
          optionType: leg.optionType,
          strike: leg.strike,
          expiryDate: leg.expiryDate,
          openingDate: leg.openingDate,
          quantity: leg.quantity,
          tradePrice: leg.tradePrice,
          impliedVolatility: leg.impliedVolatility,
          openingCommission: leg.openingCommission || 2,
          closingCommission: leg.closingCommission || 2,
          closingPrice: leg.closingPrice || null,
          closingDate: leg.closingDate || null,
        })),
      });
      refetch();
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della struttura:', error);
      throw error;
    }
  };

  // Elimina struttura
  const deleteStructure = async (structureId: number) => {
    try {
      await deleteMutation.mutateAsync({ id: structureId });
      refetch();
    } catch (error) {
      console.error('Errore durante l\'eliminazione della struttura:', error);
      throw error;
    }
  };

  // Elimina multiple strutture
  const deleteStructures = async (structureIds: number[]) => {
    try {
      await Promise.all(
        structureIds.map(id => deleteMutation.mutateAsync({ id }))
      );
      refetch();
    } catch (error) {
      console.error('Errore durante l\'eliminazione delle strutture:', error);
      throw error;
    }
  };

  // Chiudi struttura
  // TODO: Implementare procedure close nel router optionStructures
  const closeStructure = async (structureId: number, daxSpot: number, riskFreeRate: number) => {
    console.warn('closeStructure non implementata - procedure close non esiste nel router');
    throw new Error('Funzionalità non ancora implementata');
  };

  // Riapri struttura
  // TODO: Implementare procedure reopen nel router optionStructures
  const reopenStructure = async (structureId: number) => {
    console.warn('reopenStructure non implementata - procedure reopen non esiste nel router');
    throw new Error('Funzionalità non ancora implementata');
  };

  // Condividi struttura con admin
  const shareWithAdmin = async (structureId: number, adminEmail: string) => {
    try {
      await shareMutation.mutateAsync({
        structureId,
        adminEmail,
      });
      refetch();
    } catch (error) {
      console.error('Errore durante la condivisione della struttura:', error);
      throw error;
    }
  };

  // Filtra strutture active e closed
  const structures = structuresQuery.data || [];
  const activeStructures = structures.filter(s => s.status === 'active');
  const closedStructures = structures.filter(s => s.status === 'closed');

  return {
    // Dati
    structures,
    activeStructures,
    closedStructures,
    isLoading: structuresQuery.isLoading,
    error: structuresQuery.error,

    // Mutations
    addStructure,
    updateStructure,
    deleteStructure,
    deleteStructures,
    closeStructure,
    reopenStructure,
    shareWithAdmin,

    // Utility
    refetch,
  };
}
