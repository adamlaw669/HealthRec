import { ReactNode } from "react"
import { cn } from "@lib/utils"

interface ChartCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function ChartCard({
  title,
  subtitle,
  actions,
  className,
  bodyClassName,
  children,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card border border-border/60 shadow-soft overflow-hidden",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h3 className="font-display font-semibold text-base tracking-tight text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  )
}

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-4", className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {description}
          </p>
        )}
      </div>
      {actions}
    </div>
  )
}
