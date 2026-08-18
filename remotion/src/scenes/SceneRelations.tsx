import React from "react";
import { FeatureScene } from "./FeatureScene";
import { COLORS } from "../theme";

export const SceneRelations: React.FC = () => (
  <FeatureScene
    eyebrow="Relationer"
    title="Ett livsområde du formar själv"
    sub="Familj har blivit Relationer. Du lägger till de personer och relationstyper som betyder något i ditt liv."
    accent={COLORS.gold}
    features={[
      { icon: "❤️", label: "Partner & vänner", desc: "Du väljer vilka som ska synas" },
      { icon: "👧", label: "Barn & anhöriga", desc: "Scheman och hushåll finns kvar" },
      { icon: "🐾", label: "Husdjur", desc: "Eller någon helt annan viktig person" },
      { icon: "⚡", label: "Energi", desc: "Markera vad som gav eller tog energi" },
    ]}
  />
);
