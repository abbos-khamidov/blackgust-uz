import { ImageResponse } from "next/og";

/** Open Graph card: /og?l=en */
export async function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080A", color: "#ECE9E2", padding: 72, fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, letterSpacing: 8 }}>
          <div style={{ width: 44, height: 44, border: "2px solid rgba(236,233,226,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 26, height: 3, background: "#C9A86A" }} />
          </div>
          BLACKGUST
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.02, maxWidth: 980 }}>Operational intelligence for government and enterprise</div>
          <div style={{ fontSize: 26, color: "#C9A86A", letterSpacing: 3 }}>PLATFORM · FORWARD-DEPLOYED ENGINEERS · SOVEREIGN AI</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
