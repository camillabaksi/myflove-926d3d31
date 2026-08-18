import React from "react";
import { AbsoluteFill } from "remotion";
import {
  COLORS,
  FONTS,
  SceneShell,
  SectionEyebrow,
  SectionSub,
  SectionTitle,
  useEntrance,
} from "../theme";

const Panel: React.FC<{
  title: string;
  rows: string[];
  color: string;
  delay: number;
}> = ({ title, rows, color, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        background: COLORS.cream,
        borderRadius: 26,
        padding: "24px 26px",
        boxShadow: "0 14px 30px rgba(30,42,36,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        borderLeft: `10px solid ${color}`,
      }}
    >
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 30, color }}>{title}</div>
      {rows.map((r) => (
        <div
          key={r}
          style={{
            fontFamily: FONTS.body,
            fontSize: 17,
            color: COLORS.ink,
            background: `${color}12`,
            borderRadius: 14,
            padding: "10px 14px",
          }}
        >
          {r}
        </div>
      ))}
    </div>
  );
};

export const SceneStudyBuddy: React.FC = () => {
  const note = useEntrance(78);
  return (
    <SceneShell bg={COLORS.bgDeep}>
      <AbsoluteFill
        style={{ padding: "60px 80px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 820 }}>
          <SectionEyebrow delay={0}>Studier</SectionEyebrow>
          <SectionTitle delay={4}>StudyFlow och StudyBuddy.</SectionTitle>
          <SectionSub delay={8}>
            Ett ställe för studierna: planera veckan i StudyFlow, plugga aktivt med StudyBuddy.
          </SectionSub>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Panel
            title="StudyFlow"
            color={COLORS.studies}
            delay={22}
            rows={[
              "Plugga nu – dagens fokuspass",
              "Kurser & inlämningar",
              "Föreläsningar in i kalendern",
            ]}
          />
          <Panel
            title="StudyBuddy"
            color={COLORS.primary}
            delay={40}
            rows={["Flashcards från din text", "Quiz som anpassar sig", "Repetition inför provet"]}
          />
        </div>
        <div
          style={{
            ...note,
            fontFamily: FONTS.body,
            fontSize: 18,
            color: COLORS.muted,
          }}
        >
          Gamla länkar hittar rätt automatiskt – inget att lära om.
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
