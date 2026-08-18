// TODO: Replace this simulated logic with a real OpenAI or generic LLM API call.
// For now, it uses simple heuristics to break down an overwhelming task into manageable steps
// so the user can benefit from it today without backend infrastructure.

export async function breakDownTask(taskDescription: string): Promise<string[]> {
  // Simulate network latency for realism
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const lowerTask = taskDescription.toLowerCase();

  // Keyword-based simulated templates
  if (lowerTask.includes("städa") || lowerTask.includes("rensa")) {
    return [
      "Hämta en soppåse för skräp",
      "Plocka upp allt som ligger på golvet",
      "Samla ihop disk och bär till köket",
      "Lägg saker som hör hemma i ett annat rum i en korg",
      "Torka av de största ytorna snabbt",
    ];
  }

  if (lowerTask.includes("tvätta") || lowerTask.includes("tvätt")) {
    return [
      "Samla all smutstvätt i en korg",
      "Sortera i ljus och mörk tvätt (grovt räcker)",
      "Bär korgen till tvättmaskinen",
      "Stoppa in en maskin och dosera tvättmedel",
      "Starta maskinen och sätt en timer på mobilen",
    ];
  }

  if (lowerTask.includes("packa")) {
    return [
      "Ta fram väskan och öppna den",
      "Lägg ner underkläder och strumpor",
      "Lägg ner byxor och tröjor",
      "Samla ihop necessären (tandborste, tandkräm, deo)",
      "Lägg ner laddare och elektronik",
    ];
  }

  // Generic fallback breakdown
  return [
    "Skriv ner den absolut första, minsta saken du måste göra för att börja",
    "Samla allt material eller verktyg du behöver på en plats",
    "Sätt en timer på 5 minuter och gör bara uppgiften under den tiden",
    "Ta en kort paus på 2 minuter",
    "Fortsätt i 10 minuter till om det känns okej, annars är du klar för nu",
  ];
}
