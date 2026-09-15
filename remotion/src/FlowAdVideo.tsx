import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, Video } from "remotion";
import { DEMO_COLORS, DEMO_FONTS } from "./demo/theme";

export const FLOW_AD_FPS = 30;
export const FLOW_AD_FRAMES = 900;

type Format = "pitch" | "social";

const beats = [
  {
    from: 0,
    duration: 120,
    source: 0,
    eyebrow: "NÄR ALLT KÄNNS FÖR MYCKET",
    title: "Flow börjar med att lyssna.",
    body: "Du behöver inte formulera det perfekt.",
  },
  {
    from: 120,
    duration: 210,
    source: 270,
    eyebrow: "INGEN SKULD. INGEN PRESS.",
    title: "Din energi får styra planen.",
    body: "Flow ser vad som är rimligt just nu.",
  },
  {
    from: 330,
    duration: 240,
    source: 1170,
    eyebrow: "FRÅN ORO TILL ÖVERBLICK",
    title: "Flytta. Förenkla. Dela upp.",
    body: "Du bestämmer. Flow hjälper dig se alternativen.",
  },
  {
    from: 570,
    duration: 180,
    source: 1770,
    eyebrow: "ETT LITET NÄSTA STEG",
    title: "Vila först. Börja sedan mindre.",
    body: "En plan som faktiskt passar dagen.",
  },
] as const;

const Ambient: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 55) * 18;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${DEMO_COLORS.background}, ${DEMO_COLORS.backgroundDeep})`,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", width: 820, height: 820, borderRadius: "48% 52% 42% 58%", background: DEMO_COLORS.pink, opacity: 0.35, right: -310, top: -360 + drift }} />
      <div style={{ position: "absolute", width: 720, height: 720, borderRadius: "58% 42% 53% 47%", background: DEMO_COLORS.violetSoft, opacity: 0.25, left: -380, bottom: -350 - drift }} />
    </AbsoluteFill>
  );
};

const Phone: React.FC<{ source: number; duration: number; format: Format; sourceUrl: string }> = ({ source, duration, format, sourceUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 24, stiffness: 110 } });
  const scale = interpolate(frame, [0, duration], [0.985, 1.025], { extrapolateRight: "clamp" });
  const pitch = format === "pitch";
  return (
    <div
      style={{
        position: "absolute",
        width: pitch ? 540 : 690,
        aspectRatio: "1080 / 2340",
        right: pitch ? 190 : 195,
        top: pitch ? 74 : 405,
        borderRadius: pitch ? 52 : 74,
        overflow: "hidden",
        background: DEMO_COLORS.white,
        border: `${pitch ? 12 : 14}px solid ${DEMO_COLORS.white}`,
        boxShadow: "0 34px 90px rgba(56,38,79,0.24)",
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [42, 0])}px) scale(${scale})`,
      }}
    >
      <Video
        src={sourceUrl}
        startFrom={source}
        muted
        volume={0}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};

const Beat: React.FC<(typeof beats)[number] & { format: Format; sourceUrl: string }> = ({ duration, source, eyebrow, title, body, format, sourceUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const textIn = spring({ frame: frame - 5, fps, config: { damping: 24, stiffness: 125 } });
  const pitch = format === "pitch";
  return (
    <AbsoluteFill>
      <Ambient />
      <div
        style={{
          position: "absolute",
          left: pitch ? 130 : 78,
          top: pitch ? 265 : 105,
          width: pitch ? 870 : 920,
          opacity: textIn,
          transform: `translateY(${interpolate(textIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div style={{ fontFamily: DEMO_FONTS.body, color: DEMO_COLORS.violet, fontWeight: 800, fontSize: pitch ? 22 : 25, letterSpacing: 4 }}>{eyebrow}</div>
        <div style={{ marginTop: 22, fontFamily: DEMO_FONTS.display, color: DEMO_COLORS.plum, fontWeight: 900, fontSize: pitch ? 76 : 72, lineHeight: 1.02, maxWidth: pitch ? 820 : 900 }}>{title}</div>
        <div style={{ marginTop: 24, fontFamily: DEMO_FONTS.body, color: DEMO_COLORS.muted, fontWeight: 600, fontSize: pitch ? 31 : 34, lineHeight: 1.35, maxWidth: pitch ? 760 : 900 }}>{body}</div>
      </div>
      <Phone source={source} duration={duration} format={format} sourceUrl={sourceUrl} />
      <div style={{ position: "absolute", left: pitch ? 130 : 78, bottom: pitch ? 62 : 82, color: DEMO_COLORS.violet, fontFamily: DEMO_FONTS.display, fontWeight: 800, fontSize: pitch ? 28 : 32 }}>♡ MyFlove</div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 90 } });
  const pitch = format === "pitch";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Ambient />
      <div style={{ position: "relative", textAlign: "center", opacity: reveal, transform: `scale(${interpolate(reveal, [0, 1], [0.94, 1])})`, padding: pitch ? "0 180px" : "0 78px" }}>
        <div style={{ color: DEMO_COLORS.plum, fontFamily: DEMO_FONTS.display, fontWeight: 900, fontSize: pitch ? 86 : 92, lineHeight: 1.05 }}>Inte mer att göra.</div>
        <div style={{ marginTop: 14, color: DEMO_COLORS.violet, fontFamily: DEMO_FONTS.display, fontWeight: 900, fontSize: pitch ? 86 : 92, lineHeight: 1.05 }}>Rätt sak för just nu.</div>
        <div style={{ marginTop: pitch ? 54 : 72, color: DEMO_COLORS.muted, fontFamily: DEMO_FONTS.body, fontWeight: 800, fontSize: pitch ? 32 : 38 }}>♡ MyFlove · En lugnare vardag</div>
      </div>
    </AbsoluteFill>
  );
};

export const FlowAdVideo: React.FC<{ format?: Format; sourceUrl?: string }> = ({ format = "pitch", sourceUrl }) => {
  const recordingUrl = sourceUrl ?? staticFile("demo/flow-help-recording-edit.mp4");
  return <AbsoluteFill>
    {beats.map((beat) => (
      <Sequence key={beat.from} from={beat.from} durationInFrames={beat.duration} premountFor={30}>
        <Beat {...beat} format={format} sourceUrl={recordingUrl} />
      </Sequence>
    ))}
    <Sequence from={750} durationInFrames={150} premountFor={30}>
      <Outro format={format} />
    </Sequence>
  </AbsoluteFill>;
};