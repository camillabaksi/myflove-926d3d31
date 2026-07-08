import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS, SceneShell } from "../theme";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 16, stiffness: 120 } });
  const s3 = spring({ frame: frame - 36, fps, config: { damping: 16, stiffness: 120 } });

  const y1 = interpolate(s1, [0, 1], [40, 0]);
  const y2 = interpolate(s2, [0, 1], [40, 0]);
  const y3 = interpolate(s3, [0, 1], [40, 0]);

  return (
    <SceneShell bg={COLORS.ink}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "-10%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: COLORS.primary,
            opacity: 0.35,
            filter: "blur(4px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-25%",
            right: "-15%",
            width: 640,
            height: 640,
            borderRadius: "50%",
            background: COLORS.sage,
            opacity: 0.3,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
        <div style={{ opacity: s1, transform: `translateY(${y1}px)`, fontFamily: FONTS.body, fontWeight: 500, color: COLORS.gold, letterSpacing: 6, fontSize: 18, textTransform: "uppercase" }}>
          MyFlow
        </div>
        <div
          style={{
            opacity: s2,
            transform: `translateY(${y2}px)`,
            fontFamily: FONTS.display,
            fontWeight: 700,
            color: COLORS.cream,
            fontSize: 110,
            lineHeight: 1.02,
            marginTop: 16,
            textAlign: "center",
            letterSpacing: -3,
          }}
        >
          Mindre kaos.<br />
          Mer <em style={{ color: COLORS.primarySoft }}>flow</em>.
        </div>
        <div
          style={{
            opacity: s3,
            transform: `translateY(${y3}px)`,
            fontFamily: FONTS.body,
            fontWeight: 400,
            fontSize: 22,
            color: "rgba(255,251,243,0.75)",
            marginTop: 28,
          }}
        >
          mitt-flow.lovable.app
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
