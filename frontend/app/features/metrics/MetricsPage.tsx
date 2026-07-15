"use client"

import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Heart,
  Footprints,
  Moon,
  Flame,
  Timer,
  Scale,
  ArrowRight,
  ClipboardList,
  Download,
  Sparkles,
} from "lucide-react"
import { healthAPI } from "../../api/api"
import { StatCard } from "../../components/ui/StatCard"
import { ChartCard, SectionHeader } from "../../components/ui/ChartCard"
import { TrendChart, TrendPoint } from "../../components/ui/TrendChart"
import { DoctorReport } from "./DoctorReport"

type MetricConfig = {
  key: string
  slug: string
  label: string
  unit: string
  Icon: React.ComponentType<{ className?: string }>
  accent: "heart" | "steps" | "sleep" | "calories" | "active" | "weight"
  color: string
  chartVariant: "area" | "line" | "bar"
  fetcher: () => Promise<{ labels: string[]; values: number[] }>
  format: (v: number) => string
}

const METRICS: MetricConfig[] = [
  {
    key: "steps",
    slug: "steps",
    label: "Steps",
    unit: "steps",
    Icon: Footprints,
    accent: "steps",
    color: "hsl(var(--metric-steps))",
    chartVariant: "bar",
    fetcher: healthAPI.getStepData,
    format: (v) => Math.round(v).toLocaleString(),
  },
  {
    key: "heart_rate",
    slug: "heart-rate",
    label: "Heart Rate",
    unit: "bpm",
    Icon: Heart,
    accent: "heart",
    color: "hsl(var(--metric-heart))",
    chartVariant: "line",
    fetcher: healthAPI.getHeartRateData,
    format: (v) => v.toFixed(0),
  },
  {
    key: "sleep",
    slug: "sleep",
    label: "Sleep",
    unit: "hrs",
    Icon: Moon,
    accent: "sleep",
    color: "hsl(var(--metric-sleep))",
    chartVariant: "area",
    fetcher: healthAPI.getSleepData,
    format: (v) => v.toFixed(1),
  },
  {
    key: "calories",
    slug: "calories",
    label: "Calories",
    unit: "kcal",
    Icon: Flame,
    accent: "calories",
    color: "hsl(var(--metric-calories))",
    chartVariant: "bar",
    fetcher: healthAPI.getCaloriesData,
    format: (v) => Math.round(v).toLocaleString(),
  },
  {
    key: "activity_minutes",
    slug: "active-minutes",
    label: "Active Minutes",
    unit: "min",
    Icon: Timer,
    accent: "active",
    color: "hsl(var(--metric-active))",
    chartVariant: "bar",
    fetcher: healthAPI.getActivityData,
    format: (v) => Math.round(v).toLocaleString(),
  },
  {
    key: "weight",
    slug: "weight",
    label: "Weight",
    unit: "kg",
    Icon: Scale,
    accent: "weight",
    color: "hsl(var(--metric-weight))",
    chartVariant: "line",
    fetcher: healthAPI.getWeightData,
    format: (v) => v.toFixed(1),
  },
]

export default function MetricsPage() {
  const [seriesMap, setSeriesMap] = useState<Record<string, TrendPoint[]>>({})
  const [latest, setLatest] = useState<Record<string, number>>({})
  const [showReport, setShowReport] = useState(false)
  const [downloading, setDownloading] = useState<"json" | "csv" | null>(null)

  useEffect(() => {
    ;(async () => {
      const results = await Promise.allSettled(METRICS.map((m) => m.fetcher()))
      const nextSeries: Record<string, TrendPoint[]> = {}
      const nextLatest: Record<string, number> = {}
      results.forEach((r, i) => {
        const cfg = METRICS[i]
        if (r.status === "fulfilled") {
          const labels = r.value.labels || []
          const values = r.value.values || []
          const pts = labels.map((label, idx) => ({ label, value: values[idx] ?? 0 }))
          nextSeries[cfg.key] = pts
          nextLatest[cfg.key] = values[values.length - 1] || 0
        }
      })
      setSeriesMap(nextSeries)
      setLatest(nextLatest)
    })()
  }, [])

  const handleDownload = async (format: "json" | "csv") => {
    setDownloading(format)
    try {
      const blob = await healthAPI.downloadHealthData(format)
      const url = URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `healthrec-export.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  const insightTip = useMemo(() => {
    const heart = latest["heart_rate"]
    const sleep = latest["sleep"]
    if (sleep && sleep < 7) return "Aim for 7+ hours of sleep tonight — your resting HR will thank you."
    if (heart && heart > 85) return "Your latest resting HR is high. Try a slow-breath session before bed."
    return "You're on track. Keep the streak going."
  }, [latest])

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Metrics"
        title="Every number, in one place"
        description="Click a metric to see the full trend, goal progress, and personalized insights."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload("csv")}
              disabled={downloading !== null}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              {downloading === "csv" ? "..." : "CSV"}
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Send to doctor
            </button>
          </div>
        }
      />

      {/* Insight banner — flat with left accent bar */}
      <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
          <Sparkles className="w-4 h-4" />
        </span>
        <p className="text-sm text-foreground text-pretty">{insightTip}</p>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRICS.map((m) => {
          const series = seriesMap[m.key] || []
          const value = latest[m.key]
          return (
            <Link
              key={m.key}
              to={`/metrics/${m.slug}`}
              className="group block rounded-2xl bg-card border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <StatCard
                    label={m.label}
                    value={value !== undefined ? m.format(value) : "—"}
                    unit={m.unit}
                    accent={m.accent}
                    icon={<m.Icon className="w-5 h-5" />}
                    className="border-0 shadow-none p-0 hover:shadow-none"
                  />
                </div>
                <div className="mt-2 -mx-2">
                  <TrendChart
                    data={series.length ? series : Array.from({ length: 7 }, (_, i) => ({ label: `${i}`, value: 0 }))}
                    color={m.color}
                    variant={m.chartVariant}
                    height={110}
                    showAxes={false}
                    showGrid={false}
                    unit={m.unit}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tap for details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Downloads row */}
      <ChartCard title="Export your data" subtitle="Download everything HealthRec has on you.">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleDownload("csv")}
            disabled={downloading !== null}
            className="flex-1 h-11 rounded-xl bg-secondary hover:bg-secondary/70 text-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Download className="w-4 h-4" />
            {downloading === "csv" ? "Preparing..." : "Download CSV"}
          </button>
          <button
            onClick={() => handleDownload("json")}
            disabled={downloading !== null}
            className="flex-1 h-11 rounded-xl bg-secondary hover:bg-secondary/70 text-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Download className="w-4 h-4" />
            {downloading === "json" ? "Preparing..." : "Download JSON"}
          </button>
        </div>
      </ChartCard>

      {showReport && <DoctorReport onClose={() => setShowReport(false)} />}
    </div>
  )
}
