"use client"

import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FaCamera, FaDownload, FaSun, FaMoon } from "react-icons/fa"
import { authAPI, healthAPI } from "../../api/api"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../context/SidebarContext"
//import { useUser } from "../../context/UserContext"
import { getInitialTheme, toggleTheme } from "../../utils/theme-utils"

interface Profile {
  name: string;
  email: string;
  profilePicture?: string;
}

export default function ProfilePage() {
  const { isSidebarOpen } = useSidebar()
  const navigate = useNavigate()
  const [user, setUser] = useState<Profile>({ email: "", name: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: "" })
  const [darkMode, setDarkMode] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState("json")
  const [isDownloading, setIsDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize theme on component mount
  useEffect(() => {
    const initialDarkMode = getInitialTheme()
    setDarkMode(initialDarkMode)
  }, [])

  const handleToggleTheme = () => {
    const newDarkMode = toggleTheme(darkMode)
    setDarkMode(newDarkMode)
  }

  // Fetch user details on page load
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        const data = await authAPI.getProfile()
        if (data) {
          setUser({
            email: data.email || "",
            name: data.name || "User",
            profilePicture: data.profilePicture || "/placeholder.svg?height=200&width=200",
          })
          setFormData({ name: data.name || "User" })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        // If unauthorized, redirect to login
        if ((error instanceof Error ? error.message:'Unknown').toString().includes("401")) {
          navigate("/auth?mode=signin")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await authAPI.updateProfile({ 
        name: formData.name
      })
      
      if (response && response.success) {
        setUser(prev => ({ 
          ...prev, 
          name: formData.name
        }))
        setIsEditing(false)
        // Show success message
        alert(response.message || "Profile updated successfully!")
      } else {
        throw new Error(response?.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      // Show error message to user
      alert(error instanceof Error ? error.message : "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle profile picture change
  const handleProfilePictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, you would upload this file to your server
      // For now, we'll just create a local URL for preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setUser({ ...user, profilePicture: event.target.result.toString() })
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  // Handle data download
  const handleDownloadData = async () => {
    setIsDownloading(true)
    try {
      const response = await healthAPI.downloadHealthData(downloadFormat)
      const blob = new Blob([response], { 
        type: downloadFormat === 'pdf' ? 'application/pdf' : 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `health-data.${downloadFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading data:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Logout function
  const handleLogout = async () => {
    try {
      await authAPI.logout()  // optional: only if you have a backend logout
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      localStorage.clear()
      navigate("/")
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} p-6 overflow-auto`}>
        <div className="max-w-4xl mx-auto">
          {/* Header with theme toggle */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Profile</h1>
            <button
              onClick={handleToggleTheme}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div
                      className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-600 dark:border-blue-500 cursor-pointer"
                      onClick={handleProfilePictureClick}
                    >
                      <img
                        src={user.profilePicture || "/placeholder.svg?height=200&width=200"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                        <FaCamera className="text-white opacity-0 hover:opacity-100 text-2xl" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left">
                    {isEditing ? (
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false)
                              setFormData({ name: user.name })
                            }}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                          <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Edit Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Health Data */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Download Your Health Data</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You can download all your health data in various formats for your records or to share with healthcare
                  providers. Your data is encrypted and secure.
                </p>

                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <select
                    value={downloadFormat}
                    onChange={(e) => setDownloadFormat(e.target.value)}
                    className="w-full sm:w-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="json">JSON Format</option>
                    <option value="csv">CSV Format</option>
                    <option value="pdf">PDF Report</option>
                  </select>

                  <button
                    onClick={handleDownloadData}
                    disabled={isDownloading}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FaDownload className="mr-2" />
                        Download Data
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Section */}
              <div className="flex space-x-4">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Logout
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Settings
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

