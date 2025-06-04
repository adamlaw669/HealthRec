"use client"

import { useState, useEffect } from "react"
import { Line, Bar } from "react-chartjs-2"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../context/SidebarContext"
import { healthAPI } from "../../api/api"
import { FaMoon, FaSun, FaArrowLeft, FaBrain, FaInfoCircle } from "react-icons/fa"
import { getInitialTheme, toggleTheme } from "../../utils/theme-utils"
import { useNavigate } from "react-router-dom"

const SleepMetric = () => {
  const navigate = useNavigate()
  const { isSidebarOpen } = useSidebar()
  const [chartData, setChartData] = useState<any>(null)
  const [timeRange, setTimeRange] = useState("week")
  const [isLoading, setIsLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Initialize theme on component mount
  useEffect(() => {
    const initialDarkMode = getInitialTheme()
    setDarkMode(initialDarkMode)
  }, [])

  const handleToggleTheme = () => {
    const newDarkMode = toggleTheme(darkMode)
    setDarkMode(newDarkMode)
  }
  useEffect(() => {
    const fetchSleepData = async () => {
      setIsLoading(true)
      try {
        const result = await healthAPI.getSleepData()
        setChartData({
          labels: result.labels,
          datasets: [{
            label: "Sleep Hours",
            data: result.values,
            fill: false,
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            tension: 0.1,
          }],
        })
      } catch (error) {
        console.error("Failed to fetch sleep data:", error)
        setChartData(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSleepData()
  }, [timeRange])

  // Sleep quality data
  const sleepQualityData = {
    labels: ["Deep", "Light", "REM", "Awake"],
    datasets: [
      {
        label: "Sleep Stages",
        data: [0, 0, 0, 0], // Initialize with zeros
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-24"} p-6 overflow-auto`}>
        <div className="max-w-7xl mx-auto">
          {/* Page Header with Back Button */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/metrics")}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Back to Metrics
              </button>
              <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Sleep</h1>
            </div>
            <button 
              onClick={handleToggleTheme} 
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
            </button>
          </div>

          {/* AI Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FaBrain className="text-yellow-500 mt-1 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">AI-Powered Insights</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  The insights and recommendations provided are generated using artificial intelligence. While we strive for accuracy, these should not replace professional medical advice. Always consult with your healthcare provider for medical decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex justify-end mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange("week")}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange("year")}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === "year"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                }`}
              >
                Year
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : chartData ? (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                    title: {
                      display: true,
                      text: "Sleep Duration Over Time",
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                      min: 4,
                      max: 10,
                      title: {
                        display: true,
                        text: "Hours",
                      },
                    },
                  },
                }}
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center">No data available</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Sleep Quality</h2>
              <Bar
                data={sleepQualityData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: (value) => value + "%",
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Insights</h2>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                {chartData ? (
                  <>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-2 mr-2"></span>
                      Your average sleep duration is {chartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0) / chartData.datasets[0].data.length} hours.
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2"></span>
                      Your deep sleep percentage has improved by 8% this week.
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-2 mr-2"></span>
                      Try to maintain a consistent sleep schedule for better quality rest.
                    </li>
                  </>
                ) : (
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mt-2 mr-2"></span>
                    No sleep data available. Connect your Google Fit account to see insights.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer with AI Disclaimer */}
          <footer className="mt-12 mb-8 text-center">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <FaInfoCircle className="inline-block mr-1" />
                AI-powered insights are provided for informational purposes only and should not replace professional medical advice.
              </p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default SleepMetric

