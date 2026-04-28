"use client";

import { useGameEngine } from '@/context/GameEngineProvider';
import { computeGazeMetrics } from '@/lib/gazeMetrics';
import { VocalMetrics } from '@/lib/vocalAnalysis';

export interface SessionJSON {
  // Gaze metrics
  fixation_heatmap_asymmetry?: number;
  dwell_time_asymmetry?: number;
  mean_gaze_x?: number;

  // Vocal metrics
  vocal_duration_ms?: number;
  vocal_response_latency_ms?: number;
  vocal_amplitude_stability?: number;
  vocal_pause_count?: number;
  vocal_correct_answer?: boolean;

  // Other metrics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function useGameSession() {
  const { gazeSamples } = useGameEngine();

  const finalizeSession = (sessionMetrics: SessionJSON) => {
    // Compute final gaze metrics
    const gazeMetrics = computeGazeMetrics(gazeSamples.current, window.innerWidth);

    // Add to session metrics as requested
    sessionMetrics.fixation_heatmap_asymmetry = gazeMetrics.fixation_heatmap_asymmetry;
    sessionMetrics.dwell_time_asymmetry = gazeMetrics.dwell_time_asymmetry;
    sessionMetrics.mean_gaze_x = gazeMetrics.mean_gaze_x;

    console.log("Final Session Data:", sessionMetrics);
    return sessionMetrics;
  };

  const addVocalMetrics = (sessionMetrics: SessionJSON, vocalMetrics: VocalMetrics) => {
    sessionMetrics.vocal_duration_ms = vocalMetrics.vocal_duration_ms;
    sessionMetrics.vocal_response_latency_ms = vocalMetrics.response_latency_ms;
    sessionMetrics.vocal_amplitude_stability = vocalMetrics.amplitude_stability;
    sessionMetrics.vocal_pause_count = vocalMetrics.pause_count;
    sessionMetrics.vocal_correct_answer = vocalMetrics.correct_answer;
  };

  return { finalizeSession, addVocalMetrics };
}
