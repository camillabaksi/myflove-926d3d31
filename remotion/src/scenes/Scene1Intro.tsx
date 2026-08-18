import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS, SceneShell, useEntrance } from "../theme";

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const scale = interpolate(logoSpring, [0, 1], [0.7, 1]);
  const rot = interpolate(logoSpring, [0, 1], [-12, 0]);
  const tag = useEntrance(24);
  const sub = useEntrance(38);

  // circle scale for background
  const bgScale = interpolate(frame, [0, 90], [1, 1.15], { extrapolateRight: "clamp" });

  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: "-25%",
            right: "-15%",
            width: 780,
            height: 780,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${COLORS.primarySoft}, ${COLORS.primary})`,
            transform: `scale(${bgScale})`,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: COLORS.sage,
            opacity: 0.5,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ padding: 90, justifyContent: "center", alignItems: "flex-start" }}>
        <div
          style={{
            transform: `scale(${scale}) rotate(${rot}deg)`,
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: 180,
            color: COLORS.ink,
            lineHeight: 0.9,
            letterSpacing: -4,
          }}
        >
          MyFlove
        </div>
        <div
          style={{
            ...tag,
            marginTop: 24,
            fontFamily: FONTS.body,
            fontWeight: 500,
            fontSize: 34,
            color: COLORS.ink,
          }}
        >
          Ditt liv, i flow.
        </div>
        <div
          style={{
            ...sub,
            marginTop: 12,
            fontFamily: FONTS.body,
            fontWeight: 400,
            fontSize: 20,
            color: COLORS.muted,
            maxWidth: 560,
          }}
        >
          Ett lugnare hem för hjärnan – för dig som lever med ADHD, autism eller bara mycket i
          huvudet.
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
