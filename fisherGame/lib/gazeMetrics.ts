export interface GazeSample {
  x: number;
  y: number;
  timestamp: number;
}

export interface GazeMetrics {
  fixation_heatmap_asymmetry: number;  // ratio left/right (0-1, 0.5 = simétrico)
  dwell_time_left: number;             // ms mirando hemicampo izquierdo
  dwell_time_right: number;            // ms mirando hemicampo derecho
  dwell_time_asymmetry: number;        // abs(left-right)/(left+right)
  mean_gaze_x: number;                 // posición media horizontal normalizada
  gaze_samples: GazeSample[];          // buffer de las últimas 300 muestras
}

/**
 * Computes clinical gaze metrics from a buffer of samples.
 */
export function computeGazeMetrics(samples: GazeSample[], screenWidth: number): GazeMetrics {
  if (samples.length === 0) {
    return {
      fixation_heatmap_asymmetry: 0.5,
      dwell_time_left: 0,
      dwell_time_right: 0,
      dwell_time_asymmetry: 0,
      mean_gaze_x: 0.5,
      gaze_samples: []
    };
  }

  const midX = screenWidth / 2;
  
  const leftSamples = samples.filter(s => s.x < midX);
  const rightSamples = samples.filter(s => s.x >= midX);
  
  // Assuming roughly 60fps, each sample is ~16.6ms
  const dwellLeft = leftSamples.length * (1000 / 60);
  const dwellRight = rightSamples.length * (1000 / 60);
  const totalDwell = dwellLeft + dwellRight;
  
  return {
    fixation_heatmap_asymmetry: samples.length > 0 ? leftSamples.length / samples.length : 0.5,
    dwell_time_left: dwellLeft,
    dwell_time_right: dwellRight,
    dwell_time_asymmetry: totalDwell > 0 ? Math.abs(dwellLeft - dwellRight) / totalDwell : 0,
    mean_gaze_x: (samples.reduce((acc, s) => acc + s.x, 0) / samples.length) / screenWidth,
    gaze_samples: samples.slice(-300)
  };
}
