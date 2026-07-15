import { ReactNode } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { useSidebar } from "../context/SidebarContext"

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { isSidebarOpen } = useSidebar()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div
        className={`transition-[padding] duration-300 ${
          isSidebarOpen ? "md:pl-64" : "md:pl-20"
        }`}
      >
        <Topbar />
        <main className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-6">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
