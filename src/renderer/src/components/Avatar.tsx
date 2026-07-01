import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, AssistantState, VoiceMode } from '../store/useAppStore'

// Helper to get HUD color matching active voiceMode or assistantState
export const getModeColor = (mode: VoiceMode, state: AssistantState): string => {
  if (state === 'error') return '#ff3366' // Red
  if (state === 'success') return '#00ffaa' // Green

  switch (mode) {
    case 'developer':
    case 'computer':
      return '#00f0ff' // Cyan
    case 'research':
    case 'teaching':
      return '#ffaa00' // Gold
    case 'creative':
    case 'image':
      return '#d946ef' // Magenta/Purple
    case 'focus':
      return '#0070ff' // Pure Blue
    default:
      return '#00f0ff'
  }
}

export const Avatar: React.FC = React.memo(() => {
  const voiceMode = useAppStore(state => state.voiceMode)
  const assistantState = useAppStore(state => state.assistantState)
  const audioAmplitude = useAppStore(state => state.audioAmplitude)
  const [blink, setBlink] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Glow color hex
  const activeColor = getModeColor(voiceMode, assistantState)

  // Eye blinking cycle (skip when reduced motion requested)
  useEffect(() => {
    if (reducedMotion) return
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 4000)
    return () => clearInterval(blinkInterval)
  }, [reducedMotion])

  // Orbital speed based on thinking state; disable continuous rotation when reduced motion requested
  const orbitDuration = reducedMotion ? 0 : (assistantState === 'thinking' ? 3 : 15)
  const innerOrbitDuration = reducedMotion ? 0 : (assistantState === 'thinking' ? 2 : 10)

  return (
    <div className="relative w-64 h-64 flex items-center justify-center select-none">
        {/* Outer Glow Ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1.5px solid ${activeColor}`,
          boxShadow: `0 0 30px ${activeColor}40, inset 0 0 20px ${activeColor}20`
        }}
        animate={reducedMotion
          ? { scale: 1, opacity: 0.4 }
          : {
              scale: assistantState === 'listening' ? [1, 1.08, 1] : [1, 1.03, 1],
              opacity: [0.3, 0.6, 0.3]
            }
        }
        transition={{
          duration: assistantState === 'listening' ? 1.5 : 3.5,
          repeat: reducedMotion ? 0 : Infinity,
          ease: 'easeInOut'
        }}
      />

      <svg width="240" height="240" viewBox="0 0 240 240" className="absolute z-10">
        {/* Outer Rotating HUD Bracket 1 */}
        {reducedMotion ? (
          <circle
            cx="120" cy="120" r="95"
            fill="none" stroke={activeColor}
            strokeWidth="1.5" strokeDasharray="40 120 20 60"
            opacity="0.4"
          />
        ) : (
          <motion.circle
            cx="120" cy="120" r="95"
            fill="none" stroke={activeColor}
            strokeWidth="1.5" strokeDasharray="40 120 20 60"
            animate={{ rotate: 360 }}
            transition={{ duration: orbitDuration, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Counter-Rotating Inner Dotted Circle */}
        {reducedMotion ? (
          <circle
            cx="120" cy="120" r="80"
            fill="none" stroke={activeColor}
            strokeWidth="1" strokeDasharray="4 8"
            opacity="0.3"
          />
        ) : (
          <motion.circle
            cx="120" cy="120" r="80"
            fill="none" stroke={activeColor}
            strokeWidth="1" strokeDasharray="4 8"
            opacity="0.6"
            animate={{ rotate: -360 }}
            transition={{ duration: innerOrbitDuration, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* HUD Targeting Brackets */}
        <AnimatePresence>
          {assistantState === 'listening' && (
            <motion.g
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              exit={{ scale: 0.8, opacity: 0 }}
              stroke={activeColor}
              strokeWidth="2"
              fill="none"
            >
              {/* Corner Brackets */}
              <path d="M 60 70 L 60 60 L 70 60" />
              <path d="M 180 70 L 180 60 L 170 60" />
              <path d="M 60 170 L 60 180 L 70 180" />
              <path d="M 180 170 L 180 180 L 170 180" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Pulse Ring when Speaking */}
        {assistantState === 'speaking' && !reducedMotion && (
          <motion.circle
            cx="120"
            cy="120"
            r={50 + audioAmplitude * 40}
            fill="none"
            stroke={`${activeColor}`}
            strokeWidth="2"
            opacity={0.7 - audioAmplitude * 0.5}
            animate={{ scale: [1, 1.2], opacity: [0.6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}

        {/* Center Glowing Core */}
        <motion.circle
          cx="120"
          cy="120"
          r={assistantState === 'speaking' ? 35 + audioAmplitude * 25 : 35}
          fill={`url(#coreGlow-${voiceMode})`}
          stroke={activeColor}
          strokeWidth="2"
          animate={
            reducedMotion
              ? { scale: 1 }
              : {
                  scale: assistantState === 'listening' ? [1, 1.05, 0.95, 1] : 1,
                  filter: `drop-shadow(0 0 ${assistantState === 'speaking' ? 12 + audioAmplitude * 20 : 8}px ${activeColor}cc)`
                }
          }
          transition={{
            duration: 0.2,
            type: 'spring',
            stiffness: 300,
            damping: 15
          }}
        />

        {/* Blinking Eyes (HUD Style) */}
        <g fill="#ffffff" opacity="0.9">
          {/* Left Eye */}
          <motion.rect
            x="102"
            y="115"
            width="6"
            height={blink ? '0' : '10'}
            rx="3"
            transform="rotate(0, 105, 120)"
            style={{ originY: '120px' }}
            animate={{
              height: blink ? 0 : 10,
              y: blink ? 120 : 115
            }}
            transition={{ duration: 0.1 }}
          />
          {/* Right Eye */}
          <motion.rect
            x="132"
            y="115"
            width="6"
            height={blink ? '0' : '10'}
            rx="3"
            transform="rotate(0, 135, 120)"
            style={{ originY: '120px' }}
            animate={{
              height: blink ? 0 : 10,
              y: blink ? 120 : 115
            }}
            transition={{ duration: 0.1 }}
          />
        </g>

        {/* Gradient Definitions */}
        <defs>
          <radialGradient id="coreGlow-developer" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#0070ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0070ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreGlow-computer" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#0070ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0070ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreGlow-research" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffaa00" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#d97706" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreGlow-teaching" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffaa00" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#d97706" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreGlow-creative" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#a21caf" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a21caf" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreGlow-image" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#a21caf" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a21caf" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreGlow-focus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0070ff" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#0033aa" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0033aa" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="coreGlow-presentation" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#0070ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0070ff" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Rotating Floating Particles (Thinking state) — skip if reduced motion */}
      {assistantState === 'thinking' && !reducedMotion && (
        <div className="absolute w-48 h-48 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: activeColor,
                boxShadow: `0 0 10px ${activeColor}`,
                left: '50%',
                top: '50%'
              }}
              animate={{
                x: [0, Math.cos((i * 60 * Math.PI) / 185) * 65, 0],
                y: [0, Math.sin((i * 60 * Math.PI) / 185) * 65, 0],
                scale: [0.5, 1.2, 0.5],
                opacity: [0.2, 1, 0.2]
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      )}

      {/* HUD Sub-stats details around the avatar */}
      <div className="absolute bottom-[-15px] text-[10px] font-hud text-center tracking-widest uppercase opacity-70">
        <span
          style={{ color: activeColor }}
          className="font-semibold transition-colors duration-300"
        >
          {assistantState}
        </span>
      </div>
    </div>
  )
}
