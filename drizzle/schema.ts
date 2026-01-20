import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Trading strategies table - stores user-defined option strategies
 */
export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  strategyType: varchar("strategyType", { length: 100 }).notNull(), // e.g., "call", "put", "spread", "straddle"
  underlyingAsset: varchar("underlyingAsset", { length: 100 }).notNull().default("DAX"),
  strikePrice: varchar("strikePrice", { length: 50 }),
  expirationDate: timestamp("expirationDate"),
  premium: varchar("premium", { length: 50 }),
  quantity: int("quantity").default(1),
  status: mysqlEnum("status", ["active", "closed", "expired"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

/**
 * Portfolios table - groups multiple strategies together
 */
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  totalValue: varchar("totalValue", { length: 50 }),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

/**
 * Portfolio strategies junction table - many-to-many relationship
 */
export const portfolioStrategies = mysqlTable("portfolio_strategies", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  strategyId: int("strategyId").notNull().references(() => strategies.id, { onDelete: "cascade" }),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type PortfolioStrategy = typeof portfolioStrategies.$inferSelect;
export type InsertPortfolioStrategy = typeof portfolioStrategies.$inferInsert;

/**
 * Analysis history table - stores Black-Scholes calculations and risk analysis
 */
export const analysisHistory = mysqlTable("analysis_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  strategyId: int("strategyId").references(() => strategies.id, { onDelete: "set null" }),
  analysisType: varchar("analysisType", { length: 100 }).notNull(), // "black-scholes", "payoff", "risk"
  inputParams: text("inputParams").notNull(), // JSON string of input parameters
  results: text("results").notNull(), // JSON string of calculation results
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalysisHistory = typeof analysisHistory.$inferSelect;
export type InsertAnalysisHistory = typeof analysisHistory.$inferInsert;

/**
 * Risk alerts table - stores critical risk notifications
 */
export const riskAlerts = mysqlTable("risk_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  portfolioId: int("portfolioId").references(() => portfolios.id, { onDelete: "set null" }),
  strategyId: int("strategyId").references(() => strategies.id, { onDelete: "set null" }),
  alertType: varchar("alertType", { length: 100 }).notNull(), // "risk_threshold", "expiration_warning", "price_alert"
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(), // 0 = unread, 1 = read
  notifiedOwner: int("notifiedOwner").default(0).notNull(), // 0 = not notified, 1 = notified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RiskAlert = typeof riskAlerts.$inferSelect;
export type InsertRiskAlert = typeof riskAlerts.$inferInsert;

/**
 * Uploaded files table - stores metadata for PDFs, screenshots, and documents
 */
export const uploadedFiles = mysqlTable("uploaded_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  strategyId: int("strategyId").references(() => strategies.id, { onDelete: "set null" }),
  portfolioId: int("portfolioId").references(() => portfolios.id, { onDelete: "set null" }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(), // S3 URL
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // in bytes
  fileType: mysqlEnum("fileType", ["report", "screenshot", "document", "other"]).default("other"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

/**
 * Structures table - stores Option DAX trading structures (active and closed)
 * This is the main table for the app, replacing the Zustand portfolioStore
 */
export const structures = mysqlTable("structures", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tag: varchar("tag", { length: 100 }).notNull(), // e.g., "BPS5", "STG7"
  multiplier: int("multiplier").notNull().default(5), // Product multiplier (1=CFD, 5=Micro Future, 25=Future)
  legsPerContract: int("legsPerContract").notNull().default(2), // 2 gambe/e
  legs: text("legs").notNull(), // JSON string of OptionLeg[]
  status: mysqlEnum("status", ["active", "closed"]).default("active").notNull(),
  
  // Greeks and P/L (stored as strings to preserve precision)
  openPnl: varchar("openPnl", { length: 50 }),
  pdc: varchar("pdc", { length: 50 }), // Point de Carico
  delta: varchar("delta", { length: 50 }),
  gamma: varchar("gamma", { length: 50 }),
  theta: varchar("theta", { length: 50 }),
  vega: varchar("vega", { length: 50 }),
  
  // For closed structures
  closingDate: varchar("closingDate", { length: 50 }), // e.g., "2023-08-16"
  realizedPnl: varchar("realizedPnl", { length: 50 }),
  
  // Sharing with admins
  sharedWith: text("sharedWith"), // JSON array of admin user IDs, e.g., "[1, 3, 5]"
  
  // Public visibility and templates
  isPublic: int("isPublic").default(0).notNull(), // 0 = private, 1 = public (visible to all users)
  isTemplate: int("isTemplate").default(0).notNull(), // 0 = normal structure, 1 = template/model structure
  originalStructureId: int("originalStructureId"), // Reference to original structure if this is an imported copy
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Structure = typeof structures.$inferSelect;
export type InsertStructure = typeof structures.$inferInsert;
