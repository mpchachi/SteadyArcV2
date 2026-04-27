"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import GameCanvas          from "@/components/GameCanvas";
import CalibrationScreen   from "@/components/CalibrationScreen";

type Phase = "intro" | "calibrating" | "playing";

export default function Home() {
  const [phase,   setPhase]   = useState<Phase>("intro");
  const [fadeOut, setFadeOut] = useState(false);

  const videoRef   = useRef<HTMLVideoElement>(null);
  const gazeDotRef = useRef<HTMLDivElement>(null);

  // ── Intro → calibración ───────────────────────────────────────────
  const startCalibration = useCallback(() => {
    if (phase !== "intro" || fadeOut) return;
    setFadeOut(true);
    videoRef.current?.pause();
    setTimeout(() => setPhase("calibrating"), 600);
  }, [phase, fadeOut]);

  useEffect(() => {
    if (phase !== "intro") return;
    const handleKey = (e: KeyboardEvent) => { e.preventDefault(); startCalibration(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, startCalibration]);

  // ── Callbacks del eye tracker ─────────────────────────────────────
  // onGaze: manipulación directa del DOM, sin re-render (60 fps)
  const handleGaze = useCallback((g: { x: number; y: number }) => {
    if (gazeDotRef.current) {
      gazeDotRef.current.style.left = g.x + "px";
      gazeDotRef.current.style.top  = g.y + "px";
    }
  }, []);

  const handleCalibrated = useCallback(() => setPhase("playing"), []);

  // ─────────────────────────────────────────────────────────────────
  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">

      {/* Juego — se monta solo al terminar la calibración */}
      {phase === "playing" && <GameCanvas />}

      {/* CalibrationScreen: se monta al salir del intro y se queda montado
          durante "playing" para que el eyeTracker siga corriendo. */}
      {phase !== "intro" && (
        <CalibrationScreen onGaze={handleGaze} onCalibrated={handleCalibrated} />
      )}

      {/* Punto de mirada — siempre en el DOM, visible solo al jugar */}
      <div
        ref={gazeDotRef}
        style={{
          display:       phase === "playing" ? "block" : "none",
          position:      "fixed",
          zIndex:        9999,
          pointerEvents: "none",
          width:         22,
          height:        22,
          borderRadius:  "50%",
          background:    "radial-gradient(circle at 35% 35%, #ffffff, rgba(255,255,255,0.55))",
          boxShadow:     "0 0 8px 3px rgba(255,255,255,0.65), 0 0 2px rgba(255,255,255,0.9)",
          transform:     "translate(-50%, -50%)",
        }}
      />

      {/* ── Pantalla de intro ─────────────────────────────────────── */}
      {phase === "intro" && (
        <div
          onClick={startCalibration}
          style={{
            position:   "fixed",
            inset:      0,
            zIndex:     50,
            display:    "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor:     "pointer",
            backgroundColor: "#000",
            opacity:    fadeOut ? 0 : 1,
            transition: "opacity 0.6s ease-out",
          }}
        >
          {/* Video de fondo — igual que antes */}
          <video
            ref={videoRef}
            src="/Animación_de_Imagen_Generada.mp4"
            autoPlay muted loop playsInline
            style={{
              position:   "absolute",
              inset:      0,
              width:      "100%",
              height:     "100%",
              objectFit:  "cover",
            }}
          />

          {/* Gradiente oscuro para legibilidad del texto */}
          <div style={{
            position:      "absolute",
            inset:         0,
            background:    "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.6) 100%)",
            pointerEvents: "none",
          }} />

          {/* Texto parpadeante */}
          <div style={{
            position:  "absolute",
            bottom:    "15%",
            zIndex:    10,
            display:   "flex",
            flexDirection: "column",
            alignItems:"center",
            width:     "100%",
            padding:   "0 1rem",
          }}>
            <div style={{
              fontFamily:      '"Press Start 2P", monospace',
              fontSize:        "clamp(1rem, 2vw, 1.5rem)",
              color:           "#ffffff",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              padding:         "1rem 2rem",
              borderRadius:    "8px",
              border:          "2px solid rgba(255, 255, 255, 0.3)",
              textShadow:      "2px 2px 0 #000",
              animation:       "blink 1.5s ease-in-out infinite",
              boxShadow:       "0 4px 15px rgba(0,0,0,0.5)",
            }}>
              Pulsa cualquier tecla para empezar
            </div>
          </div>

          <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }`}</style>
        </div>
      )}
    </main>
  );
}
