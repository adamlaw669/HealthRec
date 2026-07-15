import { Heart } from "lucide-react"
import { healthAPI } from "../../api/api"
import MetricDetail from "./MetricDetail"

export default function HeartRateMetric() {
  return (
    <MetricDetail
      title="Heart Rate"
      subtitle="Beats per minute over time"
      unit="bpm"
      color="hsl(var(--metric-heart))"
      Icon={Heart}
      accentClass="bg-metric-heart/10 text-metric-heart"
      chartVariant="line"
      fetcher={healthAPI.getHeartRateData}
      formatValue={(v) => v.toFixed(0)}
      goal={100}
      insights={[
        "A healthy resting heart rate is typically between 60–100 bpm.",
        "Sleep quality strongly influences resting HR — 7+ hours usually pulls it down.",
        "Sudden jumps often correlate with stress, caffeine, or dehydration.",
      ]}
    />
  )
}
