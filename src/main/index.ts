import 'dotenv/config'
import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  dialog,
  desktopCapturer
} from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#040814',
    frame: false,
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (mainWindow) {
    mainWindow.on('ready-to-show', () => {
      mainWindow?.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Ephemeral Realtime Token Handler
  ipcMain.handle('get-realtime-token', async () => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in .env file.')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy',
          instructions: `You are Shawon, a professional desktop AI assistant. Keep responses short and concise unless requested otherwise. You can use tools to search the web, generate diagrams, edit images, and control the user's computer.`
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create session: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as { client_secret: { value: string } }
      return data.client_secret.value
    } catch (error: any) {
      console.error('Error fetching ephemeral token:', error)
      throw new Error(error.message || 'Error fetching ephemeral token')
    }
  })

  // Exa Search IPC Handler
  ipcMain.handle('exa-search', async (_, query: string) => {
    const apiKey = process.env.EXA_API_KEY
    if (!apiKey) {
      throw new Error('EXA_API_KEY is not defined in .env file.')
    }

    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          numResults: 5,
          contents: {
            text: true,
            highlights: true
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Exa search failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      console.error('Error in exa-search IPC handler:', error)
      throw new Error(error.message || 'Error executing Exa search')
    }
  })

  // Window Mode Controller
  ipcMain.handle('set-window-mode', async (_, mode: 'full' | 'computer') => {
    if (!mainWindow) return

    if (mode === 'computer') {
      const primaryDisplay = screen.getPrimaryDisplay()
      const { height } = primaryDisplay.workArea

      mainWindow.setAlwaysOnTop(true, 'screen-saver')
      mainWindow.setMinimumSize(320, 450)
      mainWindow.setSize(320, 450)
      mainWindow.setPosition(20, height - 450 - 20)
      mainWindow.setOpacity(0.85)
    } else {
      mainWindow.setAlwaysOnTop(false)
      mainWindow.setMinimumSize(1100, 700)
      mainWindow.setSize(1400, 900)
      mainWindow.center()
      mainWindow.setOpacity(1.0)
    }
  })

  // Desktop Automation Script Handler
  ipcMain.handle('execute-computer-action', async (_, payload: any) => {
    let script = ''

    if (payload.action === 'click') {
      script = `
        Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y); [DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);' -Name "Win32Mouse" -Namespace "Win32" -PassThru | Out-Null
        [Win32.Win32Mouse]::SetCursorPos(${payload.x}, ${payload.y})
        [Win32.Win32Mouse]::mouse_event(0x0002, 0, 0, 0, 0)
        Start-Sleep -Milliseconds 100
        [Win32.Win32Mouse]::mouse_event(0x0004, 0, 0, 0, 0)
      `
    } else if (payload.action === 'move') {
      script = `
        Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);' -Name "Win32Mouse" -Namespace "Win32" -PassThru | Out-Null
        [Win32.Win32Mouse]::SetCursorPos(${payload.x}, ${payload.y})
      `
    } else if (payload.action === 'type') {
      const escapedText = payload.text.replace(/([+^%~{}()\[\]])/g, '{$1}')
      script = `
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait("${escapedText}")
      `
    } else if (payload.action === 'keypress') {
      const keyMap: Record<string, string> = {
        enter: '{ENTER}',
        tab: '{TAB}',
        backspace: '{BACKSPACE}',
        escape: '{ESC}',
        up: '{UP}',
        down: '{DOWN}',
        left: '{LEFT}',
        right: '{RIGHT}',
        space: ' '
      }
      const mappedKey = keyMap[payload.key.toLowerCase()] || payload.key
      script = `
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait("${mappedKey}")
      `
    } else if (payload.action === 'shortcut') {
      const mapped = payload.keys
        .toLowerCase()
        .replace(/ctrl\+/g, '^')
        .replace(/alt\+/g, '%')
        .replace(/shift\+/g, '+')
        .replace(/enter/g, '{ENTER}')
        .replace(/tab/g, '{TAB}')
        .replace(/backspace/g, '{BACKSPACE}')
        .replace(/escape/g, '{ESC}')
      script = `
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait("${mapped}")
      `
    } else if (payload.action === 'launch') {
      script = `Start-Process "${payload.app}"`
    } else if (payload.action === 'openUrl') {
      script = `Start-Process "${payload.url}"`
    }

    return new Promise((resolve, reject) => {
      exec(
        `powershell.exe -NoProfile -NonInteractive -Command "${script.replace(/\n/g, ' ')}"`,
        (error, _stdout, stderr) => {
          if (error) {
            console.error('PowerShell automation error:', stderr)
            reject(new Error(stderr || error.message))
          } else {
            resolve({ success: true })
          }
        }
      )
    })
  })

  // GPT Image Generation Handler
  ipcMain.handle('generate-image', async (_, prompt: string) => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in .env file.')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.IMAGE_MODEL || 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DALL-E image generation failed: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as { data: Array<{ b64_json: string }> }
      const b64 = data.data[0].b64_json

      const targetDir = 'd:/02_Projects/Shawon Voice Agent/generated-images'
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      const fileName = `img_${Date.now()}.png`
      const filePath = join(targetDir, fileName)
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'))

      return {
        url: `data:image/png;base64,${b64}`,
        path: filePath,
        fileName
      }
    } catch (error: any) {
      console.error('Error generating image in main process:', error)
      throw new Error(error.message || 'Error generating DALL-E image')
    }
  })

  // Screenshot Capture Handler
  ipcMain.handle('capture-screenshot', async () => {
    try {
      // Minimize Shawon briefly so it doesn't appear in the screenshot
      if (mainWindow && mainWindow.isVisible()) {
        mainWindow.hide()
      }
      await new Promise((r) => setTimeout(r, 300))

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      })

      // Restore window
      if (mainWindow) {
        mainWindow.show()
      }

      if (!sources || sources.length === 0) {
        throw new Error('No screen sources found')
      }

      const screenshot = sources[0].thumbnail
      const buffer = screenshot.toPNG()

      const screenshotDir = join('d:/02_Projects/Shawon Voice Agent/generated-images/screenshots')
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true })
      }

      const fileName = `screenshot_${Date.now()}.png`
      const filePath = join(screenshotDir, fileName)
      fs.writeFileSync(filePath, buffer)

      const b64 = buffer.toString('base64')
      return {
        url: `data:image/png;base64,${b64}`,
        path: filePath,
        fileName
      }
    } catch (error: any) {
      // Restore window on error
      if (mainWindow) mainWindow.show()
      console.error('Screenshot capture error:', error)
      throw new Error(error.message || 'Screenshot capture failed')
    }
  })

  // Conversation Export Handler
  ipcMain.handle('export-conversation', async (_, transcript: any[], format: string) => {
    try {
      const defaultExt = format === 'json' ? 'json' : 'md'
      const result = await dialog.showSaveDialog({
        title: 'Export Conversation',
        defaultPath: join(
          app.getPath('documents'),
          `shawon_conversation_${Date.now()}.${defaultExt}`
        ),
        filters: [
          format === 'json'
            ? { name: 'JSON Files', extensions: ['json'] }
            : { name: 'Markdown Files', extensions: ['md'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, message: 'Export cancelled.' }
      }

      let content = ''
      if (format === 'json') {
        content = JSON.stringify(transcript, null, 2)
      } else {
        content = '# Shawon — Conversation Export\n\n'
        content += `> Exported on ${new Date().toLocaleString()}\n\n---\n\n`
        for (const entry of transcript) {
          const role = entry.role === 'user' ? '**🧑 Shawon**' : '**🤖 A.I. Companion**'
          content += `${role}\n\n${entry.text}\n\n---\n\n`
        }
      }

      fs.writeFileSync(result.filePath, content, 'utf-8')
      return { success: true, path: result.filePath }
    } catch (error: any) {
      console.error('Export error:', error)
      throw new Error(error.message || 'Conversation export failed')
    }
  })

  // Select and Read local text/code file via Dialog
  ipcMain.handle('select-and-read-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select File for Analysis',
        properties: ['openFile'],
        filters: [
          {
            name: 'Text & Code Files',
            extensions: [
              'txt',
              'md',
              'json',
              'csv',
              'js',
              'ts',
              'tsx',
              'py',
              'go',
              'rs',
              'cpp',
              'h',
              'css',
              'html',
              'yaml',
              'yml',
              'ini',
              'conf'
            ]
          }
        ]
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false }
      }

      const filePath = result.filePaths[0]
      const content = fs.readFileSync(filePath, 'utf8')
      const fileName = filePath.split(/[\\/]/).pop() || 'file'

      return {
        success: true,
        fileName,
        path: filePath,
        content
      }
    } catch (error: any) {
      console.error('Error selecting or reading file:', error)
      throw new Error(error.message || 'File reading failed')
    }
  })

  // Read local text/code file by absolute path
  ipcMain.handle('read-file-by-path', async (_, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
      }
      const content = fs.readFileSync(filePath, 'utf8')
      const fileName = filePath.split(/[\\/]/).pop() || 'file'
      return {
        success: true,
        fileName,
        content
      }
    } catch (error: any) {
      console.error('Error reading file by path:', error)
      throw new Error(error.message || 'File reading by path failed')
    }
  })

  // Reveal file in OS Explorer
  ipcMain.handle('reveal-file-in-explorer', async (_, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath)
        return { success: true }
      }
      return { success: false, error: 'File does not exist' }
    } catch (error: any) {
      console.error('Error revealing file in explorer:', error)
      throw new Error(error.message || 'Reveal in explorer failed')
    }
  })

  // Window Control Handlers (for frameless window)
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window-close', () => {
    // Minimize to tray instead of closing
    mainWindow?.hide()
  })

  createWindow()

  // System Tray
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon)
  tray.setToolTip('Shawon AI — Desktop Companion')

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Show / Hide Shawon',
      click: () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow?.show()
          mainWindow?.focus()
        }
      }
    },
    {
      label: 'Toggle Microphone',
      click: () => {
        mainWindow?.webContents.send('toggle-mic-from-tray')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Shawon',
      click: () => {
        mainWindow?.destroy()
        app.quit()
      }
    }
  ])
  tray.setContextMenu(trayMenu)
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  // Global Summon Hotkey: Ctrl+Shift+Space
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })

  // Override close to minimize to tray
  mainWindow?.on('close', (e) => {
    e.preventDefault()
    mainWindow?.hide()
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
