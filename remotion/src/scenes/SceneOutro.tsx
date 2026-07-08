import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONTS, SceneShell, useEntrance } from "../theme";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const s2 = spring({ frame: frame - 18, fps, config: { damping: 16, stiffness: 120 } });
  const l1 = useEntrance(50);
  const l2 = useEntrance(64);
  const l3 = useEntrance(80);
  const closing = useEntrance(110);
  const url = useEntrance(140);

  const y1 = interpolate(s1, [0, 1], [40, 0]);
  const y2 = interpolate(s2, [0, 1], [40, 0]);

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
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80, textAlign: "center" }}>
        <div
          style={{
            opacity: s1,
            transform: `translateY(${y1}px)`,
            fontFamily: FONTS.body,
            fontWeight: 500,
            color: COLORS.gold,
            letterSpacing: 6,
            fontSize: 16,
            textTransform: "uppercase",
          }}
        >
          MyFlow — vår vision
        </div>
        <div
          style={{
            opacity: s2,
            transform: `translateY(${y2}px)`,
            fontFamily: FONTS.display,
            fontWeight: 700,
            color: COLORS.cream,
            fontSize: 62,
            lineHeight: 1.1,
            marginTop: 20,
            maxWidth: 1000,
            letterSpacing: -1.5,
          }}
        >
          <div style={l1}>Vi bygger inte funktioner.</div>
          <div style={l2}>Vi löser vardagsfriktion.</div>
          <div style={{ ...l3, color: COLORS.primarySoft, marginTop: 8 }}>
            Bär mindre. Gör inte mer.
          </div>
        </div>
        <div
          style={{
            ...closing,
            marginTop: 36,
            fontFamily: FONTS.body,
            fontSize: 20,
            color: "rgba(255,251,243,0.8)",
            maxWidth: 780,
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          Du öppnar inte en app. Du möter Flow – en lugn, intelligent följeslagare
          som hjälper dig genom vardagen. 💙
        </div>
        <div
          style={{
            ...url,
            marginTop: 28,
            fontFamily: FONTS.body,
            fontSize: 18,
            color: "rgba(255,251,243,0.55)",
            letterSpacing: 1,
          }}
        >
          mitt-flow.lovable.app
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
