import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildWalkRoutes, type WalkRoute } from "./walk-routes.server";

const InputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  minutes: z.number().int().min(10).max(240).optional(),
  km: z.number().min(0.5).max(30).optional(),
});

export type { WalkRoute };

export const suggestWalkRoutes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => buildWalkRoutes(data));
