import { isActiveOwner } from "@/lib/account-scope";
import { nativeExtra } from "./native-reminder-plan";

// The OS owns the sound for reminders it has accepted, including while foregrounded.
// Keep due receipts briefly while the queue is refilled, avoiding a second HTMLAudio alarm.
const accepted = new Map<string, { ownerId: string; itemKey: string; at: number }>();
export function rememberNativeDelivery(
  rows: readonly { extra?: unknown }[],
  replaceFuture = true,
): void {
  const now = Date.now();
  for (const [key, value] of accepted)
    if (value.at < now - 120_000 || (replaceFuture && value.at > now)) accepted.delete(key);
  for (const row of rows) {
    const e = nativeExtra(row);
    if (e)
      accepted.set(`${e.ownerId}:${e.itemKey}:${e.scheduledAt}`, {
        ownerId: e.ownerId,
        itemKey: e.itemKey,
        at: Date.parse(e.scheduledAt),
      });
  }
}
export function forgetNativeDeliveries(): void {
  accepted.clear();
}
export function isNativeReminderHandled(itemKey: string, now = Date.now()): boolean {
  return [...accepted.entries()].some(
    ([, v]) =>
      v.itemKey === itemKey &&
      isActiveOwner(v.ownerId) &&
      Math.floor(v.at / 60_000) === Math.floor(now / 60_000),
  );
}
