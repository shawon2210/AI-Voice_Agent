import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

interface DiagnosticsPanelProps {
  isOpen: boolean
  onClose: () => void
  themeColor: string
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  isOpen,
  onClose,
  themeColor
}) => {
  const [stats, setStats] = useState<Record<string, string>>({})
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    if (!isOpen) return

    const refresh = (): void => {
      const state = useAppStore.getState()
      const mem = (performance as any).memory
      setStats({
        connection: state.connectionStatus,
        assistantState: state.assistantState,
        voiceMode: state.voiceMode,
        galleryAssets: String(state.gallery.length),
        savedNotes: String(state.notes.length),
        memoryKeys: String(Object.keys(state.memory.preferences).length),
        projects: String(state.memory.projects.length),
        jsHeap: mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'N/A',
        safetyMode: state.safetyMode,
        themeAccent: state.themeAccent
      })
    }

    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [isOpen])

  // Uptime counter
  useEffect(() => {
    if (!isOpen) {
      setUptime(0)
      return
    }
    const interval = setInterval(() => setUptime((u) => u + 1), 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const formatUptime = (s: number): string => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
  }

  const rows: { label: string; value: string; color?: string }[] = [
    {
      label: 'Connection',
      value: stats.connection?.toUpperCase() || '--',
      color: stats.connection === 'connected' ? '#22c55e' : '#ef4444'
    },
    { label: 'Assistant State', value: stats.assistantState?.toUpperCase() || '--' },
    { label: 'Voice Mode', value: stats.voiceMode?.toUpperCase() || '--' },
    { label: 'Safety Mode', value: stats.safetyMode?.toUpperCase() || '--' },
    { label: 'Gallery Assets', value: stats.galleryAssets || '0' },
    { label: 'Saved Notes', value: stats.savedNotes || '0' },
    { label: 'Memory Keys', value: stats.memoryKeys || '0' },
    { label: 'Projects', value: stats.projects || '0' },
    { label: 'JS Heap', value: stats.jsHeap || 'N/A' },
    { label: 'Panel Uptime', value: formatUptime(uptime) }
  ]

  return (
    <div className="absolute bottom-16 right-4 z-40 glass-panel bg-slate-950/95 border border-hud-cyan/15 rounded-xl p-4 w-80 select-text">
      <div className="hud-corner hud-corner-tl" style={{ borderColor: themeColor }} />
      <div className="hud-corner hud-corner-tr" style={{ borderColor: themeColor }} />
      <div className="hud-corner hud-corner-bl" style={{ borderColor: themeColor }} />
      <div className="hud-corner hud-corner-br" style={{ borderColor: themeColor }} />

      <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
        <span className="text-[10px] font-hud text-hud-cyan uppercase tracking-widest">
          Diagnostics Matrix
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 cursor-pointer text-xs"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between items-center py-1.5 border-b border-slate-900/50 last:border-0"
          >
            <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
              {row.label}
            </span>
            <span
              className="text-[10px] font-mono text-slate-300"
              style={row.color ? { color: row.color } : {}}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
