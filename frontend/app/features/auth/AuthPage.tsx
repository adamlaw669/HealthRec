"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { authAPI } from "../../api/api"
import "../../../assets/styles/auth-background.css"
import GoogleLoginComponent from "../../components/GoogleLogin"
//import APIConnectionTest from "../../components/APIConnectionTest"

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      navigate("/dashboard")
    }
  }, [navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
  
    try {
      if (mode === "signup") {
        // Validate password length
        if (formData.password.length < 8) {
          throw new Error("Password must be at least 8 characters long")
        }
        
        // Validate password match
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match")
        }
        
        // Validate email format
        if (!formData.email.includes('@')) {
          throw new Error("Please enter a valid email address")
        }
  
        const response = await authAPI.basic_signup(formData.email, formData.password)
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user))
          navigate("/dashboard")
        } else {
          throw new Error("Signup failed. Please try again.")
        }
      } else {
        const response = await authAPI.login(formData.email, formData.password)
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user))
          navigate("/dashboard")
        } else {
          throw new Error("Login failed. Please check your credentials.")
        }
      }
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center auth-background">
      <div className="bg-gray-900/40 backdrop-blur-sm p-8 rounded-lg shadow-xl w-full max-w-md border border-white/10 auth-form-container mb-4">
        {/* Centered Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Link to="/" className="flex flex-col items-center">
            <img 
              src="/healthreclogo.png" 
              alt="HealthRec Engine Logo" 
              className="w-20 h-20"
            />
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to HealthRec Engine
          </h1>
          <p className="text-gray-300">
            {mode === 'signup' ? 'Create an account to get started' : 'Sign in to your account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your password"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900/40 text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Google Login Button */}
        <div className="mb-6">
          <GoogleLoginComponent />
        </div>

        {/* Toggle Sign In/Sign Up */}
        <p className="text-center text-sm text-gray-400">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-500 hover:underline focus:outline-none"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-blue-500 hover:underline focus:outline-none"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Privacy Notice */}
        <p className="mt-6 text-center text-sm text-gray-400">
          By continuing, you agree to our{" "}
          <Link to="/privacy" className="text-blue-500 hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/terms" className="text-blue-500 hover:underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  )
}