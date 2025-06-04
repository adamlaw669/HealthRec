import { Outlet } from "react-router-dom"
import { SidebarProvider } from "../context/SidebarContext"
import { ThemeProvider } from "../context/ThemeContext"
import { UserProvider } from "../context/UserContext"
import { memo } from "react"

// Memoize the providers to prevent unnecessary re-renders
const MemoizedProviders = memo(({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <UserProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </UserProvider>
  </ThemeProvider>
))

MemoizedProviders.displayName = "MemoizedProviders"

export function Root() {
  return (
    <MemoizedProviders>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <Outlet />
      </div>
    </MemoizedProviders>
  )
}

export default Root