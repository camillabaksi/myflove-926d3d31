import React from "react";
import { FeatureScene } from "./FeatureScene";
import { COLORS } from "../theme";

export const SceneCapture: React.FC = () => (
  <FeatureScene
    eyebrow="QuickFlow"
    title="Släpp det hos mig – jag tar hand om strukturen"
    sub="Skriv en tanke som den kommer. QuickFlow förstår vad det är, när det ska ske och var det hör hemma."
    accent={COLORS.gold}
    features={[
      { icon: "🕒", label: "Förstår tid", desc: '"Ring tandläkaren idag 14:00" blir en uppgift kl 14' },
      { icon: "🗂️", label: "Sorterar", desc: "Uppgift, inköp, kalender, studier eller anteckning" },
      { icon: "🙌", label: "Du bekräftar", desc: "Du ser förslaget innan något sparas" },
      { icon: "🔋", label: "Jag gjorde något", desc: "Logga det du gjort – dagens energiflöde" },
    ]}
  />
);
