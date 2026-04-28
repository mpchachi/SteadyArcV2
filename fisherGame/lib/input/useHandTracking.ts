import { useEffect, useRef } from "react";

const VW = 960;
const VH = 540;

function gDist(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow((p1.x - p2.x) * VW, 2) + Math.pow((p1.y - p2.y) * VH, 2));
}

// Returns true when thumb tip and index tip are close (< 22% of hand size).
function detectPinch(lm: { x: number; y: number }[]): boolean {
  if (!lm || lm.length < 21) return false;
  const hSize = gDist(lm[0], lm[9]);
  return gDist(lm[4], lm[8]) / hSize < 0.22;
}

// Returns 0 (fist) to 1 (fully extended). Combines finger count and aperture.
function calcHandOpenness(lm: { x: number; y: number }[]): number {
  if (!lm || lm.length < 21) return 0;

  let extended = 0;
  ([8, 12, 16, 20] as const).forEach((tip, i) => {
    const joint = ([6, 10, 14, 18] as const)[i];
    if (gDist(lm[tip], lm[0]) > gDist(lm[joint], lm[0])) extended++;
  });
  if (gDist(lm[4], lm[17]) > gDist(lm[3], lm[17])) extended++;

  const palmSize = gDist(lm[0], lm[9]);
  const tips = [4, 8, 12, 16, 20];
  const avgTipDist = tips.reduce((s, idx) => s + gDist(lm[idx], lm[9]), 0) / 5;
  const aperture = (avgTipDist / (palmSize * 2.1)) * 100;

  const fingerRatio  = extended / 5;
  const apertureRatio = Math.min(1, aperture / 100);

  return fingerRatio * 0.5 + apertureRatio * 0.5;
}

// Smile: ratio of mouth-corner width to face width > 0.42 (from SteadyArc detection-core).
function detectSmile(flm: { x: number; y: number }[]): boolean {
  if (!flm || flm.length < 468) return false;
  const dSmile = Math.abs(flm[61].x - flm[291].x);
  const dFace  = Math.abs(flm[234].x - flm[454].x);
  return dFace > 0 && (dSmile / dFace) > 0.42;
}

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>
): {
  handOpennessRef:   React.MutableRefObject<number>;
  consumePinchCount: () => number;
  isSmilingRef:      React.MutableRefObject<boolean>;
  handPosRef:        React.MutableRefObject<{ x: number; y: number }>;
  isFistRef:         React.MutableRefObject<boolean>;
} {
  const handOpennessRef  = useRef<number>(0);
  const pinchCountRef    = useRef<number>(0);
  const wasPinchingRef   = useRef<boolean>(false);
  const isSmilingRef     = useRef<boolean>(false);
  const handPosRef       = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const isFistRef        = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let cameraInstance: { start: () => Promise<void>; stop: () => void } | null = null;

    const init = async () => {
      try {
        const { Hands }    = await import("@mediapipe/hands");
        const { FaceMesh } = await import("@mediapipe/face_mesh");
        const { Camera }   = await import("@mediapipe/camera_utils");

        const handsInstance = new Hands({
          locateFile: (f: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });
        handsInstance.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });
        handsInstance.onResults((results: { multiHandLandmarks?: { x: number; y: number }[][] }) => {
          if (!isMounted) return;
          const lm = results.multiHandLandmarks?.[0];
          handOpennessRef.current = lm ? calcHandOpenness(lm) : 0;

          // Actualizar posición de la mano usando el centro de la palma (lm[9]) - invertir X para efecto espejo
          if (lm && lm[9]) {
            handPosRef.current = {
              x: 1 - lm[9].x,  // Invertir X para efecto espejo
              y: lm[9].y
            };
          }

          // Actualizar si el puño está cerrado (openness < 0.2)
          isFistRef.current = handOpennessRef.current < 0.2;

          // Rising-edge pinch counter: fires once each time pinch starts
          const isPinching = lm ? detectPinch(lm) : false;
          if (isPinching && !wasPinchingRef.current) pinchCountRef.current++;
          wasPinchingRef.current = isPinching;
        });

        const faceMeshInstance = new FaceMesh({
          locateFile: (f: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
        });
        faceMeshInstance.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        faceMeshInstance.onResults((results: { multiFaceLandmarks?: { x: number; y: number }[][] }) => {
          if (!isMounted) return;
          const flm = results.multiFaceLandmarks?.[0];
          isSmilingRef.current = flm ? detectSmile(flm) : false;
        });

        if (!videoRef.current) return;
        cameraInstance = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!isMounted || !videoRef.current) return;
            try {
              await handsInstance.send({ image: videoRef.current });
              await faceMeshInstance.send({ image: videoRef.current });
            } catch (_) {}
          },
          width: VW,
          height: VH,
        });
        await cameraInstance.start();
      } catch (err) {
        console.error("useHandTracking init failed:", err);
      }
    };

    init();
    return () => {
      isMounted = false;
      cameraInstance?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumePinchCount = () => {
    const n = pinchCountRef.current;
    pinchCountRef.current = 0;
    return n;
  };

  return { handOpennessRef, consumePinchCount, isSmilingRef, handPosRef, isFistRef };
}
