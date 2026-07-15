import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { googleCallback } from "../../api/api"
import { useUser } from "../../context/UserContext"
import { AlertCircle, Loader2, Heart } from "lucide-react"

const GoogleCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useUser()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code")
        if (!code) throw new Error("No authorization code received from Google")

        const data = await googleCallback(code)

        if (data.token && data.user) {
          localStorage.setItem("token", data.token)
          localStorage.setItem("user", JSON.stringify(data.user))
          setUser({ name: data.user.name || "", email: data.user.email || "" })
          navigate("/dashboard")
        } else {
          throw new Error(data.error || "Authentication failed — no token returned")
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication failed"
        setError(message)
        setTimeout(() => navigate("/auth?mode=signin&error=google_login_failed"), 4000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full text-center animate-fade-in-up">
        <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-pop mb-6">
          <Heart className="w-6 h-6" fill="currentColor" />
        </div>

        {!error ? (
          <>
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <h1 className="mt-4 font-display font-bold text-xl">Signing you in…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Just a moment while we set things up.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="mt-4 font-display font-bold text-xl">Authentication failed</h1>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">Redirecting to login…</p>
            <button
              onClick={() => navigate("/auth?mode=signin")}
              className="mt-5 h-10 px-5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm"
            >
              Return to login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default GoogleCallback
