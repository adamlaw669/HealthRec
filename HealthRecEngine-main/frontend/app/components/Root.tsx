import { Outlet } from "react-router-dom"
import { SidebarProvider } from "../context/SidebarContext"
import { ThemeProvider } from "../context/ThemeContext"
import { UserProvider } from "../context/UserContext"

export function Root() {
  return (
    <ThemeProvider>
      <UserProvider>
        <SidebarProvider>
          <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <Outlet />
          </div>
        </SidebarProvider>
      </UserProvider>
    </ThemeProvider>
  )
}

export default Root