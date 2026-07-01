import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

// Initialize Mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  themeVariables: {
    primaryColor: '#00f0ff',
    primaryTextColor: '#fff',
    primaryBorderColor: '#0070ff',
    lineColor: '#00f0ff',
    secondaryColor: '#ffaa00',
    tertiaryColor: '#d946ef'
  }
})

interface MermaidProps {
  code: string
}

// Heuristic syntax repair for common Mermaid syntax errors from AI generators
const repairMermaidSyntax = (code: string): string => {
  let cleaned = code.trim()

  // Remove markdown code fences if present
  if (cleaned.startsWith('```mermaid')) {
    cleaned = cleaned.substring(10)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3)
  }

  // Split lines and clean them
  let lines = cleaned.split('\n')
  lines = lines.map((line) => {
    let l = line.trim()
    if (!l) return l

    // Heuristic 1: Fix nested parenthesis or brackets in labels
    // e.g., A(Some (Text) here) -> A("Some (Text) here")
    // Match word characters, followed by ( or [ or {, followed by text containing brackets, followed by ) or ] or }
    l = l.replace(/(\b\w+)\(([^"\)]*[\(\)][^"\)]*)\)/g, '$1("$2")')
    l = l.replace(/(\b\w+)\[([^"\]]*[\[\]\(\)][^"\]]*)\]/g, '$1["$2"]')
    l = l.replace(/(\b\w+)\{([^"\}]*[\{\}\(\)][^"\}]*)\}/g, '$1{"$2"}')

    // Heuristic 2: Ensure semicolons are not loose at the end of connections
    if (l.endsWith(';')) {
      // Mermaid doesn't strictly need semicolons unless separating multiple statements on one line
      // Sometimes loose semicolons cause issues depending on syntax type
    }

    return l
  })

  return lines.join('\n').trim()
}

export const Mermaid: React.FC<MermaidProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [svgHtml, setSvgHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const renderChart = async () => {
      if (!containerRef.current) return

      const repairedCode = repairMermaidSyntax(code)
      const elementId = `mermaid-${Math.random().toString(36).substring(2, 9)}`

      try {
        setError(null)
        // Parse and render
        const { svg } = await mermaid.render(elementId, repairedCode)
        if (isMounted) {
          setSvgHtml(svg)
        }
      } catch (err: any) {
        console.warn('First Mermaid rendering attempt failed. Attempting deep cleanup...', err)

        // Deep Cleanup Fallback: Try a completely safe graph rendering
        try {
          // Keep only graph structure or convert to a basic structure
          const fallbackCode = `graph TD\n  Error["Diagram Syntax Error"]\n  Fix["Please check syntax or try again"]\n  Error --> Fix`
          const { svg } = await mermaid.render(`${elementId}-fallback`, fallbackCode)
          if (isMounted) {
            setError('Mermaid Rendering Error. Check diagram syntax.')
            setSvgHtml(svg)
          }
        } catch (innerErr) {
          if (isMounted) {
            setError('Unrecoverable Mermaid rendering failure.')
            setSvgHtml(null)
          }
        }
      }
    }

    renderChart()

    return () => {
      isMounted = false
    }
  }, [code])

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-hud-cyan/10 glass-panel mt-4">
      {error && (
        <div className="w-full mb-3 px-3 py-1.5 bg-hud-red/10 border border-hud-red/20 text-hud-red rounded text-[10px] font-mono">
          [!] DIAGRAM ERROR RESOLVED WITH FALLBACK VISUALIZATION
        </div>
      )}

      {svgHtml ? (
        <div
          ref={containerRef}
          className="w-full max-h-[450px] overflow-auto flex justify-center items-center [&>svg]:w-full [&>svg]:h-auto text-slate-100"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 font-hud text-xs tracking-wider gap-2">
          <div className="w-6 h-6 border-2 border-hud-cyan border-t-transparent rounded-full animate-spin" />
          RENDERING VECTOR DIAGRAM...
        </div>
      )}
    </div>
  )
}
