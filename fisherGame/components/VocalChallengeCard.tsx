"use client";

import { useEffect, useRef, useState } from 'react'
import { computeVocalMetrics, VocalMetrics } from '../lib/vocalAnalysis'
import { VOCAL_CHALLENGE } from '../lib/patientProfile'

// Paleta madera — misma que WoodenSign
const WOOD = {
  base: "#7A4A22",
  dark: "#4A2C13",
  darker: "#2A180A",
  outline: "#1A0F08",
  rope: "#D9B073",
  ropeDark: "#6B4820",
  parchment: "#E8D9A8",
  parchmentInk: "#3A2412",
}

type VocalState = 'READY' | 'RECORDING' | 'RESULT'

interface Props {
  onComplete: (metrics: VocalMetrics) => void
  visible: boolean
}

const SAMPLE_RATE_MS = 50
const MAX_DURATION_MS = 1000  // 1 segundo real

export default function VocalChallengeCard({
  onComplete, visible
}: Props) {
  const [vocalState, setVocalState] = useState<VocalState>('READY')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<VocalMetrics | null>(null)
  const [transcript, setTranscript] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const samplesRef = useRef<number[]>([])
  const buttonPressedAtRef = useRef<number>(0)
  const recordingRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const animFrameRef = useRef<number>(0)

  const cleanup = () => {
    recordingRef.current = false
    cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    recognitionRef.current?.stop()
  }

  useEffect(() => () => cleanup(), [])

  // Reset completo cada vez que el componente se hace visible
  useEffect(() => {
    if (visible) {
      setVocalState('READY')
      setProgress(0)
      setResult(null)
      setTranscript('')
      setIsSuccess(false)
      samplesRef.current = []
      cleanup()
    }
  }, [visible])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser

      buttonPressedAtRef.current = Date.now()
      samplesRef.current = []
      recordingRef.current = true
      setVocalState('RECORDING')

      // Web Speech API para transcripción
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SR()
        recognition.lang = 'es-ES'
        recognition.continuous = false
        recognition.interimResults = true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (e: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const t = Array.from(e.results).map((r: any) => r[0].transcript).join('')
          setTranscript(t)
        }
        recognition.start()
        recognitionRef.current = recognition
      }

      // Loop de captura de amplitud
      let elapsed = 0
      const WARMUP_MS = 200
      let warmupElapsed = 0

      const tick = () => {
        if (!recordingRef.current || !analyserRef.current) return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteTimeDomainData(dataArray)
        const rms = Math.sqrt(
          dataArray.reduce((acc, v) => acc + Math.pow((v - 128) / 128, 2), 0) / dataArray.length
        )

        warmupElapsed += SAMPLE_RATE_MS

        // Solo guardar muestras después del warmup:
        if (warmupElapsed > WARMUP_MS) {
          samplesRef.current.push(rms)
        }

        elapsed += SAMPLE_RATE_MS
        setProgress(Math.min(100, (elapsed / MAX_DURATION_MS) * 100))

        // Dibujar onda en canvas
        drawWaveform(dataArray)

        if (elapsed >= MAX_DURATION_MS) {
          // Log para verificar:
          console.log('samples al finalizar:', samplesRef.current.length, samplesRef.current.slice(0, 5))
          finishRecording(Date.now() - buttonPressedAtRef.current)
          return
        }
        setTimeout(() => animFrameRef.current = requestAnimationFrame(tick), SAMPLE_RATE_MS)
      }
      animFrameRef.current = requestAnimationFrame(tick)

    } catch {
      setVocalState('READY')
    }
  }

  const drawWaveform = (dataArray: Uint8Array) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = WOOD.darker
    ctx.fillRect(0, 0, W, H)
    ctx.lineWidth = 3  // más grueso
    ctx.strokeStyle = '#4ade80'
    ctx.shadowBlur = 8  // glow verde
    ctx.shadowColor = '#4ade80'
    ctx.beginPath()
    const sliceWidth = W / dataArray.length
    let x = 0
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0
      // Amplificar x2.5 para exagerar la onda
      const y = H / 2 + (v - 1) * H * 1.2
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      x += sliceWidth
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  const finishRecording = (latency?: number) => {
    recordingRef.current = false
    cancelAnimationFrame(animFrameRef.current)
    recognitionRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())

    const latencyMs = latency ?? Date.now() - buttonPressedAtRef.current
    console.log('samples:', samplesRef.current.length, samplesRef.current.slice(0,5))
    const metrics = computeVocalMetrics(
      samplesRef.current,
      SAMPLE_RATE_MS,
      latencyMs,
      undefined,  // ya no usamos expectedAnswer
      transcript
    )

    // El reto se completa siempre que el timer llegue a MAX_DURATION_MS
    // Las métricas de amplitud y estabilidad se capturan para el JSON
    // pero NO bloquean la finalización del reto
    setIsSuccess(true)
    setResult(metrics)
    setVocalState('RESULT')
    setTimeout(() => onComplete(metrics), 2000)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex', gap: 16, alignItems: 'flex-start',
      pointerEvents: 'none'
    }}>
      {/* CARTEL PRINCIPAL — mismo estilo madera */}
      <div style={{
        width: 320,
        background: `repeating-linear-gradient(90deg, ${WOOD.base} 0px, ${WOOD.base} 38px, ${WOOD.dark} 38px, ${WOOD.dark} 40px)`,
        boxShadow: `inset 0 0 0 6px ${WOOD.outline}, 6px 6px 0 rgba(0,0,0,0.5)`,
        padding: '20px 18px',
        transformOrigin: '50% 0%',
        animation: 'wsSwing 4.5s ease-in-out infinite',
        pointerEvents: 'auto'
      }}>
        {/* Header */}
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8, color: '#A8753D', marginBottom: 12,
          textTransform: 'uppercase', letterSpacing: '0.1em'
        }}>
          🎤 RETO DE VOZ
        </div>

        {/* Pregunta */}
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 11, color: '#FFF1C9', lineHeight: 1.6,
          textShadow: `2px 2px 0 ${WOOD.outline}`,
          marginBottom: 8, textAlign: 'center'
        }}>
          {VOCAL_CHALLENGE.question}
        </div>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8, color: '#A8753D',
          marginBottom: 16, textAlign: 'center'
        }}>
          {VOCAL_CHALLENGE.instruction}
        </div>

        {/* Botón activar micrófono */}
        {vocalState === 'READY' && (
          <button
            onClick={startRecording}
            style={{
              width: '100%', padding: '10px 0',
              background: '#4ade80', border: `3px solid ${WOOD.outline}`,
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9, color: WOOD.outline,
              cursor: 'pointer', letterSpacing: '0.05em',
              boxShadow: `3px 3px 0 ${WOOD.outline}`,
            }}
          >
            🎤 ACTIVAR MICRÓFONO
          </button>
        )}

        {/* Barra de progreso durante grabación */}
        {vocalState === 'RECORDING' && (
          <>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9, color: '#4ade80', textAlign: 'center',
              marginBottom: 8, animation: 'pulse 1s infinite'
            }}>
              ● GRABANDO...
            </div>
            <div style={{
              height: 8, background: WOOD.darker,
              boxShadow: `0 0 0 2px ${WOOD.outline}`
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: '#4ade80', transition: 'width 0.05s linear'
              }} />
            </div>
            <button
              onClick={() => finishRecording()}
              style={{
                marginTop: 10, width: '100%', padding: '8px 0',
                background: WOOD.dark, border: `2px solid ${WOOD.outline}`,
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 8, color: '#FFF1C9', cursor: 'pointer'
              }}
            >
              ✓ TERMINAR
            </button>
          </>
        )}

        {/* Resultado */}
        {vocalState === 'RESULT' && result && (
          <div style={{
            background: WOOD.parchment,
            padding: '10px', boxShadow: `0 0 0 2px ${WOOD.outline}`,
            fontFamily: '"Press Start 2P", monospace', fontSize: 8,
            color: WOOD.parchmentInk, lineHeight: 1.8
          }}>
            <div style={{
              color: '#2d7a2d',
              marginBottom: 4
            }}>
              ✓ COMPLETADO
            </div>
            <div>DURACIÓN: {result.vocal_duration_ms}ms</div>
            <div>ESTABILIDAD: {Math.round(result.amplitude_stability * 100)}%</div>
            <div>PAUSAS: {result.pause_count}</div>
          </div>
        )}
      </div>

      {/* PANEL DERECHO — onda de audio */}
      {vocalState === 'RECORDING' && (
        <div style={{
          width: 260,
          background: `repeating-linear-gradient(90deg, ${WOOD.base} 0px, ${WOOD.base} 38px, ${WOOD.dark} 38px, ${WOOD.dark} 40px)`,
          boxShadow: `inset 0 0 0 6px ${WOOD.outline}, 6px 6px 0 rgba(0,0,0,0.5)`,
          padding: '12px',
          pointerEvents: 'auto'
        }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7, color: '#A8753D', marginBottom: 8
          }}>
            ONDA DE VOZ
          </div>
          <canvas
            ref={canvasRef}
            width={220} height={120}
            style={{
              display: 'block',
              boxShadow: `0 0 0 2px ${WOOD.outline}`
            }}
          />
          {transcript && (
            <div style={{
              marginTop: 8, padding: '6px',
              background: WOOD.parchment,
              boxShadow: `0 0 0 2px ${WOOD.outline}`,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic', fontSize: 10,
              color: WOOD.parchmentInk, wordBreak: 'break-word'
            }}>
              &ldquo;{transcript}&rdquo;
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes wsSwing {
          0%, 100% { transform: rotate(-2.2deg); }
          50% { transform: rotate(2.2deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
