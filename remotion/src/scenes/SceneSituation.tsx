import React from "react";
import { FeatureScene } from "./FeatureScene";
import { COLORS } from "../theme";

export const SceneSituation: React.FC = () => (
  <FeatureScene
    eyebrow="Min situation"
    title="Appen förstår var du är i livet"
    sub="Välj de livssituationer som pågår just nu – flera kan vara aktiva samtidigt. Pausar du en försvinner ingenting."
    accent={COLORS.primary}
    features={[
      { icon: "💼", label: "Jobb & studier", desc: "Öppnar din jobbprofil och studieprofil" },
      { icon: "🏡", label: "Föräldraledig", desc: "Barn och hemma lyfts fram" },
      { icon: "🌿", label: "Sjukskriven", desc: "Lugnare tempo, färre krav" },
      { icon: "🔎", label: "Arbetssökande", desc: "Flow anpassar förslagen direkt" },
    ]}
  />
);
