/** Shared user-facing names; existing URLs and stored records stay compatible. */
export const APP_DESTINATIONS: Record<string, { label: string; hint: string }> = {
  "/halsa": { label: "Min plats", hint: "Energi, mående, träning, medicin och vila" },
  "/energifloede": { label: "Energimönster", hint: "Vad som brukar ge och ta energi" },
  "/historik": { label: "Dina aktiviteter", hint: "Dina uppgifter, påminnelser och veckosammanfattningar" },
  "/assistant": { label: "Chatta med Pace", hint: "Prata av dig eller tänk högt med Pace" },
  "/flow": { label: "Chatta med Pace", hint: "Prata av dig eller tänk högt med Pace" },
  "/flowplan": { label: "Planera", hint: "Ordna dagens saker med Pace" },
  "/familjeflow": { label: "Familj", hint: "Familjens vardag" },
  "/familj": { label: "Dela & bjud in", hint: "Dela listor och kalender med andra" },
  "/insight": { label: "Insikter", hint: "Beskrivande mönster från din egen data" },
  "/pomodoro": { label: "Timer", hint: "Jobba en stund, ta paus" },
  "/stop-paus": { label: "Stop-paus", hint: "En paus mellan impuls och beslut" },
};
