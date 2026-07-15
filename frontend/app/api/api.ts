import axios from "axios"
import { mock } from "./mock"

const PROD_API_URL = "https://healthrec.onrender.com"
const DEV_API_URL = "http://127.0.0.1:8000"

const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? (import.meta.env as any).VITE_API_URL || PROD_API_URL
    : DEV_API_URL

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 6000,
})

// ---------------------------------------------------------------------------
// Demo mode — lets the app work end-to-end without a backend.
// Activated when:
//   - token starts with "demo-" (explicit demo login), OR
//   - localStorage `demo` flag is set, OR
//   - any real API call fails with network error (auto-fallback)
// ---------------------------------------------------------------------------

const DEMO_KEY = "hr_demo"

export const demoMode = {
  isActive(): boolean {
    if (typeof window === "undefined") return false
    if (localStorage.getItem(DEMO_KEY) === "1") return true
    const t = localStorage.getItem("token")
    return !!t && t.startsWith("demo-")
  },
  activate() {
    if (typeof window === "undefined") return
    localStorage.setItem(DEMO_KEY, "1")
    localStorage.setItem("token", mock.token)
    localStorage.setItem("user", JSON.stringify(mock.user))
  },
  deactivate() {
    if (typeof window === "undefined") return
    localStorage.removeItem(DEMO_KEY)
  },
}

// Attach token + CSRF cookie to every real request
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token && !token.startsWith("demo-")) {
    config.headers["Authorization"] = `Token ${token}`
  }
  if (typeof document !== "undefined") {
    const csrfCookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("csrftoken="))
    if (csrfCookie) {
      config.headers["X-CSRFToken"] = csrfCookie.split("=")[1]
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !demoMode.isActive()) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        if (!window.location.pathname.startsWith("/auth")) {
          window.location.href = "/auth"
        }
      }
    }
    return Promise.reject(error)
  }
)

const handleError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message
    )
  }
  return "An unexpected error occurred"
}

// Helper: run `real` if not demo, else return `demoValue`. On network error, degrade to demo.
async function withFallback<T>(real: () => Promise<T>, demoValue: () => T): Promise<T> {
  if (demoMode.isActive()) return demoValue()
  try {
    return await real()
  } catch (e) {
    if (axios.isAxiosError(e) && (!e.response || e.code === "ECONNABORTED" || e.code === "ERR_NETWORK")) {
      return demoValue()
    }
    throw e
  }
}

// Fetch and cache the CSRF token
export const getCsrfToken = async (): Promise<string | null> => {
  try {
    const response = await apiClient.get("/csrf-cookie/")
    const token = response.data.csrfToken || response.headers["x-csrftoken"]
    if (token) apiClient.defaults.headers["X-CSRFToken"] = token
    return token ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authAPI = {
  demoLogin: () => {
    demoMode.activate()
    return { user: mock.user, token: mock.token }
  },

  basic_signup: async (email: string, password: string) => {
    if (demoMode.isActive()) {
      return { user: { ...mock.user, email, username: email }, token: mock.token }
    }
    try {
      await getCsrfToken()
      const response = await apiClient.post("/basic_signup/", { username: email, password })
      if (response.data.token) localStorage.setItem("token", response.data.token)
      if (response.data.user) localStorage.setItem("user", JSON.stringify(response.data.user))
      return response.data
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      // Backend unreachable? Offer demo mode transparently.
      if (axios.isAxiosError(error) && !error.response) {
        demoMode.activate()
        return { user: { ...mock.user, email, username: email }, token: mock.token }
      }
      throw new Error("Signup failed. Please try again.")
    }
  },

  login: async (username: string, password: string) => {
    if (demoMode.isActive()) {
      return { user: { ...mock.user, email: username, username }, token: mock.token }
    }
    try {
      await getCsrfToken()
      const response = await apiClient.post("/login/", { username, password })
      if (response.data.token) localStorage.setItem("token", response.data.token)
      if (response.data.user) localStorage.setItem("user", JSON.stringify(response.data.user))
      return response.data
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && !error.response) {
        demoMode.activate()
        return { user: { ...mock.user, email: username, username }, token: mock.token }
      }
      throw new Error(handleError(error))
    }
  },

  logout: async () => {
    try {
      if (!demoMode.isActive()) await apiClient.post("/logout/", {})
    } finally {
      demoMode.deactivate()
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },

  getProfile: async () =>
    withFallback(
      async () => {
        const response = await apiClient.get("/profile/")
        return {
          name: response.data.first_name || response.data.username?.split("@")[0] || "",
          email: response.data.email || response.data.username || "",
        }
      },
      () => {
        const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null
        if (raw) {
          try {
            const u = JSON.parse(raw)
            return { name: u.name || mock.user.name, email: u.email || mock.user.email }
          } catch { /* ignore */ }
        }
        return { name: mock.user.name, email: mock.user.email }
      }
    ),

  updateProfile: async (profileData: Record<string, string>) => {
    if (demoMode.isActive()) {
      const raw = localStorage.getItem("user")
      const u = raw ? JSON.parse(raw) : mock.user
      const next = { ...u, ...profileData }
      localStorage.setItem("user", JSON.stringify(next))
      return { success: true, ...next }
    }
    try {
      const response = await apiClient.put("/update_profile/", profileData)
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },

  updateSettings: async (settingsData: Record<string, unknown>) => {
    if (demoMode.isActive()) {
      localStorage.setItem("hr_settings", JSON.stringify(settingsData))
      return { success: true }
    }
    try {
      const response = await apiClient.put("/update_settings/", settingsData)
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },

  getSettings: async () =>
    withFallback(
      async () => (await apiClient.get("/user_settings/")).data,
      () => {
        const raw = typeof window !== "undefined" ? localStorage.getItem("hr_settings") : null
        return raw ? { ...mock.settings, ...JSON.parse(raw) } : mock.settings
      }
    ),

  scheduleAccountDeletion: async (days: number) => {
    if (demoMode.isActive()) {
      return { scheduled: new Date(Date.now() + days * 86400000).toISOString() }
    }
    try {
      const response = await apiClient.post("/account_deletion/", { days })
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },

  cancelAccountDeletion: async () => {
    if (demoMode.isActive()) return { cancelled: true }
    try {
      const response = await apiClient.post("/cancel_deletion/", {})
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },

  googleLogin: async () => {
    const response = await apiClient.get("/google_login/")
    return response.data
  },

  googleCallback: async (code: string) => {
    const response = await apiClient.post("/google_callback/", { code })
    return response.data
  },

  connectGoogleFit: async () => {
    if (demoMode.isActive()) {
      localStorage.setItem("hr_fit_connected", "1")
      return true
    }
    const response = await apiClient.get("/connect_google_fit/")
    if (response.data.authUrl) {
      window.location.href = response.data.authUrl
      return true
    }
    throw new Error("Failed to get Google Fit auth URL")
  },

  checkGoogleFitStatus: async () =>
    withFallback(
      async () => (await apiClient.get("/google_fit_status/")).data.connected as boolean,
      () => (typeof window !== "undefined" && localStorage.getItem("hr_fit_connected") === "1")
    ),

  checkOpenAIStatus: async () => {
    if (demoMode.isActive()) return { status: "ok", model: "demo" }
    const response = await apiClient.get("/check_openai_status/")
    return response.data
  },

  verifyToken: async () => {
    if (demoMode.isActive()) return { valid: true, user: mock.user }
    const response = await apiClient.get("/verify_token/")
    return response.data
  },
}

// ---------------------------------------------------------------------------
// Health API
// ---------------------------------------------------------------------------

const cleanRecommendation = (text: string): string => text.replace(/^\d+\.\s*/, "")

export const healthAPI = {
  getHealthRecommendation: async () =>
    withFallback(
      async () => {
        const response = await apiClient.post("/get_health_recommendation/", {})
        if (response.data?.recommendations?.general?.insights) {
          response.data.recommendations.general.insights =
            response.data.recommendations.general.insights.map(cleanRecommendation)
        }
        if (response.data?.recommendations?.correlation) {
          response.data.recommendations.correlation =
            response.data.recommendations.correlation.map(cleanRecommendation)
        }
        return response.data
      },
      () => mock.aiRecommendation()
    ),

  getHealthData: async () =>
    withFallback(
      async () => (await apiClient.get("/health_data/")).data,
      () => mock.todayMetrics()
    ),

  getHealthFacts: async () =>
    withFallback(
      async () => (await apiClient.post("/HealthFacts/", {})).data,
      () => ({ facts: [] })
    ),

  getStepData: async (range: "week" | "month" | "year" = "week") =>
    withFallback(
      async () => {
        const response = await apiClient.get("/step_data/")
        if (!Array.isArray(response.data?.labels)) return mock.steps(range)
        return response.data
      },
      () => mock.steps(range)
    ),

  getSleepData: async (range: "week" | "month" | "year" = "week") =>
    withFallback(
      async () => {
        const response = await apiClient.get("/sleep_data/")
        if (!Array.isArray(response.data?.labels)) return mock.sleep(range)
        return response.data
      },
      () => mock.sleep(range)
    ),

  getHeartRateData: async (range: "week" | "month" | "year" = "week") =>
    withFallback(
      async () => {
        const response = await apiClient.get("/heart_data/")
        if (!Array.isArray(response.data?.labels)) return mock.heart(range)
        return response.data
      },
      () => mock.heart(range)
    ),

  getWeightData: async (range: "week" | "month" | "year" = "week") =>
    withFallback(
      async () => {
        const response = await apiClient.get("/weight_data/")
        if (!Array.isArray(response.data?.labels)) return mock.weight(range)
        return response.data
      },
      () => mock.weight(range)
    ),

  getCaloriesData: async (range: "week" | "month" | "year" = "week") =>
    withFallback(
      async () => {
        const response = await apiClient.get("/calories_data/")
        if (!Array.isArray(response.data?.labels)) return mock.calories(range)
        return response.data
      },
      () => mock.calories(range)
    ),

  getActivityData: async (range: "week" | "month" | "year" = "week") =>
    withFallback(
      async () => {
        const response = await apiClient.get("/activity_data/")
        if (!Array.isArray(response.data?.labels)) return mock.activity(range)
        return response.data
      },
      () => mock.activity(range)
    ),

  getMetrics: async () =>
    withFallback(
      async () => (await apiClient.get("/get_metrics/")).data,
      () => mock.todayMetrics()
    ),

  getMetricsChart: async (metricType: string) => {
    if (demoMode.isActive()) return mock.steps()
    try {
      const response = await apiClient.get(`/metrics_chart/${metricType}/`)
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },

  getDoctorReport: async (email: string, metrics: string[], customNotes = "") => {
    if (demoMode.isActive()) {
      return {
        success: true,
        sent_to: email,
        included: metrics,
        notes: customNotes,
      }
    }
    try {
      const response = await apiClient.post("/get_doctor_report/", {
        email,
        metrics,
        custom_notes: customNotes,
      })
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },

  downloadHealthData: async (format: "json" | "csv" = "json") => {
    if (demoMode.isActive()) {
      const payload = {
        exported_at: new Date().toISOString(),
        user: mock.user,
        metrics: mock.todayMetrics(),
        weekly: {
          steps: mock.steps(),
          sleep: mock.sleep(),
          heart: mock.heart(),
          weight: mock.weight(),
          calories: mock.calories(),
          activity: mock.activity(),
        },
      }
      if (format === "csv") {
        const rows: string[] = ["metric,label,value"]
        for (const [k, v] of Object.entries(payload.weekly) as [string, { labels: string[]; values: number[] }][]) {
          v.labels.forEach((label, i) => rows.push(`${k},${label},${v.values[i]}`))
        }
        return new Blob([rows.join("\n")], { type: "text/csv" })
      }
      return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    }
    try {
      const response = await apiClient.get(`/download_health_data/?format=${format}`, {
        responseType: format === "csv" ? "blob" : "json",
      })
      if (format === "json") {
        return new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" })
      }
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },

  getWeeklySummary: async () =>
    withFallback(
      async () => (await apiClient.post("/weekly_summary/", {})).data,
      () => mock.weeklySummary()
    ),

  addMetric: async (metric: string, value: number) => {
    if (demoMode.isActive()) {
      return { success: true, metric, value }
    }
    try {
      const response = await apiClient.post("/add_metric/", { metric, value })
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },

  explainHealthMetric: async (message: string) => {
    if (demoMode.isActive()) {
      return {
        response:
          "In demo mode, we don't call the AI — but in the real app, GPT would interpret this for you in plain language.",
      }
    }
    try {
      const response = await apiClient.post("/health_interpreter/", { message })
      return response.data
    } catch (error: unknown) {
      throw new Error(handleError(error))
    }
  },
}

// ---------------------------------------------------------------------------
// Google OAuth helpers (used by GoogleCallback page)
// ---------------------------------------------------------------------------

export const googleLogin = async (): Promise<void> => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  const response = await apiClient.get("/google_login/")
  if (response.status === 200 && response.data.authUrl) {
    window.location.href = response.data.authUrl
  } else {
    throw new Error("Failed to get Google login URL")
  }
}

export const checkGoogleStatus = async () => {
  try {
    const response = await apiClient.get("/google_status/")
    return response.data
  } catch {
    return { connected: false }
  }
}

export const googleCallback = async (
  code: string
): Promise<{
  token?: string
  user?: { username: string; name: string; email: string }
  error?: string
}> => {
  const response = await apiClient.post("/google_callback/", { code })
  return response.data
}

// ---------------------------------------------------------------------------
// Support API
// ---------------------------------------------------------------------------

export const supportAPI = {
  contactSupport: async (name: string, email: string, message: string) => {
    if (demoMode.isActive()) {
      return { success: true, name, email, message }
    }
    try {
      const response = await apiClient.post("/support_contact/", { name, email, message })
      return response.data
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && !error.response) {
        return { success: true, offline: true }
      }
      throw new Error(handleError(error))
    }
  },

  getFAQs: async () =>
    withFallback(
      async () => (await apiClient.get("/get_faqs/")).data,
      () => ({ faqs: mock.faqs })
    ),
}
