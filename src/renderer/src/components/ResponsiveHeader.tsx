import React from 'react'
import { getModeColor } from './Avatar'
import { useAppStore } from '../store/useAppStore'

import { Menu, X } from 'lucide-react'

interface ResponsiveHeaderProps {
  onMenuToggle: () => void
  isMenuOpen: boolean
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  const { voiceMode, assistantState, themeAccent, connectionStatus } = useAppStore()
  const themeColor = themeAccent || getModeColor(voiceMode, assistantState)

  return (
    <header className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-hud-cyan/10 bg-slate-950/40 backdrop-blur-md md:px-6">
      {/* Hamburger for mobile */}
      <button
        onClick={onMenuToggle}
        className="md:hidden flex items-center gap-2 text-[10px] font-hud text-slate-400 hover:text-slate-200"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={14} /> : <Menu size={14} />}
      </button>

      {/* Logo & Status */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }}
        />
        <h1 className="font-hud text-sm font-bold tracking-widest text-slate-100 flex items-center gap-1.5">
          SHAWON{' '}
          <span className="text-[10px] text-hud-cyan font-normal opacity-70">A.I. COMPANION</span>
        </h1>
      </div>

      {/* Right side status */}
      <div className="flex items-center gap-4 text-[10px] font-hud tracking-wider text-slate-400">
        <span className="opacity-50">CORE:</span>
        <span className="text-hud-cyan">{connectionStatus.toUpperCase()}</span>
        <span className="opacity-50">MODE:</span>
        <span className="uppercase" style={{ color: themeColor }}>
          {voiceMode}
        </span>
      </div>
    </header>
  )
}
