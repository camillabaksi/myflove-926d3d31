import React from "react";
import { FeatureScene } from "./FeatureScene";
import { COLORS } from "../theme";

export const SceneControl: React.FC = () => (
  <FeatureScene
    eyebrow="Du bestämmer"
    title="Flow föreslår – du säger ja"
    sub="FlowPlan lägger dagens ordning som ett förslag. Flytta om tills det känns rätt, och ändra allt direkt där det visas."
    accent={COLORS.studies}
    features={[
      { icon: "🗂", label: "Förslag först", desc: "Planen gäller när du säger ja" },
      { icon: "↕️", label: "Din ordning", desc: "Flytta upp och ner med pilarna" },
      { icon: "✏️", label: "Ändra överallt", desc: "Tid, datum, livsområde, anteckning" },
      { icon: "↩️", label: "Alltid tillbaka", desc: "Återgå till Flows ordning när du vill" },
    ]}
  />
);
