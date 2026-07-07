export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Hej på dig, natturgla 🌙";
  if (hour < 10) return "God morgon ☀️";
  if (hour < 17) return "God eftermiddag 👋";
  if (hour < 22) return "God kväll 🌆";
  return "Hej på dig, natturgla 🌙";
}
