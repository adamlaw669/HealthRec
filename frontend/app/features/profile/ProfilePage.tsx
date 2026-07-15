"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  Mail,
  Download,
  Save,
  Edit3,
  CheckCircle2,
  X,
  Activity,
  Sparkles,
  Trash2,
  ShieldCheck,
  LogOut,
  Flame,
  Footprints,
  Heart,
} from "lucide-react"
import { authAPI, healthAPI } from "../../api/api"
import { ChartCard, SectionHeader } from "../../components/ui/ChartCard"
import { Skeleton } from "../../components/ui/Skeleton"
import { useUser } from "../../context/UserContext"

interface ProfileData {
  name: string
  email: string
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { setUser: setContextUser, signOut, isDemo } = useUser()
  const [user, setUser] = useState<ProfileData>({ name: "", email: "" })
  const [form, setForm] = useState({ name: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<"json" | "csv">("csv")
  const [isDownloading, setIsDownloading] = useState(false)
  const [toast, setToast] = useState<{ tone: "ok" | "err"; text: string } | null>(null)
  const [googleFitConnected, setGoogleFitConnected] = useState<boolean | null>(null)
  const [stats, setStats] = useState({ steps: 0, heart: 0, calories: 0 })

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        const data = await authAPI.getProfile()
        setUser({ name: data.name || "User", email: data.email || "" })
        setForm({ name: data.name || "User" })
        const fit = await authAPI.checkGoogleFitStatus()
        setGoogleFitConnected(fit)
        const m = await healthAPI.getMetrics()
        setStats({
          steps: m.steps || 0,
          heart: m.heart_rate || 0,
          calories: m.calories || 0,
        })
      } catch (e: any) {
        if ((e?.message || "").includes("401")) navigate("/auth?mode=signin")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [navigate])

  const notify = (tone: "ok" | "err", text: string) => {
    setToast({ tone, text })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await authAPI.updateProfile({ name: form.name })
      if (response && response.success !== false) {
        setUser((u) => ({ ...u, name: form.name }))
        setContextUser({ name: form.name, email: user.email })
        setIsEditing(false)
        notify("ok", "Profile updated")
      } else {
        throw new Error(response?.message || "Failed to update")
      }
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Update failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const blob = await healthAPI.downloadHealthData(downloadFormat)
      const url = URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `healthrec-export.${downloadFormat}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      notify("err", "Download failed")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleConnectFit = async () => {
    try {
      await authAPI.connectGoogleFit()
      if (isDemo) {
        setGoogleFitConnected(true)
        notify("ok", "Connected (demo)")
      }
    } catch {
      notify("err", "Couldn't connect Google Fit")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } finally {
      navigate("/auth?mode=signin")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        eyebrow="Account"
        title="Your profile"
        description="Manage your identity and data."
        actions={
          <button
            onClick={handleSignOut}
            className="hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/70"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        }
      />

      {/* Header card — flat, primary accent avatar */}
      <div className="rounded-2xl bg-card border border-border p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display font-bold shrink-0">
            {user.name?.[0]?.toUpperCase() || <User className="w-7 h-7" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signed in as</p>
            <h1 className="mt-0.5 text-2xl sm:text-3xl font-display font-bold tracking-tight truncate">
              {isLoading ? <Skeleton className="h-8 w-40" /> : user.name || "User"}
            </h1>
            <p className="text-muted-foreground text-sm truncate">{user.email}</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 pt-6 border-t border-border">
          {[
            { Icon: Footprints, label: "Steps today", value: stats.steps.toLocaleString(), color: "text-metric-steps", bg: "bg-metric-steps/10" },
            { Icon: Heart, label: "Heart rate", value: `${stats.heart}`, unit: "bpm", color: "text-metric-heart", bg: "bg-metric-heart/10" },
            { Icon: Flame, label: "Calories", value: `${stats.calories}`, color: "text-metric-calories", bg: "bg-metric-calories/10" },
          ].map(({ Icon, label, value, unit, color, bg }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${bg} ${color}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
                <div className="mt-0.5 font-display font-bold text-lg tabular-nums text-foreground">
                  {isLoading ? <Skeleton className="h-5 w-16" /> : (
                    <>{value}{unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}</>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form + connections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Personal info" subtitle="What we call you." className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Display name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:shadow-ring disabled:opacity-70"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={user.email}
                  disabled
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">Contact support to change your email.</p>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm shadow-soft disabled:opacity-70"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ name: user.name })
                    setIsEditing(false)
                  }}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/70"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            )}
          </form>
        </ChartCard>

        <div className="space-y-4">
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold">Google Fit</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {googleFitConnected === null
                ? "Checking status..."
                : googleFitConnected
                ? "Connected. Data syncs automatically."
                : "Not connected. Connect to auto-sync your metrics."}
            </p>
            {!googleFitConnected && googleFitConnected !== null && (
              <button
                onClick={handleConnectFit}
                className="mt-3 w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
              >
                Connect
              </button>
            )}
            {googleFitConnected && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-metric-active">
                <ShieldCheck className="w-3.5 h-3.5" /> Active
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold">Streak</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              You've been tracking for a while. Consistency is the whole game.
            </p>
          </div>
        </div>
      </div>

      {/* Export data */}
      <ChartCard title="Export your data" subtitle="Take everything with you at any time.">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-secondary p-1">
            {(["csv", "json"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setDownloadFormat(fmt)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  downloadFormat === fmt ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm shadow-soft disabled:opacity-70"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Preparing..." : `Download as ${downloadFormat.toUpperCase()}`}
          </button>
        </div>
      </ChartCard>

      {/* Danger zone */}
      <ChartCard title="Danger zone" subtitle="Irreversible account changes.">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Delete account</p>
              <p className="text-xs text-muted-foreground">Manage account deletion in Settings → Privacy.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/settings")}
            className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/70"
          >
            Manage
          </button>
        </div>
      </ChartCard>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fade-in-up">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 shadow-pop border ${
              toast.tone === "ok"
                ? "bg-metric-active/15 border-metric-active/30 text-metric-active"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            {toast.tone === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  )
}
