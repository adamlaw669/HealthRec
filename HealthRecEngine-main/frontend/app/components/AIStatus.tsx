import React from 'react'
import { FaBrain } from 'react-icons/fa'

interface AIStatusProps {
  isOnline: boolean
  className?: string
}

const AIStatus: React.FC<AIStatusProps> = ({ isOnline, className = '' }) => {
  return (
    <div 
      className={`inline-flex items-center group relative ${className}`}
      title={isOnline ? "AI is active and processing real data" : "Using default sample data"}
    >
      <FaBrain className={`mr-1 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
      <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
        {isOnline ? 'AI Online' : 'AI Offline'}
      </span>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {isOnline ? 'AI is active and processing real data' : 'Using default sample data'}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
      </div>
    </div>
  )
}

export default AIStatus 