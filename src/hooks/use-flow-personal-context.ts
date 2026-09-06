import { useMemo } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useMoods } from "@/hooks/use-data";
import { useFlowLearning } from "@/hooks/use-flow-learning";
import { useFlowSettings } from "@/hooks/use-flow-settings";
import { useLifeProfile } from "@/hooks/use-life-profile";
import { useSituation } from "@/hooks/use-situation";
import { lifeProfileContext } from "@/lib/life-profile";
import { situationContext } from "@/lib/situation";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import { impactContext } from "@/lib/impact-checkin";
import { checkinContext } from "@/lib/flow-checkin-context";

const TONE: Record<string, string> = {
  tyst: "Användaren vill ha få ord. Svara kort och bara på det som frågas.",
  diskret: "Användaren vill ha lagom mycket hjälp. Ett förslag i taget.",
  aktiv: "Användaren vill gärna ha förslag och idéer, men fortfarande en sak i taget.",
};

/**
 * Personlig kontext till Flow-chatten: vem du är, vad Flow lärt sig av din
 * användning och hur du vill bli bemött. Ingen ny data samlas in – allt
 * finns redan i MyFlove.
 */
export function useFlowPersonalContext(): string {
  const { name } = useUserProfile();
  const knowledge = useFlowLearning();
  const { settings } = useFlowSettings();
  const { profile } = useLifeProfile();
  const { situation } = useSituation();
  const { moods } = useMoods();
  const { todayEnergyEntries } = useQuickCheckin();
  const { impact } = useImpactCheckin();

  return useMemo(() => {
    const lines: string[] = ["Om användaren (personlig kontext, inte regler):"];
    if (name) lines.push(`- Tilltalsnamn: ${name}. Använd namnet sparsamt och varmt.`);

    const profileText = lifeProfileContext(profile);
    if (profileText) lines.push(profileText);

    const sit = situationContext(situation);
    if (sit) lines.push(sit);

    lines.push(checkinContext(moods, todayEnergyEntries));

    const impact = impactContext(impactEntry);
    if (impact) lines.push(impact);


    // Användarens egna ord från Mitt batteri – kontext, aldrig diagnos.
    const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const notes = moods
      .filter((m) => m.date >= week && m.note?.trim())
      .slice(0, 3)
      .map((m) => `- Du har berättat: ”${m.note?.trim()}”`);
    if (notes.length) {
      lines.push("Användarens egna ord om sitt mående den senaste veckan:");
      lines.push(...notes);
      lines.push(
        "Detta är användarens egen beskrivning, inte en diagnos. Dra inga medicinska slutsatser och ställ inga diagnoser – säg hellre 'du har berättat att…' och anpassa dagens förslag varsamt.",
      );
    }

    if (knowledge.insights.length) {
      lines.push(
        `Vad Flow har sett i användningen hittills (${knowledge.label}, ${knowledge.level}% igenkänning):`,
      );
      for (const i of knowledge.insights.slice(0, 6)) {
        lines.push(`- (${i.confidence}) ${i.text}`);
      }
      lines.push(
        "Använd mönstren för att ge konkreta, personliga tips – t.ex. föreslå tider och upplägg som brukar fungera för användaren. Påstå aldrig mer än du sett; säg hellre 'jag har lagt märke till att…'.",
      );
    } else {
      lines.push(
        "Flow har ännu få mönster att gå på. Ställ hellre en nyfiken fråga än att gissa om användarens vanor.",
      );
    }

    lines.push(TONE[settings.level] ?? TONE["diskret"] ?? "");

    return lines.filter(Boolean).join("\n");
  }, [name, profile, situation, knowledge, settings.level, moods, todayEnergyEntries, impactEntry]);
}
