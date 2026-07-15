import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider } from "../context/SidebarContext"
import { ThemeProvider } from "../context/ThemeContext"
import { UserProvider } from "../context/UserContext"
import { memo } from "react"
import AppShell from "./AppShell"

const MemoizedProviders = memo(({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <UserProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </UserProvider>
  </ThemeProvider>
))

MemoizedProviders.displayName = "MemoizedProviders"

const PUBLIC_PATHS = ["/", "/auth", "/auth/callback", "/auth/callback/enhanced"]

export function Root() {
  const { pathname } = useLocation()
  const isPublic = PUBLIC_PATHS.includes(pathname)

  return (
    <MemoizedProviders>
      {isPublic ? (
        <div className="min-h-screen bg-background text-foreground">
          <Outlet />
        </div>
      ) : (
        <AppShell>
          <Outlet />
        </AppShell>
      )}
    </MemoizedProviders>
  )
}

export default Root
