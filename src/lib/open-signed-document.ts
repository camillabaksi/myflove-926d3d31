import { getDataOwner } from "@/lib/account-scope";

/** Reserve the tab during the user's click, before fetching the private URL.
 * The original app stays open; a failed lookup closes the blank tab. */
export async function openSignedDocument(resolveUrl: () => Promise<string>): Promise<void> {
  const owner = getDataOwner();
  if (!owner) throw new Error("Logga in för att öppna dokumentet.");
  const tab = window.open("about:blank", "_blank");
  if (!tab) throw new Error("Webbläsaren blockerade dokumentet. Tillåt en ny flik och försök igen.");
  tab.opener = null;
  try {
    const url = new URL(await resolveUrl());
    if (getDataOwner() !== owner) throw new Error("Kontot ändrades. Öppna dokumentet igen.");
    if (url.protocol !== "https:") throw new Error("Dokumentlänken kunde inte öppnas säkert.");
    if (tab.closed) return;
    tab.location.replace(url.href);
  } catch (error) {
    tab.close();
    throw error;
  }
}
