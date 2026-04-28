"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import GameCanvas          from "@/components/GameCanvas";
import CalibrationScreen   from "@/components/CalibrationScreen";
import ClinicalView        from "@/components/ClinicalView";
import { GameEngineProvider } from "@/context/GameEngineProvider";
import type { GazeSample } from "@/lib/gazeMetrics";

type Phase = "intro" | "calibrating" | "playing" | "clinical";

export default function Home() {
  const [phase,   setPhase]   = useState<Phase>("intro");
  const [fadeOut, setFadeOut] = useState(false);

  const videoRef   = useRef<HTMLVideoElement>(null);
  const gazeSamplesRef = useRef<GazeSample[]>([]);

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
  // onGaze: solo recopilar métricas, sin actualizar el DOM (cursor visual eliminado)
  const handleGaze = useCallback((g: { x: number; y: number }) => {
    // Añadir al buffer para métricas clínicas:
    gazeSamplesRef.current.push({ x: g.x, y: g.y, timestamp: Date.now() });
    // Mantener solo las últimas 300 muestras:
    if (gazeSamplesRef.current.length > 300) {
      gazeSamplesRef.current.shift();
    }
  }, []);

  const handleCalibrated = useCallback(() => setPhase("playing"), []);

  // ─────────────────────────────────────────────────────────────────
  return (
    <GameEngineProvider gazeSamples={gazeSamplesRef}>
      <main className="relative w-screen h-screen bg-black overflow-hidden">

      {/* Juego — se monta solo al terminar la calibración */}
      {phase === "playing" && <GameCanvas onOpenClinical={() => setPhase("clinical")} />}

      {/* Mensaje de carga mientras se inicializa el eye tracker */}
      {phase === "calibrating" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-6" style={{ zIndex: 1 }}>
          <p className="font-pixel text-white opacity-40 animate-pulse text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            INICIALIZANDO EYE TRACKER...
          </p>
          <button
            onClick={() => setPhase("playing")}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.4)",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            SALTAR CALIBRACIÓN
          </button>
        </div>
      )}

      {/* Vista Clínica real — cámara + MediaPipe + métricas */}
      {phase === "clinical" && (
        <div className="fixed inset-0 z-[100]">
          <ClinicalView onBack={() => setPhase("playing")} />
        </div>
      )}

      {/* CalibrationScreen: solo durante calibración y juego.
          Se detiene en modo clinical para no competir con la cámara de MediaPipe. */}
      {(phase === "calibrating" || phase === "playing") && (
        <CalibrationScreen onGaze={handleGaze} onCalibrated={handleCalibrated} />
      )}

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

        </div>
      )}
    </main>
    </GameEngineProvider>
  );
}
