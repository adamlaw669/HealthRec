"use client"

// SidebarContext.tsx
import { createContext, useState, useContext } from "react"
import type { ReactNode } from "react"

interface SidebarContextType {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarState: (state: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen((prevState) => !prevState)
  }

  const setSidebarState = (state: boolean) => {
    setIsSidebarOpen(state)
  }

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, setSidebarState }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

