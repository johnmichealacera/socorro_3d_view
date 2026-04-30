"use client";

import { useMemo } from "react";
import { ANNUAL_EVENTS, daysUntil, eventMonthDay, CATEGORY_LABELS, CATEGORY_COLORS, type SocorroEvent } from "./scene/eventData";

interface EventsPanelProps {
  onClose:          () => void;
  onLocationSelect: (id: string) => void;
}

export default function EventsPanel({ onClose, onLocationSelect }: EventsPanelProps) {
  const sorted = useMemo<(SocorroEvent & { days: number })[]>(() => {
    return ANNUAL_EVENTS
      .map((ev) => ({ ...ev, days: daysUntil(ev) }))
      .sort((a, b) => a.days - b.days);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: "1rem",
        right: "calc(1.5rem + 232px + 8px + 140px + 8px)",  // clears the weather + clock panels
        width: "270px",
        maxHeight: "calc(100vh - 5rem)",
        overflowY: "auto",
        background: "rgba(6,14,28,0.92)",
        backdropFilter: "blur(16px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderTop: "3px solid #38bdf8",
        borderRadius: "10px",
        padding: "0.9rem",
        color: "#f0f8ff",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        zIndex: 100,
        fontFamily: "-apple-system,'Segoe UI',sans-serif",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(56,189,248,0.25) transparent",
      } as React.CSSProperties}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div>
          <div style={{ fontSize: "0.6rem", color: "#38bdf8", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>
            Municipal Calendar
          </div>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f0f8ff", marginTop: "2px" }}>
            Upcoming Events
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px", color: "#88a8c8", cursor: "pointer",
            padding: "3px 8px", fontSize: "0.75rem", fontFamily: "inherit",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ height: "1px", background: "rgba(56,189,248,0.2)", marginBottom: "0.7rem" }} />

      {/* Event list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {sorted.map((ev) => {
          const daysLabel =
            ev.days === 0 ? "TODAY" :
            ev.days === 1 ? "Tomorrow" :
            `in ${ev.days} day${ev.days !== 1 ? "s" : ""}`;

          const isImminent = ev.days <= 3;

          return (
            <button
              key={ev.id}
              onClick={() => onLocationSelect(ev.locationId)}
              style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                background: isImminent ? `${ev.color}14` : "rgba(255,255,255,0.03)",
                border: `1px solid ${isImminent ? ev.color + "55" : "rgba(255,255,255,0.07)"}`,
                borderLeft: `3px solid ${ev.color}`,
                borderRadius: "7px",
                padding: "8px 10px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                width: "100%",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${ev.color}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  isImminent ? `${ev.color}14` : "rgba(255,255,255,0.03)";
              }}
            >
              {/* Date badge */}
              <div
                style={{
                  flexShrink: 0,
                  width: "38px",
                  textAlign: "center",
                  background: `${ev.color}22`,
                  border: `1px solid ${ev.color}44`,
                  borderRadius: "5px",
                  padding: "3px 4px",
                }}
              >
                <div style={{ fontSize: "0.52rem", color: ev.color, fontWeight: 700, letterSpacing: "0.05em" }}>
                  {new Date(2000, ev.month - 1).toLocaleString("en-PH", { month: "short" }).toUpperCase()}
                </div>
                <div style={{ fontSize: "1.0rem", fontWeight: 800, color: "#f0f8ff", lineHeight: 1 }}>
                  {ev.day}
                </div>
              </div>

              {/* Event info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e8f4ff", lineHeight: 1.3, marginBottom: "2px" }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#7a9ab8", lineHeight: 1.3, marginBottom: "4px" }}>
                  {ev.subtitle}
                </div>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em",
                      color: CATEGORY_COLORS[ev.category],
                      background: `${CATEGORY_COLORS[ev.category]}18`,
                      border: `1px solid ${CATEGORY_COLORS[ev.category]}35`,
                      padding: "1px 5px", borderRadius: "3px",
                    }}
                  >
                    {CATEGORY_LABELS[ev.category]}
                  </span>
                  <span
                    style={{
                      fontSize: "0.58rem", fontWeight: isImminent ? 700 : 400,
                      color: isImminent ? ev.color : "#5a7a9a",
                    }}
                  >
                    {daysLabel}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "0.75rem",
          paddingTop: "0.6rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: "0.6rem",
          color: "#4a6a88",
          textAlign: "center",
        }}
      >
        📍 Click any event to fly to its location
      </div>
    </div>
  );
}
