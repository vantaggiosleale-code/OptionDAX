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
  const closeMutation = trpc.optionStructures.close.useMutation();
  const reopenMutation = trpc.optionStructures.reopen.useMutation();
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
          id: leg.id,
          optionType: leg.optionType,
          strike: leg.strike,
          expiryDate: leg.expiryDate,
          openingDate: leg.openingDate,
          quantity: leg.quantity,
          tradePrice: leg.tradePrice,
          impliedVolatility: leg.impliedVolatility,
          openingCommission: leg.openingCommission || 2,
          closingCommission: leg.closingCommission || 2,
          closingPrice: leg.closingPrice ?? null,
          closingDate: leg.closingDate ?? null,
          isActive: leg.isActive ?? true,
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
          id: leg.id,
          optionType: leg.optionType,
          strike: leg.strike,
          expiryDate: leg.expiryDate,
          openingDate: leg.openingDate,
          quantity: leg.quantity,
          tradePrice: leg.tradePrice,
          impliedVolatility: leg.impliedVolatility,
          openingCommission: leg.openingCommission || 2,
          closingCommission: leg.closingCommission || 2,
          closingPrice: leg.closingPrice ?? null,
          closingDate: leg.closingDate ?? null,
          isActive: leg.isActive ?? true,
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
  const closeStructure = async (structureId: number, daxSpot: number, riskFreeRate: number) => {
    try {
      await closeMutation.mutateAsync({
        id: structureId,
        daxSpot,
        riskFreeRate,
      });
      // Aspetta che il refetch sia completato prima di tornare
      await utils.optionStructures.list.invalidate();
    } catch (error) {
      console.error('Errore durante la chiusura della struttura:', error);
      throw error;
    }
  };

  // Riapri struttura (ora implementata!)
  const reopenStructure = async (structureId: number) => {
    try {
      await reopenMutation.mutateAsync({ id: structureId });
      await utils.optionStructures.list.invalidate();
    } catch (error) {
      console.error('Errore durante la riapertura della struttura:', error);
      throw error;
    }
  };

  // Condividi struttura con admin (FIXED: usa adminId invece di adminEmail)
  const shareWithAdmin = async (structureId: number, adminId: number) => {
    try {
      await shareMutation.mutateAsync({
        structureId,
        adminId,
      });
      refetch();
    } catch (error) {
      console.error('Errore durante la condivisione della struttura:', error);
      throw error;
    }
  };

  // Filtra strutture active e closed
  // FIXED: Converte realizedPnl da stringa a numero
  const structures = (structuresQuery.data || []).map(s => ({
    ...s,
    realizedPnl: s.realizedPnl ? Number(s.realizedPnl) : undefined,
  })) as Structure[];
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
