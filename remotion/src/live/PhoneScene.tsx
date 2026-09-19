import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Body, C, Heading, Note, Shell, rise } from "../marketing90/theme";

/**
 * Scen med en RIKTIG MyFlove-skärmbild i en telefonram.
 * Bilden tonas mjukt in och ut inuti scenen, utöver crossfade mellan scener.
 */
export const PhoneScene: React.FC<{
  duration: number;
  label: string;
  title: React.ReactNode;
  body: React.ReactNode;
  image: string;
  note?: string;
}> = ({ duration, label, title, body, image, note }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;

  const imgOpacity = interpolate(
    frame,
    [6, 34, duration - 30, duration - 6],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(frame, [0, duration], [1.0, 1.045], { extrapolateRight: "clamp" });
  const float = Math.sin(frame / 55) * 8;

  const phoneH = portrait ? 1020 : 830;
  const phoneW = phoneH * (430 / 932);

  return (
    <Shell duration={duration} label={label}>
      <div
        style={{
          position: "absolute",
          inset: portrait ? "150px 60px 130px" : "120px 100px 100px",
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          gap: portrait ? 40 : 80,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ ...rise(frame, 8), width: portrait ? "100%" : "50%", zIndex: 2 }}>
          <Heading>{title}</Heading>
          <Body style={{ marginTop: 28 }}>{body}</Body>
          {note ? <Note style={{ marginTop: 34 }}>{note}</Note> : null}
        </div>
        <div
          style={{
            ...rise(frame, 20, 60),
            position: "relative",
            width: phoneW,
            height: phoneH,
            flexShrink: 0,
            transform: `translateY(${float}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 62,
              background: C.ink,
              padding: 14,
              boxShadow: "0 40px 100px rgba(57,41,79,.28)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 50,
                overflow: "hidden",
                background: C.white,
              }}
            >
              <Img
                src={staticFile(`live/${image}`)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top",
                  opacity: imgOpacity,
                  transform: `scale(${scale})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};
