"use client";

import { useRef, useState, useCallback } from "react";
import { useGestureRecognition } from "@/lib/cv/useGestureRecognition";
import { AnatomicalDashboard, type ClinicalData, type AnchorMap } from "./AnatomicalDashboard";

interface ClinicalViewProps {
  onBack: () => void;
}

export default function ClinicalView({ onBack }: ClinicalViewProps) {
  const videoElement          = useRef<HTMLVideoElement>(null);
  const canvasEl              = useRef<HTMLCanvasElement>(null);
  const lastUpdateTime        = useRef(0);
  const posBuffer             = useRef<{ x: number; y: number; t: number }[]>([]);
  const maxSpanObserved       = useRef(1);
  const baselineSmileVertical = useRef(0);

  const [metrics, setMetrics] = useState<ClinicalData>({
    cri: 0,
    pinchActive: false,
    pinchMm: 0,
    handOpenPct: 0,
    fingers: 0,
    palmSpeed: 0,
    smoothness: 1.0,
    romDeg: 0,
    tremorAmp: 0.1,
    faceSymmetry: 1.0,
    smiling: false,
  });

  const [anchors, setAnchors] = useState<AnchorMap>({});

  const onResultsCallback = useCallback((res: any) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 40) return;
    lastUpdateTime.current = now;

    const lm  = res.multiHandLandmarks?.[0];
    const flm = res.latestFaceResults?.multiFaceLandmarks?.[0];

    const vw = 960, vh = 540;
    const gDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
      Math.sqrt(Math.pow((p1.x - p2.x) * vw, 2) + Math.pow((p1.y - p2.y) * vh, 2));

    const next: ClinicalData = {
      cri: 0,
      pinchActive: false,
      pinchMm: 0,
      handOpenPct: 0,
      fingers: 0,
      palmSpeed: 0,
      smoothness: 1.0,
      romDeg: 0,
      tremorAmp: metrics.tremorAmp,
      faceSymmetry: metrics.faceSymmetry,
      smiling: metrics.smiling,
    };

    // ── Métricas de mano ─────────────────────────────────────────────
    if (lm) {
      const hSize     = gDist(lm[0], lm[9]);
      const palmScale = gDist(lm[5], lm[17]);
      const pxToMm    = 80 / (palmScale + 0.001);

      const dPinchPx   = gDist(lm[4], lm[8]);
      next.pinchMm     = Math.round(dPinchPx * pxToMm);
      next.pinchActive = dPinchPx / hSize < 0.15;

      const tips = [4, 8, 12, 16, 20];
      const avgDistTips = tips.reduce((s, idx) => s + gDist(lm[idx], lm[9]), 0) / 5;
      maxSpanObserved.current = Math.max(maxSpanObserved.current, avgDistTips);
      next.handOpenPct = Math.round((avgDistTips / maxSpanObserved.current) * 100);

      let extended = 0;
      [8, 12, 16, 20].forEach((tip, i) => {
        const joint = [6, 10, 14, 18][i];
        if (gDist(lm[tip], lm[0]) > gDist(lm[joint], lm[0])) extended++;
      });
      if (gDist(lm[4], lm[17]) > gDist(lm[3], lm[17])) extended++;
      next.fingers = extended;

      posBuffer.current.push({ x: lm[0].x, y: lm[0].y, t: now });
      if (posBuffer.current.length > 60) posBuffer.current.shift();

      if (posBuffer.current.length > 2) {
        const p1 = posBuffer.current[posBuffer.current.length - 1];
        const p2 = posBuffer.current[posBuffer.current.length - 2];
        const dt = (p1.t - p2.t) / 1000;
        next.palmSpeed = Math.round((gDist(p1, p2) * pxToMm) / (dt + 0.001));

        // Suavidad: 1.0 = fluido, 0 = muy fragmentado
        let inversions = 0;
        for (let i = 2; i < posBuffer.current.length; i++) {
          const v1 = posBuffer.current[i - 1].y - posBuffer.current[i - 2].y;
          const v2 = posBuffer.current[i    ].y - posBuffer.current[i - 1].y;
          if (v1 * v2 < 0) inversions++;
        }
        next.smoothness = Math.max(0, 1 - inversions / 30);
      }

      const v1  = { x: lm[0].x - lm[9].x, y: lm[0].y - lm[9].y };
      const v2  = { x: lm[5].x - lm[0].x, y: lm[5].y - lm[0].y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const m1  = Math.sqrt(v1.x ** 2 + v1.y ** 2);
      const m2  = Math.sqrt(v2.x ** 2 + v2.y ** 2);
      next.romDeg = Math.round(
        Math.acos(Math.min(1, Math.max(-1, dot / (m1 * m2 + 0.001)))) * 180 / Math.PI
      );

      // Temblor — stdX normalizado [0,1]: 0.002→bajo, 0.005→alto
      if (next.palmSpeed < 20 && posBuffer.current.length >= 30) {
        const meanX = posBuffer.current.slice(-30).reduce((a, b) => a + b.x, 0) / 30;
        const stdX  = Math.sqrt(
          posBuffer.current.slice(-30).reduce((a, b) => a + Math.pow(b.x - meanX, 2), 0) / 30
        );
        next.tremorAmp = Math.min(1, stdX * 100);
      } else {
        next.tremorAmp = metrics.tremorAmp;
      }
    }

    // ── Métricas faciales ────────────────────────────────────────────
    if (flm) {
      const midX = (flm[234].x + flm[454].x) / 2;
      const midY = (flm[234].y + flm[454].y) / 2;
      const dL   = Math.sqrt((flm[61].x  - midX) ** 2 + (flm[61].y  - midY) ** 2);
      const dR   = Math.sqrt((flm[291].x - midX) ** 2 + (flm[291].y - midY) ** 2);
      next.faceSymmetry = Math.min(dL, dR) / (Math.max(dL, dR) + 0.001);

      const smileV = gDist(flm[13], flm[14]);
      if (baselineSmileVertical.current === 0) baselineSmileVertical.current = smileV;
      next.smiling = smileV > baselineSmileVertical.current * 1.2;
    }

    // ── CRI ──────────────────────────────────────────────────────────
    next.cri = (
      next.handOpenPct              * 0.30 +
      (next.fingers / 5 * 100)      * 0.20 +
      (next.romDeg  / 180 * 100)    * 0.20 +
      (next.faceSymmetry * 100)     * 0.30
    );

    // ── Anclas sobre el panel de cámara ─────────────────────────────
    // Coordenadas normalizadas (0-1) directas de MediaPipe — coinciden
    // con el canvas de 960×540 que se muestra sin recorte (16:9 panel).
    const newAnchors: AnchorMap = {};
    if (lm) {
      // M1 — punto de pinza (entre pulgar e índice) — X invertida por espejo
      newAnchors.M1 = { x: 1 - (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 };
      // M2 — centro de palma
      newAnchors.M2 = { x: 1 - lm[9].x, y: lm[9].y };
      // M3 — muñeca
      newAnchors.M3 = { x: 1 - lm[0].x, y: lm[0].y };
    }
    if (flm) {
      // F1 — mejilla izquierda (referencia simetría)
      newAnchors.F1 = { x: 1 - flm[234].x, y: flm[234].y };
      // F2 — mejilla derecha
      newAnchors.F2 = { x: 1 - flm[454].x, y: flm[454].y };
      // F3 — centro boca (sonrisa)
      newAnchors.F3 = { x: 1 - (flm[61].x + flm[291].x) / 2, y: (flm[61].y + flm[291].y) / 2 };
    }

    setMetrics(next);
    setAnchors(newAnchors);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { maxVideoWidth, maxVideoHeight } = useGestureRecognition({
    videoElement, canvasEl, onResultsCallback,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "#F2E8D5", overflowY: "auto", zIndex: 100 }}>

      {/* Video oculto — fuente para MediaPipe (el canvas muestra el render) */}
      <video style={{ display: "none" }} playsInline ref={videoElement} />

      <AnatomicalDashboard
        data={metrics}
        anchors={anchors}
        cameraSlot={
          <canvas
            ref={canvasEl}
            width={maxVideoWidth}
            height={maxVideoHeight}
            style={{ transform: "scaleX(-1)" }}
          />
        }
      />

      {/* Botón de vuelta */}
      <button
        onClick={onBack}
        style={{
          position: "fixed", bottom: "20px", right: "20px", zIndex: 9999,
          background: "rgba(10,20,40,0.92)", border: "2px solid #00ff88",
          color: "#00ff88", padding: "8px 18px", borderRadius: "6px",
          fontSize: "0.6rem", cursor: "pointer",
          fontFamily: '"Press Start 2P", monospace',
          letterSpacing: "0.05em", boxShadow: "0 0 12px rgba(0,255,136,0.2)",
        }}
      >
        ▶ GAME MODE
      </button>
    </div>
  );
}
