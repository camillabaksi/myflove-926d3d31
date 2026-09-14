import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const DEMO_COLORS = {
  background: "#F8F2FC",
  backgroundDeep: "#EDE0F8",
  plum: "#38264F",
  violet: "#7457AD",
  violetSoft: "#C7B1EA",
  pink: "#F0C8DC",
  muted: "#776987",
  white: "#FFFFFF",
};

export const DEMO_FONTS = {
  display: "Nunito Sans, Noto Sans, Arial, sans-serif",
  body: "Nunito Sans, Noto Sans, Arial, sans-serif",
};

export const DemoShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 42) * 10;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${DEMO_COLORS.background} 0%, ${DEMO_COLORS.backgroundDeep} 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 860,
          height: 860,
          borderRadius: "47% 53% 61% 39% / 45% 42% 58% 55%",
          background: DEMO_COLORS.pink,
          opacity: 0.34,
          top: -460 + drift,
          right: -170,
          transform: `rotate(${8 + drift / 3}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "58% 42% 44% 56% / 48% 62% 38% 52%",
          background: DEMO_COLORS.violetSoft,
          opacity: 0.24,
          bottom: -440 - drift,
          left: -190,
          transform: `rotate(${-12 - drift / 4}deg)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

export const enter = (frame: number, fps: number, delay: number, distance = 32) => {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 22, stiffness: 130, mass: 0.9 },
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px) scale(${interpolate(progress, [0, 1], [0.975, 1])})`,
  } as React.CSSProperties;
};

export const BrandMark: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <div
    style={{
      position: "absolute",
      left: 82,
      bottom: 54,
      display: "flex",
      alignItems: "center",
      gap: 12,
      color: dark ? DEMO_COLORS.white : DEMO_COLORS.violet,
      fontFamily: DEMO_FONTS.display,
      fontWeight: 800,
      fontSize: 29,
    }}
  >
    <span style={{ fontSize: 27 }}>♡</span>
    MyFlove
  </div>
);

export const PitchLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: DEMO_FONTS.body,
      color: DEMO_COLORS.violet,
      fontWeight: 800,
      letterSpacing: 5,
      fontSize: 22,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

export const ProductFrame: React.FC<{
  src: string;
  frame: number;
  duration: number;
  delay?: number;
}> = ({ src, frame, duration, delay = 8 }) => {
  const { fps } = useVideoConfig();
  const entrance = enter(frame, fps, delay, 24);
  const scale = interpolate(frame, [0, duration], [1.015, 1.055], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ ...entrance, transform: `${entrance.transform} scale(${scale})` }}>
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};
