import * as React from "react";

export function CanvasBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(50, 50, 50, 0.15) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0",
      }}
    />
  );
}
