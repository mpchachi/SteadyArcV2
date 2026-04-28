"use client";
import { RefObject, useEffect, useRef } from "react";

const maxVideoWidth  = 960;
const maxVideoHeight = 540;

// ── Face landmark groups ──────────────────────────────────────────────
const FACE_OVAL      = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10];
const EYEBROW_LEFT   = [70,63,105,66,107,55,65,52,53,46];
const EYEBROW_RIGHT  = [300,293,334,296,336,285,295,282,283,276];
const EYE_LEFT       = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246,33];
const EYE_RIGHT      = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398,362];
const MOUTH_UPPER    = [61,185,40,39,37,0,267,269,270,409,291];
const MOUTH_LOWER    = [61,146,91,181,84,17,314,405,321,375,291];

// ── Hand connections ──────────────────────────────────────────────────
const HAND_PALM   = [[0,1],[0,5],[0,17],[5,9],[9,13],[13,17]];
const HAND_THUMB  = [[1,2],[2,3],[3,4]];
const HAND_INDEX  = [[5,6],[6,7],[7,8]];
const HAND_MIDDLE = [[9,10],[10,11],[11,12]];
const HAND_RING   = [[13,14],[14,15],[15,16]];
const HAND_PINKY  = [[17,18],[18,19],[19,20]];
const ALL_HAND_LINKS = [...HAND_PALM,...HAND_THUMB,...HAND_INDEX,...HAND_MIDDLE,...HAND_RING,...HAND_PINKY];

type Lm = { x: number; y: number };

interface Options {
  videoElement:     RefObject<HTMLVideoElement | null>;
  canvasEl:         RefObject<HTMLCanvasElement | null>;
  onResultsCallback?: (results: unknown) => void;
}

export function useGestureRecognition({ videoElement, canvasEl, onResultsCallback }: Options) {

  const latestHandResults  = useRef<unknown>(null);
  const latestFaceResults  = useRef<unknown>(null);
  const prevHandsPos       = useRef<Lm[]>([]);
  const heatmapBuffer      = useRef<Lm[]>([]);
  const lastHeatmapReset   = useRef<number>(Date.now());
  const eyeState = useRef({
    left:  { framesBelow: 0, blinkCount: 0, closureCount: 0, isInClosure: false, sessionStart: Date.now() },
    right: { framesBelow: 0, blinkCount: 0, closureCount: 0, isInClosure: false, sessionStart: Date.now() },
  });

  const dist = (p1: Lm, p2: Lm) =>
    Math.sqrt(Math.pow((p1.x - p2.x) * maxVideoWidth, 2) + Math.pow((p1.y - p2.y) * maxVideoHeight, 2));

  // ── Face HUD ──────────────────────────────────────────────────────────
  const drawFaceHUD = (ctx: CanvasRenderingContext2D, faceResults: { multiFaceLandmarks?: Lm[][] }) => {
    if (!faceResults?.multiFaceLandmarks?.length) return;
    const lm = faceResults.multiFaceLandmarks[0];

    // EAR / blink / closure — matemática pura, no depende del espejo
    const earL = (dist(lm[159], lm[145]) + dist(lm[158], lm[153])) / (2 * dist(lm[133], lm[33]));
    const earR = (dist(lm[386], lm[374]) + dist(lm[385], lm[380])) / (2 * dist(lm[362], lm[263]));
    const now  = Date.now();
    const THRESHOLD = 0.25;

    const processEye = (ear: number, side: "left" | "right") => {
      const state = eyeState.current[side];
      if (ear < THRESHOLD) {
        state.framesBelow++;
        if (state.framesBelow > 6 && !state.isInClosure) state.isInClosure = true;
      } else {
        if (state.framesBelow >= 2 && state.framesBelow <= 6) state.blinkCount++;
        else if (state.framesBelow > 6) { state.closureCount++; state.isInClosure = false; }
        state.framesBelow = 0;
      }
      if (now - state.sessionStart > 60000) { state.blinkCount = 0; state.closureCount = 0; state.sessionStart = now; }
    };
    processEye(earL, "left");
    processEye(earR, "right");

    const elapsedMin = (now - eyeState.current.left.sessionStart) / 60000;
    const blinkRateL = elapsedMin > 0.1 ? Math.round(eyeState.current.left.blinkCount  / elapsedMin) : 0;
    const blinkRateR = elapsedMin > 0.1 ? Math.round(eyeState.current.right.blinkCount / elapsedMin) : 0;

    const noseTip   = lm[4];
    const leftDist  = dist(lm[61],  noseTip);
    const rightDist = dist(lm[291], noseTip);
    const symPct    = Math.min(100, (Math.min(leftDist, rightDist) / (Math.max(leftDist, rightDist) + 0.001)) * 100).toFixed(1);
    const leftLift  = noseTip.y - lm[61].y;
    const rightLift = noseTip.y - lm[291].y;
    const smileSym  = Math.min(100, (Math.min(leftLift, rightLift) / (Math.max(leftLift, rightLift) + 0.001)) * 100).toFixed(1);
    const dxT = lm[263].x - lm[33].x;
    const dyT = lm[263].y - lm[33].y;
    const tilt = Math.atan2(dyT, dxT) * 180 / Math.PI;

    // ── Overlays de malla facial — coordenadas raw, el CSS scaleX(-1) ya las espeja ──
    const drawLineP = (pts: number[], color: string, width: number) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width;
      pts.forEach((idx, i) => {
        const p = lm[idx];
        if (i === 0) ctx.moveTo(p.x * maxVideoWidth, p.y * maxVideoHeight);
        else         ctx.lineTo(p.x * maxVideoWidth, p.y * maxVideoHeight);
      });
      ctx.stroke();
    };
    drawLineP(FACE_OVAL,     "rgba(255,255,255,0.8)", 1.5);
    drawLineP(EYEBROW_LEFT,  "#FF4444", 2);
    drawLineP(EYEBROW_RIGHT, "#22C55E", 2);

    const drawClosedEye = (pts: number[], color: string) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      pts.forEach((idx, i) => {
        const p = lm[idx];
        if (i === 0) ctx.moveTo(p.x * maxVideoWidth, p.y * maxVideoHeight);
        else         ctx.lineTo(p.x * maxVideoWidth, p.y * maxVideoHeight);
      });
      ctx.closePath(); ctx.stroke();
    };
    drawClosedEye(EYE_LEFT,  "#FF4444");
    drawClosedEye(EYE_RIGHT, "#22C55E");

    // EAR bars sobre los ojos
    const getBarColor = (fb: number) => fb === 0 ? "#00FF88" : fb <= 6 ? "#FFA500" : "#FF4444";
    const barMax = 40;
    ctx.fillStyle = getBarColor(eyeState.current.left.framesBelow);
    ctx.fillRect(lm[33].x * maxVideoWidth,  lm[159].y * maxVideoHeight - 8, barMax * Math.min(1, earL / 0.35), 3);
    ctx.fillStyle = getBarColor(eyeState.current.right.framesBelow);
    ctx.fillRect(lm[362].x * maxVideoWidth, lm[386].y * maxVideoHeight - 8, barMax * Math.min(1, earR / 0.35), 3);

    // Iris dots
    ctx.fillStyle = "#FFFFFF";
    [[33,133],[362,263]].forEach(([l,r]) => {
      const p = { x: (lm[l].x + lm[r].x) / 2, y: (lm[l].y + lm[r].y) / 2 };
      ctx.beginPath(); ctx.arc(p.x * maxVideoWidth, p.y * maxVideoHeight, 3, 0, 2*Math.PI); ctx.fill();
    });
    drawLineP(MOUTH_UPPER, "#FFFFFF", 1.5);
    drawLineP(MOUTH_LOWER, "#FFFFFF", 1.5);
    [[61,"#FF4444"],[291,"#22C55E"]].forEach(([idx, color]) => {
      const p = lm[idx as number];
      ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = color as string;
      ctx.fillStyle = color as string;
      ctx.beginPath(); ctx.arc(p.x * maxVideoWidth, p.y * maxVideoHeight, 4, 0, 2*Math.PI); ctx.fill();
      ctx.restore();
    });
    ctx.save();
    ctx.beginPath(); ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.setLineDash([4,4]);
    ctx.moveTo(lm[10].x * maxVideoWidth, lm[10].y * maxVideoHeight);
    ctx.lineTo(lm[152].x * maxVideoWidth, lm[152].y * maxVideoHeight);
    ctx.stroke(); ctx.restore();

    // ── HUD text — renderizado como HTML para evitar el espejo del canvas ──
    const hudEl = document.getElementById("face-hud-overlay");
    if (hudEl) {
      const lStatus = eyeState.current.left.framesBelow  > 0 ? "CLOSED" : "OPEN";
      const rStatus = eyeState.current.right.framesBelow > 0 ? "CLOSED" : "OPEN";
      const closureAsym = Math.abs(eyeState.current.left.closureCount - eyeState.current.right.closureCount);
      const rc = Math.abs(blinkRateL - blinkRateR) > 4 ? "#FF4444" : "#00FF88";
      const line = (l: string, v: string, c: string) =>
        `<span style="color:#AAAAAA">${l}</span> <span style="color:${c}">${v}</span>`;
      hudEl.innerHTML = [
        line("SYMMETRY:", `${symPct}%`, parseFloat(symPct) > 85 ? "#00FF88" : "#FF4444"),
        line("BLINK:", `L:${blinkRateL}/m R:${blinkRateR}/m`, rc),
        line("EYE L:", lStatus, lStatus === "CLOSED" ? "#FF4444" : "#00FF88"),
        line("EYE R:", rStatus, rStatus === "CLOSED" ? "#FF4444" : "#00FF88"),
        line("VOL.CLOSURE:", `L:${eyeState.current.left.closureCount} R:${eyeState.current.right.closureCount}`, closureAsym > 2 ? "#FF4444" : "#00FF88"),
        line("SMILE SYM:", `${smileSym}%`, parseFloat(smileSym) > 80 ? "#00FF88" : "#FF4444"),
        line("HEAD TILT:", `${tilt.toFixed(1)}°`, Math.abs(tilt) < 5 ? "#00FF88" : "#FF4444"),
      ].join("<br>");
    }
  };

  // ── Render loop ───────────────────────────────────────────────────────
  // NOTA: el elemento <canvas> tiene CSS transform: scaleX(-1) aplicado desde
  // ClinicalView, que espeja visualmente todo el contenido del canvas. Por tanto:
  //  - Vídeo y overlays de cuerpo se dibujan con coordenadas raw de MediaPipe.
  //  - El CSS scaleX(-1) se encarga de mostrarlos espejados (efecto selfie).
  //  - Solo el HUD de texto usa un ctx.scale(-1,1) interno para cancelar el espejo.
  const render = () => {
    const canvas = canvasEl.current;
    const video  = videoElement.current;
    if (!canvas || !video || video.readyState < 2) { requestAnimationFrame(render); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    try {
      ctx.save();
      ctx.clearRect(0, 0, maxVideoWidth, maxVideoHeight);
      ctx.drawImage(video, 0, 0, maxVideoWidth, maxVideoHeight);

      // Heatmap
      heatmapBuffer.current.forEach((point, i) => {
        const alpha = (i / heatmapBuffer.current.length) * 0.3;
        const grad = ctx.createRadialGradient(
          point.x * maxVideoWidth, point.y * maxVideoHeight, 0,
          point.x * maxVideoWidth, point.y * maxVideoHeight, 30,
        );
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(0.5, `rgba(0,212,255,${alpha * 0.5})`);
        grad.addColorStop(1, "rgba(0,20,100,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(point.x * maxVideoWidth - 30, point.y * maxVideoHeight - 30, 60, 60);
      });
      if (Date.now() - lastHeatmapReset.current > 5000) {
        heatmapBuffer.current = []; lastHeatmapReset.current = Date.now();
      }

      // Hand landmarks
      const hRes = latestHandResults.current as { multiHandLandmarks?: Lm[][] } | null;
      if (hRes?.multiHandLandmarks) {
        hRes.multiHandLandmarks.forEach((landmarks) => {
          ALL_HAND_LINKS.forEach(([a, b]) => {
            const p1 = landmarks[a], p2 = landmarks[b];
            const x1 = p1.x * maxVideoWidth, y1 = p1.y * maxVideoHeight;
            const x2 = p2.x * maxVideoWidth, y2 = p2.y * maxVideoHeight;
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, "#00D4FF"); grad.addColorStop(1, "#7C3AED");
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
            ctx.strokeStyle = grad; ctx.globalAlpha = 0.85; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
          });
          ctx.shadowBlur = 10; ctx.shadowColor = "#00D4FF";
          landmarks.forEach((lm) => {
            ctx.beginPath(); ctx.arc(lm.x * maxVideoWidth, lm.y * maxVideoHeight, 4, 0, 2*Math.PI);
            ctx.fillStyle = "#FFFFFF"; ctx.fill();
          });
          ctx.shadowBlur = 0;
        });
      }

      if (latestFaceResults.current) drawFaceHUD(ctx, latestFaceResults.current as { multiFaceLandmarks?: Lm[][] });
      ctx.restore();
    } catch (err) { console.error("Render loop error:", err); }
    requestAnimationFrame(render);
  };

  useEffect(() => {
    let isMounted = true;

    const initEngine = async () => {
      try {
        const { Hands }    = await import("@mediapipe/hands");
        const { FaceMesh } = await import("@mediapipe/face_mesh");
        const { Camera }   = await import("@mediapipe/camera_utils");

        const hands = new Hands({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        hands.onResults((r: { multiHandLandmarks?: Lm[][], multiHandedness?: unknown[] }) => {
          if (!isMounted) return;
          latestHandResults.current = r;
          if (r.multiHandLandmarks?.[0]) {
            let activeIdx = 0;
            if (r.multiHandLandmarks.length > 1) {
              const speeds = r.multiHandLandmarks.map((lm, i) =>
                prevHandsPos.current[i] ? Math.hypot((lm[0].x - prevHandsPos.current[i].x) * 960, (lm[0].y - prevHandsPos.current[i].y) * 540) : 0
              );
              activeIdx = speeds[0] >= (speeds[1] || 0) ? 0 : 1;
              prevHandsPos.current = r.multiHandLandmarks.map(lm => ({ x: lm[0].x, y: lm[0].y }));
            }
            if (onResultsCallback) {
              onResultsCallback({
                ...r,
                multiHandLandmarks: [r.multiHandLandmarks[activeIdx]],
                multiHandedness:    [r.multiHandedness?.[activeIdx]],
                latestFaceResults:  latestFaceResults.current,
              });
            }
            heatmapBuffer.current.push({ x: r.multiHandLandmarks[activeIdx][9].x, y: r.multiHandLandmarks[activeIdx][9].y });
            if (heatmapBuffer.current.length > 300) heatmapBuffer.current.shift();
          }
        });

        const faceMesh = new FaceMesh({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        faceMesh.onResults((r: unknown) => { if (isMounted) latestFaceResults.current = r; });

        const cam = new Camera(videoElement.current!, {
          onFrame: async () => {
            if (!isMounted || !videoElement.current) return;
            try {
              await hands.send({ image: videoElement.current });
              await faceMesh.send({ image: videoElement.current });
            } catch (_) {}
          },
          width: maxVideoWidth, height: maxVideoHeight,
        });
        await cam.start();
        render();

        return () => { isMounted = false; cam.stop(); };
      } catch (err) {
        console.error("useGestureRecognition init failed:", err);
      }
    };

    initEngine();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { maxVideoWidth, maxVideoHeight };
}
