import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/**
 * Privat investerarmaterial. Filerna ligger i en privat storage-bucket utan
 * publika policies – enda vägen in är dessa serverfunktioner, som först
 * kontrollerar att anroparen verkligen har admin-rollen.
 */
const BUCKET = "investor-docs";

export const INVESTOR_CATEGORIES = [
  "pitchdeck",
  "ekonomi",
  "financial-model",
  "bmc",
  "quick-answers",
  "kpi",
  "ovrigt",
] as const;

export type InvestorCategory = (typeof INVESTOR_CATEGORIES)[number];

export const INVESTOR_CATEGORY_LABELS: Record<InvestorCategory, string> = {
  pitchdeck: "Pitchdeck / investor pitch",
  ekonomi: "Ekonomi & investeringsplan",
  "financial-model": "Financial Model",
  bmc: "Business Model Canvas",
  "quick-answers": "Investor Quick Answers",
  kpi: "KPI & traction",
  ovrigt: "Övrigt internt",
};

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type InvestorDoc = {
  path: string;
  name: string;
  category: InvestorCategory;
  size: number | null;
  updated_at: string | null;
};

const CategorySchema = z.enum(INVESTOR_CATEGORIES);
/** Tillåt bara enkla filnamn – ingen path traversal. */
const FileNameSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[\w ()+.-]+$/u, "Ogiltigt filnamn");
const PathSchema = z
  .string()
  .min(3)
  .max(260)
  .regex(/^[\w-]+\/[\w ()+.-]+$/u, "Ogiltig sökväg");

export const listInvestorDocsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InvestorDoc[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const docs: InvestorDoc[] = [];
    for (const category of INVESTOR_CATEGORIES) {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .list(category, { limit: 200, sortBy: { column: "updated_at", order: "desc" } });
      if (error) continue;
      for (const file of data ?? []) {
        if (!file.name || file.name === ".emptyFolderPlaceholder") continue;
        docs.push({
          path: `${category}/${file.name}`,
          name: file.name,
          category,
          size: (file.metadata?.["size"] as number | undefined) ?? null,
          updated_at: file.updated_at ?? file.created_at ?? null,
        });
      }
    }
    return docs;
  });

/** Kort signerad länk (5 min) – inga permanenta publika fil-URL:er. */
export const getInvestorDocUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ path: PathSchema }).parse(data))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(data.path, 300);
    if (error || !signed) throw new Error(error?.message ?? "Kunde inte skapa länk");
    return { url: signed.signedUrl };
  });

/** Signerad uppladdningslänk så filen aldrig passerar databasen. */
export const createInvestorUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ category: CategorySchema, fileName: FileNameSchema }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ path: string; token: string }> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${data.category}/${data.fileName}`;
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Kunde inte förbereda uppladdning");
    return { path, token: signed.token };
  });

export const deleteInvestorDocFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ path: PathSchema }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([data.path]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
