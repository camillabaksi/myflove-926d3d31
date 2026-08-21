import React from "react";
import { FeatureScene } from "./FeatureScene";
import { COLORS } from "../theme";

export const SceneToday: React.FC = () => (
  <FeatureScene
    eyebrow="Idag"
    title="En vy för hela dagen"
    sub="Min dag och Daily Flow är nu EN plats: ❤️ Idag. Batteri, tidslinje och allt som ska göras – i två lugna visningslägen."
    accent={COLORS.primary}
    features={[
      { icon: "🌊", label: "Flow", desc: "Batteri, tidslinje och ett förslag i taget" },
      { icon: "📋", label: "Lista", desc: "Allt som ska göras idag, avbockningsbart" },
      { icon: "✨", label: "Allt i dagen", desc: "Planerat och genomfört på valfri dag" },
      { icon: "✅", label: "Samma bock", desc: "Hem, Idag, Kalender och Att göra delar status" },
    ]}
  />
);
