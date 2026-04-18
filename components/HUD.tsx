"use client";

import React from "react";
import { LOCATIONS, CATEGORY_ICONS } from "./scene/locations";
import { LocationData } from "./scene/types";

interface HUDProps {
  selectedId: string | null;
  onLocationSelect: (id: string) => void;
}

export default function HUD({ selectedId, onLocationSelect }: HUDProps) {
  return (
    <>
      {/* ── Top gradient header ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "1rem 1.4rem 2.5rem",
          background:
            "linear-gradient(180deg, rgba(4,10,22,0.90) 0%, rgba(4,10,22,0.0) 100%)",
          pointerEvents: "none",
          zIndex: 50,
          fontFamily: "-apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#f0f8ff",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Socorro 3D Interactive Map
          </h1>
          <span
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#38bdf8",
              padding: "2px 7px",
              border: "1px solid rgba(56,189,248,0.55)",
              borderRadius: "4px",
              background: "rgba(56,189,248,0.12)",
            }}
          >
            LIVE VIEW
          </span>
        </div>
        <p style={{ fontSize: "0.72rem", color: "#6888a8", margin: "4px 0 0", letterSpacing: "0.06em" }}>
          SURIGAO DEL NORTE · BUCAS GRANDE ISLAND · PHILIPPINES
        </p>
      </div>

      {/* ── Left sidebar – location list ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "1rem",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          zIndex: 50,
          fontFamily: "-apple-system, 'Segoe UI', sans-serif",
          maxHeight: "calc(100vh - 7rem)",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "4px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(56,189,248,0.3) transparent",
        } as React.CSSProperties}
      >
        {LOCATIONS.map((loc: LocationData) => {
          const active = selectedId === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => onLocationSelect(loc.id)}
              title={loc.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "4px 10px 4px 7px",
                background: active
                  ? `linear-gradient(90deg, ${loc.color}cc, ${loc.color}88)`
                  : "rgba(4,10,22,0.72)",
                border: `1px solid ${active ? loc.color : "rgba(255,255,255,0.08)"}`,
                borderRadius: "7px",
                color: active ? "#fff" : "#a0c0d8",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: active ? 700 : 400,
                fontFamily: "inherit",
                backdropFilter: "blur(10px)",
                boxShadow: active ? `0 0 16px ${loc.color}55` : "none",
                whiteSpace: "nowrap",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = `${loc.color}28`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${loc.color}66`;
                  (e.currentTarget as HTMLButtonElement).style.color = "#d8ecf8";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(4,10,22,0.72)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#a0c0d8";
                }
              }}
            >
              <span style={{ fontSize: "1rem", lineHeight: 1 }}>
                {CATEGORY_ICONS[loc.category as LocationData["category"]]}
              </span>
              <span>{loc.name}</span>
              {active && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#fff",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Bottom controls hint ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "1.2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "1.2rem",
          background: "rgba(4,10,22,0.68)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "8px",
          padding: "5px 16px",
          zIndex: 50,
          pointerEvents: "none",
          fontFamily: "-apple-system, 'Segoe UI', sans-serif",
        }}
      >
        {[
          ["🖱️ Drag", "rotate"],
          ["⚲ Scroll", "zoom"],
          ["⬡ Click", "explore"],
        ].map(([act, desc]) => (
          <div
            key={desc}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.66rem",
              color: "#6888a8",
            }}
          >
            <span style={{ color: "#8aaccc", fontWeight: 600 }}>{act}</span>
            <span>{desc}</span>
          </div>
        ))}
      </div>

      {/* ── Compass rose ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "1.2rem",
          right: "1.5rem",
          width: "44px",
          height: "44px",
          background: "rgba(4,10,22,0.70)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6888aa",
          fontSize: "0.65rem",
          fontWeight: 700,
          fontFamily: "inherit",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        N
      </div>
    </>
  );
}
