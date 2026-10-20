/** Presentation only; actual event dates, duration and permissions never change. */
export const CALENDAR_DESKTOP_SCALE = 1.7;
export const CALENDAR_MOBILE_SCALE = 1.35;
export function calendarGeometry(desktop: boolean, textScale = 1) {
  const scale = desktop ? CALENDAR_DESKTOP_SCALE : CALENDAR_MOBILE_SCALE;
  const contentScale = desktop ? 1 : Math.max(1, textScale);
  const entryMinimum = desktop ? 44 : Math.max(44, 64 * contentScale);
  const familyMinimum = desktop ? 64 : Math.max(entryMinimum, 72 * contentScale);
  const clusterMinimum = desktop ? 50 : Math.max(50, 52 * contentScale);
  return {
    scale, entryMinimum, familyMinimum, clusterMinimum,
    // Include the inter-block gap in collision occupancy, not stored duration.
    visualMinutes: desktop ? 32 : Math.ceil((Math.max(entryMinimum, clusterMinimum) + 4) / scale),
    familyVisualMinutes: desktop ? 32 : Math.ceil((familyMinimum + 4) / scale),
    endPadding: desktop ? 64 : familyMinimum + 4,
  };
}
export function calendarOffset(minute: number, first: number, scale: number) {
  return (minute - first) * scale;
}
export function calendarBlockHeight(start: number, end: number, scale: number, minimum: number) {
  return Math.max(minimum, (end - start) * scale - 4);
}
export function calendarDropMinute(offset: number, first: number, last: number, scale: number) {
  const minute = Math.round((first + offset / scale) / 15) * 15;
  return Math.max(first, Math.min(last - 15, minute));
}
export function calendarTimelineHeight(first: number, last: number, scale: number, endPadding: number) {
  return calendarOffset(last, first, scale) + (last === 1440 ? endPadding : 16);
}