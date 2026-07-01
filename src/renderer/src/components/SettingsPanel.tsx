import React from 'react'
import { useAppStore, VoiceMode } from '../store/useAppStore'
import { Settings, Trash2, X, Palette, Shield, Mic, Database, BarChart3 } from 'lucide-react'

const ACCENT_PRESETS = [
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Gold', color: '#eab308' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Blue', color: '#3b82f6' }
]

const VOICE_MODES: VoiceMode[] = [
  'developer',
  'research',
  'creative',
  'focus',
  'computer',
  'image',
  'presentation',
  'teaching'
]

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  themeColor: string
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, themeColor }) => {
  const voiceMode = useAppStore(state => state.voiceMode);
  const setVoiceMode = useAppStore(state => state.setVoiceMode);
  const safetyMode = useAppStore(state => state.safetyMode);
  const setSafetyMode = useAppStore(state => state.setSafetyMode);
  const themeAccent = useAppStore(state => state.themeAccent);
  const setThemeAccent = useAppStore(state => state.setThemeAccent);
  const gallery = useAppStore(state => state.gallery);
  const notes = useAppStore(state => state.notes);
  const memory = useAppStore(state => state.memory);
  const clearAllData = useAppStore(state => state.clearAllData);
  const clearTranscript = useAppStore(state => state.clearTranscript);
  const toggleDiagnostics = useAppStore(state => state.toggleDiagnostics);

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 select-text">
      <div className="glass-panel w-full max-w-lg p-6 border border-hud-cyan/15 rounded-2xl bg-slate-950/95 flex flex-col gap-5 relative max-h-[85vh] overflow-y-auto">
        <div className="hud-corner hud-corner-tl" style={{ borderColor: themeColor }} />
        <div className="hud-corner hud-corner-tr" style={{ borderColor: themeColor }} />
        <div className="hud-corner hud-corner-bl" style={{ borderColor: themeColor }} />
        <div className="hud-corner hud-corner-br" style={{ borderColor: themeColor }} />

        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Settings size={14} style={{ color: themeColor }} />
            <span
              className="text-xs font-hud uppercase tracking-widest"
              style={{ color: themeColor }}
            >
              System Configuration
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* API Key Status */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="text-slate-500" />
            <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
              API Key Status
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-hud text-slate-400 uppercase">OpenAI</span>
                <span className="text-[8px] font-mono text-slate-500">sk-proj-••••••</span>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-hud text-slate-400 uppercase">EXA</span>
                <span className="text-[8px] font-mono text-slate-500">exa-••••••</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Accent */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Palette size={10} className="text-slate-500" />
            <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
              Theme Accent Color
            </span>
          </div>
          <div className="flex gap-2">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setThemeAccent(preset.color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-300 cursor-pointer flex items-center justify-center ${
                  themeAccent === preset.color
                    ? 'scale-110 shadow-lg'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${preset.color}20`,
                  borderColor: themeAccent === preset.color ? preset.color : 'transparent'
                }}
                title={preset.name}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: preset.color }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Default Voice Mode */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Mic size={10} className="text-slate-500" />
            <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
              Default Voice Mode
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {VOICE_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setVoiceMode(mode)}
                className={`py-1.5 text-[8px] font-hud rounded-lg border transition-all duration-300 uppercase cursor-pointer ${
                  voiceMode === mode
                    ? 'bg-hud-cyan/15 text-hud-cyan border-hud-cyan/35'
                    : 'border-slate-800/40 text-slate-500 hover:text-slate-300'
                }`}
                style={
                  voiceMode === mode
                    ? {
                        color: themeColor,
                        borderColor: `${themeColor}40`,
                        backgroundColor: `${themeColor}15`
                      }
                    : {}
                }
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Default Safety Mode */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="text-slate-500" />
            <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
              Default Safety Level
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['safe', 'developer', 'autonomous'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSafetyMode(mode)}
                className={`py-1.5 text-[9px] font-hud rounded-lg border transition-all duration-300 uppercase cursor-pointer ${
                  safetyMode === mode
                    ? 'bg-hud-cyan/15 text-hud-cyan border-hud-cyan/35'
                    : 'border-slate-800/40 text-slate-500 hover:text-slate-300'
                }`}
                style={
                  safetyMode === mode
                    ? {
                        color: themeColor,
                        borderColor: `${themeColor}40`,
                        backgroundColor: `${themeColor}15`
                      }
                    : {}
                }
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="flex flex-col gap-2 border-t border-slate-900 pt-4">
          <div className="flex items-center gap-1.5">
            <Database size={10} className="text-slate-500" />
            <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
              Data Management
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-2.5 flex items-center justify-between">
              <span className="font-hud text-slate-400 uppercase">Gallery</span>
              <span className="font-mono text-slate-300">{gallery.length} items</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-2.5 flex items-center justify-between">
              <span className="font-hud text-slate-400 uppercase">Notes</span>
              <span className="font-mono text-slate-300">{notes.length} items</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-2.5 flex items-center justify-between">
              <span className="font-hud text-slate-400 uppercase">Memory</span>
              <span className="font-mono text-slate-300">
                {Object.keys(memory.preferences).length} keys
              </span>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-2.5 flex items-center justify-between">
              <span className="font-hud text-slate-400 uppercase">Projects</span>
              <span className="font-mono text-slate-300">{memory.projects.length} items</span>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={clearTranscript}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[9px] font-hud rounded-lg cursor-pointer transition-all duration-300"
            >
              <Trash2 size={9} />
              <span>Clear Transcripts</span>
            </button>
            <button
              onClick={() => {
                if (confirm('This will erase all gallery images, notes, and memory. Continue?')) {
                  clearAllData()
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-[9px] font-hud rounded-lg cursor-pointer transition-all duration-300"
            >
              <Trash2 size={9} />
              <span>Reset All Data</span>
            </button>
          </div>
        </div>

        {/* Diagnostics shortcut */}
        <div className="flex flex-col gap-2 border-t border-slate-900 pt-4">
          <div className="flex items-center gap-1.5">
            <BarChart3 size={10} className="text-slate-500" />
            <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
              Developer Tools
            </span>
          </div>
          <button
            onClick={() => {
              toggleDiagnostics()
              onClose()
            }}
            className="w-full py-1.5 bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 text-[9px] font-hud rounded-lg cursor-pointer transition-all duration-300 uppercase"
          >
            Open Diagnostics Panel (Ctrl+Shift+D)
          </button>
        </div>

        {/* Keyboard shortcuts reference */}
        <div className="flex flex-col gap-2 border-t border-slate-900 pt-4">
          <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
            Keyboard Shortcuts
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              ['Ctrl+Shift+M', 'Toggle Mic'],
              ['Ctrl+Shift+S', 'Settings'],
              ['Ctrl+Shift+D', 'Diagnostics'],
              ['Ctrl+Shift+1', 'Artifacts Tab'],
              ['Ctrl+Shift+2', 'Search Tab'],
              ['Ctrl+Shift+3', 'Images Tab'],
              ['Ctrl+Shift+4', 'Notes Tab'],
              ['Ctrl+Shift+5', 'History Tab'],
              ['Escape', 'Close Modal']
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between py-0.5">
                <kbd className="text-[8px] font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                  {key}
                </kbd>
                <span className="text-[8px] font-hud text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
