import { useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export const useRealtimeVoice = () => {
  const {
    setConnectionStatus,
    setAssistantState,
    setAudioAmplitude,
    addTranscriptEntry,
    isMuted,
    setActiveArtifact,
    setSearchResults,
    setActiveTab,
    setWindowMode,
    addActionToQueue,
    updateActionStatus,
    setPendingActionApproval,
    addImageToGallery,
    updateGalleryItem,
    deleteGalleryItem,
    addNote,
    updateNote,
    deleteNote,
    setMemoryPreference,
    addMemoryProject,
    updateMemoryContext,
    toggleMute,
    addToast
  } = useAppStore()

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Disconnect voice session
  const disconnect = useCallback(() => {
    console.log('Disconnecting Realtime Voice Session...')

    // Stop audio amplitude tracking
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Close WebRTC Data Channel
    if (dcRef.current) {
      dcRef.current.close()
      dcRef.current = null
    }

    // Close PeerConnection
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    // Stop mic stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    // Close AudioContext
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
      }
      audioCtxRef.current = null
    }

    setConnectionStatus('disconnected')
    setAssistantState('idle')
    setAudioAmplitude(0)
  }, [setConnectionStatus, setAssistantState, setAudioAmplitude])

  // Track remote audio stream amplitude
  const startAudioAnalysis = (remoteStream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContextClass()
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(remoteStream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      // Connect source to analyser, and analyser to output (speakers)
      source.connect(analyser)
      analyser.connect(audioCtx.destination)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkAmplitude = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteTimeDomainData(dataArray)

        // Calculate Root Mean Square (RMS) amplitude
        let sumSquares = 0
        for (let i = 0; i < bufferLength; i++) {
          const deviation = (dataArray[i] - 128) / 128
          sumSquares += deviation * deviation
        }

        const rms = Math.sqrt(sumSquares / bufferLength)

        // Damp amplitude for smoother animations
        setAudioAmplitude(rms * 1.5)

        animationFrameRef.current = requestAnimationFrame(checkAmplitude)
      }

      checkAmplitude()
    } catch (e) {
      console.error('Failed to initialize Web Audio API analysis:', e)
    }
  }

  // Connect to OpenAI Realtime WebRTC
  const connect = useCallback(async () => {
    try {
      setConnectionStatus('connecting')
      setAssistantState('thinking')

      // 1. Fetch ephemeral token from Main Process (which reads .env)
      const token = await window.api.getRealtimeToken()

      // 2. Initialize PeerConnection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // Set up remote media track listener (Assistant's voice output)
      pc.ontrack = (event) => {
        console.log('Received remote audio track from OpenAI Realtime')
        setAssistantState('speaking')
        startAudioAnalysis(event.streams[0])
      }

      // 3. Capture user's microphone
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      localStreamRef.current = localStream

      // Add local track to peer connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
      })

      // Handle mute state initially
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted
      })

      // 4. Setup Data Channel
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.onopen = () => {
        console.log('OpenAI Realtime WebRTC Data Channel is Open')
        setConnectionStatus('connected')
        setAssistantState('idle')

        // Build dynamic memory context for injection
        const currentMemory = useAppStore.getState().memory
        const currentNotes = useAppStore.getState().notes
        const memoryBlock = [
          '\n\n[LONG-TERM SYSTEM MEMORY]',
          `- User Preferences: ${JSON.stringify(currentMemory.preferences)}`,
          `- Active Projects: ${currentMemory.projects.join(', ')}`,
          `- Context: ${currentMemory.context}`,
          `- Saved Notes Count: ${currentNotes.length}`,
          currentNotes.length > 0
            ? `- Note Titles: ${currentNotes.map((n) => n.title).join(', ')}`
            : ''
        ]
          .filter(Boolean)
          .join('\n')

        // Send session update instructions with tools
        const sessionUpdate = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are Shawon, a professional, fast, intelligent, and expressive AI desktop companion. You help the user with coding, research, creative tasks, and daily workflows. You have access to tools for web search, diagram generation, computer automation, image generation, note-taking, and long-term memory storage. Use tools proactively when they serve the user's request. Be concise in speech but thorough in execution.${memoryBlock}`,
            input_audio_transcription: {
              model: 'whisper-1'
            },
            tools: [
              {
                type: 'function',
                name: 'exa_search',
                description:
                  'Search the web for real-time information, news, research topics, startup analyses, and general knowledge queries.',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'The search query string'
                    }
                  },
                  required: ['query']
                }
              },
              {
                type: 'function',
                name: 'generate_mermaid',
                description:
                  'Generate a MermaidJS diagram from a structured topic. Renders flowcharts, sequence diagrams, mind maps, or Gantt charts in the HUD artifact panel.',
                parameters: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'A short title for the diagram'
                    },
                    code: {
                      type: 'string',
                      description: 'The mermaid.js diagram code (e.g. graph TD; A-->B)'
                    }
                  },
                  required: ['title', 'code']
                }
              },
              {
                type: 'function',
                name: 'computer_action',
                description:
                  "Execute computer automation actions like clicking, moving the mouse, typing text, pressing keyboard shortcuts, launching applications, or opening URLs on the user's Windows desktop.",
                parameters: {
                  type: 'object',
                  properties: {
                    action: {
                      type: 'string',
                      enum: ['click', 'move', 'type', 'keypress', 'shortcut', 'launch', 'openUrl'],
                      description: 'The type of computer action to execute'
                    },
                    x: {
                      type: 'number',
                      description: 'X coordinate for click/move actions'
                    },
                    y: {
                      type: 'number',
                      description: 'Y coordinate for click/move actions'
                    },
                    text: {
                      type: 'string',
                      description: 'Text to type (required for type action)'
                    },
                    key: {
                      type: 'string',
                      description:
                        'Single key to press (required for keypress action), e.g. Enter, Tab, Escape'
                    },
                    keys: {
                      type: 'string',
                      description:
                        'Keyboard shortcut combination (required for shortcut), e.g. ctrl+s, alt+tab'
                    },
                    app: {
                      type: 'string',
                      description:
                        'Desktop application name or executable path, e.g. notepad, cursor, chrome (required for launch)'
                    },
                    url: {
                      type: 'string',
                      description: 'Website URL to open in default browser (required for openUrl)'
                    }
                  },
                  required: ['action']
                }
              },
              {
                type: 'function',
                name: 'generate_image',
                description:
                  'Generate a new image based on a detailed visual text prompt using AI. Automatically displays in the HUD gallery.',
                parameters: {
                  type: 'object',
                  properties: {
                    prompt: {
                      type: 'string',
                      description: 'The detailed description of the image to generate'
                    }
                  },
                  required: ['prompt']
                }
              },
              {
                type: 'function',
                name: 'edit_gallery_image',
                description:
                  'Perform visual modifications on an existing gallery image by index (e.g. 1-based index like image 1, image 2). Modifications can be filters, background color fills, text overlays, or deleting/favoriting the image.',
                parameters: {
                  type: 'object',
                  properties: {
                    imageNumber: {
                      type: 'number',
                      description:
                        'The 1-based index of the image in the gallery (e.g. 1 for the newest/first image)'
                    },
                    modification: {
                      type: 'string',
                      enum: [
                        'cinematic',
                        'grayscale',
                        'sepia',
                        'normal',
                        'add_text',
                        'favorite',
                        'delete'
                      ],
                      description: 'The visual filter or operational edit to apply'
                    },
                    text: {
                      type: 'string',
                      description: 'Text string to overlay (required for add_text)'
                    }
                  },
                  required: ['imageNumber', 'modification']
                }
              },
              {
                type: 'function',
                name: 'capture_screenshot',
                description:
                  "Capture a full-screen screenshot of the developer's desktop. Automatically adds to the HUD gallery.",
                parameters: {
                  type: 'object',
                  properties: {}
                }
              },
              {
                type: 'function',
                name: 'read_file',
                description:
                  'Read the text contents of a local file (code files, TXT, CSV, Markdown, JSON, etc.) by specifying its absolute path. Renders it in the HUD artifacts panel.',
                parameters: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'string',
                      description:
                        'The absolute file path on Windows (e.g. C:/Users/Shawon/Documents/todo.txt)'
                    }
                  },
                  required: ['path']
                }
              },
              {
                type: 'function',
                name: 'manage_notes',
                description:
                  "Create, update, list, or delete notes in the user's persistent HUD Notes console. Notes survive across sessions.",
                parameters: {
                  type: 'object',
                  properties: {
                    operation: {
                      type: 'string',
                      enum: ['create', 'update', 'delete', 'list'],
                      description: 'The note operation to perform'
                    },
                    id: {
                      type: 'string',
                      description: 'Note ID (required for update and delete)'
                    },
                    title: {
                      type: 'string',
                      description: 'Note title (required for create, optional for update)'
                    },
                    content: {
                      type: 'string',
                      description: 'Note body content (required for create, optional for update)'
                    }
                  },
                  required: ['operation']
                }
              },
              {
                type: 'function',
                name: 'manage_memory',
                description:
                  'Store or update long-term memory about the user including preferences, active projects, and contextual information. Memory persists across sessions and is injected into the system instructions on each connection.',
                parameters: {
                  type: 'object',
                  properties: {
                    operation: {
                      type: 'string',
                      enum: ['set_preference', 'add_project', 'update_context', 'get_memory'],
                      description: 'The memory operation to perform'
                    },
                    key: {
                      type: 'string',
                      description: 'Preference key (required for set_preference)'
                    },
                    value: {
                      type: 'string',
                      description: 'Preference value (required for set_preference)'
                    },
                    project: {
                      type: 'string',
                      description: 'Project name to add (required for add_project)'
                    },
                    context: {
                      type: 'string',
                      description: 'Updated context summary (required for update_context)'
                    }
                  },
                  required: ['operation']
                }
              }
            ],
            tool_choice: 'auto'
          }
        }
        dc.send(JSON.stringify(sessionUpdate))
      }

      // Handle messages from OpenAI
      let assistantResponseBuffer = ''

      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // console.log('Received Realtime Event:', data.type, data)

          switch (data.type) {
            case 'session.created':
              console.log('Session created on server')
              break

            case 'input_audio_buffer.speech_started':
              console.log('User speech started (Barge-in)')
              setAssistantState('listening')
              // Mute assistant audio analysis / visualizer scales
              setAudioAmplitude(0)
              break

            case 'input_audio_buffer.speech_stopped':
              console.log('User speech stopped')
              setAssistantState('thinking')
              break

            case 'conversation.item.input_audio_transcription.completed':
              // User speech transcription completed
              if (data.transcript) {
                console.log('User Transcript:', data.transcript)
                addTranscriptEntry('user', data.transcript.trim())
              }
              break

            case 'response.speech_started':
              setAssistantState('speaking')
              assistantResponseBuffer = ''
              break

            case 'response.speech_stopped':
              setAssistantState('idle')
              setAudioAmplitude(0)
              break

            case 'response.audio_transcript.delta':
              if (data.delta) {
                assistantResponseBuffer += data.delta
              }
              break

            case 'response.audio_transcript.done':
              if (assistantResponseBuffer.trim()) {
                console.log('Assistant Transcript:', assistantResponseBuffer)
                addTranscriptEntry('assistant', assistantResponseBuffer.trim())
              }
              break

            case 'response.function_call_arguments.done': {
              const { call_id, name, arguments: argsString } = data
              console.log(`Tool invocation received: ${name}`, argsString)

              // Handle async tools in a self-invoking block
              ;(async () => {
                let output = {}
                try {
                  const args = JSON.parse(argsString)

                  if (name === 'exa_search') {
                    setAssistantState('searching')
                    const results = await window.api.exaSearch(args.query)
                    setSearchResults(results.results || [])
                    setActiveTab('search')
                    output = {
                      success: true,
                      count: (results.results || []).length,
                      results: results.results || []
                    }
                  } else if (name === 'generate_mermaid') {
                    setAssistantState('executing')
                    setActiveArtifact({
                      title: args.title,
                      content: args.code,
                      type: 'mermaid'
                    })
                    setActiveTab('artifacts')
                    output = {
                      success: true,
                      message: `Diagram "${args.title}" rendered in HUD artifact panel.`
                    }
                  } else if (name === 'computer_action') {
                    // Shrink and transition window to overlay mode if not already
                    if (useAppStore.getState().windowMode === 'full') {
                      setWindowMode('computer')
                      await window.api.setWindowMode('computer')
                    }

                    const detail =
                      args.action === 'click' || args.action === 'move'
                        ? `${args.action} at (${args.x}, ${args.y})`
                        : args.action === 'type'
                          ? `type "${args.text}"`
                          : args.action === 'keypress'
                            ? `press key "${args.key}"`
                            : args.action === 'shortcut'
                              ? `press shortcut "${args.keys}"`
                              : args.action === 'launch'
                                ? `launch app "${args.app}"`
                                : `open URL "${args.url}"`

                    const actionId = addActionToQueue(args.action, detail)

                    // Request user approval based on safetyMode
                    const isApproved = await new Promise<boolean>((resolve) => {
                      const safety = useAppStore.getState().safetyMode
                      if (safety === 'autonomous') {
                        resolve(true)
                      } else {
                        setPendingActionApproval({
                          id: actionId,
                          action: args.action,
                          detail: detail,
                          resolve: (approved: boolean) => {
                            setPendingActionApproval(null)
                            resolve(approved)
                          }
                        })
                      }
                    })

                    if (isApproved) {
                      updateActionStatus(actionId, 'executing')
                      setAssistantState('executing')
                      const result = await window.api.executeComputerAction(args)
                      updateActionStatus(actionId, 'completed')
                      output = { success: true, action: args.action, result }
                    } else {
                      updateActionStatus(actionId, 'failed')
                      output = {
                        success: false,
                        action: args.action,
                        error: 'Execution denied by user.'
                      }
                    }
                  } else if (name === 'generate_image') {
                    setAssistantState('searching')
                    const res = await window.api.generateImage(args.prompt)
                    addImageToGallery(res.url, args.prompt, res.path)
                    setActiveTab('images')
                    output = {
                      success: true,
                      message: `Image generated and saved as ${res.fileName}.`
                    }
                  } else if (name === 'edit_gallery_image') {
                    const currentGallery = useAppStore.getState().gallery
                    const index = args.imageNumber - 1

                    if (index >= 0 && index < currentGallery.length) {
                      const targetItem = currentGallery[index]

                      if (args.modification === 'delete') {
                        deleteGalleryItem(targetItem.id)
                        output = { success: true, message: `Deleted image ${args.imageNumber}.` }
                      } else if (args.modification === 'favorite') {
                        updateGalleryItem(targetItem.id, { isFavorite: !targetItem.isFavorite })
                        output = {
                          success: true,
                          message: `Toggled favorite for image ${args.imageNumber}.`
                        }
                      } else if (args.modification === 'add_text') {
                        updateGalleryItem(targetItem.id, { textOverlay: args.text })
                        output = {
                          success: true,
                          message: `Added text overlay to image ${args.imageNumber}.`
                        }
                      } else {
                        updateGalleryItem(targetItem.id, { filter: args.modification })
                        output = {
                          success: true,
                          message: `Applied ${args.modification} filter to image ${args.imageNumber}.`
                        }
                      }
                      setActiveTab('images')
                    } else {
                      output = {
                        success: false,
                        error: `Invalid image index ${args.imageNumber}. Gallery only has ${currentGallery.length} items.`
                      }
                    }
                  } else if (name === 'manage_notes') {
                    const currentNotes = useAppStore.getState().notes
                    if (args.operation === 'create') {
                      const noteId = addNote(args.title || 'Untitled', args.content || '')
                      setActiveTab('notes')
                      output = {
                        success: true,
                        message: `Note "${args.title}" created with ID ${noteId}.`,
                        id: noteId
                      }
                    } else if (args.operation === 'update') {
                      const existing = currentNotes.find((n) => n.id === args.id)
                      if (existing) {
                        updateNote(
                          args.id,
                          args.title || existing.title,
                          args.content !== undefined ? args.content : existing.content
                        )
                        setActiveTab('notes')
                        output = {
                          success: true,
                          message: `Note "${args.title || existing.title}" updated.`
                        }
                      } else {
                        output = { success: false, error: `Note with ID ${args.id} not found.` }
                      }
                    } else if (args.operation === 'delete') {
                      deleteNote(args.id)
                      setActiveTab('notes')
                      output = { success: true, message: `Note deleted.` }
                    } else if (args.operation === 'list') {
                      const summaries = currentNotes.map((n, i) => ({
                        index: i + 1,
                        id: n.id,
                        title: n.title,
                        preview: n.content.substring(0, 80),
                        date: n.timestamp
                      }))
                      setActiveTab('notes')
                      output = { success: true, notes: summaries, count: summaries.length }
                    }
                  } else if (name === 'manage_memory') {
                    if (args.operation === 'set_preference') {
                      setMemoryPreference(args.key, args.value)
                      output = {
                        success: true,
                        message: `Memory preference "${args.key}" set to "${args.value}".`
                      }
                    } else if (args.operation === 'add_project') {
                      addMemoryProject(args.project)
                      output = {
                        success: true,
                        message: `Project "${args.project}" added to long-term memory.`
                      }
                    } else if (args.operation === 'update_context') {
                      updateMemoryContext(args.context)
                      output = { success: true, message: `Memory context updated.` }
                    } else if (args.operation === 'get_memory') {
                      const mem = useAppStore.getState().memory
                      output = { success: true, memory: mem }
                    }
                  } else if (name === 'capture_screenshot') {
                    setAssistantState('searching')
                    const res = await window.api.captureScreenshot()
                    addImageToGallery(res.url, 'HUD Desktop Screenshot', res.path)
                    setActiveTab('images')
                    addToast('Screenshot captured and saved to gallery', 'success')
                    output = { success: true, message: `Screenshot saved as ${res.fileName}.` }
                  } else if (name === 'read_file') {
                    setAssistantState('searching')
                    const res = await window.api.readFileByPath(args.path)

                    setActiveArtifact({
                      title: res.fileName,
                      content: `### File Contents: ${res.fileName}\n\n\`\`\`\n${res.content}\n\`\`\``,
                      type: 'markdown'
                    })
                    setActiveTab('artifacts')
                    addToast(`Read file: ${res.fileName}`, 'success')

                    const preview =
                      res.content.length > 5000
                        ? res.content.substring(0, 5000) +
                          '\n\n...[FILE CONTENT TRUNCATED FOR CONTEXT SANITY]...'
                        : res.content
                    output = { success: true, fileName: res.fileName, preview }
                  }
                } catch (error: any) {
                  console.error(`Error executing tool ${name}:`, error)
                  output = {
                    success: false,
                    error: error.message || 'Unknown tool execution error'
                  }
                } finally {
                  setAssistantState('idle')
                  // Send output back to OpenAI
                  if (dcRef.current && dcRef.current.readyState === 'open') {
                    const responseEvent = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: call_id,
                        output: JSON.stringify(output)
                      }
                    }
                    dcRef.current.send(JSON.stringify(responseEvent))

                    // Trigger model to continue speaking/replying
                    dcRef.current.send(JSON.stringify({ type: 'response.create' }))
                  }
                }
              })()
              break
            }

            case 'error':
              console.error('Realtime session error event:', data.error)
              setAssistantState('error')
              break
          }
        } catch (err) {
          console.error('Error parsing data channel event data:', err)
        }
      }

      dc.onclose = () => {
        console.log('Data channel closed')
        disconnect()
      }

      // 5. Create local offer SDP
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 6. Complete SDP Handshake with OpenAI Realtime API
      const model = 'gpt-4o-realtime-preview-2024-12-17'
      const response = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenAI SDP handshake failed: ${response.status} - ${errText}`)
      }

      const answerSdp = await response.text()

      // Apply the answer to complete WebRTC setup
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      })

      console.log('WebRTC connection established with OpenAI Realtime')
    } catch (error) {
      console.error('Error connecting to OpenAI Realtime API:', error)
      setConnectionStatus('error')
      setAssistantState('error')
      disconnect()
    }
  }, [
    setConnectionStatus,
    setAssistantState,
    addTranscriptEntry,
    isMuted,
    disconnect,
    setAudioAmplitude
  ])

  // Update local track mute state when store state changes
  const updateMuteState = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted
      })
    }
  }, [])

  // Listen for tray mic toggle events
  useEffect(() => {
    if (window.api && window.api.onToggleMicFromTray) {
      window.api.onToggleMicFromTray(() => {
        toggleMute()
        updateMuteState(!isMuted)
        addToast(`Microphone ${isMuted ? 'Active' : 'Muted'}`, 'info')
      })
    }
  }, [isMuted, toggleMute, updateMuteState, addToast])

  return {
    connect,
    disconnect,
    updateMuteState
  }
}
