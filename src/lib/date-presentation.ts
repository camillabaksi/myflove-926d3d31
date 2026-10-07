/** Sentence-style Swedish date labels; other locales keep their own casing. */
export function dateHeadingLabel(label: string, locale: string): string {
  if (!/^sv(?:-|$)/i.test(locale) || !label) return label;
  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
}
