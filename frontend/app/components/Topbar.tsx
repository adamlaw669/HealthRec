import { useLocation, Link, useNavigate } from "react-router-dom"
import { Search, Bell, Sun, Moon, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/metrics": "Metrics",
  "/profile": "Profile",
  "/settings": "Settings",
}

function getTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname]
  if (pathname.startsWith("/metrics/")) {
    const slug = pathname.split("/").pop() || ""
    return slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ")
  }
  return ""
}

const QUICK = [
  { label: "Steps", href: "/metrics/steps" },
  { label: "Heart Rate", href: "/metrics/heart-rate" },
  { label: "Sleep", href: "/metrics/sleep" },
  { label: "Calories", href: "/metrics/calories" },
  { label: "Weight", href: "/metrics/weight" },
  { label: "Active Minutes", href: "/metrics/active-minutes" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Settings", href: "/settings" },
  { label: "Profile", href: "/profile" },
]

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { darkMode, toggleTheme } = useTheme()
  const { user, isDemo } = useUser()
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const title = getTitle(pathname)

  const matches = query
    ? QUICK.filter((q) => q.label.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (matches[0]) {
      navigate(matches[0].href)
      setQuery("")
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border/60">
      <div className="h-full flex items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex-1 min-w-0 pl-12 md:pl-0">
          <h1 className="text-lg sm:text-xl font-display font-semibold tracking-tight truncate flex items-center gap-2">
            {title}
            {isDemo && (
              <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-accent/15 text-accent text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" fill="currentColor" /> Demo
              </span>
            )}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="hidden md:block relative w-64"
        >
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-secondary/60 border border-border/60 text-muted-foreground">
            <Search className="w-4 h-4 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Jump to metric…"
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/70 text-foreground"
            />
            <kbd className="hidden lg:inline-flex items-center h-5 px-1.5 rounded bg-background border border-border text-[10px] text-muted-foreground font-mono">
              ⌘K
            </kbd>
          </div>
          {focused && matches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-card border border-border shadow-pop overflow-hidden animate-fade-in-up z-40">
              {matches.map((m) => (
                <Link
                  key={m.href}
                  to={m.href}
                  onClick={() => setQuery("")}
                  className="block px-3 py-2.5 text-sm hover:bg-secondary transition-colors"
                >
                  {m.label}
                </Link>
              ))}
            </div>
          )}
        </form>

        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
        </button>

        <Link
          to="/profile"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-soft hover:scale-105 transition-transform"
        >
          {user?.name?.[0]?.toUpperCase() || "G"}
        </Link>
      </div>
    </header>
  )
}
