import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';
import { getDb } from './db';
import { users, structures } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Marketplace (listPublic & import)', () => {
  let adminUserId: number;
  let clientUserId: number;
  let publicStructureId: number;
  let privateStructureId: number;
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Create admin user
    const [adminResult] = await db.insert(users).values({
      openId: 'test-admin-marketplace-' + Date.now(),
      name: 'Test Admin Marketplace',
      email: 'admin-marketplace@example.com',
      role: 'admin',
      loginMethod: 'test',
    });
    adminUserId = adminResult.insertId;
    
    // Create client user
    const [clientResult] = await db.insert(users).values({
      openId: 'test-client-marketplace-' + Date.now(),
      name: 'Test Client Marketplace',
      email: 'client-marketplace@example.com',
      role: 'user',
      loginMethod: 'test',
    });
    clientUserId = clientResult.insertId;
    
    // Create public structure (admin)
    const [publicResult] = await db.insert(structures).values({
      userId: adminUserId,
      tag: 'Public Test Structure',
      multiplier: 5,
      legsPerContract: 1,
      legs: JSON.stringify([{
        id: 1,
        optionType: 'Call',
        strike: 20000,
        expiryDate: '2026-03-20',
        openingDate: '2026-01-24',
        quantity: 1,
        tradePrice: 100,
        closingPrice: null,
        closingDate: null,
        impliedVolatility: 15,
        openingCommission: 3,
        closingCommission: 3,
      }]),
      status: 'active',
      isPublic: 1, // PUBLIC
      isTemplate: 0,
    });
    publicStructureId = publicResult.insertId;
    
    // Create private structure (admin)
    const [privateResult] = await db.insert(structures).values({
      userId: adminUserId,
      tag: 'Private Test Structure',
      multiplier: 5,
      legsPerContract: 1,
      legs: JSON.stringify([{
        id: 1,
        optionType: 'Put',
        strike: 19000,
        expiryDate: '2026-03-20',
        openingDate: '2026-01-24',
        quantity: 1,
        tradePrice: 80,
        closingPrice: null,
        closingDate: null,
        impliedVolatility: 15,
        openingCommission: 3,
        closingCommission: 3,
      }]),
      status: 'active',
      isPublic: 0, // PRIVATE
      isTemplate: 0,
    });
    privateStructureId = privateResult.insertId;
  });
  
  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    
    // Clean up test data
    await db.delete(structures).where(eq(structures.userId, adminUserId));
    await db.delete(structures).where(eq(structures.userId, clientUserId));
    await db.delete(users).where(eq(users.id, adminUserId));
    await db.delete(users).where(eq(users.id, clientUserId));
  });
  
  const getAdminContext = (): Context => ({
    user: {
      id: adminUserId,
      openId: 'test-admin-marketplace',
      name: 'Test Admin Marketplace',
      email: 'admin-marketplace@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: 'test',
    },
    req: {} as any,
    res: {} as any,
  });
  
  const getClientContext = (): Context => ({
    user: {
      id: clientUserId,
      openId: 'test-client-marketplace',
      name: 'Test Client Marketplace',
      email: 'client-marketplace@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: 'test',
    },
    req: {} as any,
    res: {} as any,
  });
  
  describe('listPublic', () => {
    it('should return only public structures', async () => {
      const caller = appRouter.createCaller(getClientContext());
      const publicStructures = await caller.optionStructures.listPublic({ status: 'all' });
      
      expect(publicStructures).toBeDefined();
      expect(Array.isArray(publicStructures)).toBe(true);
      
      // Should include public structure
      const foundPublic = publicStructures.find(s => s.id === publicStructureId);
      expect(foundPublic).toBeDefined();
      expect(foundPublic?.tag).toBe('Public Test Structure');
      
      // Should NOT include private structure
      const foundPrivate = publicStructures.find(s => s.id === privateStructureId);
      expect(foundPrivate).toBeUndefined();
    });
    
    it('should filter by status', async () => {
      const caller = appRouter.createCaller(getClientContext());
      const activeStructures = await caller.optionStructures.listPublic({ status: 'active' });
      
      expect(activeStructures.every(s => s.status === 'active')).toBe(true);
    });
  });
  
  describe('import', () => {
    it('should import public structure as independent copy', async () => {
      const caller = appRouter.createCaller(getClientContext());
      const imported = await caller.optionStructures.import({ structureId: publicStructureId });
      
      expect(imported).toBeDefined();
      expect(imported.id).not.toBe(publicStructureId); // Different ID
      expect(imported.userId).toBe(clientUserId); // Owned by client
      expect(imported.tag).toBe('Public Test Structure (Copy)');
      expect(imported.isPublic).toBe(0); // Private by default
      expect(imported.originalStructureId).toBe(publicStructureId); // Track original
      expect(imported.legs).toHaveLength(1);
    });
    
    it('should reject import of private structure', async () => {
      const caller = appRouter.createCaller(getClientContext());
      
      await expect(
        caller.optionStructures.import({ structureId: privateStructureId })
      ).rejects.toThrow('Structure is not public');
    });
    
    it('should reject import of non-existent structure', async () => {
      const caller = appRouter.createCaller(getClientContext());
      
      await expect(
        caller.optionStructures.import({ structureId: 999999 })
      ).rejects.toThrow('Structure not found');
    });
  });
  
  describe('togglePublic (admin only)', () => {
    it('should allow admin to toggle visibility', async () => {
      const caller = appRouter.createCaller(getAdminContext());
      
      // Toggle to private
      const result = await caller.optionStructures.togglePublic({
        structureId: publicStructureId,
        isPublic: false,
      });
      
      expect(result.success).toBe(true);
      
      // Verify it's no longer in public list
      const publicStructures = await caller.optionStructures.listPublic({ status: 'all' });
      const found = publicStructures.find(s => s.id === publicStructureId);
      expect(found).toBeUndefined();
      
      // Toggle back to public
      await caller.optionStructures.togglePublic({
        structureId: publicStructureId,
        isPublic: true,
      });
    });
    
    it('should reject non-admin toggle', async () => {
      const caller = appRouter.createCaller(getClientContext());
      
      await expect(
        caller.optionStructures.togglePublic({
          structureId: publicStructureId,
          isPublic: false,
        })
      ).rejects.toThrow('Only admins can change visibility');
    });
  });
});
