import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  strategies,
  InsertStrategy,
  portfolios,
  InsertPortfolio,
  portfolioStrategies,
  analysisHistory,
  InsertAnalysisHistory,
  riskAlerts,
  InsertRiskAlert,
  uploadedFiles,
  InsertUploadedFile,
  approvalRequests,
  InsertApprovalRequest
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Lista Gmail con privilegi admin
const ADMIN_EMAILS = [
  'vito.tarantini.52@gmail.com',
  'andrea.vaturi@gmail.com',
  'andrea.pula.it@gmail.com',
  'mirko.castignani@gmail.com',
];

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    } else if (user.email && isAdminEmail(user.email)) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Strategies queries
export async function createStrategy(strategy: InsertStrategy) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(strategies).values(strategy);
  return result;
}

export async function getUserStrategies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(strategies).where(eq(strategies.userId, userId));
}

export async function getStrategyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(strategies).where(eq(strategies.id, id)).limit(1);
  return result[0];
}

export async function updateStrategy(id: number, data: Partial<InsertStrategy>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(strategies).set(data).where(eq(strategies.id, id));
}

export async function deleteStrategy(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(strategies).where(eq(strategies.id, id));
}

// Portfolios queries
export async function createPortfolio(portfolio: InsertPortfolio) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(portfolios).values(portfolio);
  return result;
}

export async function getUserPortfolios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(portfolios).where(eq(portfolios.userId, userId));
}

export async function getPortfolioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(portfolios).where(eq(portfolios.id, id)).limit(1);
  return result[0];
}

export async function updatePortfolio(id: number, data: Partial<InsertPortfolio>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(portfolios).set(data).where(eq(portfolios.id, id));
}

export async function deletePortfolio(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(portfolios).where(eq(portfolios.id, id));
}

// Portfolio-Strategy relationships
export async function addStrategyToPortfolio(portfolioId: number, strategyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(portfolioStrategies).values({ portfolioId, strategyId });
}

export async function removeStrategyFromPortfolio(portfolioId: number, strategyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(portfolioStrategies)
    .where(eq(portfolioStrategies.portfolioId, portfolioId));
}

export async function getPortfolioStrategies(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(portfolioStrategies)
    .innerJoin(strategies, eq(portfolioStrategies.strategyId, strategies.id))
    .where(eq(portfolioStrategies.portfolioId, portfolioId));
}

// Analysis history queries
export async function saveAnalysis(analysis: InsertAnalysisHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(analysisHistory).values(analysis);
}

export async function getUserAnalysisHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(analysisHistory)
    .where(eq(analysisHistory.userId, userId))
    .orderBy(analysisHistory.createdAt)
    .limit(limit);
}

// Risk alerts queries
export async function createRiskAlert(alert: InsertRiskAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(riskAlerts).values(alert);
}

export async function getUserAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(riskAlerts)
    .where(eq(riskAlerts.userId, userId))
    .orderBy(riskAlerts.createdAt);
}

export async function markAlertAsRead(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(riskAlerts).set({ isRead: 1 }).where(eq(riskAlerts.id, alertId));
}

// Uploaded files queries
export async function saveUploadedFile(file: InsertUploadedFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(uploadedFiles).values(file);
}

export async function getUserFiles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(uploadedFiles)
    .where(eq(uploadedFiles.userId, userId))
    .orderBy(uploadedFiles.createdAt);
}

export async function getFileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id)).limit(1);
  return result[0];
}

export async function deleteFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
}


// Approval requests queries
export async function createApprovalRequest(request: InsertApprovalRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(approvalRequests).values(request);
}

export async function getPendingApprovals() {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(approvalRequests)
    .innerJoin(users, eq(approvalRequests.userId, users.id))
    .where(eq(approvalRequests.status, 'pending'))
    .orderBy(approvalRequests.createdAt);
}

export async function getApprovalRequestByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(approvalRequests)
    .where(eq(approvalRequests.userId, userId))
    .limit(1);
  return result[0];
}

export async function approveUser(userId: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update approval_requests table
  await db.update(approvalRequests)
    .set({
      status: 'approved',
      approvedBy,
      approvalDate: new Date(),
    })
    .where(eq(approvalRequests.userId, userId));
  
  // Update users table status
  return await db.update(users)
    .set({ status: 'approved' })
    .where(eq(users.id, userId));
}

export async function rejectUser(userId: number, approvedBy: number, rejectionReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update approval_requests table
  await db.update(approvalRequests)
    .set({
      status: 'rejected',
      approvedBy,
      approvalDate: new Date(),
      rejectionReason: rejectionReason || null,
    })
    .where(eq(approvalRequests.userId, userId));
  
  // Update users table status
  return await db.update(users)
    .set({ status: 'rejected' })
    .where(eq(users.id, userId));
}

export async function getPendingApprovalsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select()
    .from(approvalRequests)
    .where(eq(approvalRequests.status, 'pending'));
  return result.length;
}
