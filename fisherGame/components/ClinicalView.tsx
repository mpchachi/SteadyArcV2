"use client";

import { useRef, useState, useCallback } from "react";
import { useGestureRecognition } from "@/lib/cv/useGestureRecognition";

// ── Sub-components ────────────────────────────────────────────────────

const FmaGauge = ({ value, color }: { value: number; color: string }) => {
  const radius = 70;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div style={{ position: "relative", width: "100%", height: "140px", display: "flex", justifyContent: "center", alignItems: "flex-end", marginBottom: "20px" }}>
      <svg width="200" height="120">
        <path d="M 30 110 A 70 70 0 0 1 170 110" fill="none" stroke="#2D333B" strokeWidth="12" strokeLinecap="round" />
        <path d="M 30 110 A 70 70 0 0 1 170 110" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", bottom: 0, textAlign: "center" }}>
        <div style={{ fontSize: "3rem", fontWeight: 900, color: "#FFF" }}>{Math.round(value)}</div>
        <div style={{ fontSize: "0.6rem", color: "#8B949E", fontWeight: 800 }}>CLINICAL RECOVERY INDEX</div>
      </div>
    </div>
  );
};

const MetricCard = ({ name, value, unit, subtitle, color, barProgress = null }: {
  name: string; value: string | number; unit: string; subtitle: string;
  color: string; barProgress?: number | null;
}) => (
  <div style={{ background: "#1C2128", borderRadius: "10px", padding: "12px", borderLeft: `3px solid ${color}`, minHeight: "90px" }}>
    <div style={{ color: "#8B949E", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.05em" }}>{name}</div>
    <div style={{ color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 700, fontFamily: "monospace", margin: "4px 0" }}>
      {value} <span style={{ fontSize: "0.7rem", color: "#8B949E" }}>{unit}</span>
    </div>
    {barProgress !== null && (
      <div style={{ width: "100%", height: "4px", background: "#30363D", borderRadius: "2px", overflow: "hidden", margin: "4px 0" }}>
        <div style={{ width: `${barProgress}%`, height: "100%", background: color, transition: "width 0.3s" }} />
      </div>
    )}
    <div style={{ color: "#484F58", fontSize: "0.55rem" }}>{subtitle}</div>
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <div style={{ color: "#8B949E", fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.15em", margin: "20px 0 10px 0", borderBottom: "1px solid #30363D", paddingBottom: "4px" }}>
    {title}
  </div>
);

// ── Types ──────────────────────────────────────────────────────────────

interface Metrics {
  pinchActive: string; pinchMm: number; handOpenPct: number; fingersExt: number;
  palmSpeed: number; smoothness: string; romWrist: number; tremor: string;
  facialSym: string | number; smileActive: string; fmaProxy: number;
}

interface ClinicalViewProps {
  onBack: () => void;
}

// ── Main component ─────────────────────────────────────────────────────

export default function ClinicalView({ onBack }: ClinicalViewProps) {
  const videoElement   = useRef<HTMLVideoElement>(null);
  const canvasEl       = useRef<HTMLCanvasElement>(null);
  const lastUpdateTime = useRef(0);
  const posBuffer      = useRef<{ x: number; y: number; t: number }[]>([]);
  const maxSpanObserved      = useRef(1);
  const baselineSmileVertical = useRef(0);

  const [metrics, setMetrics] = useState<Metrics>({
    pinchActive: "NO", pinchMm: 0, handOpenPct: 0, fingersExt: 0,
    palmSpeed: 0, smoothness: "FLUIDO", romWrist: 0, tremor: "BAJO",
    facialSym: 1.0, smileActive: "NO", fmaProxy: 0,
  });

  const onResultsCallback = useCallback((res: any) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 40) return;
    lastUpdateTime.current = now;

    const lm  = res.multiHandLandmarks?.[0];
    const flm = res.latestFaceResults?.multiFaceLandmarks?.[0];

    const vw = 960, vh = 540;
    const gDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
      Math.sqrt(Math.pow((p1.x - p2.x) * vw, 2) + Math.pow((p1.y - p2.y) * vh, 2));

    const next: Metrics = {
      pinchActive: "NO", pinchMm: 0, handOpenPct: 0, fingersExt: 0,
      palmSpeed: 0, smoothness: "FLUIDO", romWrist: 0, tremor: "BAJO",
      facialSym: 1.0, smileActive: "NO", fmaProxy: 0,
    };

    if (lm) {
      const hSize     = gDist(lm[0], lm[9]);
      const palmScale = gDist(lm[5], lm[17]);
      const pxToMm    = 80 / (palmScale + 0.001);

      const dPinchPx   = gDist(lm[4], lm[8]);
      next.pinchMm     = Math.round(dPinchPx * pxToMm);
      next.pinchActive = dPinchPx / hSize < 0.15 ? "SÍ" : "NO";

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
      next.fingersExt = extended;

      posBuffer.current.push({ x: lm[0].x, y: lm[0].y, t: now });
      if (posBuffer.current.length > 60) posBuffer.current.shift();

      if (posBuffer.current.length > 2) {
        const p1  = posBuffer.current[posBuffer.current.length - 1];
        const p2  = posBuffer.current[posBuffer.current.length - 2];
        const dt  = (p1.t - p2.t) / 1000;
        next.palmSpeed = Math.round((gDist(p1, p2) * pxToMm) / (dt + 0.001));

        let inversions = 0;
        for (let i = 2; i < posBuffer.current.length; i++) {
          const v1 = posBuffer.current[i-1].y - posBuffer.current[i-2].y;
          const v2 = posBuffer.current[i  ].y - posBuffer.current[i-1].y;
          if (v1 * v2 < 0) inversions++;
        }
        next.smoothness = inversions > 12 ? "FRAGMENTADO" : "FLUIDO";
      }

      const v1  = { x: lm[0].x - lm[9].x, y: lm[0].y - lm[9].y };
      const v2  = { x: lm[5].x - lm[0].x, y: lm[5].y - lm[0].y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const m1  = Math.sqrt(v1.x ** 2 + v1.y ** 2);
      const m2  = Math.sqrt(v2.x ** 2 + v2.y ** 2);
      next.romWrist = Math.round(Math.acos(Math.min(1, Math.max(-1, dot / (m1 * m2 + 0.001)))) * 180 / Math.PI);

      if (next.palmSpeed < 20 && posBuffer.current.length >= 30) {
        const meanX = posBuffer.current.slice(-30).reduce((a, b) => a + b.x, 0) / 30;
        const stdX  = Math.sqrt(posBuffer.current.slice(-30).reduce((a, b) => a + Math.pow(b.x - meanX, 2), 0) / 30);
        next.tremor = stdX > 0.005 ? "ALTO" : stdX > 0.002 ? "MEDIO" : "BAJO";
      } else {
        next.tremor = metrics.tremor;
      }
    }

    if (flm) {
      const midX   = (flm[234].x + flm[454].x) / 2;
      const midY   = (flm[234].y + flm[454].y) / 2;
      const dL     = Math.sqrt((flm[61].x - midX) ** 2  + (flm[61].y - midY) ** 2);
      const dR     = Math.sqrt((flm[291].x - midX) ** 2 + (flm[291].y - midY) ** 2);
      next.facialSym  = (Math.min(dL, dR) / Math.max(dL, dR)).toFixed(2);
      const smileV = gDist(flm[13], flm[14]);
      if (baselineSmileVertical.current === 0) baselineSmileVertical.current = smileV;
      next.smileActive = smileV > baselineSmileVertical.current * 1.2 ? "SÍ" : "NO";
    } else {
      next.facialSym  = metrics.facialSym;
      next.smileActive = metrics.smileActive;
    }

    const facialSymNum = parseFloat(String(next.facialSym));
    next.fmaProxy = (
      next.handOpenPct * 0.3 +
      (next.fingersExt / 5 * 100) * 0.2 +
      (next.romWrist   / 180 * 100) * 0.2 +
      (facialSymNum    * 100) * 0.3
    );

    setMetrics(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { maxVideoWidth, maxVideoHeight } = useGestureRecognition({
    videoElement, canvasEl, onResultsCallback,
  });

  const getStatusColor = (val: number, thresholds = [35, 70]) =>
    val > thresholds[1] ? "#22C55E" : val > thresholds[0] ? "#F97316" : "#EF4444";

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#0D1117", color: "#c9d1d9", overflow: "hidden" }}>

      {/* Panel Izquierdo — feed de cámara con overlays */}
      <div style={{ flex: "0 0 60%", position: "relative", background: "#000" }}>
        <video style={{ display: "none" }} playsInline ref={videoElement} />
        <canvas
          ref={canvasEl}
          width={maxVideoWidth}
          height={maxVideoHeight}
          style={{ display: "block", height: "100%", width: "100%", objectFit: "contain" }}
        />
      </div>

      {/* Panel Derecho — métricas */}
      <div style={{ flex: "0 0 40%", background: "#161B22", padding: "24px", display: "flex", flexDirection: "column", borderLeft: "1px solid #30363D", overflowY: "auto" }}>
        <FmaGauge value={metrics.fmaProxy} color={getStatusColor(metrics.fmaProxy)} />

        <SectionTitle title="MÉTRICAS DE MANO (CORE)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          <MetricCard name="PINZA ACTIVA"     value={metrics.pinchActive}  unit=""      subtitle="Ref: LM 4-8"              color={metrics.pinchActive === "SÍ" ? "#22C55E" : "#EF4444"} />
          <MetricCard name="DISTANCIA PINZA"  value={metrics.pinchMm}      unit="mm"    subtitle="Escala 5-17 (80mm)"        color="#00D4FF" />
          <MetricCard name="APERTURA MANO"    value={`${metrics.handOpenPct}%`} unit="" subtitle="Normalizado Max Sesión"   color={getStatusColor(metrics.handOpenPct)} barProgress={metrics.handOpenPct} />
          <MetricCard name="DEDOS EXT."       value={metrics.fingersExt}   unit="/ 5"   subtitle="Posición falanges"         color="#7C3AED" />
          <MetricCard name="VELOCIDAD PALMA"  value={metrics.palmSpeed}    unit="mm/s"  subtitle="Media móvil 5 frames"      color="#F97316" />
          <MetricCard name="SUAVIDAD"         value={metrics.smoothness}   unit=""      subtitle="Algoritmo SPARC"           color={metrics.smoothness === "FLUIDO" ? "#22C55E" : "#F97316"} />
          <MetricCard name="ROM MUÑECA"       value={`${metrics.romWrist}°`} unit=""   subtitle="Vector 9-0-5"              color="#00D4FF" />
          <MetricCard name="ÍNDICE TEMBLOR"   value={metrics.tremor}       unit=""      subtitle="Desv. Estándar LM0"        color={metrics.tremor === "BAJO" ? "#22C55E" : "#EF4444"} />
        </div>

        <SectionTitle title="MÉTRICAS CARA Y ATENCIÓN" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <MetricCard name="SIMETRÍA LABIAL" value={metrics.facialSym}   unit="pts" subtitle="Ratio L291 vs L61"       color={getStatusColor(parseFloat(String(metrics.facialSym)) * 100)} />
          <MetricCard name="SONRISA"         value={metrics.smileActive} unit=""    subtitle="Dinámica vertical"        color={metrics.smileActive === "SÍ" ? "#22C55E" : "#8B949E"} />
        </div>
      </div>

      {/* Botón de vuelta — siempre visible */}
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
