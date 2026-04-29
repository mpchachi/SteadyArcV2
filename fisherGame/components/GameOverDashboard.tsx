"use client";

import { SessionMetrics } from "@/lib/sessionMetrics";

interface Props {
  score: number;
  metrics: SessionMetrics;
  onReplay: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function criColor(v: number) {
  if (v >= 75) return "#4ade80";
  if (v >= 50) return "#fb923c";
  return "#f87171";
}

function criLabel(v: number) {
  if (v >= 75) return "ÓPTIMO";
  if (v >= 50) return "MODERADO";
  return "CRÍTICO";
}

function scoreColor(v: number) {
  if (v < 0) return "#64748b";
  if (v >= 70) return "#4ade80";
  if (v >= 45) return "#fb923c";
  return "#f87171";
}

function ScoreRing({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const fill = value < 0 ? 0 : (value / 100) * circ;
  const color = scoreColor(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
      <div style={{ position: "relative", width: 76, height: 76 }}>
        <svg width={76} height={76} viewBox="0 0 76 76">
          <circle cx={38} cy={38} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
          <circle
            cx={38} cy={38} r={r}
            fill="none"
            stroke={color}
            strokeWidth={7}
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 38 38)"
            style={{ transition: "stroke-dasharray 0.8s ease", filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: '"Press Start 2P", monospace',
          fontSize: value < 0 ? "0.45rem" : "0.75rem",
          color,
        }}>
          {value < 0 ? "N/A" : `${value}`}
        </div>
      </div>
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.45rem", color: "#e2e8f0", textAlign: "center", lineHeight: 1.5 }}>
        {label}
      </div>
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.38rem", color: "#64748b", textAlign: "center", lineHeight: 1.4 }}>
        {sublabel}
      </div>
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        width: `${Math.max(0, Math.min(100, value))}%`,
        height: "100%",
        background: color,
        borderRadius: 3,
        transition: "width 1s ease",
        boxShadow: `0 0 6px ${color}`,
      }} />
    </div>
  );
}

function MetricRow({ label, value, unit, color, bar = false }: {
  label: string; value: string | number; unit?: string; color: string; bar?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.38rem", color: "#94a3b8" }}>
          {label}
        </span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.5rem", color }}>
          {value}{unit && <span style={{ fontSize: "0.38rem", color: "#64748b" }}> {unit}</span>}
        </span>
      </div>
      {bar && typeof value === "number" && value >= 0 && (
        <Bar value={value} color={color} />
      )}
    </div>
  );
}

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: "1rem 1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.5rem", color: "#7dd3fc", letterSpacing: "0.1em" }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.38rem", color: "#64748b" }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GameOverDashboard({ score, metrics, onReplay }: Props) {
  const {
    motorPinchScore, motorOpenScore, facialSmileScore, vocalScore, cri,
    vocalStability, vocalDurationMs, vocalPauseCount, vocalMeanAmplitude,
    challenges,
  } = metrics;

  const fishCaught      = Math.floor(score / 100);
  const totalChallenges = challenges.length;
  const avgCompletionMs = totalChallenges > 0
    ? Math.round(challenges.reduce((a, c) => a + c.completionMs, 0) / totalChallenges)
    : 0;

  const pinchChallenges = challenges.filter(c => c.type === 'REPEATED_PINCH');
  const openChallenges  = challenges.filter(c => c.type === 'HOLD_HAND_OPEN');
  const smileChallenges = challenges.filter(c => c.type === 'SMILE_CHALLENGE');
  const vocalChallenges = challenges.filter(c => c.type === 'VOCAL');

  const avgTime = (cs: typeof challenges) =>
    cs.length > 0 ? (cs.reduce((a, c) => a + c.completionMs, 0) / cs.length / 1000).toFixed(1) : "—";

  return (
    <div
      style={{
        position: "fixed", inset: 0, overflowY: "auto",
        background: "linear-gradient(160deg, #0f0a1e 0%, #0a1628 50%, #071420 100%)",
        fontFamily: '"Press Start 2P", monospace',
        zIndex: 200,
      }}
    >
      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div style={{
        position: "relative", maxWidth: 900, margin: "0 auto",
        padding: "2rem 1.5rem 4rem",
        display: "flex", flexDirection: "column", gap: "1.5rem",
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "clamp(0.55rem, 1.5vw, 0.8rem)", color: "#64748b", letterSpacing: "0.25em", marginBottom: "0.5rem" }}>
            STEADYARC · INFORME DE SESIÓN
          </div>
          <h1 style={{
            fontSize: "clamp(1rem, 3vw, 1.6rem)", color: "#facc15",
            textShadow: "3px 3px 0 #7a5a00, 0 0 30px rgba(250,204,21,0.4)",
            margin: 0,
          }}>
            ¡SESIÓN COMPLETADA!
          </h1>
        </div>

        {/* ── CRI Hero ── */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: `2px solid ${criColor(cri)}`,
          borderRadius: 14,
          padding: "1.5rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          boxShadow: `0 0 30px ${criColor(cri)}22`,
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: "0.42rem", color: "#94a3b8", letterSpacing: "0.15em", marginBottom: "0.4rem" }}>
              ÍNDICE DE RECUPERACIÓN CLÍNICA (CRI)
            </div>
            <div style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", color: criColor(cri), textShadow: `2px 2px 0 #000, 0 0 20px ${criColor(cri)}` }}>
              {cri}
            </div>
            <div style={{ fontSize: "0.5rem", color: criColor(cri), letterSpacing: "0.15em", marginTop: "0.25rem" }}>
              {criLabel(cri)}
            </div>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.38rem", color: "#64748b", marginBottom: "0.3rem" }}>PECES</div>
              <div style={{ fontSize: "1.8rem", color: "#4ade80", textShadow: "2px 2px 0 #166534" }}>{fishCaught}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.38rem", color: "#64748b", marginBottom: "0.3rem" }}>PUNTOS</div>
              <div style={{ fontSize: "1.8rem", color: "#facc15", textShadow: "2px 2px 0 #7a5a00" }}>{score}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.38rem", color: "#64748b", marginBottom: "0.3rem" }}>RETOS</div>
              <div style={{ fontSize: "1.8rem", color: "#7dd3fc", textShadow: "2px 2px 0 #1e3a5f" }}>{totalChallenges}</div>
            </div>
          </div>
        </div>

        {/* ── Dominio scores ── */}
        <Section title="01 · DOMINIOS CLÍNICOS" badge="Scores 0–100">
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "space-around", flexWrap: "wrap" }}>
            <ScoreRing value={motorPinchScore}  label={"MOTOR\nFINO"} sublabel={"M1 · Pinch\nprecision"} />
            <ScoreRing value={motorOpenScore}   label={"APERTURA\nMANO"} sublabel={"M2 · Hand\nopening"} />
            <ScoreRing value={facialSmileScore} label={"ACTIVACIÓN\nFACIAL"} sublabel={"M6 · Smile\nsymmetry"} />
            <ScoreRing value={vocalScore}       label={"FONACIÓN\nSOSTENIDA"} sublabel={"Dysarthria\nproxy"} />
          </div>
        </Section>

        {/* ── Dos columnas: Motor + Vocal ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

          {/* Motor fino */}
          <Section title="02 · MOTOR FINO" badge="M1–M2">
            <MetricRow
              label="PINCH — tiempo medio"
              value={avgTime(pinchChallenges)}
              unit="s"
              color={scoreColor(motorPinchScore)}
            />
            <MetricRow
              label="PINCH — score M1"
              value={motorPinchScore < 0 ? "N/A" : motorPinchScore}
              color={scoreColor(motorPinchScore)}
              bar
            />
            <MetricRow
              label="APERTURA — tiempo medio"
              value={avgTime(openChallenges)}
              unit="s"
              color={scoreColor(motorOpenScore)}
            />
            <MetricRow
              label="APERTURA — score M2"
              value={motorOpenScore < 0 ? "N/A" : motorOpenScore}
              color={scoreColor(motorOpenScore)}
              bar
            />
          </Section>

          {/* Facial */}
          <Section title="03 · FACIAL" badge="M5–M6">
            <MetricRow
              label="SONRISA — tiempo medio"
              value={avgTime(smileChallenges)}
              unit="s"
              color={scoreColor(facialSmileScore)}
            />
            <MetricRow
              label="SONRISA — score M6"
              value={facialSmileScore < 0 ? "N/A" : facialSmileScore}
              color={scoreColor(facialSmileScore)}
              bar
            />
            <MetricRow
              label="RETOS FACIALES"
              value={smileChallenges.length}
              color="#7dd3fc"
            />
            <MetricRow
              label="INCIDENCIAS"
              value={smileChallenges.filter(c => !c.succeeded).length}
              color={smileChallenges.some(c => !c.succeeded) ? "#f87171" : "#4ade80"}
            />
          </Section>
        </div>

        {/* ── Vocal ── */}
        <Section title="04 · VOCAL · FONACIÓN SOSTENIDA" badge="Dysarthria proxy">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
            <MetricRow
              label="ESTABILIDAD\nAMPLITUD"
              value={vocalChallenges.length > 0 ? `${Math.round(vocalStability * 100)}%` : "N/A"}
              color={scoreColor(Math.round(vocalStability * 100))}
              bar={false}
            />
            <MetricRow
              label="DURACIÓN\nVOZ"
              value={vocalChallenges.length > 0 ? `${(vocalDurationMs / 1000).toFixed(1)}` : "N/A"}
              unit={vocalChallenges.length > 0 ? "s" : ""}
              color="#7dd3fc"
            />
            <MetricRow
              label="PAUSAS\nDETECTADAS"
              value={vocalChallenges.length > 0 ? vocalPauseCount : "N/A"}
              color={vocalPauseCount > 2 ? "#f87171" : "#4ade80"}
            />
            <MetricRow
              label="AMPLITUD\nMEDIA"
              value={vocalChallenges.length > 0 ? vocalMeanAmplitude.toFixed(3) : "N/A"}
              color="#a78bfa"
            />
          </div>
          {vocalChallenges.length > 0 && (
            <div style={{ marginTop: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.38rem", color: "#94a3b8" }}>ESTABILIDAD VOCAL</span>
                <span style={{ fontSize: "0.45rem", color: scoreColor(Math.round(vocalStability * 100)) }}>
                  {Math.round(vocalStability * 100)}%
                </span>
              </div>
              <Bar value={vocalStability * 100} color={scoreColor(Math.round(vocalStability * 100))} />
            </div>
          )}
          {vocalChallenges.length === 0 && (
            <div style={{ fontSize: "0.4rem", color: "#64748b", textAlign: "center", padding: "0.5rem 0" }}>
              Sin retos vocales en esta sesión
            </div>
          )}
        </Section>

        {/* ── Resumen de retos ── */}
        <Section title="05 · RESUMEN DE RETOS" badge={`${totalChallenges} completados`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.38rem", color: "#64748b" }}>TIPO</span>
              <span style={{ fontSize: "0.38rem", color: "#64748b", textAlign: "center" }}>VECES</span>
              <span style={{ fontSize: "0.38rem", color: "#64748b", textAlign: "center" }}>T. MEDIO</span>
              <span style={{ fontSize: "0.38rem", color: "#64748b", textAlign: "center" }}>SCORE</span>
            </div>
            {[
              { type: "REPEATED_PINCH",  label: "Pinch ×4",         cs: pinchChallenges, score: motorPinchScore  },
              { type: "HOLD_HAND_OPEN",  label: "Mano abierta",     cs: openChallenges,  score: motorOpenScore   },
              { type: "SMILE_CHALLENGE", label: "Sonrisa",          cs: smileChallenges, score: facialSmileScore },
              { type: "VOCAL",           label: "Fonación /a/",     cs: vocalChallenges, score: vocalScore       },
            ].map(({ label, cs, score: s }) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.42rem", color: "#e2e8f0" }}>{label}</span>
                <span style={{ fontSize: "0.42rem", color: "#7dd3fc", textAlign: "center" }}>{cs.length}</span>
                <span style={{ fontSize: "0.42rem", color: "#94a3b8", textAlign: "center" }}>
                  {cs.length > 0 ? `${avgTime(cs)}s` : "—"}
                </span>
                <span style={{
                  fontSize: "0.42rem", textAlign: "center",
                  color: scoreColor(s),
                }}>
                  {s < 0 ? "—" : s}
                </span>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0.25rem 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.38rem", color: "#64748b" }}>TIEMPO MEDIO POR RETO</span>
            <span style={{ fontSize: "0.5rem", color: "#7dd3fc" }}>{(avgCompletionMs / 1000).toFixed(1)}s</span>
          </div>
        </Section>

        {/* ── Nota metodológica ── */}
        <div style={{
          background: "rgba(125,211,252,0.05)", border: "1px solid rgba(125,211,252,0.15)",
          borderRadius: 8, padding: "0.75rem 1rem",
        }}>
          <div style={{ fontSize: "0.38rem", color: "#7dd3fc", marginBottom: "0.35rem", letterSpacing: "0.1em" }}>
            NOTA METODOLÓGICA
          </div>
          <div style={{ fontSize: "0.35rem", color: "#64748b", lineHeight: 1.8 }}>
            Los scores M1–M2 (motor fino) aproximan FMA-UE distal via tiempo de completación de tarea kinésica.
            M6 (facial) aproxima House-Brackmann adaptado via latencia de activación sonrisa.
            Score vocal aproxima severidad disartria (jitter/HNR proxy) via estabilidad de amplitud sostenida.
            CRI = media ponderada de dominios disponibles. Validación clínica pendiente.
          </div>
        </div>

        {/* ── Replay button ── */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "0.5rem" }}>
          <button
            onClick={onReplay}
            style={{
              background: "transparent",
              border: "2px solid #4ade80",
              color: "#4ade80",
              padding: "1rem 3rem",
              borderRadius: "8px",
              fontSize: "clamp(0.45rem, 1.2vw, 0.7rem)",
              cursor: "pointer",
              fontFamily: '"Press Start 2P", monospace',
              letterSpacing: "0.1em",
              boxShadow: "0 0 16px rgba(74,222,128,0.2)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(74,222,128,0.15)";
              e.currentTarget.style.boxShadow = "0 0 28px rgba(74,222,128,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.boxShadow = "0 0 16px rgba(74,222,128,0.2)";
            }}
          >
            ▶ NUEVA SESIÓN
          </button>
        </div>
      </div>
    </div>
  );
}
