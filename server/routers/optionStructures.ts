import { z } from 'zod';
import { eq, and, or, inArray, sql } from 'drizzle-orm';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { structures, users, InsertStructure } from '../../drizzle/schema';

/**
 * Router per gestione strutture Option DAX
 * Implementa logica di visibilità:
 * - Utenti vedono: proprie strutture + strutture admin
 * - Admin vedono: proprie strutture + strutture altri admin (non utenti di default)
 */
export const optionStructuresRouter = router({
  /**
   * Get all structures visible to current user
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['active', 'closed', 'all']).default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const currentUser = ctx.user;
      const isAdmin = currentUser.role === 'admin';

      // Base query - show only structures owned by current user
      let query = db.select().from(structures).where(eq(structures.userId, currentUser.id));

      // Filter by status
      if (input.status !== 'all') {
        query = query.where(eq(structures.status, input.status));
      }

      const results = await query;

      // Parse JSON fields
      return results.map(s => ({
        ...s,
        legs: JSON.parse(s.legs),
        sharedWith: s.sharedWith ? JSON.parse(s.sharedWith) : [],
      }));
    }),

  /**
   * Get single structure by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [structure] = await db
        .select()
        .from(structures)
        .where(eq(structures.id, input.id))
        .limit(1);

      if (!structure) {
        throw new Error('Structure not found');
      }

      // Check visibility
      const currentUser = ctx.user;
      const isOwner = structure.userId === currentUser.id;
      const sharedWith = structure.sharedWith ? JSON.parse(structure.sharedWith) : [];
      const isSharedWithUser = sharedWith.includes(currentUser.id);

      // Get structure owner
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, structure.userId))
        .limit(1);

      const isOwnerAdmin = owner?.role === 'admin';
      const isCurrentUserAdmin = currentUser.role === 'admin';

      // Visibility logic
      const canView =
        isOwner ||
        isSharedWithUser ||
        (isOwnerAdmin && !isCurrentUserAdmin) || // Users can see admin structures
        (isOwnerAdmin && isCurrentUserAdmin); // Admins can see other admin structures

      if (!canView) {
        throw new Error('Access denied');
      }

      return {
        ...structure,
        legs: JSON.parse(structure.legs),
        sharedWith,
      };
    }),

  /**
   * Create new structure
   */
  create: protectedProcedure
    .input(
      z.object({
        tag: z.string(),
        multiplier: z.number().default(5),
        legsPerContract: z.number().default(2),
        legs: z.array(z.any()), // OptionLeg[]
        status: z.enum(['active', 'closed']).default('active'),
        openPnl: z.string().optional(),
        pdc: z.string().optional(),
        delta: z.string().optional(),
        gamma: z.string().optional(),
        theta: z.string().optional(),
        vega: z.string().optional(),
        closingDate: z.string().optional(),
        realizedPnl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[optionStructures.create] START - User:", ctx.user.id, "Tag:", input.tag);
      console.log("[optionStructures.create] Input:", JSON.stringify(input, null, 2));
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const newStructure: InsertStructure = {
        userId: ctx.user.id,
        tag: input.tag,
        multiplier: input.multiplier,
        legsPerContract: input.legsPerContract,
        legs: JSON.stringify(input.legs),
        status: input.status,
        openPnl: input.openPnl,
        pdc: input.pdc,
        delta: input.delta,
        gamma: input.gamma,
        theta: input.theta,
        vega: input.vega,
        closingDate: input.closingDate,
        realizedPnl: input.realizedPnl,
        sharedWith: null,
      };

      const [result] = await db.insert(structures).values(newStructure);
      console.log("[optionStructures.create] Insert completed, insertId:", result.insertId);
      
      // Recupera la struttura appena creata dal database
      const [createdStructure] = await db
        .select()
        .from(structures)
        .where(eq(structures.id, result.insertId));
      
      if (!createdStructure) {
        throw new Error('Failed to retrieve created structure');
      }
      
      console.log("[optionStructures.create] Returning created structure:", createdStructure.id);
      
      // Restituisci la struttura completa come fa list()
      return {
        id: createdStructure.id,
        userId: createdStructure.userId,
        tag: createdStructure.tag,
        multiplier: createdStructure.multiplier,
        legsPerContract: createdStructure.legsPerContract,
        legs: JSON.parse(createdStructure.legs),
        status: createdStructure.status,
        openPnl: createdStructure.openPnl,
        pdc: createdStructure.pdc,
        delta: createdStructure.delta,
        gamma: createdStructure.gamma,
        theta: createdStructure.theta,
        vega: createdStructure.vega,
        closingDate: createdStructure.closingDate,
        realizedPnl: createdStructure.realizedPnl,
        sharedWith: createdStructure.sharedWith ? createdStructure.sharedWith.split(',') : [],
      };
    }),

  /**
   * Update existing structure
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        tag: z.string().optional(),
        multiplier: z.number().optional(),
        legsPerContract: z.number().optional(),
        legs: z.array(z.any()).optional(),
        status: z.enum(['active', 'closed']).optional(),
        openPnl: z.string().optional(),
        pdc: z.string().optional(),
        delta: z.string().optional(),
        gamma: z.string().optional(),
        theta: z.string().optional(),
        vega: z.string().optional(),
        closingDate: z.string().optional(),
        realizedPnl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check ownership
      const [existing] = await db
        .select()
        .from(structures)
        .where(eq(structures.id, input.id))
        .limit(1);

      if (!existing) {
        throw new Error('Structure not found');
      }

      if (existing.userId !== ctx.user.id) {
        throw new Error('Access denied: You can only update your own structures');
      }

      const updates: Partial<InsertStructure> = {};
      if (input.tag !== undefined) updates.tag = input.tag;
      if (input.multiplier !== undefined) updates.multiplier = input.multiplier;
      if (input.legsPerContract !== undefined) updates.legsPerContract = input.legsPerContract;
      if (input.legs !== undefined) updates.legs = JSON.stringify(input.legs);
      if (input.status !== undefined) updates.status = input.status;
      if (input.openPnl !== undefined) updates.openPnl = input.openPnl;
      if (input.pdc !== undefined) updates.pdc = input.pdc;
      if (input.delta !== undefined) updates.delta = input.delta;
      if (input.gamma !== undefined) updates.gamma = input.gamma;
      if (input.theta !== undefined) updates.theta = input.theta;
      if (input.vega !== undefined) updates.vega = input.vega;
      if (input.closingDate !== undefined) updates.closingDate = input.closingDate;
      if (input.realizedPnl !== undefined) updates.realizedPnl = input.realizedPnl;

      await db
        .update(structures)
        .set(updates)
        .where(eq(structures.id, input.id));

      return { success: true };
    }),

  /**
   * Delete structure
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check ownership
      const [existing] = await db
        .select()
        .from(structures)
        .where(eq(structures.id, input.id))
        .limit(1);

      if (!existing) {
        throw new Error('Structure not found');
      }

      if (existing.userId !== ctx.user.id) {
        throw new Error('Access denied: You can only delete your own structures');
      }

      await db.delete(structures).where(eq(structures.id, input.id));

      return { success: true };
    }),

  /**
   * Share structure with admin
   */
  share: protectedProcedure
    .input(
      z.object({
        structureId: z.number(),
        adminId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check ownership
      const [structure] = await db
        .select()
        .from(structures)
        .where(eq(structures.id, input.structureId))
        .limit(1);

      if (!structure) {
        throw new Error('Structure not found');
      }

      if (structure.userId !== ctx.user.id) {
        throw new Error('Access denied: You can only share your own structures');
      }

      // Verify target user is admin
      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.adminId))
        .limit(1);

      if (!targetUser || targetUser.role !== 'admin') {
        throw new Error('Target user is not an admin');
      }

      // Update sharedWith
      const currentSharedWith = structure.sharedWith ? JSON.parse(structure.sharedWith) : [];
      if (!currentSharedWith.includes(input.adminId)) {
        currentSharedWith.push(input.adminId);
      }

      await db
        .update(structures)
        .set({ sharedWith: JSON.stringify(currentSharedWith) })
        .where(eq(structures.id, input.structureId));

      return { success: true };
    }),

  /**
   * Unshare structure
   */
  unshare: protectedProcedure
    .input(
      z.object({
        structureId: z.number(),
        adminId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check ownership
      const [structure] = await db
        .select()
        .from(structures)
        .where(eq(structures.id, input.structureId))
        .limit(1);

      if (!structure) {
        throw new Error('Structure not found');
      }

      if (structure.userId !== ctx.user.id) {
        throw new Error('Access denied');
      }

      // Update sharedWith
      const currentSharedWith = structure.sharedWith ? JSON.parse(structure.sharedWith) : [];
      const newSharedWith = currentSharedWith.filter((id: number) => id !== input.adminId);

      await db
        .update(structures)
        .set({ sharedWith: JSON.stringify(newSharedWith) })
        .where(eq(structures.id, input.structureId));

      return { success: true };
    }),

  /**
   * Close structure (mark as closed with realized P&L)
   */
  close: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        daxSpot: z.number(),
        riskFreeRate: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check ownership
      const [structure] = await db
        .select()
        .from(structures)
        .where(eq(structures.id, input.id))
        .limit(1);

      if (!structure) {
        throw new Error('Structure not found');
      }

      if (structure.userId !== ctx.user.id) {
        throw new Error('Access denied: You can only close your own structures');
      }

      if (structure.status === 'closed') {
        throw new Error('Structure is already closed');
      }

      // Parse legs
      const legs = JSON.parse(structure.legs);

      // Calculate realized P&L by closing all legs at current market prices
      // For simplicity, use current theoretical value as closing price
      const closingDate = new Date().toISOString();
      let realizedPnl = 0;

      const updatedLegs = legs.map((leg: any) => {
        // Calculate theoretical price using Black-Scholes
        const timeToExpiry = (new Date(leg.expiryDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
        const d1 = (Math.log(input.daxSpot / leg.strike) + (input.riskFreeRate + 0.5 * leg.impliedVolatility ** 2) * timeToExpiry) / (leg.impliedVolatility * Math.sqrt(timeToExpiry));
        const d2 = d1 - leg.impliedVolatility * Math.sqrt(timeToExpiry);
        
        // Approssimazione della CDF normale standard (Abramowitz & Stegun)
        const normCdf = (x: number) => {
          const t = 1 / (1 + 0.2316419 * Math.abs(x));
          const d = 0.3989423 * Math.exp(-x * x / 2);
          const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
          return x > 0 ? 1 - prob : prob;
        };
        
        let theoreticalPrice;
        if (leg.optionType === 'call') {
          theoreticalPrice = input.daxSpot * normCdf(d1) - leg.strike * Math.exp(-input.riskFreeRate * timeToExpiry) * normCdf(d2);
        } else {
          theoreticalPrice = leg.strike * Math.exp(-input.riskFreeRate * timeToExpiry) * normCdf(-d2) - input.daxSpot * normCdf(-d1);
        }

        // Calculate P&L for this leg
        const legPnl = (theoreticalPrice - leg.tradePrice) * leg.quantity * structure.multiplier - leg.openingCommission - leg.closingCommission;
        realizedPnl += legPnl;

        return {
          ...leg,
          closingPrice: theoreticalPrice,
          closingDate,
        };
      });

      // Update structure
      await db
        .update(structures)
        .set({
          status: 'closed',
          legs: JSON.stringify(updatedLegs),
          closingDate,
          realizedPnl: realizedPnl.toFixed(2),
        })
        .where(eq(structures.id, input.id));

      return { success: true, realizedPnl };
    }),

  /**
   * Get list of admins for sharing dropdown
   */
  getAdmins: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const admins = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.role, 'admin'));

    return admins;
  }),
});
