import { createServerFn } from "@tanstack/react-start";

/**
 * Utvecklingsläge: skapar/återställer ett testkonto så att QA-klickflöden
 * kan köras i previewen utan riktiga användaruppgifter.
 *
 * Endast tillgängligt när servern INTE kör i produktionsläge.
 */
export type DevSessionCredentials = { email: string; password: string };

export const ensureDevTestUserFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<DevSessionCredentials> => {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("Not available");
    }

    const email = process.env["DEV_TEST_EMAIL"] ?? "testflow@myflove.test";
    const password = process.env["DEV_TEST_PASSWORD"] ?? "PaceableDev!2026";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Finns användaren redan? Sätt då om lösenordet till dev-lösenordet.
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listError) throw new Error(listError.message);

    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      return { email, password };
    }

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Testflow", dev_test_account: true },
    });
    if (error) throw new Error(error.message);
    return { email, password };
  },
);
