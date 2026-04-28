"use client";

import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";

/**
 * AnatomicalDashboard — versión "instrumento clínico integrado"
 * --------------------------------------------------------------
 * Layout 60/40: panel CAM a la izquierda + métricas a la derecha,
 * todo dentro del mismo marco pixel-clínico (un único instrumento).
 */

const C = {
  bg: "#F2E8D5",
  panel: "#FBF4E2",
  panelDark: "#E8DBBE",
  panelDeep: "#DCC9A0",
  grid: "#D9C9A3",
  border: "#8B6B3D",
  borderSoft: "#B89968",
  ink: "#2E2418",
  inkDim: "#7A6648",
  inkSoft: "#A38860",
  ok: "#3F8F5C",
  warn: "#C9822F",
  bad: "#B0432E",
  off: "#D9C9A3",
  outline: "#3A2A14",
  accent: "#5A8A6B",
};

const MONO: CSSProperties = {
  fontFamily: '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace',
  letterSpacing: "0.04em",
};

export type ClinicalData = {
  cri: number;
  pinchActive: boolean;
  pinchMm: number;
  handOpenPct: number;
  fingers: number;
  palmSpeed: number;
  smoothness: number;
  romDeg: number;
  tremorAmp: number;
  faceSymmetry: number;
  smiling: boolean;
};

/** Coordenadas normalizadas (0-1) de cada ancla sobre el panel de cámara. */
export type AnchorMap = Partial<Record<
  "F1" | "F2" | "F3" | "F4" | "M1" | "M2" | "M3",
  { x: number; y: number }
>>;

type Props = {
  data: ClinicalData;
  history?: Partial<Record<keyof ClinicalData, number[]>>;
  /** Nodo libre que se renderiza dentro del panel CAM (canvas MediaPipe) */
  cameraSlot?: ReactNode;
  /** Posiciones (0-1) de los puntos a etiquetar sobre la cámara */
  anchors?: AnchorMap;
  /** Texto de cabecera del panel CAM */
  cameraLabel?: string;
};

export function AnatomicalDashboard({
  data,
  history,
  cameraSlot,
  anchors,
  cameraLabel = "CAM-01 · OBSERVACIÓN DIRECTA",
}: Props) {
  const internal = useMetricHistory(data, 30);
  const hist = (k: keyof ClinicalData) =>
    (history?.[k] as number[] | undefined) ?? internal[k] ?? [];

  return (
    <div
      className="relative w-full"
      style={{
        ...MONO,
        background: C.panel,
        boxShadow: `0 0 0 2px ${C.outline}, 0 0 0 4px ${C.border}`,
        padding: "40px 28px 32px",
        imageRendering: "pixelated",
      }}
    >
      <RulerEdge side="top" />
      <RulerEdge side="bottom" />
      <RulerEdge side="left" />
      <RulerEdge side="right" />

      {/* Cabecera de informe */}
      <div
        className="flex items-center justify-between"
        style={{
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: `1px dashed ${C.borderSoft}`,
          fontSize: 9,
          color: C.inkDim,
          letterSpacing: "0.18em",
        }}
      >
        <span>STEADYARC · INFORME CLÍNICO EN TIEMPO REAL</span>
        <span>PAC-0001 · v1.0</span>
      </div>

      {/* === LAYOUT 60/40: CÁMARA + DASHBOARD === */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "minmax(0, 60fr) minmax(0, 40fr)" }}
      >
        {/* ---------- COLUMNA IZQ: CÁMARA + CRI ---------- */}
        <div className="flex flex-col gap-3">
          <CameraPanel label={cameraLabel} anchors={anchors}>
            {cameraSlot}
          </CameraPanel>
          <CriHero value={data.cri} history={hist("cri")} />
        </div>

        {/* ---------- COLUMNA DER: MÉTRICAS ---------- */}
        <div className="flex flex-col">
          <SectionLabel index="01" title="MANO · MOTOR FINO" tight />
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <BigCard
              code="M1"
              name="PINZA"
              status={data.pinchActive ? "ok" : "idle"}
              critical={false}
              value={data.pinchActive ? "SÍ" : "NO"}
              unit={`${data.pinchMm.toFixed(1)} mm`}
              instrument={<Sparkline data={hist("pinchMm")} color={C.ok} max={40} />}
            />
            <BigCard
              code="M2"
              name="APERTURA"
              status={data.handOpenPct > 70 ? "ok" : data.handOpenPct > 35 ? "warn" : "bad"}
              critical={data.handOpenPct < 25}
              value={Math.round(data.handOpenPct)}
              unit="%"
              instrument={<SegmentedBar value={data.handOpenPct / 100} color={C.accent} />}
            />
            <BigCard
              code="M2"
              name="DEDOS"
              status="idle"
              critical={false}
              value={`${data.fingers}`}
              unit="/ 5"
              instrument={<FingersBars count={data.fingers} />}
            />
            <BigCard
              code="M2"
              name="VEL. PALMA"
              status={data.smoothness > 0.6 ? "ok" : "warn"}
              critical={false}
              value={Math.round(data.palmSpeed)}
              unit="mm/s"
              instrument={<SpeedTrail speed={data.palmSpeed} smooth={data.smoothness} />}
            />
            <BigCard
              code="M3"
              name="ROM MUÑECA"
              status={data.romDeg > 120 ? "ok" : data.romDeg > 70 ? "warn" : "bad"}
              critical={data.romDeg < 50}
              value={Math.round(data.romDeg)}
              unit="°"
              instrument={<Protractor deg={data.romDeg} />}
            />
            <BigCard
              code="M2"
              name="TEMBLOR"
              status={data.tremorAmp < 0.3 ? "ok" : data.tremorAmp < 0.6 ? "warn" : "bad"}
              critical={data.tremorAmp > 0.7}
              value={(data.tremorAmp * 100).toFixed(0)}
              unit="%"
              instrument={<Seismograph amp={data.tremorAmp} />}
            />
          </div>

          <SectionLabel index="02" title="FACIAL · SIMETRÍA" tight />
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <BigCard
              code="F1·F2"
              name="SIMETRÍA"
              status={data.faceSymmetry > 0.85 ? "ok" : data.faceSymmetry > 0.7 ? "warn" : "bad"}
              critical={data.faceSymmetry < 0.65}
              value={data.faceSymmetry.toFixed(2)}
              unit="/ 1"
              instrument={<Sparkline data={hist("faceSymmetry")} color={C.accent} max={1} />}
            />
            <BigCard
              code="F3"
              name="SONRISA"
              status={data.smiling ? "ok" : "idle"}
              critical={false}
              value={data.smiling ? "SÍ" : "NO"}
              unit=""
              instrument={
                <SegmentedBar value={data.smiling ? 1 : 0} color={data.smiling ? C.ok : C.off} />
              }
            />
          </div>
        </div>
      </div>

      {/* Footer firma */}
      <div
        className="mt-4 pt-3 flex items-center justify-between"
        style={{
          borderTop: `1px dashed ${C.borderSoft}`,
          fontSize: 9,
          color: C.inkSoft,
          letterSpacing: "0.14em",
        }}
      >
        <span>ANCLAS · F=FACIAL · M=MANO/MOTOR</span>
        <span>TIEMPO REAL · 30Hz</span>
      </div>
    </div>
  );
}

/* =====================================================================
 * CAMERA PANEL
 * ===================================================================== */

function CameraPanel({
  label,
  anchors,
  children,
}: {
  label: string;
  anchors?: AnchorMap;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative"
      style={{
        background: C.panelDark,
        boxShadow: `0 0 0 1px ${C.outline}, 0 0 0 2px ${C.border}, inset 3px 0 0 0 ${C.accent}`,
        padding: 8,
      }}
    >
      {/* header tipo carta */}
      <div
        className="flex items-center justify-between"
        style={{
          fontSize: 10,
          color: C.ink,
          letterSpacing: "0.18em",
          fontWeight: 700,
          padding: "2px 4px 8px",
        }}
      >
        <span>{label}</span>
        <span
          className="inline-flex items-center gap-1"
          style={{
            fontSize: 8,
            color: C.bad,
            padding: "2px 5px",
            background: C.panel,
            boxShadow: `inset 0 0 0 1px ${C.bad}`,
            fontWeight: 800,
            letterSpacing: "0.16em",
          }}
        >
          <BlinkDot color={C.bad} />
          REC
        </span>
      </div>

      {/* área de vídeo — 16:9 para coincidir con el canvas 960×540 */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "16 / 9",
          background: "#1a1410",
          boxShadow: `inset 0 0 0 1px ${C.outline}`,
        }}
      >
        {/* slot del consumidor */}
        <div className="absolute inset-0 flex">
          <CameraSlotWrap>{children}</CameraSlotWrap>
        </div>

        {/* retícula central */}
        <CrosshairOverlay />

        {/* anclas etiquetadas */}
        {anchors &&
          (Object.keys(anchors) as (keyof AnchorMap)[]).map((k) => {
            const p = anchors[k];
            if (!p) return null;
            return <AnchorMark key={k} code={k} x={p.x} y={p.y} />;
          })}

        {/* barra de telemetría inferior */}
        <div
          className="absolute left-0 right-0 bottom-0 flex items-center justify-between"
          style={{
            background: "rgba(0,0,0,0.55)",
            color: "#E8DBBE",
            fontSize: 9,
            letterSpacing: "0.18em",
            padding: "3px 6px",
          }}
        >
          <span>● TRACKING OK</span>
          <span>30 FPS · 960×540</span>
        </div>

        {/* HUD facial — overlay HTML (no afectado por el espejo del canvas) */}
        <div
          id="face-hud-overlay"
          className="absolute pointer-events-none"
          style={{
            right: 8,
            bottom: 24,
            background: "rgba(0,0,0,0.6)",
            padding: "8px 10px",
            fontSize: 11,
            fontFamily: '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace',
            letterSpacing: "0.04em",
            lineHeight: 1.6,
            color: "#AAAAAA",
            zIndex: 2,
            whiteSpace: "nowrap",
          }}
        />

        <CornerTick pos="tl" />
        <CornerTick pos="tr" />
        <CornerTick pos="bl" />
        <CornerTick pos="br" />
      </div>
    </div>
  );
}

function CameraSlotWrap({ children }: { children?: ReactNode }) {
  if (!children) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          background: "repeating-linear-gradient(45deg, #1f1812 0 8px, #251d15 8px 16px)",
          color: "#6b5840",
          fontSize: 10,
          letterSpacing: "0.2em",
        }}
      >
        SIN SEÑAL DE CÁMARA
      </div>
    );
  }
  return (
    <div className="w-full h-full">
      <style>{`
        .ana-cam-slot > video,
        .ana-cam-slot > img,
        .ana-cam-slot > canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block;
        }
      `}</style>
      <div className="ana-cam-slot w-full h-full">{children}</div>
    </div>
  );
}

function CrosshairOverlay() {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
    >
      <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(232,219,190,0.18)" strokeWidth="0.2" strokeDasharray="1 2" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(232,219,190,0.18)" strokeWidth="0.2" strokeDasharray="1 2" />
      <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="rgba(232,219,190,0.08)" strokeWidth="0.15" />
      <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="rgba(232,219,190,0.08)" strokeWidth="0.15" />
      <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="rgba(232,219,190,0.08)" strokeWidth="0.15" />
      <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="rgba(232,219,190,0.08)" strokeWidth="0.15" />
    </svg>
  );
}

function AnchorMark({ code, x, y }: { code: string; x: number; y: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
        ...MONO,
      }}
    >
      <div className="relative" style={{ width: 18, height: 18 }}>
        <div
          style={{
            position: "absolute", left: 8, top: 0, width: 2, height: 18,
            background: "#E8DBBE", boxShadow: `0 0 0 1px ${C.outline}`,
          }}
        />
        <div
          style={{
            position: "absolute", top: 8, left: 0, height: 2, width: 18,
            background: "#E8DBBE", boxShadow: `0 0 0 1px ${C.outline}`,
          }}
        />
        <div
          style={{
            position: "absolute", left: 6, top: 6, width: 6, height: 6,
            background: "transparent",
            boxShadow: `0 0 0 1px #E8DBBE, 0 0 0 2px ${C.outline}`,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute", left: 22, top: 0,
          background: C.panel, color: C.ink, fontSize: 9, fontWeight: 800,
          letterSpacing: "0.16em", padding: "1px 5px",
          boxShadow: `0 0 0 1px ${C.outline}`, whiteSpace: "nowrap",
        }}
      >
        {code}
      </div>
    </div>
  );
}

function CornerTick({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const m = 4;
  const base: CSSProperties = { position: "absolute", width: 10, height: 10, borderColor: "#E8DBBE", borderStyle: "solid", borderWidth: 0 };
  const s: CSSProperties = { ...base };
  if (pos === "tl")      { s.top = m;      s.left = m;  s.borderTopWidth = 2;    s.borderLeftWidth = 2;  }
  else if (pos === "tr") { s.top = m;      s.right = m; s.borderTopWidth = 2;    s.borderRightWidth = 2; }
  else if (pos === "bl") { s.bottom = m + 16; s.left = m;  s.borderBottomWidth = 2; s.borderLeftWidth = 2;  }
  else                   { s.bottom = m + 16; s.right = m; s.borderBottomWidth = 2; s.borderRightWidth = 2; }
  return <div style={s} />;
}

/* =====================================================================
 * HERO — CRI dominante
 * ===================================================================== */

function CriHero({ value, history }: { value: number; history: number[] }) {
  const v = Math.max(0, Math.min(100, value));
  const c = v < 35 ? C.bad : v < 70 ? C.warn : C.ok;
  const label = v < 35 ? "CRÍTICO" : v < 70 ? "MODERADO" : "ÓPTIMO";

  return (
    <div
      className="relative"
      style={{
        padding: "12px 14px",
        background: C.panelDark,
        boxShadow: `0 0 0 1px ${C.outline}, 0 0 0 2px ${C.border}, inset 4px 0 0 0 ${c}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div style={{ fontSize: 9, color: C.inkDim, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 4 }}>
            ÍNDICE DE RECUPERACIÓN CLÍNICA
          </div>
          <div className="flex items-baseline gap-2">
            <span style={{ fontSize: 44, lineHeight: 0.9, color: c, fontWeight: 800, textShadow: `2px 2px 0 ${C.outline}` }}>
              {Math.round(v)}
            </span>
            <span style={{ fontSize: 12, color: C.inkDim, fontWeight: 700 }}>/ 100</span>
            <span
              className="ml-2 inline-flex items-center gap-1"
              style={{
                fontSize: 9, padding: "2px 6px", background: C.panel,
                boxShadow: `inset 0 0 0 1px ${c}`, color: c, fontWeight: 800, letterSpacing: "0.18em",
              }}
            >
              <BlinkDot color={c} />
              {label}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 200 }}>
          <div className="flex items-center justify-between" style={{ fontSize: 9, color: C.inkDim, marginBottom: 3 }}>
            <span>30s</span><span>0—100</span>
          </div>
          <div style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.borderSoft}`, padding: 3, height: 42 }}>
            <Sparkline data={history} color={c} max={100} tall />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
 * BIG CARD
 * ===================================================================== */

function BigCard({
  code,
  name,
  status,
  critical,
  value,
  unit,
  instrument,
}: {
  code?: string;
  name: string;
  status: "ok" | "warn" | "bad" | "idle";
  critical: boolean;
  value: string | number;
  unit?: string;
  instrument?: ReactNode;
}) {
  const accent = status === "ok" ? C.ok : status === "warn" ? C.warn : status === "bad" ? C.bad : C.accent;
  const statusLabel = status === "ok" ? "ÓPT" : status === "warn" ? "MOD" : status === "bad" ? "CRÍ" : "ACT";

  return (
    <div
      className="relative"
      style={{
        background: C.panel,
        boxShadow: `0 0 0 1px ${C.outline}, 0 0 0 2px ${C.border}, inset 3px 0 0 0 ${accent}`,
        padding: "8px 10px 10px 12px",
        minHeight: 110,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {code && (
            <span style={{ fontSize: 8, color: C.panel, background: C.ink, padding: "1px 4px", fontWeight: 800, letterSpacing: "0.14em" }}>
              {code}
            </span>
          )}
          <span style={{ fontSize: 10, color: C.ink, letterSpacing: "0.12em", fontWeight: 700 }}>{name}</span>
        </div>
        <span
          className="inline-flex items-center gap-1"
          style={{
            fontSize: 8, color: accent, padding: "1px 4px",
            background: C.panelDark, boxShadow: `inset 0 0 0 1px ${accent}`,
            fontWeight: 800, letterSpacing: "0.14em",
          }}
        >
          <BlinkDot color={accent} />
          {statusLabel}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span style={{ fontSize: 28, lineHeight: 0.95, color: C.ink, fontWeight: 800, textShadow: `2px 2px 0 ${C.outline}` }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 10, color: C.inkDim, fontWeight: 700, letterSpacing: "0.06em" }}>{unit}</span>
        )}
      </div>

      {instrument && <div style={{ marginTop: "auto" }}>{instrument}</div>}
      {critical && <RubberStamp text="REVISIÓN" />}
    </div>
  );
}

/* =====================================================================
 * INSTRUMENTOS
 * ===================================================================== */

function SegmentedBar({ value, color }: { value: number; color: string }) {
  const total = 12;
  const filled = Math.round(Math.max(0, Math.min(1, value)) * total);
  return (
    <div className="flex gap-[2px] p-[2px]" style={{ background: C.panelDark, boxShadow: `inset 0 0 0 1px ${C.borderSoft}` }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 7, background: i < filled ? color : C.off }} />
      ))}
    </div>
  );
}

function FingersBars({ count }: { count: number }) {
  const heights = [12, 16, 15, 13, 10];
  return (
    <div className="flex items-end gap-1" style={{ height: 18 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ width: 8, height: heights[i], background: i < count ? C.ok : C.off, boxShadow: `inset 0 0 0 1px ${C.outline}` }} />
      ))}
    </div>
  );
}

function SpeedTrail({ speed, smooth }: { speed: number; smooth: number }) {
  const segments = Math.min(12, Math.max(2, Math.round(speed / 14)));
  const col = smooth > 0.6 ? C.ok : C.warn;
  return (
    <div className="flex items-center" style={{ height: 12, padding: 2, background: C.panelDark, boxShadow: `inset 0 0 0 1px ${C.borderSoft}` }}>
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} style={{ width: 5, height: 7, marginRight: 2, background: col, opacity: 0.25 + (i / segments) * 0.75 }} />
      ))}
    </div>
  );
}

function Protractor({ deg }: { deg: number }) {
  const angle = Math.max(0, Math.min(180, deg));
  const rad = (angle / 180) * Math.PI;
  const cx = 60, cy = 32, r = 26;
  const nx = cx - Math.cos(rad) * r;
  const ny = cy - Math.sin(rad) * r;
  return (
    <svg width="100%" height="36" viewBox="0 0 120 36" shapeRendering="crispEdges"
      style={{ background: C.panelDark, boxShadow: `inset 0 0 0 1px ${C.borderSoft}` }}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={C.off} strokeWidth="2.5" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={C.accent} strokeWidth="2.5"
        strokeDasharray={`${(angle / 180) * (Math.PI * r)} 999`} />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.bad} strokeWidth="1.6" />
      <rect x={cx - 2} y={cy - 2} width="4" height="4" fill={C.outline} />
    </svg>
  );
}

function Seismograph({ amp }: { amp: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 140);
    return () => clearInterval(id);
  }, []);
  const bars = useMemo(() => Array.from({ length: 22 }, () => Math.random()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick]);
  const color = amp < 0.3 ? C.ok : amp < 0.6 ? C.warn : C.bad;
  return (
    <div className="flex items-end gap-[1px]"
      style={{ height: 18, padding: "2px 3px", background: C.panelDark, boxShadow: `inset 0 0 0 1px ${C.borderSoft}` }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, height: 2 + b * 12 * (0.3 + amp), background: color }} />
      ))}
    </div>
  );
}

function Sparkline({ data, color, max, tall = false }: { data: number[]; color: string; max: number; tall?: boolean }) {
  const h = tall ? 36 : 16;
  if (!data.length) return <div style={{ height: h }} />;
  const w = 100;
  const step = w / Math.max(1, data.length - 1);
  const pts = data.map((v, i) =>
    `${(i * step).toFixed(1)},${(h - (Math.max(0, Math.min(max, v)) / max) * h).toFixed(1)}`
  ).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" shapeRendering="crispEdges"
      style={{ display: "block", background: tall ? "transparent" : C.panelDark, boxShadow: tall ? undefined : `inset 0 0 0 1px ${C.borderSoft}` }}>
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={C.borderSoft} strokeWidth="0.3" strokeDasharray="1 2" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={tall ? "1.2" : "1"} />
    </svg>
  );
}

/* =====================================================================
 * AMBIENT
 * ===================================================================== */

function RulerEdge({ side }: { side: "top" | "bottom" | "left" | "right" }) {
  const horizontal = side === "top" || side === "bottom";
  const ticks = 50;
  const style: CSSProperties = {
    position: "absolute",
    [side]: 6,
    ...(horizontal ? { left: 14, right: 14, height: 8 } : { top: 14, bottom: 14, width: 8 }),
    display: "flex",
    flexDirection: horizontal ? "row" : "column",
    justifyContent: "space-between",
    alignItems: side === "bottom" ? "flex-start" : side === "top" ? "flex-end" : side === "left" ? "flex-end" : "flex-start",
    pointerEvents: "none",
    opacity: 0.4,
  };
  return (
    <div style={style}>
      {Array.from({ length: ticks }).map((_, i) => {
        const major = i % 5 === 0;
        return (
          <div key={i} style={{ background: C.border, ...(horizontal ? { width: 1, height: major ? 6 : 3 } : { height: 1, width: major ? 6 : 3 }) }} />
        );
      })}
    </div>
  );
}

function RubberStamp({ text }: { text: string }) {
  return (
    <div className="absolute" style={{
      ...MONO, right: 6, top: 6, transform: "rotate(-10deg)",
      padding: "2px 6px", border: `2px solid ${C.bad}`, color: C.bad,
      fontSize: 8, fontWeight: 800, letterSpacing: "0.22em",
      background: "rgba(251,244,226,0.5)", opacity: 0.85, pointerEvents: "none",
    }}>
      {text}
    </div>
  );
}

function SectionLabel({ index, title, tight }: { index: string; title: string; tight?: boolean }) {
  return (
    <div className="flex items-center gap-2" style={{ margin: tight ? "4px 0 8px" : "16px 0 8px" }}>
      <span style={{ fontSize: 8, color: C.panel, background: C.ink, padding: "2px 5px", fontWeight: 800, letterSpacing: "0.14em" }}>
        {index}
      </span>
      <span style={{ fontSize: 10, color: C.ink, letterSpacing: "0.18em", fontWeight: 800 }}>{title}</span>
      <div className="flex-1 h-[2px]"
        style={{ background: `repeating-linear-gradient(90deg, ${C.border} 0 4px, transparent 4px 8px)` }} />
    </div>
  );
}

function BlinkDot({ color }: { color: string }) {
  return (
    <span style={{
      display: "inline-block", width: 6, height: 6, background: color,
      boxShadow: `0 0 4px ${color}, 0 0 0 1px ${C.outline}`,
      animation: "anaBlink 1.4s steps(2) infinite",
    }} />
  );
}

/* =====================================================================
 * Histórico interno por métrica
 * ===================================================================== */

function useMetricHistory(data: ClinicalData, n: number) {
  const ref = useRef<Partial<Record<keyof ClinicalData, number[]>>>({});
  const [, setTick] = useState(0);

  useEffect(() => {
    const next: Partial<Record<keyof ClinicalData, number[]>> = { ...ref.current };
    (Object.keys(data) as (keyof ClinicalData)[]).forEach((k) => {
      const v = data[k];
      const num = typeof v === "number" ? v : v ? 1 : 0;
      const arr = (next[k] ?? []).concat(num);
      if (arr.length > n) arr.splice(0, arr.length - n);
      next[k] = arr;
    });
    ref.current = next;
    setTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.cri, data.pinchActive, data.pinchMm, data.handOpenPct, data.fingers, data.palmSpeed, data.smoothness, data.romDeg, data.tremorAmp, data.faceSymmetry, data.smiling]);

  return ref.current;
}

/* keyframes — inyectados una sola vez */
if (typeof document !== "undefined" && !document.getElementById("ana-styles")) {
  const s = document.createElement("style");
  s.id = "ana-styles";
  s.textContent = `@keyframes anaBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`;
  document.head.appendChild(s);
}
