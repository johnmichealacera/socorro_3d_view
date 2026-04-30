"use client";

interface StatsPanelProps {
  onClose: () => void;
}

interface StatRow {
  label: string;
  value: string;
  icon?: string;
}

const SECTIONS: { heading: string; color: string; rows: StatRow[] }[] = [
  {
    heading: "Identity",
    color: "#38bdf8",
    rows: [
      { label: "Municipality",   value: "Socorro",                  icon: "🏛️" },
      { label: "Province",       value: "Surigao del Norte",        icon: "📍" },
      { label: "Island",         value: "Bucas Grande Island",      icon: "🏝️" },
      { label: "Classification", value: "4th Class Municipality",   icon: "📋" },
      { label: "Barangays",      value: "22",                       icon: "🏘️" },
    ],
  },
  {
    heading: "Geography",
    color: "#10B981",
    rows: [
      { label: "Land Area",      value: "≈ 108 km²",                icon: "🗺️" },
      { label: "Coastline",      value: "≈ 40 km (eastern shore)",  icon: "🌊" },
      { label: "Water Bodies",   value: "Dinagat Sound (E)",        icon: "💧" },
      { label: "Elevation",      value: "0 – 420 m asl",            icon: "⛰️" },
    ],
  },
  {
    heading: "Demographics",
    color: "#F59E0B",
    rows: [
      { label: "Population",     value: "≈ 15,000 (est.)",          icon: "👥" },
      { label: "Main Language",  value: "Surigaonon, Filipino",     icon: "🗣️" },
      { label: "Religion",       value: "Predominantly Catholic",   icon: "⛪" },
    ],
  },
  {
    heading: "Economy",
    color: "#F97316",
    rows: [
      { label: "Primary",        value: "Fishing (tuna, bangus)",   icon: "🎣" },
      { label: "Secondary",      value: "Farming, coconut/copra",   icon: "🌴" },
      { label: "Tertiary",       value: "Trade, transport",         icon: "🛒" },
      { label: "Key Exports",    value: "Tuna, copra, sea cucumber",icon: "📦" },
    ],
  },
  {
    heading: "Tourism",
    color: "#EC4899",
    rows: [
      { label: "Beaches",        value: "Puyangi White Beach",      icon: "🏖️" },
      { label: "Nearby",         value: "Sohoton Jellyfish Cove",   icon: "🪼" },
      { label: "Recreation",     value: "Taruc Swimming Pool",      icon: "🏊" },
      { label: "Sea Access",     value: "Via Surigao City (ferry)", icon: "⛴️" },
    ],
  },
];

export default function StatsPanel({ onClose }: StatsPanelProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: "1rem",
        right: "calc(1.5rem + 232px + 8px + 140px + 8px)",
        width: "270px",
        maxHeight: "calc(100vh - 5rem)",
        overflowY: "auto",
        background: "rgba(6,14,28,0.93)",
        backdropFilter: "blur(16px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderTop: "3px solid #F59E0B",
        borderRadius: "10px",
        padding: "0.9rem",
        color: "#f0f8ff",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        zIndex: 100,
        fontFamily: "-apple-system,'Segoe UI',sans-serif",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(245,158,11,0.25) transparent",
      } as React.CSSProperties}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div>
          <div style={{ fontSize: "0.6rem", color: "#F59E0B", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>
            Municipal Profile
          </div>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f0f8ff", marginTop: "2px" }}>
            Socorro at a Glance
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

      <div style={{ height: "1px", background: "rgba(245,158,11,0.2)", marginBottom: "0.75rem" }} />

      {/* Stat sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {SECTIONS.map((sec) => (
          <div key={sec.heading}>
            <div
              style={{
                fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.13em",
                textTransform: "uppercase", color: sec.color,
                marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <span style={{ flex: 1, height: "1px", background: `${sec.color}30` }} />
              {sec.heading}
              <span style={{ flex: 1, height: "1px", background: `${sec.color}30` }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {sec.rows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex", alignItems: "baseline", gap: "8px",
                    padding: "3px 6px", borderRadius: "4px",
                    background: "rgba(255,255,255,0.025)",
                  }}
                >
                  {row.icon && (
                    <span style={{ fontSize: "0.75rem", flexShrink: 0 }}>{row.icon}</span>
                  )}
                  <span style={{ fontSize: "0.66rem", color: "#7a9ab8", flexShrink: 0, minWidth: "90px" }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#d0e8f8" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "0.6rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: "0.6rem",
          color: "#4a6a88",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Socorro, Surigao del Norte · Philippines<br />
        Data approximate · Population est. 2024
      </div>
    </div>
  );
}
