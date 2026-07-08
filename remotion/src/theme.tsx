import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: display } = loadFraunces("normal", { weights: ["600", "700"], subsets: ["latin"] });
const { fontFamily: body } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

export const COLORS = {
  bg: "#F5F1EA",
  bgDeep: "#EDE6D9",
  primary: "#B85042",
  primarySoft: "#D97060",
  sage: "#A7BEAE",
  ink: "#2C3639",
  muted: "#7A6E63",
  cream: "#FFFBF3",
  gold: "#E4A853",
};

export const FONTS = { display, body };

interface SceneShellProps {
  children: React.ReactNode;
  bg?: string;
}

export const SceneShell: React.FC<SceneShellProps> = ({ children, bg = COLORS.bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // subtle drift so no scene is static
  const drift = Math.sin((frame / durationInFrames) * Math.PI) * 6;
  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${drift}px, ${-drift * 0.5}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export function useEntrance(delay: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [24, 0]);
  const scale = interpolate(s, [0, 1], [0.96, 1]);
  return { opacity, transform: `translateY(${y}px) scale(${scale})` };
}

interface FeaturePillProps {
  icon: string;
  label: string;
  desc: string;
  delay: number;
  color?: string;
}

export const FeaturePill: React.FC<FeaturePillProps> = ({ icon, label, desc, delay, color = COLORS.primary }) => {
  const entrance = useEntrance(delay);
  return (
    <div
      style={{
        ...entrance,
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: COLORS.cream,
        borderRadius: 20,
        padding: "14px 20px",
        boxShadow: "0 6px 18px rgba(44,54,57,0.06)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: color,
          color: COLORS.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: body, fontWeight: 600, color: COLORS.ink, fontSize: 20 }}>{label}</div>
        <div style={{ fontFamily: body, fontWeight: 400, color: COLORS.muted, fontSize: 14 }}>{desc}</div>
      </div>
    </div>
  );
};

export const SectionEyebrow: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const e = useEntrance(delay);
  return (
    <div
      style={{
        ...e,
        fontFamily: body,
        fontWeight: 600,
        color: COLORS.primary,
        letterSpacing: 4,
        textTransform: "uppercase",
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
};

export const SectionTitle: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 4 }) => {
  const e = useEntrance(delay);
  return (
    <h2
      style={{
        ...e,
        fontFamily: display,
        fontWeight: 700,
        color: COLORS.ink,
        fontSize: 68,
        lineHeight: 1.05,
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
};

export const SectionSub: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 8 }) => {
  const e = useEntrance(delay);
  return (
    <p
      style={{
        ...e,
        fontFamily: body,
        fontWeight: 400,
        color: COLORS.muted,
        fontSize: 22,
        lineHeight: 1.4,
        margin: 0,
        maxWidth: 620,
      }}
    >
      {children}
    </p>
  );
};
