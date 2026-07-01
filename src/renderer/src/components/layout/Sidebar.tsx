import React from 'react'
import { Home, Settings, Book, Image, Bot } from 'lucide-react'

interface SidebarProps {
  isMenuOpen: boolean
  toggleMenu: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isMenuOpen, toggleMenu }) => {
  return (
    <aside
      className={`
        bg-gray-900 text-gray-100
        w-64 h-full p-4
        fixed inset-y-0 left-0 transform
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 md:flex md:flex-col
      `}
    >
      <nav className="flex flex-col space-y-4 mt-8">
        <button className="flex items-center space-x-2 hover:text-primary" title="Home">
          <Home size={20} />
          <span className="hidden md:inline">Home</span>
        </button>
        <button className="flex items-center space-x-2 hover:text-primary" title="Chat">
          <Bot size={20} />
          <span className="hidden md:inline">Chat</span>
        </button>
        <button className="flex items-center space-x-2 hover:text-primary" title="Images">
          <Image size={20} />
          <span className="hidden md:inline">Images</span>
        </button>
        <button className="flex items-center space-x-2 hover:text-primary" title="Docs">
          <Book size={20} />
          <span className="hidden md:inline">Docs</span>
        </button>
        <button
          className="flex items-center space-x-2 hover:text-primary"
          title="Settings"
          onClick={toggleMenu}
        >
          <Settings size={20} />
          <span className="hidden md:inline">Settings</span>
        </button>
      </nav>
    </aside>
  )
}
