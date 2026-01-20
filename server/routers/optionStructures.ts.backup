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

      // Get all admin user IDs
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));
      const adminIds = adminUsers.map(u => u.id);

      let query = db.select().from(structures);

      if (isAdmin) {
        // Admin vede: proprie + altri admin
        query = query.where(
          or(
            eq(structures.userId, currentUser.id),
            inArray(structures.userId, adminIds)
          )
        );
      } else {
        // User vede: proprie + admin
        query = query.where(
          or(
            eq(structures.userId, currentUser.id),
            inArray(structures.userId, adminIds)
          )
        );
      }

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
      console.log("[optionStructures.create] Inserting structure:", JSON.stringify(newStructure, null, 2));
      console.log("[optionStructures.create] Insert completed, result:", result);

      return {
        success: true,
        id: result.insertId,
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
