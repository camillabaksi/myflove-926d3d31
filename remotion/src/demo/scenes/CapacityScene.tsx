import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DEMO_COLORS, DEMO_FONTS, DemoShell, enter } from "../theme";
import { useDemoCopy } from "../lang";

export const CapacityScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = useDemoCopy();
  const compare = enter(frame, fps, 4, 28);
  const message = enter(frame, fps, 132, 20);
  const imageScale = interpolate(frame, [0, 255], [1.02, 1.065], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <DemoShell>
      <AbsoluteFill
        style={{
          ...compare,
          transform: `${compare.transform} scale(${imageScale})`,
        }}
      >
        <Img
          src={staticFile("demo/myflove-demo-adapt-a.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <div
        style={{
          ...message,
          position: "absolute",
          left: 480,
          right: 480,
          bottom: 44,
          minHeight: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          background: DEMO_COLORS.plum,
          color: DEMO_COLORS.white,
          fontFamily: DEMO_FONTS.body,
          fontWeight: 800,
          fontSize: 26,
          boxShadow: "0 20px 48px rgba(56,38,79,0.22)",
        }}
      >
        {copy("capacity")}
      </div>
    </DemoShell>
  );
};
