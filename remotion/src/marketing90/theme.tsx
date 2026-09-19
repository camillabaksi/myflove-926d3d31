import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";

export const { fontFamily: displayFont } = loadJakarta("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });
export const { fontFamily: noteFont } = loadCaveat("normal", { weights: ["500", "600"], subsets: ["latin"] });

export const C = { bg: "#F7F3FC", bg2: "#EEE5FA", ink: "#1A0D59", plum: "#39294F", violet: "#7657B6", lilac: "#D8C8F2", pink: "#F2C9E2", mint: "#CDEFE7", white: "#FFFFFF", muted: "#716680", red: "#E56B87", green: "#55B99C" };

export const fade = (frame: number, duration: number) => interpolate(frame, [0, 20, duration - 24, duration], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
export const rise = (frame: number, delay = 0, distance = 45) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 120, mass: 0.9 } });
  return { opacity: p, transform: `translateY(${interpolate(p, [0, 1], [distance, 0])}px)` } as React.CSSProperties;
};

/** När true sköter TransitionSeries all toning – scenen tonar inte själv (undviker dubbel fade/blink). */
export const NoSelfFade = React.createContext(false);

export const Shell: React.FC<{ children: React.ReactNode; duration: number; label?: string }> = ({ children, duration, label }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const portrait = height > width;
  const noSelfFade = React.useContext(NoSelfFade);
  const drift = Math.sin(frame / 60) * 18;
  return <AbsoluteFill style={{ background: `linear-gradient(135deg, ${C.bg}, ${C.bg2})`, color: C.ink, fontFamily: displayFont, overflow: "hidden", opacity: noSelfFade ? 1 : fade(frame, duration) }}>
    <div style={{ position: "absolute", width: portrait ? 760 : 1000, height: portrait ? 760 : 1000, borderRadius: "48% 52% 61% 39% / 55% 42% 58% 45%", background: C.pink, opacity: .25, right: portrait ? -390 : -320, top: -430 + drift }} />
    <div style={{ position: "absolute", width: portrait ? 680 : 850, height: portrait ? 680 : 850, borderRadius: "60% 40% 46% 54%", background: C.lilac, opacity: .22, left: portrait ? -390 : -300, bottom: -460 - drift }} />
    {label && <div style={{ position: "absolute", left: portrait ? 64 : 92, top: portrait ? 68 : 58, fontSize: portrait ? 25 : 23, fontWeight: 800, color: C.violet, letterSpacing: 4, zIndex: 10 }}>{label.toUpperCase()}</div>}
    {children}
    <Brand />
  </AbsoluteFill>;
};

export const Brand: React.FC = () => { const { width, height } = useVideoConfig(); const portrait = height > width; return <div style={{ position: "absolute", left: portrait ? 62 : 90, bottom: portrait ? 54 : 45, fontSize: portrait ? 31 : 27, fontWeight: 800, color: C.ink, zIndex: 20 }}>♡ MyFlove <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, marginLeft: 12 }}>EN LUGNARE VARDAG</span></div>; };

export const Heading: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => { const { width, height } = useVideoConfig(); const portrait = height > width; return <div style={{ fontSize: portrait ? 78 : 76, lineHeight: 1.04, fontWeight: 800, letterSpacing: 0, ...style }}>{children}</div>; };
export const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => { const { width, height } = useVideoConfig(); const portrait = height > width; return <div style={{ fontSize: portrait ? 39 : 32, lineHeight: 1.35, fontWeight: 500, color: C.muted, ...style }}>{children}</div>; };
export const Note: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <div style={{ fontFamily: noteFont, fontSize: 42, lineHeight: 1.05, color: C.violet, transform: "rotate(-4deg)", ...style }}>{children}</div>;

export const PhotoBlob: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => <div style={{ overflow: "hidden", borderRadius: "46% 54% 58% 42% / 44% 42% 58% 56%", boxShadow: "0 30px 80px rgba(57,41,79,.16)", ...style }}><Img src={staticFile(`marketing90/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>;
export const ProductImage: React.FC<{ src: string; frame: number; style?: React.CSSProperties }> = ({ src, frame, style }) => <Img src={staticFile(`marketing90/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${interpolate(frame, [0, 360], [1.015, 1.055], { extrapolateRight: "clamp" })})`, ...style }} />;

export const Pill: React.FC<{ children: React.ReactNode; accent?: "pink" | "mint" | "violet" }> = ({ children, accent = "violet" }) => <div style={{ padding: "18px 26px", borderRadius: 30, background: accent === "pink" ? C.pink : accent === "mint" ? C.mint : C.lilac, fontWeight: 700, fontSize: 27, color: C.ink }}>{children}</div>;

export const ScreenScene: React.FC<{ duration: number; label: string; title: React.ReactNode; body: React.ReactNode; image: string; note?: string }> = ({ duration, label, title, body, image, note }) => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const portrait = height > width;
  return <Shell duration={duration} label={label}><div style={{ position: "absolute", inset: portrait ? "155px 48px 120px" : "145px 85px 105px", display: "flex", flexDirection: portrait ? "column" : "row", gap: portrait ? 45 : 55, alignItems: "center" }}>
    <div style={{ ...rise(frame, 8), width: portrait ? "92%" : "48%", zIndex: 2 }}><Heading>{title}</Heading><Body style={{ marginTop: 28 }}>{body}</Body>{note && <Note style={{ marginTop: 34 }}>{note}</Note>}</div>
    <div style={{ ...rise(frame, 22, 70), position: "relative", width: portrait ? "100%" : "52%", height: portrait ? 940 : 710, borderRadius: 34, overflow: "hidden", boxShadow: "0 34px 90px rgba(57,41,79,.18)", background: `linear-gradient(145deg, ${C.white}, ${C.bg2})` }}><ProductImage src={image} frame={frame} style={{ objectFit: "contain" }} /></div>
  </div></Shell>;
};