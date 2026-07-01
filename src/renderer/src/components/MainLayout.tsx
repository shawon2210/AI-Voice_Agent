import React from 'react'
import { useAppStore, VoiceMode } from '../store/useAppStore'
import { Avatar, getModeColor } from './Avatar'
import { Waveform } from './Waveform'
import { useRealtimeVoice } from '../hooks/useRealtimeVoice'
const Mermaid = React.lazy(() => import('./Mermaid'));
import { Markdown } from './Markdown'
import { ComputerOverlay } from './ComputerOverlay'
import { SettingsPanel } from './SettingsPanel'
import { DiagnosticsPanel } from './DiagnosticsPanel'

import { ToastNotification } from './Toast'
import { ResponsiveHeader } from './ResponsiveHeader'
import { Sidebar } from './layout/Sidebar'

import {
  Activity,
  Mic,
  MicOff,
  Radio,
  Terminal,
  Search,
  BookOpen,
  Image,
  Eye,
  Sliders,
  Brain,
  History,
  Plus,
  Trash2,
  Save,
  Settings
} from 'lucide-react'

export const MainLayout: React.FC = React.memo(() => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const voiceMode = useAppStore(state => state.voiceMode)
  const assistantState = useAppStore(state => state.assistantState)
  const connectionStatus = useAppStore(state => state.connectionStatus)
  const isMuted = useAppStore(state => state.isMuted)
  const transcript = useAppStore(state => state.transcript)
  const activeArtifact = useAppStore(state => state.activeArtifact)
  const setVoiceMode = useAppStore(state => state.setVoiceMode)
  const toggleMute = useAppStore(state => state.toggleMute)
  const searchResults = useAppStore(state => state.searchResults)
  const activeTab = useAppStore(state => state.activeTab)
  const setActiveTab = useAppStore(state => state.setActiveTab)
  const windowMode = useAppStore(state => state.windowMode)
  const safetyMode = useAppStore(state => state.safetyMode)
  const setSafetyMode = useAppStore(state => state.setSafetyMode)
  const gallery = useAppStore(state => state.gallery)
  const updateGalleryItem = useAppStore(state => state.updateGalleryItem)
  const deleteGalleryItem = useAppStore(state => state.deleteGalleryItem)
  const duplicateGalleryItem = useAppStore(state => state.duplicateGalleryItem)
  const notes = useAppStore(state => state.notes)
  const addNote = useAppStore(state => state.addNote)
  const updateNote = useAppStore(state => state.updateNote)
  const deleteNote = useAppStore(state => state.deleteNote)
  const showSettings = useAppStore(state => state.showSettings)
  const toggleSettings = useAppStore(state => state.toggleSettings)
  const showDiagnostics = useAppStore(state => state.showDiagnostics)
  const toggleDiagnostics = useAppStore(state => state.toggleDiagnostics)
  const themeAccent = useAppStore(state => state.themeAccent)
  const addToast = useAppStore(state => state.addToast)

  const [editingImage, setEditingImage] = React.useState<any | null>(null)
  const [overlayText, setOverlayText] = React.useState('')
  const [selectedFilter, setSelectedFilter] = React.useState<
    'normal' | 'cinematic' | 'grayscale' | 'sepia'
  >('normal')

  // Notes CRUD UI State
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(null)
  const [noteTitle, setNoteTitle] = React.useState('')
  const [noteContent, setNoteContent] = React.useState('')
  const [isEditingNote, setIsEditingNote] = React.useState(false)

  const { connect, disconnect, updateMuteState } = useRealtimeVoice()

  const themeColor = themeAccent || getModeColor(voiceMode, assistantState)

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      // Escape closes modals
      if (e.key === 'Escape') {
        if (editingImage) setEditingImage(null)
        else if (showSettings) toggleSettings()
        else if (showDiagnostics) toggleDiagnostics()
        return
      }

      if (e.ctrlKey && e.shiftKey) {
        const tabMap: Record<string, typeof activeTab> = {
          '1': 'artifacts',
          '2': 'search',
          '3': 'images',
          '4': 'notes',
          '5': 'history'
        }

        if (e.key === 'M' || e.key === 'm') {
          e.preventDefault()
          toggleMute()
          updateMuteState(!isMuted)
        } else if (e.key === 'S' || e.key === 's') {
          e.preventDefault()
          toggleSettings()
        } else if (e.key === 'D' || e.key === 'd') {
          e.preventDefault()
          toggleDiagnostics()
        } else if (tabMap[e.key]) {
          e.preventDefault()
          setActiveTab(tabMap[e.key])
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingImage, showSettings, showDiagnostics, isMuted])

  const handleConnectionToggle = () => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      disconnect()
    } else {
      connect()
    }
  }

  const handleMuteToggle = () => {
    toggleMute()
    // Update local tracks in active stream
    updateMuteState(!isMuted)
  }

  const modesList: { mode: VoiceMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'developer', label: 'Developer', icon: <Terminal size={14} /> },
    { mode: 'research', label: 'Research', icon: <Search size={14} /> },
    { mode: 'focus', label: 'Focus Mode', icon: <Eye size={14} /> },
    { mode: 'creative', label: 'Creative', icon: <Sliders size={14} /> },
    { mode: 'computer', label: 'Computer Control', icon: <Activity size={14} /> },
    { mode: 'image', label: 'Image Studio', icon: <Image size={14} /> },
    { mode: 'teaching', label: 'Teaching', icon: <BookOpen size={14} /> }
  ]

  if (windowMode === 'computer') {
    return <ComputerOverlay />
  }

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#040814] select-none text-slate-200">
      {/* Sleek Draggable Frameless Titlebar */}
      <div
        className="w-full h-8 bg-slate-950/70 border-b border-hud-cyan/5 flex items-center justify-between px-4 select-none relative z-50 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-1.5 pointer-events-none">
          <Terminal size={10} style={{ color: themeColor }} />
          <span className="text-[9px] font-hud text-slate-400 uppercase tracking-widest">
            SHAWON OS v1.0.0 &mdash; MULTIMODAL ASSISTANT
          </span>
        </div>
        <div
          className="flex items-center gap-1.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => window.api.windowMinimize()}
            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono text-slate-500 hover:text-slate-200 hover:bg-slate-900 cursor-pointer"
            title="Minimize"
          >
            &mdash;
          </button>
          <button
            onClick={() => window.api.windowMaximize()}
            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono text-slate-500 hover:text-slate-200 hover:bg-slate-900 cursor-pointer"
            title="Maximize"
          >
            ❑
          </button>
          <button
            onClick={() => window.api.windowClose()}
            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
            title="Minimize to Tray"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Dynamic Toast Notifications HUD */}
      <ToastNotification />
      {/* HUD Scanner Scanline Effect */}
      <div className="scanline" />

      {/* Cyber Grid Background */}
      <div className="hud-grid-bg" />

      {/* Main Grid Content */}
      <main className="relative z-10 flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-5 p-5 overflow-hidden">
        {/* Mobile Drawer (hamburger) */}
        {isMenuOpen && (
          <aside
            className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-sm md:hidden"
            onClick={toggleMenu}
          >
            <nav
              className="bg-slate-950/95 w-64 h-full p-4 glass-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="mb-4 text-slate-400 hover:text-slate-200" onClick={toggleMenu}>
                Close
              </button>
              <div className="flex flex-col gap-2">
                {(['artifacts', 'search', 'images', 'notes', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab)
                      toggleMenu()
                    }}
                    className={`text-left px-2 py-1 ${activeTab === tab ? 'text-hud-cyan' : 'text-slate-400'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </nav>
          </aside>
        )}
        {/* Header with hamburger */}
        <ResponsiveHeader onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />
        {/* Left Panel */}
        <section className="md:col-span-3 hidden md:block">
          <Sidebar isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
          <Avatar />
          <div className="mt-8 text-center">Neural Link Status</div>
          <div
            className="text-xs font-semibold mt-1 tracking-wider uppercase font-hud"
            style={{ color: themeColor }}
          >
            {connectionStatus === 'connected'
              ? 'Neural Link Established'
              : connectionStatus === 'connecting'
                ? 'Synchronizing Synapses...'
                : connectionStatus === 'error'
                  ? 'Link Disruption Detected'
                  : 'Link Offline'}
          </div>

          {/* Voice Waveform */}
          <Waveform />

          {/* HUD Mode Grid */}
          <div className="glass-panel border border-hud-cyan/10 rounded-xl p-4 bg-slate-950/20 flex flex-col gap-3">
            <h3 className="font-hud text-[10px] text-hud-cyan/50 tracking-wider uppercase">
              System Operations Mode
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {modesList.map((m) => {
                const isSelected = voiceMode === m.mode
                return (
                  <button
                    key={m.mode}
                    onClick={() => setVoiceMode(m.mode)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-hud rounded-lg border transition-all duration-300 ${
                      isSelected
                        ? 'bg-slate-950 border-hud-cyan/30 text-hud-cyan'
                        : 'border-slate-800/40 bg-slate-950/20 text-slate-400 hover:text-slate-200 hover:border-slate-700/50'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: `${themeColor}40`,
                            color: themeColor,
                            boxShadow: `0 0 10px ${themeColor}10`
                          }
                        : {}
                    }
                  >
                    <span style={{ color: isSelected ? themeColor : 'inherit' }}>{m.icon}</span>
                    <span className="truncate">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Right Panel: Artifact Panel & Conversations */}
        <section className="md:col-span-9 grid grid-rows-10 gap-4 overflow-hidden">
          {/* Artifact Console */}
          <div className="row-span-7 glass-panel border border-hud-cyan/10 rounded-xl flex flex-col overflow-hidden bg-slate-950/20">
            <div className="hud-corner hud-corner-tl" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-tr" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-bl" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-br" style={{ borderColor: themeColor }} />

            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-hud-cyan/5 bg-slate-950/50 px-4 py-2">
              <div className="flex gap-4">
                {(['artifacts', 'search', 'images', 'notes', 'history'] as const).map((tab) => {
                  const isActive = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-[10px] font-hud tracking-widest uppercase transition-all duration-300 pb-1 border-b-2 cursor-pointer ${
                        isActive
                          ? 'border-hud-cyan text-hud-cyan'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                      style={isActive ? { borderColor: themeColor, color: themeColor } : {}}
                    >
                      {tab}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-hud-cyan/30 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-hud-blue/30 animate-pulse delay-75" />
              </div>
            </div>

            {/* Tab Content rendering */}
            <div className="flex-1 p-5 overflow-y-auto select-text">
              {activeTab === 'artifacts' && (
                <div className="h-full flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-800/40 pb-2 mb-1">
                    <span className="text-[9px] font-hud text-slate-500 uppercase tracking-wider">
                      Loaded HUD System Asset
                    </span>
                    <button
                      onClick={async () => {
                        const res = await window.api.selectAndReadFile()
                        if (res && res.success) {
                          useAppStore.getState().setActiveArtifact({
                            title: res.fileName,
                            content: `### File: ${res.fileName}\n\nPath: \`${res.path}\`\n\n\`\`\`\n${res.content}\n\`\`\``,
                            type: 'markdown'
                          })
                          addToast(`Loaded file: ${res.fileName}`, 'success')
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[8px] font-hud rounded cursor-pointer transition-colors"
                    >
                      📁 READ FILE
                    </button>
                  </div>
                  {activeArtifact ? (
                    <div className="flex flex-col gap-3">
                      <h2
                        className="text-sm font-hud text-hud-cyan uppercase tracking-wider"
                        style={{ color: themeColor }}
                      >
                        {activeArtifact.title}
                      </h2>
                      {activeArtifact.type === 'mermaid' ? (
                        <Mermaid code={activeArtifact.content} />
                      ) : (
                        <Markdown content={activeArtifact.content} />
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 py-20">
                      <Brain size={32} className="opacity-20" />
                      <p className="font-hud text-xs tracking-wider opacity-30">
                        NO ACTIVE ARTIFACTS
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'search' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span
                      className="text-xs font-hud text-hud-cyan uppercase tracking-wider"
                      style={{ color: themeColor }}
                    >
                      Search Results Stream
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">EXA API</span>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 font-hud text-xs tracking-wider opacity-30">
                      NO SEARCH DATA RETRIEVED YET
                    </div>
                  ) : (
                    searchResults.map((result: any, idx: number) => (
                      <div
                        key={idx}
                        className="glass-panel p-4 rounded-xl border border-hud-cyan/5 bg-slate-950/40 hover:border-hud-cyan/20 transition-all duration-300"
                      >
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-hud text-hud-cyan hover:underline font-semibold block leading-tight mb-1"
                          style={{ color: themeColor }}
                        >
                          {result.title}
                        </a>
                        <span className="text-[8px] font-mono text-slate-400 block mb-2 break-all">
                          {result.url}
                        </span>
                        {result.highlights && result.highlights.length > 0 && (
                          <div
                            className="mt-2 text-xs border-l-2 border-hud-cyan/35 pl-3 text-slate-300 italic leading-relaxed"
                            style={{ borderColor: themeColor }}
                          >
                            "...{result.highlights[0]}..."
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'images' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span
                      className="text-xs font-hud text-hud-cyan uppercase tracking-wider"
                      style={{ color: themeColor }}
                    >
                      Image Studio Gallery
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {gallery.length} Generated Assets
                    </span>
                  </div>

                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="flex flex-col gap-4 h-full min-h-[350px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span
                      className="text-xs font-hud text-hud-cyan uppercase tracking-wider"
                      style={{ color: themeColor }}
                    >
                      HUD Notes Console
                    </span>
                    <button
                      onClick={() => {
                        const newId = addNote('New Log', '')
                        setActiveNoteId(newId)
                        setNoteTitle('New Log')
                        setNoteContent('')
                        setIsEditingNote(true)
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-hud-cyan/15 hover:bg-hud-cyan/25 border border-hud-cyan/35 text-hud-cyan text-[10px] font-hud rounded-lg cursor-pointer transition-all duration-300"
                      style={{
                        color: themeColor,
                        borderColor: `${themeColor}40`,
                        backgroundColor: `${themeColor}15`
                      }}
                    >
                      <Plus size={10} />
                      <span>NEW NOTE</span>
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 font-hud text-xs tracking-wider opacity-35 flex flex-col items-center gap-2">
                      <BookOpen size={32} className="opacity-20 animate-pulse" />
                      NO NOTES STORED IN SYSTEM MEMORY.
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-4 h-[300px] overflow-hidden">
                      {/* Left: Notes List */}
                      <div className="col-span-4 border-r border-slate-800/40 pr-3 flex flex-col gap-2 overflow-y-auto h-full scroll-smooth">
                        {notes.map((note) => {
                          const isSelected = activeNoteId === note.id
                          return (
                            <button
                              key={note.id}
                              onClick={() => {
                                setActiveNoteId(note.id)
                                setNoteTitle(note.title)
                                setNoteContent(note.content)
                                setIsEditingNote(false)
                              }}
                              className={`w-full text-left p-2.5 rounded-lg border transition-all duration-300 flex flex-col gap-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 border-hud-cyan/30 text-hud-cyan'
                                  : 'bg-slate-950/20 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                              }`}
                              style={
                                isSelected
                                  ? { borderColor: `${themeColor}40`, color: themeColor }
                                  : {}
                              }
                            >
                              <span className="text-[10px] font-hud uppercase tracking-wider font-semibold truncate block">
                                {note.title}
                              </span>
                              <span className="text-[8px] font-mono text-slate-500">
                                {new Date(note.timestamp).toLocaleDateString()}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Right: Active Note Pane */}
                      <div className="col-span-8 flex flex-col gap-3 h-full overflow-y-auto pl-1">
                        {activeNoteId ? (
                          isEditingNote ? (
                            <div className="flex flex-col gap-3 h-full justify-between">
                              <div className="flex flex-col gap-2">
                                <label className="text-[8px] font-hud text-slate-500 uppercase">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={noteTitle}
                                  onChange={(e) => setNoteTitle(e.target.value)}
                                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-hud-cyan/30 font-mono"
                                />
                              </div>
                              <div className="flex-1 flex flex-col gap-2">
                                <label className="text-[8px] font-hud text-slate-500 uppercase">
                                  Content
                                </label>
                                <textarea
                                  value={noteContent}
                                  onChange={(e) => setNoteContent(e.target.value)}
                                  rows={6}
                                  className="w-full flex-1 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-hud-cyan/30 font-mono resize-none"
                                />
                              </div>
                              <div className="flex gap-2 border-t border-slate-900 pt-2.5">
                                <button
                                  onClick={() => {
                                    updateNote(activeNoteId, noteTitle, noteContent)
                                    setIsEditingNote(false)
                                  }}
                                  className="flex items-center gap-1 px-4 py-1.5 bg-hud-green/10 hover:bg-hud-green/20 border border-hud-green/30 text-hud-green text-[10px] font-hud rounded-lg cursor-pointer transition-all duration-300"
                                >
                                  <Save size={10} />
                                  <span>SAVE</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const orig = notes.find((n) => n.id === activeNoteId)
                                    if (orig) {
                                      setNoteTitle(orig.title)
                                      setNoteContent(orig.content)
                                    }
                                    setIsEditingNote(false)
                                  }}
                                  className="px-4 py-1.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 text-[10px] font-hud rounded-lg cursor-pointer transition-all duration-300"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3 h-full">
                              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                                <h3
                                  className="text-xs font-hud text-hud-cyan uppercase tracking-wider"
                                  style={{ color: themeColor }}
                                >
                                  {noteTitle}
                                </h3>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setIsEditingNote(true)}
                                    className="text-[9px] font-hud text-hud-cyan hover:underline cursor-pointer"
                                  >
                                    EDIT
                                  </button>
                                  <button
                                    onClick={() => {
                                      deleteNote(activeNoteId)
                                      setActiveNoteId(null)
                                      setNoteTitle('')
                                      setNoteContent('')
                                    }}
                                    className="text-[9px] font-hud text-hud-red hover:underline flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Trash2 size={8} />
                                    <span>DELETE</span>
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed overflow-y-auto max-h-[220px]">
                                {noteContent || (
                                  <span className="text-slate-600 italic">
                                    No content. Click Edit to add details.
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-600 italic text-[10px] py-16">
                            Select a note from the logs.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 mb-2">
                    <span className="text-xs font-hud text-slate-400 uppercase tracking-wider">
                      Session Memory Logs
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          const res = await window.api.exportConversation(transcript, 'markdown')
                          if (res && res.success) {
                            addToast(`Conversation exported to Markdown`, 'success')
                          }
                        }}
                        className="text-[9px] font-hud text-hud-cyan hover:underline cursor-pointer"
                      >
                        EXPORT MD
                      </button>
                      <button
                        onClick={async () => {
                          const res = await window.api.exportConversation(transcript, 'json')
                          if (res && res.success) {
                            addToast(`Conversation exported to JSON`, 'success')
                          }
                        }}
                        className="text-[9px] font-hud text-hud-cyan hover:underline cursor-pointer"
                      >
                        EXPORT JSON
                      </button>
                      <button
                        className="text-[9px] font-hud text-hud-red hover:underline cursor-pointer"
                        onClick={() => {
                          useAppStore.getState().clearTranscript()
                          addToast('Transcripts cleared', 'info')
                        }}
                      >
                        CLEAR
                      </button>
                    </div>
                  </div>
                  {transcript.map((t) => (
                    <div
                      key={t.id}
                      className="text-xs border-b border-slate-900 pb-2 mb-1 flex items-start gap-3"
                    >
                      <span className="font-hud uppercase text-[9px] w-20 text-slate-400 shrink-0 font-bold">
                        [{t.role}]
                      </span>
                      <span className="font-sans text-slate-300 leading-normal">{t.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversations Transcript Stream */}
          <div className="row-span-3 glass-panel border border-hud-cyan/10 rounded-xl flex flex-col overflow-hidden bg-slate-950/20">
            <div className="hud-corner hud-corner-tl" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-tr" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-bl" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-br" style={{ borderColor: themeColor }} />

            <div className="flex items-center justify-between border-b border-hud-cyan/5 bg-slate-950/50 px-4 py-2">
              <div className="flex items-center gap-1.5">
                <History size={12} className="text-hud-cyan/60" />
                <span className="text-[10px] font-hud text-slate-300 tracking-wider uppercase">
                  TRANSCRIPTION MATRIX
                </span>
              </div>
              <span className="text-[9px] font-hud text-hud-cyan/40">REAL-TIME TELEMETRY</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scroll-smooth text-xs select-text">
              {transcript.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 font-hud text-[10px] tracking-widest opacity-35">
                  WAITING FOR AUDIO TRANSMISSION...
                </div>
              ) : (
                transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex flex-col max-w-[85%] rounded-lg p-2.5 border ${
                      entry.role === 'user'
                        ? 'self-end bg-hud-blue/5 border-hud-blue/20 text-slate-200'
                        : 'self-start bg-slate-950/50 border-hud-cyan/15 text-slate-300'
                    }`}
                  >
                    <span
                      className="text-[9px] font-hud font-bold tracking-wider mb-1 uppercase"
                      style={{ color: entry.role === 'user' ? '#0070ff' : themeColor }}
                    >
                      {entry.role === 'user' ? 'Shawon' : 'A.I. Companion'}
                    </span>
                    <p className="font-sans leading-relaxed">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Control Dock */}
      <footer className="relative z-10 h-16 border-t border-hud-cyan/10 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6">
        {/* Left Connection control */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleConnectionToggle}
            className={`font-hud text-xs tracking-widest px-4 py-1.5 rounded-full border transition-all duration-300 ${
              connectionStatus === 'connected'
                ? 'bg-hud-cyan/10 border-hud-cyan/40 text-hud-cyan hover:bg-hud-red/10 hover:border-hud-red/40 hover:text-hud-red'
                : connectionStatus === 'connecting'
                  ? 'bg-hud-gold/10 border-hud-gold/40 text-hud-gold animate-pulse'
                  : 'bg-hud-cyan/5 border-slate-700/60 text-slate-400 hover:text-hud-cyan hover:border-hud-cyan/40'
            }`}
            style={
              connectionStatus === 'connected' ? { boxShadow: `0 0 10px ${themeColor}15` } : {}
            }
          >
            {connectionStatus === 'connected'
              ? 'DISCONNECT'
              : connectionStatus === 'connecting'
                ? 'SYNCING...'
                : 'INITIATE NEURAL LINK'}
          </button>

          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1.5 text-[10px] font-hud text-hud-cyan/50">
              <Radio size={10} className="animate-pulse" />
              <span>LINK ACTIVE</span>
            </div>
          )}
        </div>

        {/* Center Mic control */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
          <button
            onClick={handleMuteToggle}
            disabled={connectionStatus !== 'connected'}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${
              connectionStatus !== 'connected'
                ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-950/30 text-slate-600'
                : isMuted
                  ? 'bg-hud-red/10 border-hud-red/40 text-hud-red hover:bg-hud-red/20'
                  : 'bg-hud-cyan/10 border-hud-cyan/40 text-hud-cyan hover:bg-hud-cyan/20'
            }`}
            style={
              connectionStatus === 'connected' && !isMuted
                ? { boxShadow: `0 0 15px ${themeColor}20` }
                : {}
            }
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>

        {/* Right HUD info */}
        <div className="flex items-center gap-4 text-[10px] font-hud tracking-widest text-slate-400">
          <div className="flex items-center gap-1 border-l border-slate-800 pl-4">
            <span className="opacity-50">SAFETY:</span>
            <div className="flex gap-1 ml-1.5">
              {(['safe', 'developer', 'autonomous'] as const).map((mode) => {
                const isActive = safetyMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => setSafetyMode(mode)}
                    className={`px-1.5 py-0.5 rounded text-[8px] cursor-pointer transition-all duration-300 uppercase ${
                      isActive
                        ? 'bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/30'
                        : 'border border-transparent text-slate-500 hover:text-slate-350'
                    }`}
                    style={
                      isActive
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
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
            <span className="opacity-50">LATENCY:</span>
            <span className={connectionStatus === 'connected' ? 'text-hud-cyan' : 'text-slate-500'}>
              {connectionStatus === 'connected' ? '38ms' : '--'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
            <span className="opacity-50">AUDIO COPIER:</span>
            <span
              className={connectionStatus === 'connected' ? 'text-hud-green' : 'text-slate-550'}
            >
              PCM_16BIT
            </span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
            <button
              onClick={toggleSettings}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer transition-all duration-200"
              title="Settings (Ctrl+Shift+S)"
            >
              <Settings size={12} />
              <span className="text-[9px] font-hud uppercase tracking-wider">Config</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={toggleSettings} themeColor={themeColor} />

      {/* Diagnostics Panel */}
      <DiagnosticsPanel
        isOpen={showDiagnostics}
        onClose={toggleDiagnostics}
        themeColor={themeColor}
      />

      {/* Dynamic Image Studio Canvas Editor Modal */}
      {editingImage && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 select-text">
          <div className="glass-panel w-full max-w-lg p-6 border border-hud-cyan/15 rounded-2xl bg-slate-950/95 flex flex-col gap-4 relative">
            <div className="hud-corner hud-corner-tl" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-tr" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-bl" style={{ borderColor: themeColor }} />
            <div className="hud-corner hud-corner-br" style={{ borderColor: themeColor }} />

            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-xs font-hud text-hud-cyan uppercase tracking-widest">
                Image Canvas Editor
              </span>
              <button
                onClick={() => setEditingImage(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4">
              {/* Preview Container */}
              <div className="w-1/2 aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-950 relative">
                <img
                  src={editingImage.url}
                  alt="Edit preview"
                  className={`w-full h-full object-cover ${
                    selectedFilter === 'grayscale'
                      ? 'grayscale'
                      : selectedFilter === 'sepia'
                        ? 'sepia'
                        : selectedFilter === 'cinematic'
                          ? 'contrast-125 saturate-150 brightness-95 hue-rotate-15'
                          : ''
                  }`}
                />
                {overlayText && (
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 py-2 text-center border-t border-hud-cyan/10">
                    <span className="text-[10px] font-hud text-hud-cyan font-bold tracking-widest block uppercase">
                      {overlayText}
                    </span>
                  </div>
                )}
              </div>

              {/* Editing Controls */}
              <div className="flex-1 flex flex-col gap-3 justify-between">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-hud text-slate-500 uppercase">
                    Text Overlay
                  </label>
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="ENTER OVERLAY TEXT..."
                    className="w-full bg-slate-900/60 border border-hud-cyan/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-hud-cyan/35 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-hud text-slate-500 uppercase">
                    Color Grading Filters
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['normal', 'cinematic', 'grayscale', 'sepia'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFilter(f)}
                        className={`py-1 text-[9px] font-hud rounded-lg border transition-all duration-300 uppercase cursor-pointer ${
                          selectedFilter === f
                            ? 'bg-hud-cyan/15 text-hud-cyan border-hud-cyan/35'
                            : 'border-slate-800/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      updateGalleryItem(editingImage.id, {
                        textOverlay: overlayText || undefined,
                        filter: selectedFilter
                      })
                      setEditingImage(null)
                    }}
                    className="flex-1 py-1.5 bg-hud-cyan/10 hover:bg-hud-cyan/20 border border-hud-cyan/30 text-hud-cyan text-[10px] font-hud rounded-lg cursor-pointer transition-all duration-300"
                  >
                    APPLY CHANGES
                  </button>
                  <button
                    onClick={() => setEditingImage(null)}
                    className="py-1.5 px-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-hud rounded-lg cursor-pointer transition-all duration-300"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
