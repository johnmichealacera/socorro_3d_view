"use client";

import React, { useState, useEffect } from "react";
import { LOCATIONS, CATEGORY_ICONS } from "./scene/locations";
import { LocationData } from "./scene/types";
import { WEATHER, WEATHER_ORDER, type WeatherPreset } from "./scene/weather";

interface HUDProps {
  selectedId:       string | null;
  onLocationSelect: (id: string) => void;
  weather:          WeatherPreset;
  onWeatherChange:  (w: WeatherPreset) => void;
}

function usePHTClock() {
  const [display, setDisplay] = useState({ time: "00:00:00", period: "NIGHT", dotColor: "#3050a0" });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-PH", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const h = parseInt(
        now.toLocaleString("en-PH", { timeZone: "Asia/Manila", hour: "numeric", hour12: false })
      );
      const period =
        h >= 5 && h < 12  ? "MORNING"
        : h >= 12 && h < 17 ? "AFTERNOON"
        : h >= 17 && h < 20 ? "EVENING"
        : "NIGHT";
      const dotColor =
        h >= 6 && h < 17  ? "#ffd060"
        : h >= 17 && h < 20 ? "#ff8040"
        : "#3050a0";
      setDisplay({ time, period, dotColor });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return display;
}

export default function HUD({ selectedId, onLocationSelect, weather, onWeatherChange }: HUDProps) {
  const clock = usePHTClock();
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

      {/* ── Top-right: Weather selector + Clock ────────────────────────── */}
      <div
        style={{
          position:   "absolute",
          top:        "1rem",
          right:      "1.5rem",
          display:    "flex",
          gap:        "8px",
          alignItems: "flex-start",
          zIndex:     50,
          fontFamily: "-apple-system, 'Segoe UI', sans-serif",
        }}
      >
        {/* Weather simulator */}
        <div
          style={{
            background:     "rgba(4,10,22,0.78)",
            backdropFilter: "blur(12px)",
            border:         "1px solid rgba(255,255,255,0.09)",
            borderRadius:   "10px",
            padding:        "7px 10px",
            display:        "flex",
            flexDirection:  "column",
            gap:            "6px",
          }}
        >
          <div style={{ fontSize: "0.52rem", color: "#6888a8", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Weather
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {WEATHER_ORDER.map((preset) => {
              const cfg    = WEATHER[preset];
              const active = weather === preset;
              return (
                <button
                  key={preset}
                  title={cfg.label}
                  onClick={() => onWeatherChange(preset)}
                  style={{
                    width:          "30px",
                    height:         "30px",
                    background:     active ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.04)",
                    border:         `1px solid ${active ? "rgba(56,189,248,0.55)" : "rgba(255,255,255,0.10)"}`,
                    borderRadius:   "7px",
                    fontSize:       "1.0rem",
                    lineHeight:     1,
                    cursor:         "pointer",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    transition:     "all 0.15s",
                    boxShadow:      active ? "0 0 8px rgba(56,189,248,0.25)" : "none",
                    color:          active ? "#38bdf8" : "#8aaccc",
                    fontFamily:     "inherit",
                    padding:        0,
                  }}
                >
                  {cfg.icon}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: "0.58rem", color: "#38bdf8", letterSpacing: "0.06em", textAlign: "center" }}>
            {WEATHER[weather].label}
          </div>
        </div>

        {/* PHT Clock */}
        <div
          style={{
            background:     "rgba(4,10,22,0.78)",
            backdropFilter: "blur(12px)",
            border:         "1px solid rgba(255,255,255,0.09)",
            borderRadius:   "10px",
            padding:        "8px 14px 7px",
            pointerEvents:  "none",
            textAlign:      "right",
            minWidth:       "130px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px", justifyContent: "flex-end" }}>
            <span
              style={{
                width:      "7px",
                height:     "7px",
                borderRadius: "50%",
                background: clock.dotColor,
                boxShadow:  `0 0 6px ${clock.dotColor}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize:          "1.05rem",
                fontWeight:        700,
                color:             "#f0f8ff",
                letterSpacing:     "0.05em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {clock.time}
            </span>
          </div>
          <div style={{ fontSize: "0.58rem", color: "#6888a8", letterSpacing: "0.10em", marginTop: "3px" }}>
            {clock.period} · PHT (UTC+8)
          </div>
        </div>
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
