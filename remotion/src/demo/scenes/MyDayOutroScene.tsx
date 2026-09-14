import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DEMO_COLORS, DEMO_FONTS, DemoShell, enter } from "../theme";

export const MyDayOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imageOpacity = interpolate(frame, [78, 112], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const quote = enter(frame, fps, 100, 40);
  const brand = enter(frame, fps, 132, 22);
  return (
    <DemoShell>
      <AbsoluteFill style={{ opacity: imageOpacity }}>
        <Img
          src={staticFile("demo/myflove-demo-minday.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: interpolate(frame, [82, 112], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          justifyContent: "center",
          padding: "0 150px",
        }}
      >
        <div
          style={{
            ...quote,
            fontFamily: DEMO_FONTS.display,
            fontWeight: 900,
            fontSize: 76,
            lineHeight: 1.08,
            color: DEMO_COLORS.plum,
            maxWidth: 1440,
          }}
        >
          The goal isn’t to get more done.
          <br />
          <span style={{ color: DEMO_COLORS.violet }}>It’s to make the day more doable.</span>
        </div>
        <div
          style={{
            ...brand,
            marginTop: 44,
            fontFamily: DEMO_FONTS.body,
            fontSize: 31,
            fontWeight: 800,
            color: DEMO_COLORS.muted,
          }}
        >
          ♡ MyFlove · A calmer everyday life
        </div>
      </AbsoluteFill>
    </DemoShell>
  );
};
