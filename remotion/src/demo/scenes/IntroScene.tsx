import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark, DEMO_COLORS, DEMO_FONTS, DemoShell, enter } from "../theme";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = enter(frame, fps, 5, 44);
  const sub = enter(frame, fps, 18, 28);
  const ring = interpolate(frame, [0, 120], [0.82, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <DemoShell>
      <div
        style={{
          position: "absolute",
          width: 610,
          height: 610,
          right: 130,
          top: 190,
          border: `4px solid ${DEMO_COLORS.violetSoft}`,
          borderRadius: "50%",
          opacity: 0.5,
          transform: `scale(${ring})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 430,
          height: 430,
          right: 220,
          top: 280,
          borderRadius: "48% 52% 57% 43% / 49% 42% 58% 51%",
          background: `linear-gradient(145deg, ${DEMO_COLORS.violet}, ${DEMO_COLORS.pink})`,
          transform: `rotate(${interpolate(frame, [0, 120], [-8, 4])}deg)`,
          boxShadow: "0 44px 80px rgba(56,38,79,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 365,
          top: 405,
          color: DEMO_COLORS.white,
          fontFamily: DEMO_FONTS.display,
          fontSize: 150,
          transform: `scale(${interpolate(frame, [0, 20], [0.7, 1], { extrapolateRight: "clamp" })})`,
        }}
      >
        ♡
      </div>
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 0 0 130px" }}>
        <div
          style={{
            ...title,
            fontFamily: DEMO_FONTS.display,
            fontWeight: 900,
            fontSize: 138,
            lineHeight: 0.95,
            color: DEMO_COLORS.plum,
            maxWidth: 980,
          }}
        >
          MyFlove
        </div>
        <div
          style={{
            ...sub,
            marginTop: 28,
            fontFamily: DEMO_FONTS.body,
            fontSize: 40,
            color: DEMO_COLORS.muted,
          }}
        >
          A calmer everyday life.
        </div>
      </AbsoluteFill>
      <BrandMark />
    </DemoShell>
  );
};
