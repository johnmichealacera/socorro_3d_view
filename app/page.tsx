"use client";

import dynamic from "next/dynamic";

const IslandViewer = dynamic(() => import("@/components/IslandViewer"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a1628",
        color: "#7aadcc",
        fontFamily: "system-ui, sans-serif",
        gap: "1rem",
      }}
    >
      <div style={{ fontSize: "2.5rem" }}>🏝️</div>
      <p style={{ fontSize: "0.9rem", letterSpacing: "0.1em" }}>
        Loading Socorro 3D Map…
      </p>
    </div>
  ),
});

const SoundSystem = dynamic(() => import("@/components/SoundSystem"), { ssr: false });

export default function Page() {
  return (
    <>
      <IslandViewer />
      <SoundSystem />
    </>
  );
}
