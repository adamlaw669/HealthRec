"use client"

import { useState, useEffect } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
} from "chart.js"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../context/SidebarContext"
import { FaMoon, FaSun, FaBrain, FaWalking, FaHeartbeat, FaInfoCircle, FaPlus, FaBed, FaWeight, FaAppleAlt, FaRunning } from "react-icons/fa"
import DoctorReport from "./DoctorReport"
import { getInitialTheme, toggleTheme } from "../../utils/theme-utils"
import { healthAPI } from "../../api/api"
import { useNavigate } from "react-router-dom"
import AIStatus from "../../components/AIStatus"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const API_ENDPOINT = "http://127.0.0.1:8000"

interface MetricsData {
  steps: ChartData<"line"> | null
  heartRate: ChartData<"line"> | null
  sleep: ChartData<"line"> | null
  weight: ChartData<"line"> | null
  calories: ChartData<"line"> | null
  activeMinutes: ChartData<"line"> | null
}

const Metrics: React.FC = () => {
  const navigate = useNavigate()
  const { isSidebarOpen } = useSidebar()
  const [showDoctorReport, setShowDoctorReport] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [timeRange, setTimeRange] = useState("week")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAiOnline, setIsAiOnline] = useState(false)
  const [metricsData, setMetricsData] = useState<MetricsData>({
    steps: null,
    heartRate: null,
    sleep: null,
    weight: null,
    calories: null,
    activeMinutes: null
  })
  const [aiTips, setAiTips] = useState<string[]>([])
  const [correlationInsights, setCorrelationInsights] = useState<string[]>([])
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [metricValue, setMetricValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize theme on component mount
  useEffect(() => {
    const initialDarkMode = getInitialTheme()
    setDarkMode(initialDarkMode)
  }, [])

  const handleToggleTheme = () => {
    const newDarkMode = toggleTheme(darkMode)
    setDarkMode(newDarkMode)
  }

  // Fetch metrics data
  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get username from localStorage
        const userData = localStorage.getItem("user");
        if (!userData) {
          throw new Error("No user data found in localStorage");
        }
        const { username } = JSON.parse(userData);

        // Fetch health data using healthAPI
        const healthDataResponse = await healthAPI.getHealthData();
        const healthData = healthDataResponse.data;
        
        // Process health data for charts
        const labels = healthData.map((entry: any) => new Date(entry.date).toLocaleDateString());
        
        setMetricsData({
          steps: {
            labels,
            datasets: [{
              label: "Steps",
              data: healthData.map((entry: any) => entry.steps),
              fill: true,
              backgroundColor: 'rgba(30, 58, 138, 0.1)',
              borderColor: "#1e3a8a",
              tension: 0.3,
            }]
          },
          heartRate: {
            labels,
            datasets: [{
              label: "Heart Rate",
              data: healthData.map((entry: any) => entry.heart_rate),
              fill: true,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: "#ef4444",
              tension: 0.3,
            }]
          },
          sleep: {
            labels,
            datasets: [{
              label: "Sleep",
              data: healthData.map((entry: any) => entry.sleep),
              fill: true,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderColor: "#6366f1",
              tension: 0.3,
            }]
          },
          weight: {
            labels,
            datasets: [{
              label: "Weight",
              data: healthData.map((entry: any) => entry.weight),
              fill: true,
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderColor: "#22c55e",
              tension: 0.3,
            }]
          },
          calories: {
            labels,
            datasets: [{
              label: "Calories",
              data: healthData.map((entry: any) => entry.calories),
              fill: true,
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              borderColor: "#f97316",
              tension: 0.3,
            }]
          },
          activeMinutes: {
            labels,
            datasets: [{
              label: "Active Minutes",
              data: healthData.map((entry: any) => entry.activity_minutes),
              fill: true,
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              borderColor: "#14b8a6",
              tension: 0.3,
            }]
          }
        });

        // Fetch AI recommendations
        try {
          const { recommendations, status } = await healthAPI.recommendations(username);
          setIsAiOnline(status === 200 || String(status) === "success");
          
          if (recommendations) {
            setCorrelationInsights(recommendations.correlation ? 
              (Array.isArray(recommendations.correlation) ? recommendations.correlation : [recommendations.correlation]) : 
              []
            );
            
            setAiTips(recommendations.tips ? 
              (Array.isArray(recommendations.tips) ? recommendations.tips : [recommendations.tips]) : 
              []
            );
          }
        } catch (err: any) {
          console.error("Failed to fetch AI recommendations:", err.message);
          setCorrelationInsights([]);
          setAiTips([]);
          setIsAiOnline(false);
        }

      } catch (err: any) {
        console.error("Failed to fetch metrics data:", err);
        setError(err.message || "Failed to load metrics data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetricsData()
  }, [timeRange])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? "#f3f4f6" : "#1f2937"
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: darkMode ? "#f3f4f6" : "#1f2937"
        }
      },
      x: {
        grid: {
          color: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: darkMode ? "#f3f4f6" : "#1f2937"
        }
      }
    }
  }

  const handleAddMetric = async (metric: string) => {
    setSelectedMetric(metric)
    setIsAddMenuOpen(false)
  }

  const handleSubmitMetric = async () => {
    if (!selectedMetric || !metricValue) return

    setIsSubmitting(true)
    try {
      await healthAPI.addMetric(selectedMetric, parseFloat(metricValue))
      setMetricValue("")
      setSelectedMetric(null)
      // Refresh metrics data
      const fetchMetricsData = async () => {
        setIsLoading(true)
        setError(null)
        try {
          // ... existing fetchMetricsData code ...
        } catch (err) {
          console.error("Failed to fetch metrics data:", err)
          setError("Failed to load metrics data. Please try again later.")
        } finally {
          setIsLoading(false)
        }
      }
      fetchMetricsData()
    } catch (error) {
      console.error("Error adding metric:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} p-6 overflow-auto`}>
        <div className="max-w-7xl mx-auto">
          {/* Page Header with Doctor's Report Button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Health Metrics</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDoctorReport(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FaMoon className="mr-2" />
                Doctor's Report
              </button>
              <button 
                onClick={handleToggleTheme} 
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* AI Correlation Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-lg shadow-md border border-blue-100 dark:border-blue-800 mb-6">
            <div className="flex items-center mb-4">
              <FaBrain className="text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">AI Correlation Insights</h2>
            </div>
            <div className="space-y-3">
                {correlationInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <p className="text-gray-700 dark:text-gray-300">{insight}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                AI-generated insights based on your health data patterns
              </div>
              <AIStatus isOnline={isAiOnline} />
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setTimeRange("week")}
                className={`px-4 py-2 rounded-l-lg ${
                  timeRange === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={`px-4 py-2 border-l border-gray-200 dark:border-gray-700 ${
                  timeRange === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange("year")}
                className={`px-4 py-2 rounded-r-lg border-l border-gray-200 dark:border-gray-700 ${
                  timeRange === "year"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Year
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 p-4">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Steps Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Steps</h2>
                  <button
                    onClick={() => navigate("/metrics/steps")}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Details
                  </button>
                </div>
                {metricsData.steps && <Line data={metricsData.steps} options={chartOptions} />}
              </div>

              {/* Heart Rate Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Heart Rate</h2>
                  <button
                    onClick={() => navigate("/metrics/heart-rate")}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Details
                  </button>
                </div>
                {metricsData.heartRate && <Line data={metricsData.heartRate} options={chartOptions} />}
              </div>

              {/* Sleep Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Sleep</h2>
                  <button
                    onClick={() => navigate("/metrics/sleep")}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Details
                  </button>
                </div>
                {metricsData.sleep && <Line data={metricsData.sleep} options={chartOptions} />}
              </div>

              {/* Weight Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Weight</h2>
                  <button
                    onClick={() => navigate("/metrics/weight")}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Details
                  </button>
                </div>
                {metricsData.weight && <Line data={metricsData.weight} options={chartOptions} />}
              </div>

              {/* Calories Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Calories</h2>
                  <button
                    onClick={() => navigate("/metrics/calories")}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Details
                  </button>
                </div>
                {metricsData.calories && <Line data={metricsData.calories} options={chartOptions} />}
              </div>

              {/* Active Minutes Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Active Minutes</h2>
                  <button
                    onClick={() => navigate("/metrics/active-minutes")}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Details
                  </button>
                </div>
                {metricsData.activeMinutes && <Line data={metricsData.activeMinutes} options={chartOptions} />}
              </div>
            </div>
          )}

          {/* AI Health Tips Section */}
          <div className="mt-12 mb-12 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-6 rounded-lg shadow-md border border-green-100 dark:border-green-800">
            <div className="flex items-center mb-4">
              <FaBrain className="text-green-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">AI Health Tips</h2>
            </div>
            <div className="space-y-4">
              {aiTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-green-600 dark:text-green-400 italic">
                Personalized tips based on your health metrics and patterns
              </div>
              <AIStatus isOnline={isAiOnline} />
            </div>
            </div>

            {/* Medical Resources Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Medical Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="https://www.heart.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FaMoon className="mr-2 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">American Heart Association</span>
              </a>
              <a
                href="https://www.sleepfoundation.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FaSun className="mr-2 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">Sleep Foundation</span>
              </a>
              <a
                href="https://www.cdc.gov/physicalactivity/"
                        target="_blank" 
                        rel="noopener noreferrer"
                className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FaBrain className="mr-2 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">CDC Physical Activity</span>
              </a>
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

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative">
          {/* Add Metric Button */}
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110"
            aria-label="Add health metric"
          >
            <FaPlus className="text-xl" />
          </button>

          {/* Dropdown Menu */}
          {isAddMenuOpen && (
            <div className="absolute bottom-16 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => handleAddMetric("steps")}
                className="w-full px-4 py-2 text-left text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <FaWalking className="mr-2" /> Steps
              </button>
              <button
                onClick={() => handleAddMetric("sleep")}
                className="w-full px-4 py-2 text-left text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <FaBed className="mr-2" /> Sleep
              </button>
              <button
                onClick={() => handleAddMetric("heartRate")}
                className="w-full px-4 py-2 text-left text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <FaHeartbeat className="mr-2" /> Heart Rate
              </button>
              <button
                onClick={() => handleAddMetric("weight")}
                className="w-full px-4 py-2 text-left text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <FaWeight className="mr-2" /> Weight
              </button>
              <button
                onClick={() => handleAddMetric("calories")}
                className="w-full px-4 py-2 text-left text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <FaAppleAlt className="mr-2" /> Calories
              </button>
              <button
                onClick={() => handleAddMetric("activeMinutes")}
                className="w-full px-4 py-2 text-left text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <FaRunning className="mr-2" /> Active Minutes
              </button>
            </div>
          )}

          {/* Metric Input Modal */}
          {selectedMetric && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Add {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                </h3>
                <input
                  type="number"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  placeholder={`Enter ${selectedMetric} value`}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMetric(null)
                      setMetricValue("")
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitMetric}
                    disabled={isSubmitting || !metricValue}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doctor's Report Modal */}
      {showDoctorReport && (
        <DoctorReport onClose={() => setShowDoctorReport(false)} />
      )}
    </div>
  )
}

export default Metrics

