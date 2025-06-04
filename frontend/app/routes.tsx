//import React from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { Root } from "./components/Root"
import { lazy, Suspense } from "react"

// Lazy load all pages
const LandingPage = lazy(() => import("./features/landing/LandingPage"))
const AuthPage = lazy(() => import("./features/auth/AuthPage"))
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"))
const MetricsPage = lazy(() => import("./features/metrics/MetricsPage"))
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"))
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"))
const GoogleCallback = lazy(() => import("./features/auth/GoogleCallback"))
const AuthCallback = lazy(() => import("./auth/callback/page"))

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


// Wrap all lazy-loaded components with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LazyLoading />}>
    <Component />
  </Suspense>
)

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: withSuspense(LandingPage),
      },
      {
        path: "auth",
        element: withSuspense(AuthPage),
      },
      {
        path: "auth/callback",
        element: withSuspense(GoogleCallback),
      },
      {
        path: "auth/callback/enhanced",
        element: withSuspense(AuthCallback),
      },
      {
        path: "dashboard",
        element: withSuspense(Dashboard),
      },
      {
        path: "metrics",
        element: withSuspense(MetricsPage),
      },
      {
        path: "metrics/heart-rate",
        element: withSuspense(HeartRateMetric),
      },
      {
        path: "metrics/sleep",
        element: withSuspense(SleepMetric),
      },
      {
        path: "metrics/steps",
        element: withSuspense(StepsMetric),
      },
      {
        path: "metrics/calories",
        element: withSuspense(CaloriesMetric),
      },
      {
        path: "metrics/active-minutes",
        element: withSuspense(ActiveMinutesMetric),
      },
      {
        path: "metrics/weight",
        element: withSuspense(WeightMetric),
      },
      {
        path: "profile",
        element: withSuspense(ProfilePage),
      },
      {
        path: "settings",
        element: withSuspense(SettingsPage),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
])

export default router

