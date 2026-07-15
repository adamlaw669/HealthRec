import { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  delta?: number
  icon?: ReactNode
  accent?: "heart" | "steps" | "sleep" | "calories" | "active" | "weight" | "primary"
  className?: string
  children?: ReactNode
}

const ICON_STYLES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  heart: "bg-metric-heart/10 text-metric-heart",
  steps: "bg-metric-steps/10 text-metric-steps",
  sleep: "bg-metric-sleep/10 text-metric-sleep",
  calories: "bg-metric-calories/10 text-metric-calories",
  active: "bg-metric-active/10 text-metric-active",
  weight: "bg-metric-weight/10 text-metric-weight",
  primary: "bg-primary/10 text-primary",
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  icon,
  accent = "primary",
  className,
  children,
}: StatCardProps) {
  const deltaUp = typeof delta === "number" && delta >= 0
  return (
    <div
      className={cn(
        "group rounded-2xl bg-card border border-border p-5 hover:border-foreground/20 transition-colors",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-bold tracking-tight text-foreground tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          {typeof delta === "number" && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                deltaUp ? "text-metric-active" : "text-metric-heart"
              )}
            >
              {deltaUp ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span className="tabular-nums">{Math.abs(delta).toFixed(1)}%</span>
              <span className="text-muted-foreground font-normal">vs last week</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
              ICON_STYLES[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
