import React, { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Avatar, getModeColor } from './Avatar'
import { useRealtimeVoice } from '../hooks/useRealtimeVoice'
import { Mic, MicOff, Maximize2, X, Check, AlertTriangle } from 'lucide-react'

export const ComputerOverlay: React.FC = () => {
  const {
    assistantState,
    voiceMode,
    isMuted,
    actionQueue,
    pendingActionApproval,
    safetyMode,
    setWindowMode,
    toggleMute
  } = useAppStore()

  const { updateMuteState } = useRealtimeVoice()
  const themeColor = getModeColor(voiceMode, assistantState)

  // Developer Mode Countdown State
  const [countdown, setCountdown] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timelineEndRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll action timeline
  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [actionQueue])

  // Handle Developer Mode 3s countdown auto-approval
  useEffect(() => {
    if (pendingActionApproval && safetyMode === 'developer') {
      setCountdown(3)
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            timerRef.current = null
            pendingActionApproval.resolve(true)
            return null
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setCountdown(null)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [pendingActionApproval, safetyMode])

  const handleExpand = async () => {
    setWindowMode('full')
    await window.api.setWindowMode('full')
  }

  const handleMuteToggle = () => {
    toggleMute()
    updateMuteState(!isMuted)
  }

  const handleApprove = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    pendingActionApproval?.resolve(true)
  }

  const handleDeny = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    pendingActionApproval?.resolve(false)
  }

  return (
    <div className="w-full h-full p-4 flex flex-col justify-between overflow-hidden bg-slate-950/80 border border-hud-cyan/15 rounded-2xl glass-panel relative">
      <div className="scanline" />
      <div className="hud-grid-bg opacity-30" />

      {/* Corner Bracket Details */}
      <div className="hud-corner hud-corner-tl" style={{ borderColor: themeColor }} />
      <div className="hud-corner hud-corner-tr" style={{ borderColor: themeColor }} />
      <div className="hud-corner hud-corner-bl" style={{ borderColor: themeColor }} />
      <div className="hud-corner hud-corner-br" style={{ borderColor: themeColor }} />

      {/* Header */}
      <header className="flex justify-between items-center z-10">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: themeColor }}
          />
          <span className="font-hud text-[9px] font-bold tracking-widest text-slate-300">
            COMPUTER HUD
          </span>
        </div>
        <button
          onClick={handleExpand}
          className="text-slate-400 hover:text-hud-cyan cursor-pointer transition-colors duration-300"
        >
          <Maximize2 size={12} />
        </button>
      </header>

      {/* Center Circle Frame (Shrunk Avatar) */}
      <div className="flex justify-center items-center my-2 transform scale-75 z-10">
        <Avatar />
      </div>

      {/* Middle Panel: Action Status & Timeline OR Action Approval Prompt */}
      <div className="flex-1 flex flex-col justify-end overflow-hidden z-10 mb-2">
        {pendingActionApproval ? (
          // User approval container
          <div className="glass-panel p-3 border border-hud-gold/20 rounded-xl bg-slate-950/70 flex flex-col gap-2 animate-pulse-slow">
            <div className="flex items-center gap-1.5 text-hud-gold text-[10px] font-hud font-semibold uppercase">
              <AlertTriangle size={12} />
              <span>Authorization Requested</span>
            </div>

            <div className="text-xs font-sans text-slate-300 line-clamp-2">
              Action:{' '}
              <span className="font-mono text-hud-gold uppercase font-bold">
                {pendingActionApproval.action}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {pendingActionApproval.detail}
              </p>
            </div>

            {countdown !== null && (
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-hud-cyan h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 3) * 100}%` }}
                />
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-hud-green/10 hover:bg-hud-green/20 border border-hud-green/30 text-hud-green text-[10px] font-hud rounded-lg cursor-pointer transition-all duration-300"
              >
                <Check size={10} />
                <span>{countdown !== null ? `ALLOW (${countdown}s)` : 'ALLOW'}</span>
              </button>
              <button
                onClick={handleDeny}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-hud-red/10 hover:bg-hud-red/20 border border-hud-red/30 text-hud-red text-[10px] font-hud rounded-lg cursor-pointer transition-all duration-300"
              >
                <X size={10} />
                <span>DENY</span>
              </button>
            </div>
          </div>
        ) : (
          // Action execution timeline log
          <div className="glass-panel p-2.5 border border-hud-cyan/5 rounded-xl bg-slate-950/40 flex-1 flex flex-col justify-between overflow-hidden">
            <div className="text-[8px] font-hud text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1 mb-1">
              Execution Timeline
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 font-mono text-[9px] leading-snug text-slate-400 scroll-smooth">
              {actionQueue.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic">
                  No actions executed yet.
                </div>
              ) : (
                actionQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-0.5 border-b border-slate-950/20"
                  >
                    <div className="truncate pr-2">
                      <span className="text-hud-cyan/60 uppercase font-semibold">
                        [{item.action}]
                      </span>{' '}
                      {item.detail}
                    </div>
                    <span
                      className={`text-[8px] uppercase px-1 rounded font-bold shrink-0 ${
                        item.status === 'completed'
                          ? 'text-hud-green'
                          : item.status === 'executing'
                            ? 'text-hud-blue animate-pulse'
                            : item.status === 'failed'
                              ? 'text-hud-red'
                              : 'text-slate-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
              <div ref={timelineEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <footer className="flex justify-between items-center z-10 mt-1 border-t border-slate-900 pt-2">
        <button
          onClick={handleMuteToggle}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer ${
            isMuted
              ? 'bg-hud-red/10 border-hud-red/35 text-hud-red'
              : 'bg-hud-cyan/10 border-hud-cyan/35 text-hud-cyan'
          }`}
        >
          {isMuted ? <MicOff size={12} /> : <Mic size={12} />}
        </button>

        <div className="flex flex-col items-end">
          <span className="text-[7px] font-hud text-slate-500 uppercase">System Safety</span>
          <span
            className="text-[9px] font-hud text-hud-cyan font-bold uppercase transition-colors duration-300"
            style={{ color: themeColor }}
          >
            {safetyMode} Mode
          </span>
        </div>
      </footer>
    </div>
  )
}
