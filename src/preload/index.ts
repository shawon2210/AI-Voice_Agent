import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getRealtimeToken: () => electronAPI.ipcRenderer.invoke('get-realtime-token'),
  exaSearch: (query: string) => electronAPI.ipcRenderer.invoke('exa-search', query),
  setWindowMode: (mode: 'full' | 'computer') =>
    electronAPI.ipcRenderer.invoke('set-window-mode', mode),
  executeComputerAction: (payload: any) =>
    electronAPI.ipcRenderer.invoke('execute-computer-action', payload),
  generateImage: (prompt: string) => electronAPI.ipcRenderer.invoke('generate-image', prompt),
  captureScreenshot: () => electronAPI.ipcRenderer.invoke('capture-screenshot'),
  exportConversation: (transcript: any[], format: string) =>
    electronAPI.ipcRenderer.invoke('export-conversation', transcript, format),
  selectAndReadFile: () => electronAPI.ipcRenderer.invoke('select-and-read-file'),
  readFileByPath: (path: string) => electronAPI.ipcRenderer.invoke('read-file-by-path', path),
  revealFileInExplorer: (path: string) =>
    electronAPI.ipcRenderer.invoke('reveal-file-in-explorer', path),
  windowMinimize: () => electronAPI.ipcRenderer.send('window-minimize'),
  windowMaximize: () => electronAPI.ipcRenderer.send('window-maximize'),
  windowClose: () => electronAPI.ipcRenderer.send('window-close'),
  onToggleMicFromTray: (callback: () => void) =>
    electronAPI.ipcRenderer.on('toggle-mic-from-tray', callback)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
