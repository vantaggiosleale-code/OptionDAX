import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { structureGraphics } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { storagePut } from "../storage";

export const graphicsRouter = router({
  /**
   * Salva grafica generata dal client (base64) su S3
   */
  saveFromClient: protectedProcedure
    .input(
      z.object({
        structureId: z.number(),
        type: z.enum(["apertura", "aggiustamento", "chiusura"]),
        imageBase64: z.string(), // Data URL format: "data:image/png;base64,..."
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Solo admin possono generare grafiche
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli amministratori possono generare grafiche",
        });
      }

      // Estrai base64 data dal data URL
      const base64Data = input.imageBase64.split(",")[1];
      if (!base64Data) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato immagine non valido",
        });
      }

      // Converti base64 → Buffer
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Upload su S3
      const timestamp = Date.now();
      const key = `graphics/${input.structureId}-${input.type}-${timestamp}.png`;
      const { url } = await storagePut(key, imageBuffer, "image/png");

      // Salva nel database
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database non disponibile",
        });
      }

      await db.insert(structureGraphics).values({
        structureId: input.structureId,
        type: input.type,
        imageUrl: url,
        imageKey: key,
      });

      return { url };
    }),

  /**
   * Lista tutte le grafiche generate per una struttura
   */
  list: protectedProcedure
    .input(z.object({ structureId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database non disponibile",
        });
      }

      const graphics = await db
        .select()
        .from(structureGraphics)
        .where(eq(structureGraphics.structureId, input.structureId))
        .orderBy(desc(structureGraphics.createdAt));

      return graphics;
    }),

  /**
   * Elimina una grafica
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Solo admin possono eliminare grafiche
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli amministratori possono eliminare grafiche",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database non disponibile",
        });
      }

      await db.delete(structureGraphics).where(eq(structureGraphics.id, input.id));

      return { success: true };
    }),
});
