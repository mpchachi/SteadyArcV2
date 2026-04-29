export type ChallengeType = 'SMILE_CHALLENGE' | 'HOLD_HAND_OPEN' | 'REPEATED_PINCH' | 'VOCAL';

export interface ChallengeRecord {
  type: ChallengeType;
  completionMs: number;
  succeeded: boolean;
}

export interface SessionMetrics {
  challenges: ChallengeRecord[];
  // Vocal biomarkers (VocalMetrics subset)
  vocalStability: number;   // 0–1
  vocalDurationMs: number;
  vocalPauseCount: number;
  vocalMeanAmplitude: number;
  // Computed domain scores 0–100
  motorPinchScore: number;   // M1 — pinch precision (REPEATED_PINCH time)
  motorOpenScore: number;    // M2 — hand opening speed (HOLD_HAND_OPEN time)
  facialSmileScore: number;  // M6 — smile activation time
  vocalScore: number;        // sustained phonation stability + duration
  cri: number;               // Clinical Recovery Index composite
}

// Time-based score: 0ms→100, 3s→65, 6s→30. Timeout → 20.
function timeScore(completionMs: number, succeeded: boolean): number {
  if (!succeeded) return 20;
  return Math.max(30, Math.round(100 - (completionMs / 6000) * 70));
}

export function computeSessionMetrics(
  challenges: ChallengeRecord[],
  vocalStability: number,
  vocalDurationMs: number,
  vocalPauseCount: number,
  vocalMeanAmplitude: number,
): SessionMetrics {
  const pinches = challenges.filter(c => c.type === 'REPEATED_PINCH');
  const opens   = challenges.filter(c => c.type === 'HOLD_HAND_OPEN');
  const smiles  = challenges.filter(c => c.type === 'SMILE_CHALLENGE');
  const vocals  = challenges.filter(c => c.type === 'VOCAL');

  const avg = (scores: number[]) => scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : -1;

  const motorPinchScore  = avg(pinches.map(c => timeScore(c.completionMs, c.succeeded)));
  const motorOpenScore   = avg(opens.map(c => timeScore(c.completionMs, c.succeeded)));
  const facialSmileScore = avg(smiles.map(c => timeScore(c.completionMs, c.succeeded)));

  // Vocal: stability (80%) + duration adequacy (20%) — penalize pauses
  const durationPct = Math.min(1, vocalDurationMs / 3000);
  const pausePenalty = Math.max(0, 1 - vocalPauseCount * 0.15);
  const vocalScore = vocals.length > 0
    ? Math.round((vocalStability * 0.70 + durationPct * 0.20 + pausePenalty * 0.10) * 100)
    : -1;

  // CRI: only average available domains
  const available = [motorPinchScore, motorOpenScore, facialSmileScore, vocalScore].filter(s => s >= 0);
  const cri = available.length > 0 ? Math.round(available.reduce((a, b) => a + b) / available.length) : 0;

  return {
    challenges,
    vocalStability,
    vocalDurationMs,
    vocalPauseCount,
    vocalMeanAmplitude,
    motorPinchScore,
    motorOpenScore,
    facialSmileScore,
    vocalScore,
    cri,
  };
}
