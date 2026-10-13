/** Keep the approved primary layouts and workout presentation intact. */
const EXISTING_PRESENTATIONS = new Set([
  "/",
  "/idag",
  "/kalender",
  "/quickflow",
  "/halsa",
  "/traning",
  "/designsystem",
  "/pitch",
  "/sign-in",
  "/sign-up",
]);
export function usesRefreshedDesign(pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  return !EXISTING_PRESENTATIONS.has(path) && !path.startsWith("/traning/");
}
