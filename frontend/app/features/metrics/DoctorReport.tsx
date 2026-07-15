"use client"
import { useState } from "react"
import { healthAPI } from "../../api/api"
import { Mail, CheckCircle2, X, ClipboardList, PenSquare } from "lucide-react"

interface DoctorReportProps {
  onClose: () => void
}

const AVAILABLE_METRICS = [
  { key: "steps", label: "Steps" },
  { key: "heart_rate", label: "Heart Rate" },
  { key: "sleep", label: "Sleep" },
  { key: "calories", label: "Calories" },
  { key: "active_minutes", label: "Active Minutes" },
  { key: "weight", label: "Weight" },
]

export const DoctorReport = ({ onClose }: DoctorReportProps) => {
  const [email, setEmail] = useState("")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customNotes, setCustomNotes] = useState("")

  const toggle = (m: string) =>
    setSelectedMetrics((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await healthAPI.getDoctorReport(email, selectedMetrics, customNotes)
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card border border-border shadow-pop"
      >
        <div className="flex items-start justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-semibold text-lg">Send doctor report</h3>
              <p className="text-sm text-muted-foreground">
                Email a summary to your healthcare provider.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-metric-active/15 text-metric-active flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="mt-4 font-display font-semibold text-lg">Report sent</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Your health report was emailed to {email}.
            </p>
            <button
              onClick={onClose}
              className="mt-5 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Doctor's email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:shadow-ring"
                  placeholder="doctor@example.com"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Include metrics</p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_METRICS.map((m) => {
                  const active = selectedMetrics.includes(m.key)
                  return (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => toggle(m.key)}
                      className={`text-sm text-left px-3 py-2 rounded-xl border transition-colors ${
                        active
                          ? "bg-primary/10 border-primary text-primary font-semibold"
                          : "bg-background border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <PenSquare className="w-3.5 h-3.5" /> Notes (optional)
              </label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Anything you'd like to add for context..."
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:shadow-ring resize-none"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !selectedMetrics.length}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-70"
            >
              {isLoading ? "Sending..." : "Send report"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default DoctorReport
