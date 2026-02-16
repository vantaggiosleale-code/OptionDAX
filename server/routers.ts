import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { strategiesRouter } from "./routers/strategies";
import { portfoliosRouter } from "./routers/portfolios";
import { analysisRouter } from "./routers/analysis";

import { filesRouter } from "./routers/files";
import { alertsRouter } from "./routers/alerts";
import { optionStructuresRouter } from "./routers/optionStructures";
import { marketDataRouter } from "./routers/marketData";
import { graphicsRouter } from "./routers/graphics";
import { userSettingsRouter } from "./routers/userSettings";
import { approvalsRouter } from "./routers/approvals";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  strategies: strategiesRouter,
  portfolios: portfoliosRouter,
  analysis: analysisRouter,
  files: filesRouter,
  alerts: alertsRouter,
  optionStructures: optionStructuresRouter,
  marketData: marketDataRouter,
  graphics: graphicsRouter,
  userSettings: userSettingsRouter,
  approvals: approvalsRouter,
});

export type AppRouter = typeof appRouter;
