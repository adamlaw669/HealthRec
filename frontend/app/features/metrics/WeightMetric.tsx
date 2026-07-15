import { Scale } from "lucide-react"
import { healthAPI } from "../../api/api"
import MetricDetail from "./MetricDetail"

export default function WeightMetric() {
  return (
    <MetricDetail
      title="Weight"
      subtitle="Body weight over time"
      unit="kg"
      color="hsl(var(--metric-weight))"
      Icon={Scale}
      accentClass="bg-metric-weight/10 text-metric-weight"
      chartVariant="line"
      fetcher={healthAPI.getWeightData}
      formatValue={(v) => v.toFixed(1)}
      insights={[
        "Daily weight fluctuations of 1–2 kg are normal — trend lines matter, not single days.",
        "Weigh yourself under similar conditions each day for the most reliable trend.",
        "Body composition (muscle vs. fat) matters more than scale weight alone.",
      ]}
    />
  )
}
