"use client";

import { LocationData } from "./scene/types";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "./scene/locations";

interface InfoPanelProps {
  location: LocationData | null;
  onClose: () => void;
}

export default function InfoPanel({ location, onClose }: InfoPanelProps) {
  if (!location) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "1.5rem",
        right: "1.5rem",
        width: "300px",
        background: "rgba(6, 14, 28, 0.92)",
        backdropFilter: "blur(16px) saturate(160%)",
        border: `1px solid ${location.color}40`,
        borderLeft: `3px solid ${location.color}`,
        borderRadius: "10px",
        padding: "1.1rem 1.2rem",
        color: "#fff",
        boxShadow: `0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`,
        animation: "panelIn 0.22s ease-out",
        zIndex: 100,
        fontFamily: "-apple-system, 'Segoe UI', sans-serif",
      }}
    >
      {/* Badge + close */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>
              {CATEGORY_ICONS[location.category]}
            </span>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: location.accentColor,
                background: `${location.color}18`,
                border: `1px solid ${location.color}35`,
                padding: "2px 7px",
                borderRadius: "4px",
              }}
            >
              {CATEGORY_LABELS[location.category]}
            </span>
          </div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f0f8ff", lineHeight: 1.25, margin: 0 }}>
            {location.name}
          </h3>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            color: "#88a8c8",
            cursor: "pointer",
            padding: "3px 8px",
            fontSize: "0.75rem",
            fontFamily: "inherit",
            flexShrink: 0,
            marginLeft: "8px",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, ${location.color}60, transparent)`,
          margin: "10px 0",
        }}
      />

      <p style={{ fontSize: "0.78rem", lineHeight: 1.7, color: "#b8d0e8", margin: 0 }}>
        {location.description}
      </p>

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "0.68rem",
          color: "#5a7a9a",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "8px",
        }}
      >
        <span style={{ fontSize: "0.85rem" }}>📍</span>
        <span>Socorro, Surigao del Norte, Philippines</span>
      </div>
    </div>
  );
}
