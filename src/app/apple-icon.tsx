import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #1d40e8 0%, #3563ff 100%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 14,
          padding: "32px 28px 28px",
        }}
      >
        <div style={{ width: 28, height: 46,  background: "rgba(255,255,255,0.55)", borderRadius: 8 }} />
        <div style={{ width: 28, height: 72,  background: "rgba(255,255,255,0.78)", borderRadius: 8 }} />
        <div style={{ width: 28, height: 100, background: "#ffffff",               borderRadius: 8 }} />
      </div>
    ),
    { ...size },
  );
}
