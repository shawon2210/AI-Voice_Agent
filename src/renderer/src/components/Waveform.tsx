import React, { useEffect, useRef } from 'react'
import { useThrottledAnimation } from '../hooks/useThrottledAnimation'
import { useAppStore } from '../store/useAppStore'
import { getModeColor } from './Avatar'

export const Waveform: React.FC = () => {
  const voiceMode = useAppStore((state) => state.voiceMode)
  const assistantState = useAppStore((state) => state.assistantState)
  const audioAmplitude = useAppStore((state) => state.audioAmplitude)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Use refs for hot-updating values to avoid re-running the effect on every frame
  const amplitudeRef = useRef(0)
  const voiceModeRef = useRef(voiceMode)
  const assistantStateRef = useRef(assistantState)
  const phaseRef = useRef(0)

  // Keep refs in sync with latest values (these don't trigger re-render of anything)
  amplitudeRef.current = audioAmplitude
  voiceModeRef.current = voiceMode
  assistantStateRef.current = assistantState

  useEffect(() => {
  const shouldRender = useThrottledAnimation(30);
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    // Render loop — reads from refs, never needs to restart
    const render = () => {
    if (!shouldRender) {
      animationFrameId = requestAnimationFrame(render);
      return;
    }
      const width = (canvas.width = canvas.offsetWidth)
      const height = (canvas.height = canvas.offsetHeight)
      ctx.clearRect(0, 0, width, height)

      const baseColor = getModeColor(voiceModeRef.current, assistantStateRef.current)
      const amp = amplitudeRef.current

      let targetHeight = 0
      if (assistantStateRef.current === 'speaking' || assistantStateRef.current === 'listening') {
        targetHeight = Math.max(2, amp * (height / 2))
      } else if (assistantStateRef.current === 'thinking') {
        targetHeight = 4 + Math.sin(Date.now() / 150) * 2
      } else {
        targetHeight = 1
      }

      phaseRef.current += 0.15

      const drawWave = (
        amplitude: number,
        color: string,
        speedFactor: number,
        phaseOffset: number
      ) => {
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5

        const phase = phaseRef.current * speedFactor + phaseOffset

        for (let x = 0; x < width; x++) {
          const normX = x / width
          const envelope = Math.sin(normX * Math.PI)
          const y = height / 2 + Math.sin(normX * Math.PI * 6 + phase) * amplitude * envelope
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      drawWave(targetHeight, `${baseColor}40`, 0.8, 0)
      drawWave(targetHeight * 0.7, `${baseColor}80`, 1.2, Math.PI / 2)
      drawWave(targetHeight * 0.4, baseColor, 1.5, Math.PI)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="w-full h-16 relative flex items-center justify-center glass-panel border border-hud-cyan/5 rounded-lg overflow-hidden bg-slate-950/20">
      <div className="absolute top-2 left-3 text-[8px] font-hud text-hud-cyan/40 tracking-wider">
        VOICE MATRIX STREAM
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}
