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
import {
  PitchVideo,
  TOTAL_FRAMES as PITCH_FRAMES,
  FPS as PITCH_FPS,
  WIDTH as PITCH_WIDTH,
  HEIGHT as PITCH_HEIGHT,
} from "./PitchVideo";
import {
  DemoVideo,
  DEMO_TOTAL_FRAMES,
  DEMO_FPS,
  DEMO_WIDTH,
  DEMO_HEIGHT,
} from "./DemoVideo";
import { FlowAdVideo, FLOW_AD_FPS, FLOW_AD_FRAMES } from "./FlowAdVideo";

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
    <Composition
      id="pitch"
      component={PitchVideo}
      durationInFrames={PITCH_FRAMES}
      fps={PITCH_FPS}
      width={PITCH_WIDTH}
      height={PITCH_HEIGHT}
    />
    <Composition
      id="investor-demo"
      component={DemoVideo}
      durationInFrames={DEMO_TOTAL_FRAMES}
      fps={DEMO_FPS}
      width={DEMO_WIDTH}
      height={DEMO_HEIGHT}
      defaultProps={{ lang: "en" as const }}
    />
    <Composition
      id="investor-demo-sv"
      component={DemoVideo}
      durationInFrames={DEMO_TOTAL_FRAMES}
      fps={DEMO_FPS}
      width={DEMO_WIDTH}
      height={DEMO_HEIGHT}
      defaultProps={{ lang: "sv" as const }}
    />
    <Composition
      id="flow-ad-pitch"
      component={FlowAdVideo}
      durationInFrames={FLOW_AD_FRAMES}
      fps={FLOW_AD_FPS}
      width={1920}
      height={1080}
      defaultProps={{ format: "pitch" as const }}
    />
    <Composition
      id="flow-ad-social"
      component={FlowAdVideo}
      durationInFrames={FLOW_AD_FRAMES}
      fps={FLOW_AD_FPS}
      width={1080}
      height={1920}
      defaultProps={{ format: "social" as const }}
    />
  </>
);
