"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { authAPI } from "../../api/api"
import { useUser } from "../../context/UserContext"
import GoogleLoginComponent from "../../components/GoogleLogin"
import {
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Sparkles,
  Activity,
  Brain,
  Zap,
} from "lucide-react"

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser, signInDemo } = useUser()
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  )
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) navigate("/dashboard")
  }, [navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleDemo = () => {
    setDemoLoading(true)
    signInDemo()
    setTimeout(() => navigate("/dashboard"), 150)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      if (mode === "signup") {
        if (formData.password.length < 8) throw new Error("Password must be at least 8 characters long")
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match")
        if (!formData.email.includes("@")) throw new Error("Please enter a valid email address")
        const response = await authAPI.basic_signup(formData.email, formData.password)
        if (response.user) {
          setUser({ name: response.user.name || formData.email.split("@")[0], email: formData.email })
          navigate("/dashboard")
        } else throw new Error("Signup failed. Please try again.")
      } else {
        const response = await authAPI.login(formData.email, formData.password)
        if (response.user) {
          setUser({ name: response.user.name || formData.email.split("@")[0], email: formData.email })
          navigate("/dashboard")
        } else throw new Error("Login failed. Please check your credentials.")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Heart className="w-5 h-5" fill="currentColor" />
            </span>
            <span className="font-display font-bold text-lg tracking-tight">HealthRec</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-balance">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              {mode === "signup"
                ? "Start understanding your health in 30 seconds."
                : "Sign in to see today's insights."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-fade-in-up">
              {error}
            </div>
          )}

          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="mb-3 w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 transition-colors"
          >
            <Zap className="w-4 h-4" fill="currentColor" />
            {demoLoading ? "Loading demo…" : "Try live demo — no signup"}
          </button>

          <div className="mb-6">
            <GoogleLoginComponent />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="px-3 bg-background text-muted-foreground">or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:shadow-ring transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full h-11 pl-10 pr-10 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:shadow-ring transition-all"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    className="w-full h-11 pl-10 pr-3 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:shadow-ring transition-all"
                    placeholder="Repeat your password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background font-semibold text-sm hover:opacity-90 disabled:opacity-70 transition-opacity"
            >
              {isLoading ? (
                "Processing…"
              ) : (
                <>
                  {mode === "signup" ? "Create account" : "Sign in"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">Terms</a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* Right — brand panel. Solid primary, no gradient. */}
      <div className="hidden lg:flex relative overflow-hidden bg-primary text-primary-foreground">
        <div className="relative flex flex-col justify-between p-12 w-full">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered insights
            </div>
            <h2 className="mt-8 text-5xl font-display font-bold tracking-tight max-w-md text-balance leading-[1.05]">
              Understand your body.
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-md text-pretty text-lg">
              Connect Google Fit and get AI-crafted daily summaries across sleep,
              heart, steps, calories, and more.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { Icon: Activity, text: "6 metrics unified in one dashboard" },
              { Icon: Brain, text: "GPT insights every morning" },
              { Icon: Check, text: "Free forever — no card required" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-foreground/10 border border-primary-foreground/15">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
