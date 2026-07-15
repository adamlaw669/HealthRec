import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export type TrendPoint = { label: string; value: number }

interface TrendChartProps {
  data: TrendPoint[]
  color?: string
  variant?: "area" | "line" | "bar"
  height?: number
  showAxes?: boolean
  showGrid?: boolean
  gradientId?: string
  unit?: string
}

const TooltipCard = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-card border border-border shadow-pop px-3 py-2 text-xs">
      <p className="font-medium text-muted-foreground mb-0.5">{label}</p>
      <p className="font-display font-bold text-base text-foreground">
        {payload[0].value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  )
}

export function TrendChart({
  data,
  color = "hsl(var(--primary))",
  variant = "area",
  height = 220,
  showAxes = true,
  showGrid = true,
  gradientId = "trend-gradient",
  unit,
}: TrendChartProps) {
  const uniqueId = `${gradientId}-${color}`.replace(/[^\w-]/g, "")

  if (variant === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 4" />}
          {showAxes && (
            <>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
            </>
          )}
          <Tooltip content={<TooltipCard unit={unit} />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
          <Bar dataKey="value" fill={`url(#${uniqueId})`} radius={[8, 8, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (variant === "line") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          {showGrid && <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 4" />}
          {showAxes && (
            <>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
            </>
          )}
          <Tooltip content={<TooltipCard unit={unit} />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {showGrid && <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 4" />}
        {showAxes && (
          <>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
          </>
        )}
        <Tooltip content={<TooltipCard unit={unit} />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${uniqueId})`}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
