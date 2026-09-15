import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEMO_COLORS, DEMO_FONTS, DemoShell, enter, PitchLabel } from "../theme";
import { useDemoCopy } from "../lang";

const CARD_KEYS = ["recoveryCard1", "recoveryCard2", "recoveryCard3", "recoveryCard4"] as const;

export const RecoveryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = useDemoCopy();
  const label = enter(frame, fps, 4, 20);
  const title = enter(frame, fps, 14, 30);

  // 4-2-6 breathing sun, synced with the app's Ljusboost rhythm.
  const cycle = 12 * fps;
  const t = (frame % cycle) / fps;
  const breath =
    t < 4
      ? interpolate(t, [0, 4], [0, 1])
      : t < 6
        ? 1
        : t < 12
          ? interpolate(t, [6, 12], [1, 0])
          : 0;
  const sunSize = interpolate(breath, [0, 1], [190, 262]);
  const glow = interpolate(breath, [0, 1], [0.34, 0.6]);

  return (
    <DemoShell>
      <div style={{ position: "absolute", left: 120, top: 120, ...label }}>
        <PitchLabel>{copy("recoveryLabel")}</PitchLabel>
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 176,
          width: 820,
          color: DEMO_COLORS.plum,
          fontFamily: DEMO_FONTS.display,
          fontWeight: 900,
          fontSize: 62,
          lineHeight: 1.1,
          ...title,
        }}
      >
        {copy("recoveryTitle")}
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 356,
          display: "grid",
          gridTemplateColumns: "repeat(2, 390px)",
          gap: 26,
        }}
      >
        {CARD_KEYS.map((key, i) => {
          const card = enter(frame, fps, 34 + i * 11, 26);
          return (
            <div
              key={key}
              style={{
                ...card,
                background: DEMO_COLORS.white,
                borderRadius: 30,
                padding: "30px 32px",
                boxShadow: "0 22px 46px rgba(56,38,79,0.12)",
                fontFamily: DEMO_FONTS.body,
                color: DEMO_COLORS.plum,
                fontWeight: 800,
                fontSize: 32,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 10,
                  borderRadius: 8,
                  background: i % 2 === 0 ? DEMO_COLORS.pink : DEMO_COLORS.violetSoft,
                  marginBottom: 18,
                }}
              />
              {copy(key)}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          right: 210,
          top: 330,
          width: 380,
          height: 380,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: sunSize,
            height: sunSize,
            borderRadius: "50%",
            background: "radial-gradient(circle at 42% 38%, #FFD9A1 0%, #FFB067 46%, #F2894F 100%)",
            boxShadow: `0 0 ${110 * glow}px ${44 * glow}px rgba(255,166,96,${glow})`,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 760,
          width: 500,
          textAlign: "center",
          fontFamily: DEMO_FONTS.body,
          fontStyle: "italic",
          fontSize: 30,
          color: DEMO_COLORS.muted,
          opacity: interpolate(frame, [40, 70], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {copy("recoveryBreath")}
      </div>
    </DemoShell>
  );
};
