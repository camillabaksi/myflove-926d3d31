/**
 * Startsidans lugna hero-gradient – samma varma toner i hela appen.
 * Tonen följer tiden på dygnet så att appen känns levande men lugn.
 */
export function heroGradient(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 10) {
    return "linear-gradient(135deg, hsl(var(--sky) / 0.65) 0%, hsl(var(--cream)) 60%, hsl(var(--lavender) / 0.8) 100%)";
  }
  if (hour < 17) {
    return "linear-gradient(135deg, hsl(var(--lavender) / 0.85) 0%, hsl(var(--cream)) 62%, hsl(var(--mint) / 0.6) 100%)";
  }
  if (hour < 22) {
    return "linear-gradient(135deg, hsl(var(--blush) / 0.75) 0%, hsl(var(--cream)) 60%, hsl(var(--lavender) / 0.8) 100%)";
  }
  return "linear-gradient(135deg, hsl(var(--lavender) / 0.65) 0%, hsl(var(--card)) 72%)";
}
