import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TripBoard — Plan your trip. Make it beautiful.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default 1200×630 Open Graph image for TripBoard. */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fafafa",
          color: "#18181b",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#18181b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 64 64" width="28" height="28">
              <path
                d="M32 12c-7.5 0-13.5 6.2-13.5 13.8C18.5 37.5 32 52 32 52s13.5-14.5 13.5-26.2C45.5 18.2 39.5 12 32 12z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="26" r="6" fill="#ffffff" />
            </svg>
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            TripBoard
          </div>
        </div>

        {/* hero copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.1,
            }}
          >
            Plan your trip.
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.1,
              color: "#71717a",
            }}
          >
            Make it beautiful.
          </div>
        </div>

        {/* footer row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#e4e4e7" }} />
          <div style={{ fontSize: 30, color: "#71717a", letterSpacing: 1 }}>
            Tokyo · Seoul · Taipei
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
