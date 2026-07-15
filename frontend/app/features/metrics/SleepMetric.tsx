import { Moon } from "lucide-react"
import { healthAPI } from "../../api/api"
import MetricDetail from "./MetricDetail"

export default function SleepMetric() {
  return (
    <MetricDetail
      title="Sleep"
      subtitle="Hours of sleep per night"
      unit="hrs"
      color="hsl(var(--metric-sleep))"
      Icon={Moon}
      accentClass="bg-metric-sleep/10 text-metric-sleep"
      chartVariant="area"
      fetcher={healthAPI.getSleepData}
      formatValue={(v) => v.toFixed(1)}
      goal={8}
      insights={[
        "Adults typically need 7–9 hours of sleep per night.",
        "A consistent bedtime is often more impactful than total duration.",
        "Limit screens 30 minutes before bed to improve deep-sleep quality.",
      ]}
    />
  )
}
