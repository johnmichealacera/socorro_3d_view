"use client";

import React from "react";
import { DiscoveryDef } from "./scene/discovery";

interface Props {
  discovery: DiscoveryDef | null;
  onClose:   () => void;
}

export default function DiscoveryPopup({ discovery, onClose }: Props) {
  if (!discovery) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position:       "absolute",
        bottom:         "5rem",
        left:           "50%",
        transform:      "translateX(-50%)",
        background:     "rgba(4,12,28,0.90)",
        backdropFilter: "blur(16px)",
        border:         `1px solid ${discovery.color}55`,
        borderRadius:   "12px",
        padding:        "14px 20px 12px",
        zIndex:         60,
        fontFamily:     "-apple-system, 'Segoe UI', sans-serif",
        maxWidth:       "340px",
        width:          "calc(100vw - 5rem)",
        animation:      "panelIn 0.28s ease",
        boxShadow:      `0 0 28px ${discovery.color}22`,
        cursor:         "pointer",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "9px" }}>
        <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{discovery.icon}</span>
        <div>
          <div style={{
            fontSize:        "0.58rem",
            color:           discovery.color,
            letterSpacing:   "0.12em",
            textTransform:   "uppercase",
            fontWeight:      700,
            marginBottom:    "1px",
          }}>
            Discovery Found
          </div>
          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#e8f4ff" }}>
            {discovery.name}
          </div>
        </div>
      </div>

      {/* Story */}
      <div style={{
        width:           "100%",
        height:          "1px",
        background:      `linear-gradient(90deg, ${discovery.color}44, transparent)`,
        marginBottom:    "9px",
      }} />
      <p style={{
        fontSize:   "0.76rem",
        color:      "#a0bcd4",
        lineHeight: 1.65,
        margin:     0,
        fontStyle:  "italic",
      }}>
        &ldquo;{discovery.story}&rdquo;
      </p>

      {/* Dismiss hint */}
      <div style={{
        fontSize:    "0.58rem",
        color:       "#334455",
        marginTop:   "10px",
        textAlign:   "right",
        letterSpacing: "0.06em",
      }}>
        TAP TO DISMISS
      </div>
    </div>
  );
}
