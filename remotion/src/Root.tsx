import React from "react";
import { Composition } from "remotion";
import { MainVideo, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from "./MainVideo";
import {
  SocialVideo,
  TOTAL_FRAMES as SOCIAL_FRAMES,
  FPS as SOCIAL_FPS,
  WIDTH as SOCIAL_WIDTH,
  HEIGHT as SOCIAL_HEIGHT,
} from "./SocialVideo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="social"
      component={SocialVideo}
      durationInFrames={SOCIAL_FRAMES}
      fps={SOCIAL_FPS}
      width={SOCIAL_WIDTH}
      height={SOCIAL_HEIGHT}
    />
  </>
);
