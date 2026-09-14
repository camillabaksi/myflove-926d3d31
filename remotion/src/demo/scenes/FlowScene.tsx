import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DEMO_COLORS, DEMO_FONTS, ProductFrame, enter } from "../theme";

export const FlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const note = enter(frame, fps, 72, 18);
  return (
    <AbsoluteFill>
      <ProductFrame src="demo/myflove-demo-flow.jpg" frame={frame} duration={225} />
      <div
        style={{
          ...note,
          position: "absolute",
          left: 510,
          bottom: 115,
          fontFamily: DEMO_FONTS.body,
          fontWeight: 700,
          fontSize: 27,
          color: DEMO_COLORS.violet,
          transform: `${note.transform} rotate(-3deg)`,
        }}
      >
        Same list. A plan that fits today. ↗
      </div>
    </AbsoluteFill>
  );
};
