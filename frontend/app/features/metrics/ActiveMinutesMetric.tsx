import { Timer } from "lucide-react"
import { healthAPI } from "../../api/api"
import MetricDetail from "./MetricDetail"

export default function ActiveMinutesMetric() {
  return (
    <MetricDetail
      title="Active Minutes"
      subtitle="Minutes of moderate-to-vigorous activity"
      unit="min"
      color="hsl(var(--metric-active))"
      Icon={Timer}
      accentClass="bg-metric-active/10 text-metric-active"
      chartVariant="bar"
      fetcher={healthAPI.getActivityData}
      formatValue={(v) => Math.round(v).toLocaleString()}
      goal={60}
      insights={[
        "The WHO recommends at least 150 active minutes per week.",
        "Splitting activity into short bouts still counts — 10 minutes at a time works.",
        "Mix cardio, strength, and mobility for the strongest health returns.",
      ]}
    />
  )
}
