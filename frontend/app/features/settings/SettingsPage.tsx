"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../context/SidebarContext"
import { FaMoon, FaSun, FaGoogle, FaPen } from "react-icons/fa"
import { getInitialTheme, toggleTheme } from "../../utils/theme-utils"

// Mock API functions
const mockAPI = {
  getProfile: async () => ({
    email: "user@example.com",
    name: "John Doe"
  }),
  checkGoogleFitStatus: async () => true,
  getSettings: async () => ({
    language: "en",
    darkMode: false,
    useMetricSystem: true,
    emailNotifications: true,
    healthAlerts: true,
    isActive: true,
    accountDeletionScheduled: null,
    googleFitConnected: false
  }),
  updateSettings: async (settings: any) => {
    console.log("Settings updated:", settings)
    return { success: true }
  },
  scheduleAccountDeletion: async (days: number) => {
    console.log(`Account deletion scheduled in ${days} days`)
    return { success: true }
  },
  cancelAccountDeletion: async () => {
    console.log("Account deletion cancelled")
    return { success: true }
  },
  connectGoogleFit: async () => {
    console.log("Google Fit connection initiated")
    return { success: true }
  },
  getFAQs: async () => ({
    faqs: [
      {
        question: "How is my health data secured?",
        answer: "Your health data is encrypted both in transit and at rest."
      },
      {
        question: "Can I export my health data?",
        answer: "Yes, you can download your health data in various formats (JSON, CSV, PDF) from your Profile page.",
      },
      {
        question: "How accurate are the AI recommendations?",
        answer: "Our AI recommendations are based on patterns in your health data and general health guidelines. They should not replace professional medical advice.",
      },
      {
        question: "How do I connect my Google Fit account?",
        answer: "Go to the Connections tab in Settings and click on 'Connect' next to Google Fit. Follow the authentication steps to grant access.",
      },
      {
        question: "Can I delete my account and all my data?",
        answer: "Yes, you can request account deletion from the Privacy tab in Settings. This will permanently remove all your data from our systems.",
      }
    ]
  })
}

export default function SettingsPage() {
  const { isSidebarOpen } = useSidebar()
  const navigate = useNavigate()
  const [language, setLanguage] = useState("English")
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("preferences")
  const [settings, setSettings] = useState({
    language: "en",
    darkMode: false,
    useMetricSystem: true,
    emailNotifications: true,
    healthAlerts: true,
    isActive: true,
    accountDeletionScheduled: null as Date | null,
    googleFitConnected: false,
  })
  const [_, setContactForm] = useState({
    subject: "",
    message: "",
    email: "",
  })
  const [_1, setFaqs] = useState([
    {
      question: "How is my health data secured?",
      answer: "Your health data is encrypted both in transit and at rest."
    }
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [accountDeletionDays, setAccountDeletionDays] = useState(30)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deletionError, setDeletionError] = useState<string | null>(null)
  const [deletionSuccess, setDeletionSuccess] = useState(false)

  useEffect(() => {
    const initialDarkMode = getInitialTheme()
    setDarkMode(initialDarkMode)

    const fetchData = async () => {
      try {
        const profile = await mockAPI.getProfile()
        setContactForm(prev => ({ ...prev, email: profile.email }))
        
        const googleFitStatus = await mockAPI.checkGoogleFitStatus()
        setSettings(prev => ({ ...prev, googleFitConnected: googleFitStatus }))
        
        const settingsData = await mockAPI.getSettings()
        setSettings(prev => ({ ...prev, ...settingsData }))
        
        const faqsData = await mockAPI.getFAQs()
        setFaqs(faqsData.faqs)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const handleToggleTheme = () => {
    const newDarkMode = toggleTheme(darkMode)
    setDarkMode(newDarkMode)
    setSettings(prev => ({ ...prev, darkMode: newDarkMode }))
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value)
  }

  const handleNotificationChange = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev],
    }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await mockAPI.updateSettings(settings)
      // No need for error handling since mock always succeeds
    } finally {
      setIsSaving(false)
    }
  }

  const handleScheduleDeletion = async () => {
    setIsDeletingAccount(true)
    setDeletionError(null)
    setDeletionSuccess(false)

    try {
      await mockAPI.scheduleAccountDeletion(accountDeletionDays)
      setSettings(prev => ({
        ...prev,
        accountDeletionScheduled: new Date(Date.now() + accountDeletionDays * 24 * 60 * 60 * 1000)
      }))
      setDeletionSuccess(true)
    } catch (error) {
      setDeletionError("Failed to schedule deletion")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleCancelDeletion = async () => {
    setIsDeletingAccount(true)
    setDeletionError(null)
    setDeletionSuccess(false)

    try {
      await mockAPI.cancelAccountDeletion()
      setSettings(prev => ({ ...prev, accountDeletionScheduled: null }))
      setDeletionSuccess(true)
    } catch (error) {
      setDeletionError("Failed to cancel deletion")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleGoogleFitConnection = async () => {
    try {
      if (settings.googleFitConnected) {
        setSettings(prev => ({ ...prev, googleFitConnected: false }))
      } else {
        await mockAPI.connectGoogleFit()
        setSettings(prev => ({ ...prev, googleFitConnected: true }))
      }
    } catch (error) {
      console.error("Error managing Google Fit connection:", error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} p-6 overflow-auto`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Settings</h1>
            <button
              onClick={handleToggleTheme}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "preferences"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("preferences")}
              >
                Preferences
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "notifications"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("notifications")}
              >
                Notifications
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "integrations"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("integrations")}
              >
                Integrations
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "account"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("account")}
              >
                Account
              </button>
            </div>

            <div className="p-6">
              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div>
                  <h2 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">Preferences</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Units</label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            checked={settings.useMetricSystem}
                            onChange={() => setSettings({ ...settings, useMetricSystem: true })}
                          />
                          <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Metric (kg, cm)
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            checked={!settings.useMetricSystem}
                            onChange={() => setSettings({ ...settings, useMetricSystem: false })}
                          />
                          <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Imperial (lb, ft)
                          </label>
                        </div>
                      </div>
                    </div>

                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">Notification Settings</h2>
                  <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                          <p className="text-gray-700 dark:text-gray-300">Email Notifications</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive notifications via email
                            </p>
                          </div>
                          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                            <input
                              type="checkbox"
                              className="absolute w-0 h-0 opacity-0"
                            checked={settings.emailNotifications}
                            onChange={() => handleNotificationChange("emailNotifications")}
                            />
                            <label
                              className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                              settings.emailNotifications ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            >
                              <span
                                className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                                settings.emailNotifications ? "translate-x-6" : "translate-x-0"
                                }`}
                              ></span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-700 dark:text-gray-300">Health Alerts</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Get notified about unusual changes in your health metrics
                            </p>
                          </div>
                          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                            <input
                              type="checkbox"
                              className="absolute w-0 h-0 opacity-0"
                            checked={settings.healthAlerts}
                              onChange={() => handleNotificationChange("healthAlerts")}
                            />
                            <label
                              className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
                              settings.healthAlerts ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            >
                              <span
                                className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                                settings.healthAlerts ? "translate-x-6" : "translate-x-0"
                                }`}
                              ></span>
                            </label>
                        </div>
                      </div>
                    </div>

                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Notification Settings"}
                    </button>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === "integrations" && (
                <div>
                  <h2 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">Data Sources</h2>
                  <div className="space-y-6">
                    {/* Google Fit Integration */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full">
                            <FaGoogle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Google Fit</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {settings.googleFitConnected
                                ? "Connected - Automatically sync your health data"
                                : "Connect to automatically sync your health data"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleGoogleFitConnection}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            settings.googleFitConnected
                              ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                          }`}
                        >
                          {settings.googleFitConnected ? "Disconnect" : "Connect"}
                        </button>
                      </div>
                      {settings.googleFitConnected && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Last synced</span>
                            <span className="text-gray-900 dark:text-white">2 minutes ago</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Sync frequency</span>
                            <span className="text-gray-900 dark:text-white">Every 30 minutes</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manual Data Entry Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-full">
                            <FaPen className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manual Entry</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Add and manage your health data manually
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate("/metrics")}
                          className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-md text-sm font-medium transition-colors"
                        >
                          Add Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === "account" && (
                <div>
                  <h2 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">Account Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Account Deletion</h3>
                      {settings.accountDeletionScheduled ? (
                      <div className="space-y-4">
                          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <p className="text-yellow-700 dark:text-yellow-300">
                              Your account is scheduled for deletion on {settings.accountDeletionScheduled.toLocaleDateString()}.
                            </p>
                          </div>
                          <button
                            onClick={handleCancelDeletion}
                            disabled={isDeletingAccount}
                            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
                          >
                            {isDeletingAccount ? "Cancelling..." : "Cancel Account Deletion"}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-700 dark:text-red-300">
                              Warning: This action cannot be undone. All your data will be permanently deleted.
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                              Deletion Delay (days)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="90"
                              value={accountDeletionDays}
                              onChange={(e) => setAccountDeletionDays(Number(e.target.value))}
                              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            onClick={handleScheduleDeletion}
                            disabled={isDeletingAccount}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            {isDeletingAccount ? "Scheduling..." : "Schedule Account Deletion"}
                          </button>
                        </div>
                      )}
                      {deletionError && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <p className="text-red-700 dark:text-red-300">{deletionError}</p>
                        </div>
                      )}
                      {deletionSuccess && (
                        <div className="mt-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <p className="text-green-700 dark:text-green-300">
                            {settings.accountDeletionScheduled ? "Account deletion cancelled successfully!" : "Account deletion scheduled successfully!"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}