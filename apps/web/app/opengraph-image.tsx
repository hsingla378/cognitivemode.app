import { ImageResponse } from "next/og";

export const alt = "Cognitive Mode: practice DSA with AI hints, not answers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LEVELS = ["1 Nudge", "2 Approach", "3 Outline", "4 Solution"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 20% 0%, #064e3b 0%, #09090b 55%)",
          color: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#a1a1aa" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#34d399" }} />
          cognitivemode.app
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Practice DSA with AI,</div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#a1a1aa" }}>
            without cheating yourself.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {LEVELS.map((level, index) => (
            <div
              key={level}
              style={{
                display: "flex",
                padding: "14px 24px",
                borderRadius: 16,
                fontSize: 28,
                border: `2px solid ${index === 0 ? "#34d399" : "#3f3f46"}`,
                color: index === 0 ? "#d1fae5" : "#a1a1aa",
              }}
            >
              {level}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
