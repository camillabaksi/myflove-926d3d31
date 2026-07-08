import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, SceneShell, useEntrance } from "../theme";

const WORDS = [
  { word: "lugn", delay: 10 },
  { word: "trygghet", delay: 24 },
  { word: "värme", delay: 38 },
  { word: "enkelhet", delay: 52 },
  { word: "mindre att bära", delay: 66 },
];

const Word: React.FC<{ word: string; delay: number }> = ({ word, delay }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: 82,
        lineHeight: 1.05,
        color: COLORS.cream,
        letterSpacing: -2,
      }}
    >
      {word}.
    </div>
  );
};

export const SceneFeeling: React.FC = () => {
  const tail = useEntrance(90);
  return (
    <SceneShell bg={COLORS.ink}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-15%",
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.primarySoft}, transparent 70%)`,
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: COLORS.sage,
            opacity: 0.2,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          padding: 90,
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 4,
        }}
      >
        {WORDS.map((w) => (
          <Word key={w.word} {...w} />
        ))}
        <div
          style={{
            ...tail,
            marginTop: 28,
            fontFamily: FONTS.body,
            fontSize: 22,
            color: "rgba(255,251,243,0.7)",
            maxWidth: 620,
            lineHeight: 1.4,
          }}
        >
          Inte produktivitet. Inte prestation. Bara mindre mental belastning.
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
