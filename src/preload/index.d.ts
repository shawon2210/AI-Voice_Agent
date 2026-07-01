import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getRealtimeToken: () => Promise<string>
      exaSearch: (query: string) => Promise<any>
      setWindowMode: (mode: 'full' | 'computer') => Promise<void>
      executeComputerAction: (payload: any) => Promise<any>
      generateImage: (prompt: string) => Promise<any>
      captureScreenshot: () => Promise<any>
      exportConversation: (transcript: any[], format: string) => Promise<any>
      selectAndReadFile: () => Promise<any>
      readFileByPath: (path: string) => Promise<any>
      revealFileInExplorer: (path: string) => Promise<any>
      windowMinimize: () => void
      windowMaximize: () => void
      windowClose: () => void
      onToggleMicFromTray: (callback: () => void) => void
    }
  }
}
