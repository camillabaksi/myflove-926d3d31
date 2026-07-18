import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS, SceneShell, useEntrance, SectionEyebrow } from "../theme";

export const SceneStop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // pulsing breath circle
  const breath = (Math.sin((frame / fps) * 1.4) + 1) / 2; // 0..1
  const pulseScale = interpolate(breath, [0, 1], [0.85, 1.1]);
  const pulseOpacity = interpolate(breath, [0, 1], [0.35, 0.7]);

  const badge = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const title = useEntrance(18);
  const sub = useEntrance(34);
  const line1 = useEntrance(58);
  const line2 = useEntrance(78);
  const line3 = useEntrance(98);

  return (
    <SceneShell bg={COLORS.bg}>
      {/* soft background wash */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-15%",
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.primarySoft}, transparent 70%)`,
            opacity: 0.35,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ padding: 90, display: "flex", alignItems: "center" }}>
        {/* left: breathing STOP badge */}
        <div style={{ flex: "0 0 380px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: COLORS.primarySoft,
              transform: `scale(${pulseScale})`,
              opacity: pulseOpacity,
              filter: "blur(2px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: COLORS.sage,
              transform: `scale(${interpolate(breath, [0, 1], [1.05, 0.9])})`,
              opacity: 0.35,
            }}
          />
          <div
            style={{
              position: "relative",
              width: 210,
              height: 210,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primarySoft})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(184,80,66,0.35)",
              transform: `scale(${interpolate(badge, [0, 1], [0.6, 1])})`,
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 76,
              color: COLORS.cream,
              letterSpacing: -1,
            }}
          >
            Stop.
          </div>
        </div>

        {/* right: copy */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, maxWidth: 620 }}>
          <SectionEyebrow>Stoppknappen™</SectionEyebrow>
          <h2
            style={{
              ...title,
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 62,
              lineHeight: 1.05,
              color: COLORS.ink,
              margin: 0,
            }}
          >
            En paus mellan impuls och beslut.
          </h2>
          <p
            style={{
              ...sub,
              fontFamily: FONTS.body,
              fontSize: 20,
              lineHeight: 1.45,
              color: COLORS.muted,
              margin: 0,
            }}
          >
            Ett tryck. Ett andetag. Ett samtal med Flow innan du gör något du kanske ångrar.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {[
              { s: line1, t: "Andas — pulsen får sjunka först." },
              { s: line2, t: "Sätt ord — vad söker känslan egentligen?" },
              { s: line3, t: "Välj — utan skam, utan press." },
            ].map((row) => (
              <div
                key={row.t}
                style={{
                  ...row.s,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: COLORS.cream,
                  padding: "12px 18px",
                  borderRadius: 16,
                  boxShadow: "0 4px 14px rgba(44,54,57,0.05)",
                  fontFamily: FONTS.body,
                  fontSize: 18,
                  color: COLORS.ink,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: COLORS.primary,
                    flexShrink: 0,
                  }}
                />
                {row.t}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
