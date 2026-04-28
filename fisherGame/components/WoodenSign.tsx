import { CSSProperties } from "react";

export type GestureIcon = "openHand" | "pinch" | "smile";

type Props = {
  icon: GestureIcon;
  title: string;
  progress: number;
  progressLabel?: string;
  description?: string;
  accent?: string;
  static?: boolean;
  className?: string;
  style?: CSSProperties;
};

const WOOD = {
  light: "#A8753D",
  base: "#7A4A22",
  dark: "#4A2C13",
  darker: "#2A180A",
  grain: "#5C3A1E",
  knot: "#1F1108",
  rope: "#D9B073",
  ropeShadow: "#9A7240",
  ropeDark: "#6B4820",
  nail: "#2A2A2A",
  nailShine: "#A8A8A8",
  nailRust: "#8B4513",
  outline: "#1A0F08",
  parchment: "#E8D9A8",
  parchmentDark: "#B89A60",
  parchmentInk: "#3A2412",
};

const PIXEL_FONT: CSSProperties = {
  fontFamily: '"Press Start 2P", system-ui, monospace',
  letterSpacing: "0.06em",
};

export default function WoodenSign({
  icon,
  title,
  progress,
  progressLabel,
  description,
  accent = "#4ade80",
  static: isStatic = false,
  className = "",
  style,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: 280,
        imageRendering: "pixelated",
        transformOrigin: "50% 0%",
        animation: isStatic ? undefined : "wsSwing 4.5s ease-in-out infinite",
        ...style,
      }}
      aria-label={`Reto: ${title}`}
    >
      <Ropes />
      <div
        className="relative"
        style={{
          marginTop: 56,
          padding: "20px 18px 18px",
          background: `repeating-linear-gradient(90deg, ${WOOD.base} 0px, ${WOOD.base} 38px, ${WOOD.dark} 38px, ${WOOD.dark} 40px)`,
          boxShadow: `inset 0 0 0 3px ${WOOD.dark}, inset 0 0 0 6px ${WOOD.outline}, inset 0 12px 18px rgba(0,0,0,0.25), inset 0 -8px 12px rgba(0,0,0,0.3), 6px 6px 0 0 rgba(0,0,0,0.5)`,
        }}
      >
        <WoodGrain />
        <Nail style={{ top: 6, left: 6 }} />
        <Nail style={{ top: 6, right: 6 }} />
        <Nail style={{ bottom: 6, left: 6 }} />
        <Nail style={{ bottom: 6, right: 6 }} />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 60,
              height: 60,
              background: accent,
              boxShadow: `0 0 0 3px ${WOOD.outline}, inset 0 0 0 2px rgba(0,0,0,0.3), inset 3px 3px 0 rgba(255,255,255,0.25), inset -3px -3px 0 rgba(0,0,0,0.25)`,
            }}
          >
            <span style={rivetStyle({ top: 3, left: 3 })} />
            <span style={rivetStyle({ top: 3, right: 3 })} />
            <span style={rivetStyle({ bottom: 3, left: 3 })} />
            <span style={rivetStyle({ bottom: 3, right: 3 })} />
            <GestureGlyph icon={icon} />
          </div>
          <div
            className="text-center"
            style={{
              ...PIXEL_FONT,
              fontSize: 11,
              lineHeight: 1.5,
              color: "#FFF1C9",
              textShadow: `2px 2px 0 ${WOOD.outline}, 0 0 6px rgba(0,0,0,0.4)`,
              maxWidth: 240,
            }}
          >
            {title}
          </div>
          <ProgressBar value={clamped} accent={accent} />
          {progressLabel && (
            <div style={{ ...PIXEL_FONT, fontSize: 9, color: "#FFF1C9", textShadow: `1px 1px 0 ${WOOD.outline}` }}>
              {progressLabel}
            </div>
          )}
          {description && <ParchmentNote text={description} />}
        </div>
      </div>
      <style>{`
        @keyframes wsSwing {
          0%, 100% { transform: rotate(-2.2deg); }
          50%       { transform: rotate(2.2deg); }
        }
      `}</style>
    </div>
  );
}

function Ropes() {
  const ropeStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    width: 4,
    height: 64,
    background: `repeating-linear-gradient(0deg, ${WOOD.rope} 0px, ${WOOD.rope} 3px, ${WOOD.ropeDark} 3px, ${WOOD.ropeDark} 6px)`,
    boxShadow: `0 0 0 1px ${WOOD.outline}`,
  };
  return (
    <>
      <div style={{ ...ropeStyle, left: 28, transform: "rotate(-8deg)", transformOrigin: "top center" }} />
      <div style={{ ...ropeStyle, right: 28, transform: "rotate(8deg)", transformOrigin: "top center" }} />
      <div style={{ position: "absolute", top: 50, left: 22, width: 14, height: 10, background: WOOD.rope, boxShadow: `inset -2px -2px 0 ${WOOD.ropeDark}, 0 0 0 1px ${WOOD.outline}` }} />
      <div style={{ position: "absolute", top: 50, right: 22, width: 14, height: 10, background: WOOD.rope, boxShadow: `inset -2px -2px 0 ${WOOD.ropeDark}, 0 0 0 1px ${WOOD.outline}` }} />
    </>
  );
}

function WoodGrain() {
  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" shapeRendering="crispEdges" preserveAspectRatio="none" viewBox="0 0 100 100">
      <line x1="0" y1="22" x2="100" y2="22" stroke={WOOD.grain} strokeWidth="1" opacity="0.6" />
      <line x1="0" y1="48" x2="100" y2="48" stroke={WOOD.dark} strokeWidth="1" opacity="0.6" />
      <line x1="0" y1="72" x2="100" y2="72" stroke={WOOD.grain} strokeWidth="1" opacity="0.5" />
      <line x1="0" y1="88" x2="100" y2="88" stroke={WOOD.dark} strokeWidth="1" opacity="0.5" />
      <ellipse cx="20" cy="62" rx="3" ry="2" fill={WOOD.darker} opacity="0.55" />
      <ellipse cx="78" cy="34" rx="2.5" ry="1.6" fill={WOOD.darker} opacity="0.55" />
    </svg>
  );
}

function Nail({ style }: { style: CSSProperties }) {
  return (
    <div style={{ position: "absolute", width: 6, height: 6, background: WOOD.nail, boxShadow: `inset 1px 1px 0 ${WOOD.nailShine}, 0 0 0 1px ${WOOD.outline}`, ...style }} />
  );
}

function rivetStyle(pos: CSSProperties): CSSProperties {
  return { position: "absolute", width: 4, height: 4, background: WOOD.outline, boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.45)`, ...pos };
}

function ParchmentNote({ text }: { text: string }) {
  return (
    <div className="relative mt-1" style={{ width: "100%", padding: "10px 10px 12px", background: `linear-gradient(180deg, ${WOOD.parchment} 0%, ${WOOD.parchment} 70%, ${WOOD.parchmentDark} 100%)`, boxShadow: `0 0 0 2px ${WOOD.outline}, inset 0 0 0 1px rgba(0,0,0,0.15), inset 0 -4px 6px rgba(120,80,30,0.35), 2px 2px 0 rgba(0,0,0,0.35)`, clipPath: "polygon(0 4%, 4% 0, 96% 2%, 100% 6%, 99% 95%, 95% 100%, 4% 98%, 1% 94%)" }}>
      <span style={{ position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, background: "#B22222", boxShadow: `inset 1px 1px 0 #FF6B6B, 0 0 0 1px ${WOOD.outline}`, borderRadius: "50%" }} />
      <p style={{ margin: 0, fontFamily: '"Georgia", "Times New Roman", serif', fontStyle: "italic", fontSize: 11, lineHeight: 1.45, color: WOOD.parchmentInk, textAlign: "center", textShadow: "0 0 1px rgba(58,36,18,0.3)" }}>
        {text}
      </p>
    </div>
  );
}

function ProgressBar({ value, accent }: { value: number; accent: string }) {
  const total = 10;
  const filled = Math.round(value * total);
  return (
    <div className="flex gap-[2px]" style={{ padding: 3, background: WOOD.darker, boxShadow: `0 0 0 2px ${WOOD.outline}, inset 0 0 0 1px rgba(255,255,255,0.06)` }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: 18, height: 12, background: i < filled ? accent : "#1f1208", boxShadow: i < filled ? `inset -2px -2px 0 rgba(0,0,0,0.35), inset 2px 2px 0 rgba(255,255,255,0.35)` : `inset 1px 1px 0 rgba(0,0,0,0.5)`, transition: "background 120ms steps(1)" }} />
      ))}
    </div>
  );
}

function GestureGlyph({ icon }: { icon: GestureIcon }) {
  if (icon === "openHand") return (
    <svg width="36" height="36" viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="2" y="3" width="2" height="6" fill="#1A0F08" />
      <rect x="5" y="1" width="2" height="8" fill="#1A0F08" />
      <rect x="8" y="1" width="2" height="8" fill="#1A0F08" />
      <rect x="11" y="2" width="2" height="7" fill="#1A0F08" />
      <rect x="13" y="6" width="2" height="4" fill="#1A0F08" />
      <rect x="2" y="9" width="13" height="5" fill="#1A0F08" />
    </svg>
  );
  if (icon === "pinch") return (
    <svg width="36" height="36" viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="3" y="2" width="3" height="5" fill="#1A0F08" />
      <rect x="6" y="6" width="2" height="2" fill="#1A0F08" />
      <rect x="3" y="10" width="3" height="4" fill="#1A0F08" />
      <rect x="6" y="8" width="2" height="2" fill="#1A0F08" />
      <rect x="8" y="7" width="2" height="2" fill="#FFF6D5" />
    </svg>
  );
  return (
    <svg width="36" height="36" viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="4" y="4" width="2" height="2" fill="#1A0F08" />
      <rect x="10" y="4" width="2" height="2" fill="#1A0F08" />
      <rect x="3" y="9" width="2" height="2" fill="#1A0F08" />
      <rect x="5" y="10" width="2" height="2" fill="#1A0F08" />
      <rect x="7" y="11" width="2" height="2" fill="#1A0F08" />
      <rect x="9" y="10" width="2" height="2" fill="#1A0F08" />
      <rect x="11" y="9" width="2" height="2" fill="#1A0F08" />
    </svg>
  );
}
