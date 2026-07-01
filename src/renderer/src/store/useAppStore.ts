import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AssistantState =
  'idle' | 'listening' | 'thinking' | 'speaking' | 'searching' | 'executing' | 'error' | 'success'

export type VoiceMode =
  | 'developer'
  | 'research'
  | 'creative'
  | 'focus'
  | 'computer'
  | 'image'
  | 'presentation'
  | 'teaching'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface TranscriptEntry {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  timestamp: Date
}

export interface ComputerAction {
  id: string
  action: string
  detail: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  timestamp: Date
}

export interface ActionApproval {
  id: string
  resolve: (approved: boolean) => void
  action: string
  detail: string
}

export interface Artifact {
  title: string
  content: string
  type: 'markdown' | 'code' | 'mermaid' | 'image'
  language?: string
}

export interface GalleryItem {
  id: string
  url: string // base64 string
  prompt: string
  isFavorite: boolean
  timestamp: Date
  filter?: 'normal' | 'cinematic' | 'grayscale' | 'sepia'
  textOverlay?: string
  path?: string // local absolute path
}

export interface Note {
  id: string
  title: string
  content: string
  timestamp: string // stored as string for persistence compatibility
}

export interface MemoryContext {
  preferences: Record<string, string>
  projects: string[]
  context: string
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface AppState {
  assistantState: AssistantState
  voiceMode: VoiceMode
  connectionStatus: ConnectionStatus
  isMuted: boolean
  audioAmplitude: number
  transcript: TranscriptEntry[]
  activeArtifact: Artifact | null
  searchResults: any[]
  activeTab: 'artifacts' | 'search' | 'images' | 'notes' | 'history'
  windowMode: 'full' | 'computer'
  safetyMode: 'safe' | 'developer' | 'autonomous'
  actionQueue: ComputerAction[]
  pendingActionApproval: ActionApproval | null
  gallery: GalleryItem[]
  notes: Note[]
  memory: MemoryContext
  showSettings: boolean
  showDiagnostics: boolean
  themeAccent: string
  toasts: Toast[]

  // Actions
  setAssistantState: (state: AssistantState) => void
  setVoiceMode: (mode: VoiceMode) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  toggleMute: () => void
  setAudioAmplitude: (amplitude: number) => void
  addTranscriptEntry: (role: 'user' | 'assistant' | 'system', text: string) => void
  setActiveArtifact: (artifact: Artifact | null) => void
  setSearchResults: (results: any[]) => void
  setActiveTab: (tab: 'artifacts' | 'search' | 'images' | 'notes' | 'history') => void
  setWindowMode: (mode: 'full' | 'computer') => void
  setSafetyMode: (mode: 'safe' | 'developer' | 'autonomous') => void
  addActionToQueue: (action: string, detail: string) => string
  updateActionStatus: (id: string, status: 'pending' | 'executing' | 'completed' | 'failed') => void
  setPendingActionApproval: (approval: ActionApproval | null) => void
  addImageToGallery: (url: string, prompt: string, path?: string) => void
  updateGalleryItem: (id: string, updates: Partial<GalleryItem>) => void
  deleteGalleryItem: (id: string) => void
  duplicateGalleryItem: (id: string) => void

  // Notes CRUD Actions
  addNote: (title: string, content: string) => string
  updateNote: (id: string, title: string, content: string) => void
  deleteNote: (id: string) => void

  // Memory Actions
  setMemoryPreference: (key: string, value: string) => void
  addMemoryProject: (project: string) => void
  updateMemoryContext: (context: string) => void

  // Settings & Polish Actions
  toggleSettings: () => void
  toggleDiagnostics: () => void
  setThemeAccent: (accent: string) => void
  clearAllData: () => void

  // Toast Actions
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void

  clearTranscript: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      assistantState: 'idle',
      voiceMode: 'developer',
      connectionStatus: 'disconnected',
      isMuted: false,
      audioAmplitude: 0,
      transcript: [],
      activeArtifact: {
        title: 'Welcome to Shawon OS',
        type: 'markdown',
        content: `# Shawon OS v1.0.0 — Desktop Multimodal AI Companion

Welcome, Shawon. I am ready to assist you. 

### Active Systems
- **AI Core**: OpenAI GPT Realtime 2
- **Search Core**: EXA API Engine
- **Computer Controls**: Local PowerShell Bridge Active
- **HUD Mode**: Developer (Default)

*Speak to initiate connection or select an action below.*`
      },
      searchResults: [],
      activeTab: 'artifacts',
      windowMode: 'full',
      safetyMode: 'safe',
      actionQueue: [],
      pendingActionApproval: null,
      gallery: [],
      notes: [],
      memory: {
        preferences: {},
        projects: ['Shawon Voice Agent'],
        context: 'Developer profile active.'
      },
      showSettings: false,
      showDiagnostics: false,
      themeAccent: '#06b6d4',
      toasts: [],

      setAssistantState: (assistantState) => set({ assistantState }),
      setVoiceMode: (voiceMode) => set({ voiceMode }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setAudioAmplitude: (audioAmplitude) => set({ audioAmplitude }),
      addTranscriptEntry: (role, text) =>
        set((state) => ({
          transcript: [
            ...state.transcript,
            {
              id: Math.random().toString(36).substring(2, 9),
              role,
              text,
              timestamp: new Date()
            }
          ]
        })),
      setActiveArtifact: (activeArtifact) => set({ activeArtifact }),
      setSearchResults: (searchResults) => set({ searchResults }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setWindowMode: (windowMode) => set({ windowMode }),
      setSafetyMode: (safetyMode) => set({ safetyMode }),
      addActionToQueue: (action, detail) => {
        const id = Math.random().toString(36).substring(2, 9)
        set((state) => ({
          actionQueue: [
            ...state.actionQueue,
            {
              id,
              action,
              detail,
              status: 'pending',
              timestamp: new Date()
            }
          ]
        }))
        return id
      },
      updateActionStatus: (id, status) =>
        set((state) => ({
          actionQueue: state.actionQueue.map((item) =>
            item.id === id ? { ...item, status } : item
          )
        })),
      setPendingActionApproval: (pendingActionApproval) => set({ pendingActionApproval }),
      addImageToGallery: (url, prompt, path) =>
        set((state) => ({
          gallery: [
            {
              id: Math.random().toString(36).substring(2, 9),
              url,
              prompt,
              isFavorite: false,
              timestamp: new Date(),
              filter: 'normal',
              path
            },
            ...state.gallery
          ]
        })),
      updateGalleryItem: (id, updates) =>
        set((state) => ({
          gallery: state.gallery.map((item) => (item.id === id ? { ...item, ...updates } : item))
        })),
      deleteGalleryItem: (id) =>
        set((state) => ({
          gallery: state.gallery.filter((item) => item.id !== id)
        })),
      duplicateGalleryItem: (id) =>
        set((state) => {
          const target = state.gallery.find((item) => item.id === id)
          if (!target) return {}
          const cloned: GalleryItem = {
            ...target,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
            isFavorite: false
          }
          return {
            gallery: [cloned, ...state.gallery]
          }
        }),

      // Notes CRUD
      addNote: (title, content) => {
        const id = Math.random().toString(36).substring(2, 9)
        set((state) => ({
          notes: [
            {
              id,
              title,
              content,
              timestamp: new Date().toISOString()
            },
            ...state.notes
          ]
        }))
        return id
      },
      updateNote: (id, title, content) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, title, content, timestamp: new Date().toISOString() } : note
          )
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id)
        })),

      // Memory
      setMemoryPreference: (key, value) =>
        set((state) => ({
          memory: {
            ...state.memory,
            preferences: {
              ...state.memory.preferences,
              [key]: value
            }
          }
        })),
      addMemoryProject: (project) =>
        set((state) => ({
          memory: {
            ...state.memory,
            projects: state.memory.projects.includes(project)
              ? state.memory.projects
              : [...state.memory.projects, project]
          }
        })),
      updateMemoryContext: (context) =>
        set((state) => ({
          memory: {
            ...state.memory,
            context
          }
        })),

      clearTranscript: () => set({ transcript: [] }),

      // Settings & Polish
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      toggleDiagnostics: () => set((state) => ({ showDiagnostics: !state.showDiagnostics })),
      setThemeAccent: (themeAccent) => set({ themeAccent }),
      clearAllData: () =>
        set({
          gallery: [],
          notes: [],
          memory: {
            preferences: {},
            projects: ['Shawon Voice Agent'],
            context: 'Developer profile active.'
          }
        }),

      // Toast Actions implementation
      addToast: (message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9)
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }))
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }))
    }),
    {
      name: 'shawon-hud-storage',
      // Only persist specific variables (exclude ephemeral media links/streams/amplitude)
      partialize: (state) => ({
        gallery: state.gallery,
        notes: state.notes,
        memory: state.memory,
        safetyMode: state.safetyMode,
        voiceMode: state.voiceMode,
        themeAccent: state.themeAccent
      })
    }
  )
)
