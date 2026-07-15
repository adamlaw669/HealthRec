import { Link, NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Activity,
  Settings,
  User,
  ChevronLeft,
  Menu,
  Heart,
  LogOut,
} from "lucide-react"
import { useSidebar } from "../context/SidebarContext"
import { useUser } from "../context/UserContext"
import { useEffect, memo, useCallback } from "react"
import { cn } from "@lib/utils"

interface NavItem {
  to: string
  label: string
  Icon: typeof LayoutDashboard
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/metrics", label: "Metrics", Icon: Activity },
  { to: "/settings", label: "Settings", Icon: Settings },
]

const NavigationLinks = memo(
  ({ isSidebarOpen }: { isSidebarOpen: boolean }) => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center rounded-xl transition-all duration-200",
              isSidebarOpen
                ? "px-3 py-2.5 gap-3"
                : "px-2 py-3 justify-center",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
              )}
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              {isSidebarOpen && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
)

NavigationLinks.displayName = "NavigationLinks"

const ProfileSection = memo(
  ({
    isSidebarOpen,
    user,
    onLogout,
  }: {
    isSidebarOpen: boolean
    user: { name: string; email: string } | null
    onLogout: () => void
  }) => (
    <div className="p-3 border-t border-border/60 space-y-1">
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-xl transition-all",
            isSidebarOpen ? "gap-3 px-3 py-2.5" : "px-2 py-3 justify-center",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )
        }
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0 font-semibold",
            isSidebarOpen ? "w-9 h-9 text-sm" : "w-9 h-9 text-sm"
          )}
        >
          {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
        </div>
        {isSidebarOpen && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.name || "Guest"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || "not signed in"}
            </p>
          </div>
        )}
      </NavLink>
      <button
        onClick={onLogout}
        className={cn(
          "w-full flex items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
          isSidebarOpen ? "gap-3 px-3 py-2.5" : "px-2 py-3 justify-center"
        )}
      >
        <LogOut className="w-5 h-5 shrink-0" />
        {isSidebarOpen && <span className="text-sm font-medium">Sign out</span>}
      </button>
    </div>
  )
)

ProfileSection.displayName = "ProfileSection"

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, setSidebarState } = useSidebar()
  const { user, signOut } = useUser()

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (window.innerWidth >= 768) return
      const sidebar = document.getElementById("sidebar")
      const toggleButton = document.getElementById("sidebar-toggle-mobile")
      if (
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node)
      ) {
        setSidebarState(false)
      }
    },
    [isSidebarOpen, setSidebarState]
  )

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClickOutside])

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      window.location.href = "/auth"
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarState(false)}
        />
      )}

      {/* Mobile floating toggle */}
      <button
        id="sidebar-toggle-mobile"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border shadow-soft text-foreground hover:bg-secondary transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-card border-r border-border transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/60 shrink-0">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2.5 min-w-0",
              !isSidebarOpen && "md:justify-center md:w-full"
            )}
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shrink-0">
              <Heart className="w-5 h-5" fill="currentColor" />
            </span>
            {isSidebarOpen && (
              <span className="font-display font-bold text-lg tracking-tight text-foreground">
                HealthRec
              </span>
            )}
          </Link>
          {isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="hidden md:flex mx-auto mt-3 items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            aria-label="Expand sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <NavigationLinks isSidebarOpen={isSidebarOpen} />
        <ProfileSection
          isSidebarOpen={isSidebarOpen}
          user={user}
          onLogout={handleLogout}
        />
      </aside>
    </>
  )
}

export default memo(Sidebar)
