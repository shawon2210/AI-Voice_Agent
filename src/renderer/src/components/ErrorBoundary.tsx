import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo })
    console.error('[SHAWON SYSTEM FAULT]', error, errorInfo)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-slate-950 text-slate-200 flex items-center justify-center p-8 z-[999]">
          <div className="border border-red-500/30 rounded-2xl bg-slate-950/95 p-8 max-w-xl w-full flex flex-col items-center gap-6 relative">
            {/* Pulsing fault indicator */}
            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/40" />

            <h1 className="font-hud text-red-400 uppercase tracking-widest text-sm text-center">
              System Fault Detected
            </h1>

            <p className="text-[10px] font-hud text-slate-500 uppercase tracking-wider text-center">
              A critical rendering error has occurred in the HUD subsystem.
            </p>

            {/* Error message */}
            <div className="w-full bg-slate-900 border border-red-500/10 rounded-lg p-3 overflow-auto max-h-40">
              <pre className="text-xs font-mono text-red-300/80 whitespace-pre-wrap break-words">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </div>

            {/* Stack trace collapsible */}
            {this.state.errorInfo && (
              <details className="w-full">
                <summary className="text-[9px] font-hud text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors">
                  Stack Trace — Click to Expand
                </summary>
                <div className="mt-2 bg-slate-900/80 border border-slate-800 rounded-lg p-3 overflow-auto max-h-48">
                  <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap break-words">
                    {this.state.error?.stack}
                  </pre>
                </div>
              </details>
            )}

            {/* Reboot button */}
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-hud rounded-lg px-6 py-2.5 cursor-pointer transition-all duration-300 uppercase tracking-widest mt-2"
            >
              Reboot System
            </button>

            <span className="text-[8px] font-mono text-slate-600">
              SHAWON OS v1.0.0 — FAULT RECOVERY MODULE
            </span>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
