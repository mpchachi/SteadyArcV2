export interface VocalMetrics {
  vocal_duration_ms: number
  response_latency_ms: number
  mean_amplitude: number
  amplitude_stability: number
  pause_count: number
  speech_ratio: number
  correct_answer: boolean
  raw_amplitudes: number[]
}

export function computeVocalMetrics(
  amplitudes: number[],
  sampleRateMs: number,
  latencyMs: number,
  expectedAnswer?: string,
  transcript?: string
): VocalMetrics {
  const VOICE_THRESHOLD = 0.05
  const SILENCE_THRESHOLD = 0.03

  const voiceFrames = amplitudes.filter(a => a > VOICE_THRESHOLD)
  const mean = voiceFrames.length > 0
    ? voiceFrames.reduce((a, b) => a + b, 0) / voiceFrames.length
    : 0

  const variance = voiceFrames.length > 0
    ? voiceFrames.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / voiceFrames.length
    : 0

  const stability = mean > 0 ? Math.max(0, 1 - (Math.sqrt(variance) / mean)) : 0

  // Contar pausas — secuencias de frames silenciosos entre frames de voz
  let pauseCount = 0
  let inPause = false
  for (const amp of amplitudes) {
    if (amp < SILENCE_THRESHOLD && !inPause) {
      inPause = true
      pauseCount++
    } else if (amp >= SILENCE_THRESHOLD) {
      inPause = false
    }
  }

  return {
    vocal_duration_ms: voiceFrames.length * sampleRateMs,
    response_latency_ms: latencyMs,
    mean_amplitude: mean,
    amplitude_stability: stability,
    pause_count: Math.max(0, pauseCount - 1), // primera pausa es el silencio inicial
    speech_ratio: amplitudes.length > 0 ? voiceFrames.length / amplitudes.length : 0,
    correct_answer: expectedAnswer && transcript
      ? transcript.toLowerCase().includes(expectedAnswer.toLowerCase())
      : false,
    raw_amplitudes: amplitudes
  }
}
