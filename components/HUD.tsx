"use client";

import React, { useState, useEffect } from "react";
import { LOCATIONS, CATEGORY_ICONS } from "./scene/locations";
import { LocationData } from "./scene/types";
import { WEATHER, WEATHER_ORDER, type WeatherPreset } from "./scene/weather";
import { ANNUAL_EVENTS, daysUntil } from "./scene/eventData";
import EventsPanel from "./EventsPanel";
import StatsPanel from "./StatsPanel";

interface HUDProps {
  selectedId:       string | null;
  onLocationSelect: (id: string) => void;
  weather:          WeatherPreset;
  onWeatherChange:  (w: WeatherPreset) => void;
  simHour:          number | null;
  onSimHourChange:  (h: number | null) => void;
}

// Count of events in the next 60 days — shown as badge on the events button.
function upcomingCount(): number {
  return ANNUAL_EVENTS.filter((ev) => daysUntil(ev) <= 60).length;
}

function usePHTClock() {
  const [data, setData] = useState({
    time: "00:00:00", period: "NIGHT", dotColor: "#3050a0", hoursDecimal: 0,
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-PH", {
        timeZone: "Asia/Manila",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      });
      const h = parseInt(
        now.toLocaleString("en-PH", { timeZone: "Asia/Manila", hour: "numeric", hour12: false })
      );
      const mins = now.toLocaleString("en-PH", { timeZone: "Asia/Manila", minute: "2-digit" });
      const secs = now.toLocaleString("en-PH", { timeZone: "Asia/Manila", second: "2-digit" });
      const hoursDecimal = h + parseInt(mins) / 60 + parseInt(secs) / 3600;

      const period =
        h >= 5 && h < 12  ? "MORNING"
        : h >= 12 && h < 17 ? "AFTERNOON"
        : h >= 17 && h < 20 ? "EVENING"
        : "NIGHT";
      const dotColor =
        h >= 6 && h < 17  ? "#ffd060"
        : h >= 17 && h < 20 ? "#ff8040"
        : "#3050a0";
      setData({ time, period, dotColor, hoursDecimal });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return data;
}

function formatSimTime(h: number): string {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function simPeriod(h: number): string {
  const hh = Math.floor(h) % 24;
  if (hh >= 5 && hh < 12)  return "MORNING";
  if (hh >= 12 && hh < 17) return "AFTERNOON";
  if (hh >= 17 && hh < 20) return "EVENING";
  return "NIGHT";
}

function simDotColor(h: number): string {
  const hh = Math.floor(h) % 24;
  if (hh >= 6 && hh < 17)  return "#ffd060";
  if (hh >= 17 && hh < 20) return "#ff8040";
  return "#3050a0";
}

export default function HUD({
  selectedId, onLocationSelect,
  weather, onWeatherChange,
  simHour, onSimHourChange,
}: HUDProps) {
  const clock  = usePHTClock();
  const isSim  = simHour !== null;
  const [showEvents, setShowEvents] = useState(false);
  const [showStats,  setShowStats]  = useState(false);
  const evCount = upcomingCount();
  const sliderVal = isSim ? simHour : clock.hoursDecimal;

  const displayTime     = isSim ? formatSimTime(simHour!) + ":00" : clock.time;
  const displayPeriod   = isSim ? simPeriod(simHour!) : clock.period;
  const displayDotColor = isSim ? simDotColor(simHour!) : clock.dotColor;

  return (
    <>
      <style>{`
        .time-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.12);
          outline: none;
          cursor: pointer;
        }
        .time-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 6px rgba(56,189,248,0.7);
          cursor: pointer;
          transition: transform 0.1s;
        }
        .time-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
        .time-slider::-moz-range-thumb {
          width: 13px; height: 13px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 6px rgba(56,189,248,0.7);
          border: none;
          cursor: pointer;
        }
        .time-slider.simulating::-webkit-slider-thumb { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.7); }
        .time-slider.simulating::-moz-range-thumb    { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.7); }
        .time-slider.simulating { background: rgba(245,158,11,0.18); }
      `}</style>

      {/* ── Top gradient header ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "1rem 1.4rem 2.5rem",
          background: "linear-gradient(180deg, rgba(4,10,22,0.90) 0%, rgba(4,10,22,0.0) 100%)",
          pointerEvents: "none",
          zIndex: 50,
          fontFamily: "-apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f0f8ff", letterSpacing: "-0.02em", margin: 0 }}>
            Socorro 3D Interactive Map
          </h1>
          <span
            style={{
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase",
              color:      isSim ? "#f59e0b" : "#38bdf8",
              padding:    "2px 7px",
              border:     `1px solid ${isSim ? "rgba(245,158,11,0.55)" : "rgba(56,189,248,0.55)"}`,
              borderRadius: "4px",
              background: isSim ? "rgba(245,158,11,0.12)" : "rgba(56,189,248,0.12)",
            }}
          >
            {isSim ? "SIM MODE" : "LIVE VIEW"}
          </span>
        </div>
        <p style={{ fontSize: "0.72rem", color: "#6888a8", margin: "4px 0 0", letterSpacing: "0.06em" }}>
          SURIGAO DEL NORTE · BUCAS GRANDE ISLAND · PHILIPPINES
        </p>
      </div>

      {/* ── Left sidebar – location list ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute", top: "50%", left: "1rem",
          transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: "3px",
          zIndex: 50,
          fontFamily: "-apple-system, 'Segoe UI', sans-serif",
          maxHeight: "calc(100vh - 7rem)", overflowY: "auto", overflowX: "hidden",
          paddingRight: "4px", scrollbarWidth: "thin",
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
                display: "flex", alignItems: "center", gap: "7px",
                padding: "4px 10px 4px 7px",
                background: active ? `linear-gradient(90deg, ${loc.color}cc, ${loc.color}88)` : "rgba(4,10,22,0.72)",
                border: `1px solid ${active ? loc.color : "rgba(255,255,255,0.08)"}`,
                borderRadius: "7px",
                color: active ? "#fff" : "#a0c0d8",
                cursor: "pointer", fontSize: "0.72rem",
                fontWeight: active ? 700 : 400,
                fontFamily: "inherit",
                backdropFilter: "blur(10px)",
                boxShadow: active ? `0 0 16px ${loc.color}55` : "none",
                whiteSpace: "nowrap", transition: "all 0.18s",
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
                <span style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Bottom controls hint ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", bottom: "1.2rem", left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: "1.2rem",
          background: "rgba(4,10,22,0.68)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px",
          padding: "5px 16px", zIndex: 50, pointerEvents: "none",
          fontFamily: "-apple-system, 'Segoe UI', sans-serif",
        }}
      >
        {[["🖱️ Drag", "rotate"], ["⚲ Scroll", "zoom"], ["⬡ Click", "explore"]].map(([act, desc]) => (
          <div key={desc} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.66rem", color: "#6888a8" }}>
            <span style={{ color: "#8aaccc", fontWeight: 600 }}>{act}</span>
            <span>{desc}</span>
          </div>
        ))}
      </div>

      {/* ── Top-right: Weather + Clock + Time Simulator ─────────────────── */}
      <div
        style={{
          position: "absolute", top: "1rem", right: "1.5rem",
          display: "flex", gap: "8px", alignItems: "flex-start",
          zIndex: 50,
          fontFamily: "-apple-system, 'Segoe UI', sans-serif",
        }}
      >
        {/* Weather selector */}
        <div
          style={{
            background: "rgba(4,10,22,0.78)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.09)", borderRadius: "10px",
            padding: "7px 10px", display: "flex", flexDirection: "column", gap: "6px",
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
                    width: "30px", height: "30px",
                    background:   active ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.04)",
                    border:       `1px solid ${active ? "rgba(56,189,248,0.55)" : "rgba(255,255,255,0.10)"}`,
                    borderRadius: "7px", fontSize: "1.0rem", lineHeight: 1,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                    boxShadow: active ? "0 0 8px rgba(56,189,248,0.25)" : "none",
                    color: active ? "#38bdf8" : "#8aaccc",
                    fontFamily: "inherit", padding: 0,
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

        {/* Clock + Time Simulator */}
        <div
          style={{
            background: "rgba(4,10,22,0.78)", backdropFilter: "blur(12px)",
            border: `1px solid ${isSim ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.09)"}`,
            borderRadius: "10px",
            padding: "8px 14px 10px",
            minWidth: "160px",
            transition: "border-color 0.3s",
          }}
        >
          {/* Time display row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span
                style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: displayDotColor,
                  boxShadow: `0 0 6px ${displayDotColor}`,
                  flexShrink: 0,
                  transition: "background 0.5s, box-shadow 0.5s",
                }}
              />
              <span
                style={{
                  fontSize: "1.05rem", fontWeight: 700, color: "#f0f8ff",
                  letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayTime}
              </span>
            </div>
            {isSim && (
              <button
                onClick={() => onSimHourChange(null)}
                title="Return to real PHT time"
                style={{
                  fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "#f59e0b", padding: "2px 6px",
                  border: "1px solid rgba(245,158,11,0.50)",
                  borderRadius: "4px", background: "rgba(245,158,11,0.12)",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.25)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.12)"; }}
              >
                ↩ CURRENT
              </button>
            )}
          </div>

          {/* Period / status line */}
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.10em", marginTop: "3px",
                        color: isSim ? "rgba(245,158,11,0.75)" : "#6888a8" }}>
            {isSim ? `SIMULATING · ${displayPeriod}` : `${displayPeriod} · PHT (UTC+8)`}
          </div>

          {/* Time scrubber */}
          <div style={{ marginTop: "10px" }}>
            <input
              type="range"
              min="0" max="24" step="0.0833"
              value={sliderVal}
              className={`time-slider${isSim ? " simulating" : ""}`}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onSimHourChange(v >= 24 ? 0 : v);
              }}
            />
            {/* Hour labels */}
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                fontSize: "0.44rem", color: "#4a6a88",
                marginTop: "3px", userSelect: "none",
              }}
            >
              {["0", "6", "12", "18", "24"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Phase 3: Events + Stats toggle buttons ──────────────────────── */}
      <div
        style={{
          position: "absolute", top: "1rem",
          right: "calc(1.5rem + 232px + 8px + 140px + 8px + 270px + 8px)",
          display: "flex", flexDirection: "column", gap: "6px",
          zIndex: 50, fontFamily: "-apple-system,'Segoe UI',sans-serif",
        }}
      >
        {/* Events toggle */}
        <button
          onClick={() => { setShowEvents((v) => !v); setShowStats(false); }}
          title="Upcoming municipal events"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 10px",
            background: showEvents ? "rgba(56,189,248,0.18)" : "rgba(4,10,22,0.78)",
            border: `1px solid ${showEvents ? "rgba(56,189,248,0.55)" : "rgba(255,255,255,0.09)"}`,
            borderRadius: "8px", color: showEvents ? "#38bdf8" : "#8aaccc",
            cursor: "pointer", fontFamily: "inherit", fontSize: "0.7rem",
            fontWeight: 600, backdropFilter: "blur(12px)",
            boxShadow: showEvents ? "0 0 10px rgba(56,189,248,0.2)" : "none",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>📅</span>
          Events
          {evCount > 0 && (
            <span
              style={{
                background: "#38bdf8", color: "#020e1a",
                borderRadius: "10px", fontSize: "0.56rem", fontWeight: 800,
                padding: "1px 5px", lineHeight: 1.4,
              }}
            >
              {evCount}
            </span>
          )}
        </button>

        {/* Stats toggle */}
        <button
          onClick={() => { setShowStats((v) => !v); setShowEvents(false); }}
          title="Municipality statistics"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 10px",
            background: showStats ? "rgba(245,158,11,0.18)" : "rgba(4,10,22,0.78)",
            border: `1px solid ${showStats ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.09)"}`,
            borderRadius: "8px", color: showStats ? "#F59E0B" : "#8aaccc",
            cursor: "pointer", fontFamily: "inherit", fontSize: "0.7rem",
            fontWeight: 600, backdropFilter: "blur(12px)",
            boxShadow: showStats ? "0 0 10px rgba(245,158,11,0.2)" : "none",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>📊</span>
          Stats
        </button>
      </div>

      {/* Phase 3 panels */}
      {showEvents && (
        <EventsPanel
          onClose={() => setShowEvents(false)}
          onLocationSelect={(id) => { onLocationSelect(id); setShowEvents(false); }}
        />
      )}
      {showStats && (
        <StatsPanel onClose={() => setShowStats(false)} />
      )}

      {/* ── Compass rose ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", bottom: "1.2rem", right: "1.5rem",
          width: "44px", height: "44px",
          background: "rgba(4,10,22,0.70)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.09)", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#6888aa", fontSize: "0.65rem", fontWeight: 700,
          fontFamily: "inherit", zIndex: 50, pointerEvents: "none",
        }}
      >
        N
      </div>
    </>
  );
}
