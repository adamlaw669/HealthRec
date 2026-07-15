import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Info, Sparkles } from "lucide-react"
import { ChartCard } from "../../components/ui/ChartCard"
import { TrendChart, TrendPoint } from "../../components/ui/TrendChart"
import { Skeleton } from "../../components/ui/Skeleton"
import { cn } from "@lib/utils"

export type MetricRange = "week" | "month" | "year"

export interface MetricDetailProps {
  title: string
  subtitle: string
  unit: string
  color: string // hsl(var(...))
  Icon: React.ComponentType<{ className?: string }>
  fetcher: (range?: MetricRange) => Promise<{ labels: string[]; values: number[] }>
  formatValue?: (v: number) => string
  goal?: number
  insights?: string[]
  chartVariant?: "area" | "line" | "bar"
  accentClass?: string // e.g. "bg-metric-heart/10 text-metric-heart"
}

const RANGES: { key: MetricRange; label: string }[] = [
  { key: "week", label: "7d" },
  { key: "month", label: "30d" },
  { key: "year", label: "1y" },
]

export default function MetricDetail({
  title,
  subtitle,
  unit,
  color,
  Icon,
  fetcher,
  formatValue = (v) => v.toFixed(0),
  goal,
  insights,
  chartVariant = "area",
  accentClass = "bg-primary/10 text-primary",
}: MetricDetailProps) {
  const navigate = useNavigate()
  const [range, setRange] = useState<MetricRange>("week")
  const [points, setPoints] = useState<TrendPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    setIsLoading(true)
    fetcher(range)
      .then((data) => {
        if (cancel) return
        const labels = data.labels || []
        const values = data.values || []
        setPoints(labels.map((label, i) => ({ label, value: values[i] ?? 0 })))
      })
      .finally(() => !cancel && setIsLoading(false))
    return () => { cancel = true }
  }, [fetcher, range])

  const stats = useMemo(() => {
    if (!points.length) return { avg: 0, min: 0, max: 0, latest: 0 }
    const vals = points.map((p) => p.value).filter((v) => !isNaN(v))
    const sum = vals.reduce((a, b) => a + b, 0)
    return {
      avg: sum / vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      latest: vals[vals.length - 1] || 0,
    }
  }, [points])

  const goalPct = goal ? Math.min(100, Math.round((stats.latest / goal) * 100)) : null

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate("/metrics")}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            aria-label="Back to metrics"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl", accentClass)}>
                <Icon className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight truncate">{title}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-secondary/60 border border-border/60 p-1">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                range === key
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))
        ) : (
          <>
            <KpiCard label="Latest" value={formatValue(stats.latest)} unit={unit} accent={accentClass} />
            <KpiCard label="Average" value={formatValue(stats.avg)} unit={unit} />
            <KpiCard label="Min" value={formatValue(stats.min)} unit={unit} />
            <KpiCard label="Max" value={formatValue(stats.max)} unit={unit} />
          </>
        )}
      </div>

      {/* Chart */}
      <ChartCard title={`${title} trend`} subtitle={`${points.length} data points`}>
        {isLoading ? (
          <div className="h-80 rounded-xl skeleton" />
        ) : points.length ? (
          <TrendChart data={points} color={color} variant={chartVariant} height={320} unit={unit} />
        ) : (
          <div className="h-64 flex items-center justify-center text-center text-sm text-muted-foreground">
            No data yet. Sync Google Fit or log manually from the dashboard.
          </div>
        )}
      </ChartCard>

      {/* Insights + goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold">What this means</h3>
          </div>
          <ul className="space-y-2">
            {(insights || DEFAULT_INSIGHTS).map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-pretty">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {goal !== undefined && (
          <div className="rounded-2xl bg-card border border-border/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily goal</p>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-bold">{goalPct}%</span>
              <span className="text-sm text-muted-foreground">
                of {formatValue(goal)} {unit}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700"
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Info className="w-3 h-3" />
        AI insights are informational, not medical advice.
      </footer>
    </div>
  )
}

const DEFAULT_INSIGHTS = [
  "You're tracking consistently — that's the biggest predictor of long-term change.",
  "Small daily improvements compound. Focus on your average, not any single day.",
]

function KpiCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string
  unit: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-2xl sm:text-3xl font-display font-bold tracking-tight",
            accent && "px-2 py-0.5 rounded-lg",
            accent
          )}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}
