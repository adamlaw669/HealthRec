//import React from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { Root } from "./components/Root"
import LandingPage from "./features/landing/LandingPage"
import AuthPage from "./features/auth/AuthPage"
import Dashboard from "./features/dashboard/Dashboard"
import MetricsPage from "./features/metrics/MetricsPage"
import ProfilePage from "./features/profile/ProfilePage"
import SettingsPage from "./features/settings/SettingsPage"
import GoogleCallback from "./features/auth/GoogleCallback"
import { lazy, Suspense } from "react"

// Import the enhanced GoogleCallback from auth/callback
import AuthCallback from "./auth/callback/page"

// Lazy load metric detail pages
const HeartRateMetric = lazy(() => import("./features/metrics/HeartRateMetric"))
const SleepMetric = lazy(() => import("./features/metrics/SleepMetric"))
const StepsMetric = lazy(() => import("./features/metrics/StepsMetric"))
const CaloriesMetric = lazy(() => import("./features/metrics/CaloriesMetric"))
const ActiveMinutesMetric = lazy(() => import("./features/metrics/ActiveMinutesMetric"))
const WeightMetric = lazy(() => import("./features/metrics/WeightMetric"))

// Loading component for lazy-loaded routes
const LazyLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
)

// Auth guard for protected routes - temporarily disabled
/* const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem("token")
  const location = window.location.pathname

  // Allow access to landing page, auth pages, and auth callback without authentication
  if (!isAuthenticated && location !== "/" && !location.startsWith("/auth")) {
    return <Navigate to="/auth?mode=signin" replace />
  }

  return <>{children}</>
} */

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "auth",
        element: <AuthPage />,
      },
      {
        path: "auth/callback",
        element: <GoogleCallback />,
      },
      {
        path: "auth/callback/enhanced",
        element: <AuthCallback />,
      },
      {
        path: "dashboard",
        element: <Dashboard />, 
      },
      {
        path: "metrics",
        element: <MetricsPage />, 
      },
      {
        path: "metrics/heart-rate",
        element: (
          <Suspense fallback={<LazyLoading />}>
            <HeartRateMetric />
          </Suspense>
        ),
      },
      {
        path: "metrics/sleep",
        element: (
          <Suspense fallback={<LazyLoading />}>
            <SleepMetric />
          </Suspense>
        ),
      },
      {
        path: "metrics/steps",
        element: (
          <Suspense fallback={<LazyLoading />}>
            <StepsMetric />
          </Suspense>
        ),
      },
      {
        path: "metrics/calories",
        element: (
          <Suspense fallback={<LazyLoading />}>
            <CaloriesMetric />
          </Suspense>
        ),
      },
      {
        path: "metrics/active-minutes",
        element: (
          <Suspense fallback={<LazyLoading />}>
            <ActiveMinutesMetric />
          </Suspense>
        ),
      },
      {
        path: "metrics/weight",
        element: (
          <Suspense fallback={<LazyLoading />}>
            <WeightMetric />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: <ProfilePage />, 
      },
      {
        path: "settings",
        element: <SettingsPage />, 
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
])

export default router

