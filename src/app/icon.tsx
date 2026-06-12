import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #1d40e8 0%, #3563ff 100%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          padding: "6px 5px 5px",
        }}
      >
        {/* Barras de gráfico ascendente */}
        <div style={{ width: 5, height: 8,  background: "rgba(255,255,255,0.55)", borderRadius: 2 }} />
        <div style={{ width: 5, height: 13, background: "rgba(255,255,255,0.78)", borderRadius: 2 }} />
        <div style={{ width: 5, height: 18, background: "#ffffff",               borderRadius: 2 }} />
      </div>
    ),
    { ...size },
  );
}
