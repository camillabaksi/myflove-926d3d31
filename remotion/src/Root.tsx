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
import {
  FirstLookVideo,
  TOTAL_FRAMES as FL_FRAMES,
  FPS as FL_FPS,
  WIDTH as FL_WIDTH,
  HEIGHT as FL_HEIGHT,
} from "./FirstLook";

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
    <Composition
      id="firstlook"
      component={FirstLookVideo}
      durationInFrames={FL_FRAMES}
      fps={FL_FPS}
      width={FL_WIDTH}
      height={FL_HEIGHT}
    />
  </>
);
