import { Flame } from "lucide-react"
import { healthAPI } from "../../api/api"
import MetricDetail from "./MetricDetail"

export default function CaloriesMetric() {
  return (
    <MetricDetail
      title="Calories"
      subtitle="Daily calories burned"
      unit="kcal"
      color="hsl(var(--metric-calories))"
      Icon={Flame}
      accentClass="bg-metric-calories/10 text-metric-calories"
      chartVariant="bar"
      fetcher={healthAPI.getCaloriesData}
      formatValue={(v) => Math.round(v).toLocaleString()}
      goal={2200}
      insights={[
        "Calorie burn depends on your basal rate plus daily activity.",
        "Strength training keeps burning calories after your workout ends.",
        "Focus on food quality alongside quantity — protein and fiber first.",
      ]}
    />
  )
}
