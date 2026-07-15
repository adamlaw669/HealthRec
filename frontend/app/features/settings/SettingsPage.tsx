"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  Globe,
  Ruler,
  Moon,
  Sun,
  Activity,
  ShieldCheck,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
} from "lucide-react"
import { authAPI } from "../../api/api"
import { supportAPI } from "../../api/api"
import { ChartCard, SectionHeader } from "../../components/ui/ChartCard"
import { useTheme } from "../../context/ThemeContext"
import { cn } from "@lib/utils"

interface Settings {
  language: string
  useMetricSystem: boolean
  emailNotifications: boolean
  healthAlerts: boolean
  accountDeletionScheduled: string | null
}

interface Faq { question: string; answer: string }

type TabKey = "preferences" | "connections" | "privacy" | "support"

const TABS: { key: TabKey; label: string }[] = [
  { key: "preferences", label: "Preferences" },
  { key: "connections", label: "Connections" },
  { key: "privacy", label: "Privacy" },
  { key: "support", label: "Support" },
]

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
]

const DEFAULT_SETTINGS: Settings = {
  language: "en",
  useMetricSystem: true,
  emailNotifications: true,
  healthAlerts: true,
  accountDeletionScheduled: null,
}

export default function SettingsPage() {
  const { darkMode, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<TabKey>("preferences")
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ tone: "ok" | "err"; text: string } | null>(null)
  const [fitConnected, setFitConnected] = useState<boolean | null>(null)
  const [deletionDays, setDeletionDays] = useState(30)
  const [deleting, setDeleting] = useState(false)
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const s = await authAPI.getSettings()
        if (s) {
          setSettings((prev) => ({
            ...prev,
            language: s.language || "en",
            useMetricSystem: s.useMetricSystem ?? true,
            emailNotifications: s.emailNotifications ?? true,
            healthAlerts: s.healthAlerts ?? true,
            accountDeletionScheduled: s.accountDeletionScheduled || null,
          }))
        }
        const fit = await authAPI.checkGoogleFitStatus()
        setFitConnected(fit)
      } catch {
        /* ignore — use defaults */
      }
    })()

    ;(async () => {
      try {
        const res = await supportAPI.getFAQs()
        if (res?.faqs) setFaqs(res.faqs)
      } catch {
        setFaqs(FALLBACK_FAQS)
      }
    })()
  }, [])

  const notify = (tone: "ok" | "err", text: string) => {
    setToast({ tone, text })
    setTimeout(() => setToast(null), 3000)
  }

  const patch = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await authAPI.updateSettings(settings as any)
      notify("ok", "Settings saved")
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  const handleScheduleDeletion = async () => {
    setDeleting(true)
    try {
      await authAPI.scheduleAccountDeletion(deletionDays)
      const scheduled = new Date(Date.now() + deletionDays * 86400000).toISOString()
      patch("accountDeletionScheduled", scheduled)
      notify("ok", `Deletion scheduled in ${deletionDays} days`)
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Failed")
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDeletion = async () => {
    setDeleting(true)
    try {
      await authAPI.cancelAccountDeletion()
      patch("accountDeletionScheduled", null)
      notify("ok", "Deletion cancelled")
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Failed")
    } finally {
      setDeleting(false)
    }
  }

  const handleConnectFit = async () => {
    try {
      await authAPI.connectGoogleFit()
      // In demo mode this just flips localStorage; refresh state.
      const fit = await authAPI.checkGoogleFitStatus()
      setFitConnected(fit)
      if (fit) notify("ok", "Google Fit connected")
    } catch {
      notify("err", "Couldn't start connection flow")
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await supportAPI.contactSupport(contactForm.name, contactForm.email, contactForm.message)
      setContactForm({ name: "", email: "", message: "" })
      notify("ok", "Message sent")
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Send failed")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Settings"
        title="Tune HealthRec to you"
        description="Preferences, connections, privacy, and support — all in one place."
        actions={
          activeTab !== "support" && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-secondary/60 border border-border/60 p-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap",
              activeTab === t.key
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "preferences" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Appearance" subtitle="Dark or light theme.">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                  {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </span>
                <div>
                  <p className="text-sm font-semibold">Dark mode</p>
                  <p className="text-xs text-muted-foreground">
                    {darkMode ? "Currently on" : "Currently off"}
                  </p>
                </div>
              </div>
              <Toggle checked={darkMode} onChange={toggleTheme} />
            </div>
          </ChartCard>

          <ChartCard title="Regional" subtitle="Language and unit system.">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => patch("language", e.target.value)}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:shadow-ring"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Metric units</p>
                    <p className="text-xs text-muted-foreground">Use kg / km instead of lb / mi</p>
                  </div>
                </div>
                <Toggle
                  checked={settings.useMetricSystem}
                  onChange={(v) => patch("useMetricSystem", v)}
                />
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Notifications" subtitle="How we contact you." className="lg:col-span-2">
            <div className="space-y-2 divide-y divide-border/60">
              <ToggleRow
                Icon={Bell}
                title="Email notifications"
                description="Weekly summaries and important updates"
                checked={settings.emailNotifications}
                onChange={(v) => patch("emailNotifications", v)}
              />
              <ToggleRow
                Icon={AlertTriangle}
                title="Health alerts"
                description="Notify me when the AI detects something worth reviewing"
                checked={settings.healthAlerts}
                onChange={(v) => patch("healthAlerts", v)}
              />
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === "connections" && (
        <ChartCard title="Google Fit" subtitle="Sync your steps, heart rate, sleep, and more.">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-metric-active/10 text-metric-active">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {fitConnected === null
                    ? "Checking..."
                    : fitConnected
                    ? "Connected"
                    : "Not connected"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fitConnected
                    ? "Data syncs automatically in the background."
                    : "Connect to auto-populate your metrics."}
                </p>
              </div>
            </div>
            {fitConnected ? (
              <span className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-metric-active/10 text-metric-active text-sm font-semibold">
                <ShieldCheck className="w-4 h-4" /> Active
              </span>
            ) : (
              <button
                onClick={handleConnectFit}
                className="inline-flex items-center h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90"
              >
                Connect
              </button>
            )}
          </div>
        </ChartCard>
      )}

      {activeTab === "privacy" && (
        <div className="space-y-4">
          <ChartCard title="Data & privacy" subtitle="You own your data.">
            <ul className="space-y-2 text-sm">
              {[
                "Your health data is encrypted in transit and at rest.",
                "We never share your data with third parties.",
                "You can download or delete your data anytime.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard
            title="Delete account"
            subtitle="Permanently remove your account and all associated data."
          >
            {settings.accountDeletionScheduled ? (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Deletion scheduled for {new Date(settings.accountDeletionScheduled).toLocaleDateString()}
                </p>
                <p className="text-xs text-destructive/80 mt-1">You can still cancel until then.</p>
                <button
                  onClick={handleCancelDeletion}
                  disabled={deleting}
                  className="mt-3 h-10 px-4 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm disabled:opacity-70"
                >
                  {deleting ? "..." : "Cancel deletion"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">Grace period (days)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={deletionDays}
                    onChange={(e) => setDeletionDays(Number(e.target.value))}
                    className="mt-1.5 w-full h-11 px-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:shadow-ring"
                  />
                </div>
                <button
                  onClick={handleScheduleDeletion}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-semibold text-sm hover:bg-destructive/20 disabled:opacity-70"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Scheduling..." : "Schedule deletion"}
                </button>
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {activeTab === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Frequently asked" subtitle="Quick answers to common questions.">
            <div className="space-y-2">
              {(faqs.length ? faqs : FALLBACK_FAQS).map((faq, i) => (
                <button
                  key={i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left rounded-xl border border-border/60 bg-background/50 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center justify-between p-3">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  {openFaq === i && (
                    <p className="px-3 pb-3 pt-0 text-sm text-muted-foreground text-pretty">
                      {faq.answer}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Contact support" subtitle="We usually reply within 24h.">
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <input
                required
                placeholder="Your name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:shadow-ring"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full h-11 px-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:shadow-ring"
              />
              <textarea
                required
                rows={4}
                placeholder="How can we help?"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:shadow-ring resize-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-70"
              >
                {sending ? "Sending..." : "Send message"}
              </button>
            </form>
          </ChartCard>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-3 shadow-pop border",
              toast.tone === "ok"
                ? "bg-metric-active/15 border-metric-active/30 text-metric-active"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            )}
          >
            {toast.tone === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-secondary"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  )
}

function ToggleRow({
  Icon,
  title,
  description,
  checked,
  onChange,
}: {
  Icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

const FALLBACK_FAQS: Faq[] = [
  { question: "How is my health data secured?", answer: "Your data is encrypted in transit and at rest, and never shared." },
  { question: "Can I export my data?", answer: "Yes — from Profile → Export data. CSV and JSON supported." },
  { question: "How accurate are AI insights?", answer: "They're based on patterns in your data plus general health guidelines. Not medical advice." },
  { question: "How do I connect Google Fit?", answer: "Settings → Connections → Connect. Grant permissions when prompted." },
]
