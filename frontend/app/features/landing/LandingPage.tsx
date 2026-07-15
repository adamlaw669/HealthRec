import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import {
  Heart,
  Activity,
  Brain,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  Moon,
  Sun,
  Menu,
  X,
  Star,
  Zap,
  Play,
} from "lucide-react"
import { useTheme } from "../../context/ThemeContext"
import { useUser } from "../../context/UserContext"
import { supportAPI } from "../../api/api"

const FEATURES = [
  {
    Icon: Brain,
    title: "AI-powered insights",
    description:
      "GPT-driven daily summaries and correlation insights across your sleep, activity, and heart data.",
  },
  {
    Icon: Activity,
    title: "All your metrics, one view",
    description:
      "Steps, sleep, heart rate, weight, calories, active minutes — beautifully visualized and connected.",
  },
  {
    Icon: Heart,
    title: "Google Fit sync",
    description:
      "One-click connect. Your Google Fit data flows in automatically — no manual logging needed.",
  },
  {
    Icon: ShieldCheck,
    title: "Private by design",
    description:
      "Your health data is yours. We store the minimum needed and let you export or delete anytime.",
  },
]

const STEPS = [
  {
    number: "01",
    title: "Sign in with Google",
    description: "One click and you're in — no long signup forms, no verification email.",
  },
  {
    number: "02",
    title: "Connect Google Fit",
    description: "Grant access once. We'll pull steps, heart rate, sleep, and calories automatically.",
  },
  {
    number: "03",
    title: "Get personal insights",
    description: "Open your dashboard and see AI recommendations tailored to your data.",
  },
]

const TESTIMONIALS = [
  {
    quote: "The daily AI summary is the first thing I read every morning. It's like having a coach.",
    author: "Yomi D.",
    role: "Endurance runner",
  },
  {
    quote: "I finally understand how my sleep affects my heart rate. The correlations are eye-opening.",
    author: "Olivia A.",
    role: "Software engineer",
  },
  {
    quote: "Clean, fast, and it actually made me care about my metrics. That's a first.",
    author: "Liam T.",
    role: "Founder",
  },
]

const STATS = [
  { value: "12M+", label: "Data points analyzed" },
  { value: "94%", label: "Retention after week 1" },
  { value: "4.8", label: "Average rating" },
]

export default function LandingPage() {
  const { darkMode, toggleTheme } = useTheme()
  const { signInDemo } = useUser()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [contact, setContact] = useState({ name: "", email: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<"idle" | "ok" | "err">("idle")

  const handleDemo = () => {
    signInDemo()
    setTimeout(() => navigate("/dashboard"), 150)
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitState("idle")
    try {
      await supportAPI.contactSupport(contact.name, contact.email, contact.message)
      setSubmitState("ok")
      setContact({ name: "", email: "", message: "" })
    } catch {
      setSubmitState("err")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Very subtle background — pattern, not a gradient wash */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-grid" aria-hidden />

      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <Heart className="w-5 h-5" fill="currentColor" />
            </span>
            <span className="font-display font-bold text-lg tracking-tight">HealthRec</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDemo}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Demo
            </button>
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-border px-4 py-4 space-y-2 bg-background">
            {[
              ["Features", "#features"],
              ["How it works", "#how"],
              ["Reviews", "#testimonials"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {label}
              </a>
            ))}
            <button
              onClick={() => { setMobileOpen(false); handleDemo() }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-primary"
            >
              <Play className="w-3.5 h-3.5 inline mr-1.5" /> Try demo
            </button>
            <Link
              to="/auth"
              className="block px-3 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground text-center"
            >
              Get started
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-foreground text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Powered by GPT
              </div>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-balance leading-[1.05]">
                Your health,{" "}
                <span className="text-primary">understood</span> — not just tracked.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty max-w-xl">
                Connect Google Fit and get daily AI-crafted insights that connect
                the dots across your sleep, activity, heart, and weight — so you
                actually know what to change.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDemo}
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Zap className="w-4 h-4" fill="currentColor" /> Try live demo
                </button>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-card border border-border font-semibold hover:bg-secondary transition-colors"
                >
                  Sign up free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-accent" /> No credit card
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-accent" /> 30-second setup
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-accent" /> Cancel anytime
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in-up" style={{ animationDelay: "80ms" }}>
              <HeroMock />
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto lg:mx-0">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold text-foreground tabular-nums">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Features</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display font-bold tracking-tight text-balance">
              Everything you need to actually improve.
            </h2>
            <p className="mt-4 text-muted-foreground text-pretty">
              We do the hard work of stitching your data together and translating it
              into changes you can actually make.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl bg-card border border-border p-6 hover:border-foreground/20 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 font-display font-semibold text-lg text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-20 sm:py-24 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Three steps. Under a minute.
            </h2>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl bg-card border border-border p-6"
              >
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary text-sm font-display font-bold tabular-nums">
                  {step.number}
                </div>
                <h3 className="mt-4 font-display font-semibold text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Loved by users</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Real people. Real changes.
            </h2>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.author}
                className="rounded-2xl bg-card border border-border p-6"
              >
                <div className="flex items-center gap-0.5 text-metric-calories">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" fill="currentColor" />
                  ))}
                </div>
                <blockquote className="mt-4 text-foreground text-pretty">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                    {t.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Contact */}
      <section id="contact" className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-foreground text-background p-8 sm:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-balance">
                  Ready to actually understand your health?
                </h2>
                <p className="mt-4 text-background/70 text-pretty">
                  Free forever. No credit card. Try the demo and see your first insight in seconds.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleDemo}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-background text-foreground font-semibold hover:bg-background/95 transition-colors"
                  >
                    <Zap className="w-4 h-4" fill="currentColor" /> Try demo
                  </button>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-background/10 border border-background/20 text-background font-semibold hover:bg-background/20 transition-colors"
                  >
                    Get started <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <form
                onSubmit={handleContactSubmit}
                className="rounded-2xl bg-background/5 border border-background/15 p-5 space-y-3"
              >
                <p className="text-sm font-semibold">Have a question?</p>
                <input
                  required
                  placeholder="Your name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg bg-background/10 border border-background/15 text-sm text-background placeholder:text-background/50 outline-none focus:border-background/40"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg bg-background/10 border border-background/15 text-sm text-background placeholder:text-background/50 outline-none focus:border-background/40"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="How can we help?"
                  value={contact.message}
                  onChange={(e) => setContact({ ...contact, message: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background/10 border border-background/15 text-sm text-background placeholder:text-background/50 outline-none focus:border-background/40 resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-lg bg-background text-foreground font-semibold disabled:opacity-70 hover:bg-background/95 transition-colors"
                >
                  {submitting ? "Sending…" : "Send message"}
                </button>
                {submitState === "ok" && (
                  <p className="text-xs text-background/80">Thanks — we'll get back to you.</p>
                )}
                {submitState === "err" && (
                  <p className="text-xs text-background/80">Couldn't send. Try again.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground">
              <Heart className="w-3 h-3" fill="currentColor" />
            </span>
            <span>© {new Date().getFullYear()} HealthRec</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function HeroMock() {
  return (
    <div className="relative">
      <div className="relative rounded-2xl bg-card border border-border shadow-pop overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-secondary/50">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-metric-calories/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent/70" />
          <span className="ml-3 text-xs text-muted-foreground">healthrec.app / dashboard</span>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Good morning, Adam</p>
              <p className="font-display font-bold text-lg">Today's ring</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/15 text-accent">
              +12% vs. avg
            </span>
          </div>

          <div className="flex items-center gap-4">
            <svg width="88" height="88" className="-rotate-90">
              <circle cx="44" cy="44" r="36" fill="none" strokeWidth="10" className="stroke-secondary" />
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * 0.18}
              />
            </svg>
            <div>
              <div className="text-3xl font-display font-bold tabular-nums">82%</div>
              <div className="text-xs text-muted-foreground">of daily goal</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Heart", value: "72", unit: "bpm", color: "text-metric-heart", bg: "bg-metric-heart/10" },
              { label: "Steps", value: "8.2k", unit: "", color: "text-metric-steps", bg: "bg-metric-steps/10" },
              { label: "Kcal", value: "420", unit: "", color: "text-metric-calories", bg: "bg-metric-calories/10" },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg p-3 ${s.bg}`}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className={`mt-0.5 font-display font-bold text-lg tabular-nums ${s.color}`}>
                  {s.value}
                  {s.unit && <span className="ml-0.5 text-xs">{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-secondary/60 border-l-2 border-primary px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <Sparkles className="w-3.5 h-3.5" /> AI insight
            </div>
            <p className="text-xs text-foreground text-pretty">
              Your resting HR dropped 4 bpm on days you slept over 7h. Aim for
              early sleep tonight.
            </p>
          </div>

          <div className="flex items-end justify-between h-14 gap-1.5">
            {[30, 44, 38, 60, 52, 74, 66, 88, 72, 92, 80, 68].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-primary/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
