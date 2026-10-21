import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Transactional mail is sent exclusively from the server after a NEW application
 * has been stored. Loopia remains the inbound email provider/forwarder.
 *
 * Required server secret: RESEND_API_KEY.
 * Required sender DNS: verified paceable.se in Resend.
 * Never import this .server module into a browser component.
 */
export const TESTER_SENDER = "Paceable <kontakt@paceable.se>";
export const TESTER_OWNER = "kontakt@paceable.se";

export type MailApplicant = {
  id: string;
  email: string;
  platform: string;
  participation: string;
  focus: string;
  feedback_willing: boolean;
  language: "sv" | "en";
  confirmation_accepted_at: string | null;
  admin_notice_accepted_at: string | null;
};

export type MailDeliveryResult = {
  configured: boolean;
  confirmationAccepted: boolean;
  ownerNoticeAccepted: boolean;
  failed: boolean;
};

type MailContent = { to: string; subject: string; text: string };

function confirmationCopy(row: MailApplicant): MailContent {
  if (row.language === "en") {
    return {
      to: row.email,
      subject: "Thank you for signing up to test Paceable 💜",
      text: [
        "Hello!",
        "",
        "Thank you for your interest in testing Paceable.",
        "We've received your application. We'll contact you if a place is available and explain the next steps.",
        "Submitting your interest does not automatically enroll you in Google Play or TestFlight.",
        "",
        "You don't need to test everything or do anything right now.",
        "If you have questions or wish to withdraw your application, email kontakt@paceable.se.",
        "",
        "One thing at a time.",
        "Paceable – Your life, your pace.",
        "https://www.paceable.se",
      ].join("\n"),
    };
  }
  return {
    to: row.email,
    subject: "Tack för att du vill testa Paceable 💜",
    text: [
      "Hej!",
      "",
      "Tack för att du vill hjälpa oss att utveckla Paceable.",
      "Vi har tagit emot din intresseanmälan. Om vi har en testplats kontaktar vi dig med mer information om nästa steg.",
      "Anmälan innebär inte att du automatiskt har fått tillgång till Google Play eller TestFlight.",
      "",
      "Du behöver inte göra något mer just nu eller testa alla funktioner.",
      "Har du frågor eller vill ta tillbaka din anmälan? Skriv till kontakt@paceable.se.",
      "",
      "En sak i taget.",
      "Paceable – Ditt liv, i din takt.",
      "https://www.paceable.se",
    ].join("\n"),
  };
}

function ownerCopy(row: MailApplicant): MailContent {
  return {
    to: TESTER_OWNER,
    subject: "Ny intresseanmälan – Paceable",
    text: [
      "En person har anmält intresse för att testa Paceable.",
      "",
      `Mejladress: ${row.email}`,
      `Plattform: ${row.platform}`,
      `Testtyp: ${row.participation}`,
      `Fokus: ${row.focus}`,
      `Vill svara på frågor: ${row.feedback_willing ? "Ja" : "Nej"}`,
      "",
      "Se anmälan och uppdatera status här:",
      "https://www.paceable.se/admin-testare",
      "",
      "Det här är en rekryteringsanmälan, inte en registrerad appanvändare.",
    ].join("\n"),
  };
}

async function sendWithResend(
  key: string,
  mail: MailContent,
  idempotencyKey: string,
): Promise<boolean> {
  // No applicant-provided HTML; plain-text body prevents markup injection.
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: TESTER_SENDER,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    // Don't log address/body or provider response which may contain contact data.
    console.warn("[tester-email] provider rejected a message", response.status);
    return false;
  }
  const payload = (await response.json()) as { id?: string };
  return Boolean(payload.id);
}

async function sendIfNeeded(
  db: SupabaseClient,
  row: MailApplicant,
  key: string,
  kind: "confirmation" | "owner",
): Promise<{ accepted: boolean; failed: boolean }> {
  const acceptedField =
    kind === "confirmation" ? "confirmation_accepted_at" : "admin_notice_accepted_at";
  if (row[acceptedField]) return { accepted: true, failed: false };

  // Claim the delivery before contacting the provider. Only one concurrent
  // request may claim a given application and message type.
  const claimField =
    kind === "confirmation" ? "confirmation_claimed_at" : "admin_notice_claimed_at";
  const { data: claimed, error: claimError } = await db
    .from("tester_applications")
    .update({ [claimField]: new Date().toISOString() })
    .eq("id", row.id)
    .is(claimField, null)
    .is(acceptedField, null)
    .select("id");
  if (claimError || !claimed || claimed.length !== 1) {
    // An existing claim may be in progress or have an uncertain outcome.
    // Never automatically resend in that situation.
    return { accepted: false, failed: true };
  }

  const message = kind === "confirmation" ? confirmationCopy(row) : ownerCopy(row);
  let accepted: boolean;
  try {
    accepted = await sendWithResend(key, message, `tester-${kind}-${row.id}`);
  } catch {
    console.warn("[tester-email] provider not reachable");
    return { accepted: false, failed: true };
  }

  if (!accepted) return { accepted: false, failed: true };

  const { error } = await db
    .from("tester_applications")
    .update({ [acceptedField]: new Date().toISOString() })
    .eq("id", row.id)
    .is(acceptedField, null);
  if (error) {
    // Resend's idempotency key protects retries within its retention window.
    console.warn("[tester-email] accepted email but could not persist mail state");
    return { accepted: true, failed: true };
  }
  return { accepted: true, failed: false };
}

/** Best effort: accepting a signup must not depend on the email provider being online. */
export async function sendTesterSignupEmails(
  db: SupabaseClient,
  row: MailApplicant,
): Promise<MailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey)
    return {
      configured: false,
      confirmationAccepted: Boolean(row.confirmation_accepted_at),
      ownerNoticeAccepted: Boolean(row.admin_notice_accepted_at),
      failed: false,
    };

  const [confirmation, owner] = await Promise.all([
    sendIfNeeded(db, row, apiKey, "confirmation"),
    sendIfNeeded(db, row, apiKey, "owner"),
  ]);

  return {
    configured: true,
    confirmationAccepted: confirmation.accepted,
    ownerNoticeAccepted: owner.accepted,
    failed: confirmation.failed || owner.failed,
  };
}
