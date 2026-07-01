import React from 'react'
import { marked } from 'marked'

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true
})

interface MarkdownProps {
  content: string
}

export const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  const htmlContent = marked.parse(content) as string

  return (
    <div className="markdown-body select-text" dangerouslySetInnerHTML={{ __html: htmlContent }} />
  )
}
