/** Balanced optional breaks for narrow greetings; preserves every character. */
export function greetingNameParts(name: string): string[] {
  return name.split(/(\s+)/).flatMap((word) => {
    const characters = Array.from(word);
    if (characters.length < 9 || /^\s+$/.test(word)) return [word];
    const count = Math.ceil(characters.length / 6);
    const size = Math.ceil(characters.length / count);
    return Array.from({ length: count }, (_, index) =>
      characters.slice(index * size, (index + 1) * size).join(""),
    );
  });
}