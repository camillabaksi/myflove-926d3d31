import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  COLORS,
  FONTS,
  SceneShell,
  SectionEyebrow,
  SectionTitle,
  SectionSub,
  useEntrance,
} from "../theme";

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const e = useEntrance(20);
  const slide = interpolate(frame, [40, 70], [-40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ ...e, position: "relative", width: 320, height: 620 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.ink,
          borderRadius: 44,
          padding: 12,
          boxShadow: "0 30px 60px rgba(44,54,57,0.35)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: COLORS.bg,
            borderRadius: 34,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              padding: "60px 22px 20px",
              fontFamily: FONTS.display,
              fontSize: 26,
              color: COLORS.ink,
            }}
          >
            God morgon 💛
          </div>
          <div
            style={{ padding: "0 22px", fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted }}
          >
            Här är din dag.
          </div>
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              top: 160,
              transform: `translateY(${slide}px)`,
              opacity: op,
              background: COLORS.cream,
              borderRadius: 20,
              padding: "14px 16px",
              boxShadow: "0 8px 24px rgba(44,54,57,0.18)",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: COLORS.primary,
                display: "grid",
                placeItems: "center",
                color: COLORS.cream,
                fontSize: 20,
              }}
            >
              💊
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 13, color: COLORS.ink }}
              >
                MyFlove • nu
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 15, color: COLORS.ink }}>
                Dags för medicinen ✨
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ScenePushMobile: React.FC = () => {
  return (
    <SceneShell bg={COLORS.bg}>
      <AbsoluteFill
        style={{
          padding: "60px 80px",
          display: "flex",
          flexDirection: "row",
          gap: 60,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          <SectionEyebrow delay={0}>På din telefon</SectionEyebrow>
          <SectionTitle delay={4}>Notiser som når fram – även när appen är stängd.</SectionTitle>
          <SectionSub delay={12}>
            PWA på hemskärmen. iOS och Android via App Store och Google Play.
          </SectionSub>
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            {["🍎 App Store", "🤖 Google Play", "🌐 Web / PWA"].map((t, i) => {
              const e = useEntrance(30 + i * 10);
              return (
                <div
                  key={t}
                  style={{
                    ...e,
                    background: COLORS.cream,
                    borderRadius: 14,
                    padding: "10px 16px",
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                    fontSize: 14,
                    color: COLORS.ink,
                    boxShadow: "0 6px 16px rgba(44,54,57,0.06)",
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Phone />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
