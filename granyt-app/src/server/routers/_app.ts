import { router } from "../trpc";
import { organizationRouter } from "./organization";
import { dashboardRouter } from "./dashboard";
import { dagMetricsRouter } from "./dag-metrics";
import { alertsRouter } from "./alerts";
import { settingsRouter } from "./settings";
import { authRouter } from "./auth";
import { teamRouter } from "./team";

export const appRouter = router({
  auth: authRouter,
  organization: organizationRouter,
  dashboard: dashboardRouter,
  dagMetrics: dagMetricsRouter,
  alerts: alertsRouter,
  settings: settingsRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
