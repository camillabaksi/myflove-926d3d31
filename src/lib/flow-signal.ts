/**
 * Liten signal så Flow kan reagera när något blir klart i appen.
 * Ingen ny datamodell – bara ett DOM-event som Flow lyssnar på.
 */

export const FLOW_DONE_EVENT = "myflove:flow-done";

export function flowDone(title?: string, message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FLOW_DONE_EVENT, { detail: { title, message } }));
}
