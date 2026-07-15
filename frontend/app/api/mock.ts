/**
 * Deterministic-ish mock data for demo mode.
 * Values look real: gentle daily rhythm + weekly variation, seeded from today's date.
 */

type Range = "week" | "month" | "year"

const seed = () => {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function series(
  base: number,
  variance: number,
  n: number,
  s: number,
  { drift = 0, floor = 0 }: { drift?: number; floor?: number } = {}
): number[] {
  const rnd = mulberry32(s)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const wave = Math.sin((i / n) * Math.PI * 2) * variance * 0.35
    const noise = (rnd() - 0.5) * variance
    const trend = drift * i
    out.push(Math.max(floor, base + wave + noise + trend))
  }
  return out
}

function labelsFor(range: Range): string[] {
  const now = new Date()
  if (range === "week") {
    const wk = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const start = new Date(now)
    const day = (now.getDay() + 6) % 7 // Mon=0
    start.setDate(now.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return wk[i]
    })
  }
  if (range === "month") {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (29 - i))
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now)
    d.setMonth(now.getMonth() - (11 - i))
    return months[d.getMonth()]
  })
}

function buildSeries(
  metric: "steps" | "heart" | "sleep" | "calories" | "activity" | "weight",
  range: Range = "week"
) {
  const s = seed() + metric.charCodeAt(0)
  const labels = labelsFor(range)
  const n = labels.length
  let values: number[] = []
  switch (metric) {
    case "steps":
      values = series(8600, 3200, n, s, { floor: 2000 }).map((v) => Math.round(v))
      break
    case "heart":
      values = series(72, 12, n, s, { floor: 55 }).map((v) => Math.round(v))
      break
    case "sleep":
      values = series(7.2, 1.6, n, s, { floor: 4 }).map((v) => Number(v.toFixed(1)))
      break
    case "calories":
      values = series(430, 180, n, s, { floor: 150 }).map((v) => Math.round(v))
      break
    case "activity":
      values = series(45, 30, n, s, { floor: 8 }).map((v) => Math.round(v))
      break
    case "weight":
      values = series(72.5, 0.8, n, s, { floor: 55, drift: -0.02 }).map((v) => Number(v.toFixed(1)))
      break
  }
  return { labels, values }
}

export const mock = {
  user: {
    name: "Adam Lawal",
    email: "demo@healthrec.app",
    username: "demo@healthrec.app",
  },

  token: "demo-token-" + seed(),

  todayMetrics() {
    const s = seed()
    const rnd = mulberry32(s + 1)
    return {
      steps: Math.round(6800 + rnd() * 3500),
      heart_rate: Math.round(66 + rnd() * 12),
      sleep: Number((6.6 + rnd() * 1.4).toFixed(1)),
      weight: Number((72.3 + rnd() * 0.6).toFixed(1)),
      calories: Math.round(380 + rnd() * 220),
      activity_minutes: Math.round(28 + rnd() * 42),
    }
  },

  steps: (r: Range = "week") => buildSeries("steps", r),
  heart: (r: Range = "week") => buildSeries("heart", r),
  sleep: (r: Range = "week") => buildSeries("sleep", r),
  calories: (r: Range = "week") => buildSeries("calories", r),
  activity: (r: Range = "week") => buildSeries("activity", r),
  weight: (r: Range = "week") => buildSeries("weight", r),

  weeklySummary() {
    return {
      summary: [
        "Your average sleep this week was 7.1 hours — up 6% from last week.",
        "You hit your step goal on 4 of 7 days. Sunday was your peak at 12,400 steps.",
        "Resting heart rate trended down slightly. Keep the momentum.",
      ],
      trends: {
        steps: 8.4,
        sleep: 6.2,
        heart_rate: -3.1,
        weight: -0.4,
        calories: 4.8,
        active_minutes: 11.3,
      },
      status: "success",
    }
  },

  aiRecommendation() {
    return {
      recommendations: {
        general: {
          summary:
            "You're trending in a great direction — sleep is up, resting HR is down. Here's how to build on it.",
          insights: [
            "Add one 20-minute Zone 2 walk mid-afternoon to nudge active minutes.",
            "Your best sleep followed days you finished eating before 8 PM. Consider protecting that window.",
            "Hydration correlates with your morning HR variability. Aim for 2L on lower-HR days.",
            "Sunday was your recovery high — schedule harder training earlier that morning.",
          ],
        },
        correlation: [
          "Nights over 7.5h sleep → next-day resting HR drops ~4 bpm.",
          "Days with 45+ active minutes → +18% deeper sleep score.",
        ],
      },
    }
  },

  faqs: [
    {
      question: "How is my health data secured?",
      answer:
        "Your data is encrypted in transit and at rest. We never share it and you can wipe your account any time.",
    },
    {
      question: "Can I export my data?",
      answer: "Yes — Profile → Export data. CSV and JSON are both supported.",
    },
    {
      question: "How accurate are the AI insights?",
      answer:
        "They combine your data with general health guidelines. Informational only — not medical advice.",
    },
    {
      question: "How do I connect Google Fit?",
      answer: "Settings → Connections → Connect. Grant fitness permissions when prompted.",
    },
    {
      question: "Is there a mobile app?",
      answer:
        "The web app is fully responsive. Native iOS + Android apps are on the roadmap.",
    },
  ],

  settings: {
    language: "en",
    useMetricSystem: true,
    emailNotifications: true,
    healthAlerts: true,
    accountDeletionScheduled: null,
  },
}
