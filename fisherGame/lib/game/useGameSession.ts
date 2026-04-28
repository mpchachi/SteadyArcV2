"use client";

import { useGameEngine } from '@/context/GameEngineProvider';
import { computeGazeMetrics } from '@/lib/gazeMetrics';

export function useGameSession() {
  const { gazeSamples } = useGameEngine();

  const finalizeSession = (sessionMetrics: any) => {
    // Compute final gaze metrics
    const gazeMetrics = computeGazeMetrics(gazeSamples.current, window.innerWidth);

    // Add to session metrics as requested
    sessionMetrics.fixation_heatmap_asymmetry = gazeMetrics.fixation_heatmap_asymmetry;
    sessionMetrics.dwell_time_asymmetry = gazeMetrics.dwell_time_asymmetry;
    sessionMetrics.mean_gaze_x = gazeMetrics.mean_gaze_x;

    console.log("Final Session Data:", sessionMetrics);
    return sessionMetrics;
  };

  return { finalizeSession };
}
