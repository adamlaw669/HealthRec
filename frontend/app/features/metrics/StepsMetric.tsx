import { Footprints } from "lucide-react"
import { healthAPI } from "../../api/api"
import MetricDetail from "./MetricDetail"

export default function StepsMetric() {
  return (
    <MetricDetail
      title="Steps"
      subtitle="Daily steps captured from Google Fit"
      unit="steps"
      color="hsl(var(--metric-steps))"
      Icon={Footprints}
      accentClass="bg-metric-steps/10 text-metric-steps"
      chartVariant="bar"
      fetcher={healthAPI.getStepData}
      formatValue={(v) => Math.round(v).toLocaleString()}
      goal={10000}
      insights={[
        "10,000 steps is a common goal — but consistency matters more than any single number.",
        "Even 30 minutes of brisk walking a day meaningfully improves cardiovascular health.",
        "Short 5-minute walks after meals help blood-sugar stability.",
      ]}
    />
  )
}
