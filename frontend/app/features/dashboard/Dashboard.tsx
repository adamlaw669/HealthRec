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
  Sparkles,
  Plus,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  X,
  Zap,
} from "lucide-react"
import { healthAPI, demoMode } from "../../api/api"
import { useUser } from "../../context/UserContext"
import { StatCard } from "../../components/ui/StatCard"
import { ChartCard, SectionHeader } from "../../components/ui/ChartCard"
import { TrendChart, TrendPoint } from "../../components/ui/TrendChart"
import { ProgressRing } from "../../components/ui/ProgressRing"
import { StatCardSkeleton, ChartSkeleton, Skeleton } from "../../components/ui/Skeleton"

interface MetricValue { value: number }
interface Metrics {
  steps: MetricValue
  sleep: MetricValue
  heartRate: MetricValue
  weight: MetricValue
  calories: MetricValue
  activeMinutes: MetricValue
}

interface WeeklyTrends {
  steps: number
  sleep: number
  heart_rate: number
  weight: number
  calories: number
  active_minutes: number
}

interface WeeklySummary {
  summary: string[]
  trends: WeeklyTrends
  status: string
}

const METRIC_GOALS: Record<keyof Metrics, number> = {
  steps: 10000,
  sleep: 8,
  heartRate: 100,
  weight: 70,
  calories: 500,
  activeMinutes: 60,
}

const DEFAULT_METRICS: Metrics = {
  steps: { value: 0 },
  sleep: { value: 0 },
  heartRate: { value: 0 },
  weight: { value: 0 },
  calories: { value: 0 },
  activeMinutes: { value: 0 },
}

const METRIC_LABELS: Record<keyof Metrics, string> = {
  steps: "Steps",
  sleep: "Sleep",
  heartRate: "Heart Rate",
  weight: "Weight",
  calories: "Calories",
  activeMinutes: "Active Mins",
}

const DEFAULT_INSIGHTS = [
  "Consistency beats intensity — you're building a habit that compounds.",
  "Aim for a 20-minute walk after your largest meal.",
  "Protecting sleep is the single best thing you can do for tomorrow's HR.",
  "Small daily wins matter more than any single perfect day.",
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 5) return "Rest well"
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function toPoints(labels: string[] = [], values: number[] = []): TrendPoint[] {
  return labels.map((label, i) => ({ label, value: values[i] ?? 0 }))
}

export default function Dashboard() {
  const { user, isDemo } = useUser()
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS)
  const [stepsSeries, setStepsSeries] = useState<TrendPoint[]>([])
  const [sleepSeries, setSleepSeries] = useState<TrendPoint[]>([])
  const [heartSeries, setHeartSeries] = useState<TrendPoint[]>([])
  const [activitySeries, setActivitySeries] = useState<TrendPoint[]>([])
  const [aiInsights, setAiInsights] = useState<{ summary: string; insights: string[] }>({
    summary: "Loading your personalized health summary…",
    insights: [],
  })
  const [aiOnline, setAiOnline] = useState(false)
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [addMetric, setAddMetric] = useState<keyof Metrics | null>(null)
  const [addValue, setAddValue] = useState("")
  const [addSubmitting, setAddSubmitting] = useState(false)

  async function loadAll() {
    try {
      const [rec, m, steps, sleep, heart, activity, summary] = await Promise.allSettled([
        healthAPI.getHealthRecommendation(),
        healthAPI.getMetrics(),
        healthAPI.getStepData(),
        healthAPI.getSleepData(),
        healthAPI.getHeartRateData(),
        healthAPI.getActivityData(),
        healthAPI.getWeeklySummary(),
      ])

      if (rec.status === "fulfilled" && rec.value?.recommendations?.general) {
        setAiInsights(rec.value.recommendations.general)
        setAiOnline(true)
      }

      if (m.status === "fulfilled" && m.value) {
        setMetrics({
          steps: { value: m.value.steps || 0 },
          sleep: { value: m.value.sleep || 0 },
          heartRate: { value: m.value.heart_rate || 0 },
          weight: { value: m.value.weight || 0 },
          calories: { value: m.value.calories || 0 },
          activeMinutes: { value: m.value.activity_minutes || 0 },
        })
      }

      if (steps.status === "fulfilled") setStepsSeries(toPoints(steps.value.labels, steps.value.values))
      if (sleep.status === "fulfilled") setSleepSeries(toPoints(sleep.value.labels, sleep.value.values))
      if (heart.status === "fulfilled") setHeartSeries(toPoints(heart.value.labels, heart.value.values))
      if (activity.status === "fulfilled") setActivitySeries(toPoints(activity.value.labels, activity.value.values))

      if (summary.status === "fulfilled" && summary.value?.summary) {
        setWeekly({
          summary: summary.value.summary,
          trends: summary.value.trends || {
            steps: 0, sleep: 0, heart_rate: 0, weight: 0, calories: 0, active_minutes: 0,
          },
          status: summary.value.status || "success",
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAll()
  }

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addMetric || !addValue) return
    setAddSubmitting(true)
    try {
      const apiKey =
        addMetric === "heartRate" ? "heartRate" :
        addMetric === "activeMinutes" ? "activeMinutes" :
        addMetric
      await healthAPI.addMetric(apiKey, Number(addValue))
      setMetrics((prev) => ({ ...prev, [addMetric]: { value: Number(addValue) } }))
      setAddMetric(null)
      setAddValue("")
    } finally {
      setAddSubmitting(false)
    }
  }

  const dailyProgress = useMemo(() => {
    const stepPct = Math.min(100, (metrics.steps.value / METRIC_GOALS.steps) * 100)
    const sleepPct = Math.min(100, (metrics.sleep.value / METRIC_GOALS.sleep) * 100)
    const activePct = Math.min(100, (metrics.activeMinutes.value / METRIC_GOALS.activeMinutes) * 100)
    return Math.round((stepPct + sleepPct + activePct) / 3)
  }, [metrics])

  const displayInsights = aiInsights.insights.length ? aiInsights.insights : DEFAULT_INSIGHTS

  return (
    <div className="space-y-6">
      {/* Demo banner */}
      {(isDemo || demoMode.isActive()) && (
        <div className="rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm flex items-center gap-2 animate-fade-in-up">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-accent/15 text-accent shrink-0">
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
          </span>
          <span className="text-pretty">
            You're viewing sample data. <Link to="/auth" className="font-semibold text-primary hover:underline">Sign up</Link> to connect Google Fit.
          </span>
        </div>
      )}

      {/* Greeting header — flat, no gradient */}
      <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long", month: "long", day: "numeric",
              })}
            </p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              {greeting()}, {user?.name?.split(" ")[0] || "friend"}.
            </h1>
            {isLoading ? (
              <div className="mt-3 space-y-2 max-w-lg">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="mt-3 max-w-lg text-muted-foreground text-pretty">
                {aiInsights.summary}
              </p>
            )}
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-secondary text-foreground text-sm font-semibold hover:bg-muted disabled:opacity-70 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                to="/metrics"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                All metrics <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 self-center shrink-0">
            <ProgressRing value={dailyProgress} size={128} stroke={10}>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-foreground tabular-nums">{dailyProgress}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Daily goal</div>
              </div>
            </ProgressRing>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Steps"
              value={metrics.steps.value.toLocaleString()}
              unit="today"
              delta={weekly?.trends.steps}
              accent="steps"
              icon={<Footprints className="w-5 h-5" />}
            />
            <StatCard
              label="Heart Rate"
              value={metrics.heartRate.value}
              unit="bpm"
              delta={weekly?.trends.heart_rate}
              accent="heart"
              icon={<Heart className="w-5 h-5" />}
            />
            <StatCard
              label="Sleep"
              value={metrics.sleep.value.toFixed(1)}
              unit="hrs"
              delta={weekly?.trends.sleep}
              accent="sleep"
              icon={<Moon className="w-5 h-5" />}
            />
            <StatCard
              label="Calories"
              value={metrics.calories.value.toLocaleString()}
              unit="kcal"
              delta={weekly?.trends.calories}
              accent="calories"
              icon={<Flame className="w-5 h-5" />}
            />
            <StatCard
              label="Active Mins"
              value={metrics.activeMinutes.value}
              unit="min"
              delta={weekly?.trends.active_minutes}
              accent="active"
              icon={<Timer className="w-5 h-5" />}
            />
            <StatCard
              label="Weight"
              value={metrics.weight.value.toFixed(1)}
              unit="kg"
              delta={weekly?.trends.weight}
              accent="weight"
              icon={<Scale className="w-5 h-5" />}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <div className="lg:col-span-2"><ChartSkeleton height={240} /></div>
            <ChartSkeleton height={240} />
          </>
        ) : (
          <>
            <ChartCard
              className="lg:col-span-2"
              title="Weekly steps"
              subtitle="Trend of your daily step count"
              actions={
                <Link to="/metrics/steps" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  Details <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <TrendChart data={stepsSeries} color="hsl(var(--metric-steps))" variant="area" height={240} unit="steps" />
            </ChartCard>

            <ChartCard
              title="Active minutes"
              subtitle="How much you moved"
              actions={
                <Link to="/metrics/active-minutes" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  Details <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <TrendChart data={activitySeries} color="hsl(var(--metric-active))" variant="bar" height={240} unit="min" />
            </ChartCard>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <ChartSkeleton height={200} />
            <ChartSkeleton height={200} />
            <ChartSkeleton height={200} />
          </>
        ) : (
          <>
            <ChartCard
              title="Heart rate"
              subtitle="Beats per minute"
              actions={
                <Link to="/metrics/heart-rate" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  Details <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <TrendChart data={heartSeries} color="hsl(var(--metric-heart))" variant="line" height={200} unit="bpm" />
            </ChartCard>

            <ChartCard
              title="Sleep hours"
              subtitle="Nightly duration"
              actions={
                <Link to="/metrics/sleep" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  Details <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <TrendChart data={sleepSeries} color="hsl(var(--metric-sleep))" variant="area" height={200} unit="h" />
            </ChartCard>

            {/* AI Insights — flat with left accent bar */}
            <div className="rounded-2xl bg-card border border-border p-5 flex flex-col relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-sm">AI Insights</h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${aiOnline ? "bg-accent animate-pulse-soft" : "bg-muted-foreground/50"}`} />
                    {aiOnline ? "Live" : "Sample"}
                  </p>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {displayInsights.slice(0, 4).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-pretty">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Quick add metric */}
      <div>
        <SectionHeader
          eyebrow="Log manually"
          title="Add a metric"
          description="Fitbit or Fit not syncing? Add today's numbers by hand."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.keys(METRIC_LABELS) as (keyof Metrics)[]).map((key) => (
            <button
              key={key}
              onClick={() => setAddMetric(key)}
              className="group flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:border-foreground/30 hover:bg-secondary transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              {METRIC_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly summary */}
      {weekly && weekly.summary?.length > 0 && (
        <ChartCard title="This week" subtitle="Highlights from the past 7 days">
          <ul className="space-y-3">
            {weekly.summary.map((line, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-foreground text-pretty">{line}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}

      {/* Add metric modal */}
      {addMetric && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setAddMetric(null)}
        >
          <form
            onSubmit={handleAddMetric}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-pop p-6 space-y-4 animate-scale-in"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg">
                  Add {METRIC_LABELS[addMetric]}
                </h3>
                <p className="text-sm text-muted-foreground">Enter today's value.</p>
              </div>
              <button
                type="button"
                onClick={() => setAddMetric(null)}
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="number"
              step="0.1"
              autoFocus
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              placeholder="e.g. 8000"
              className="w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground outline-none focus:border-primary focus:shadow-ring tabular-nums"
            />
            <button
              type="submit"
              disabled={addSubmitting || !addValue}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-70 hover:bg-primary/90 transition-colors"
            >
              {addSubmitting ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
