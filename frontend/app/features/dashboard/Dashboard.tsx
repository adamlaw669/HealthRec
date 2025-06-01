"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Sidebar from "../../components/Sidebar"
import { Line, Doughnut, Bar } from "react-chartjs-2"
import { FaWalking, FaBed, FaHeartbeat, FaWeight, FaAppleAlt, FaRunning, FaMoon, FaSun, FaBrain, FaInfoCircle, FaPlus } from "react-icons/fa"
import { useSidebar } from "../../context/SidebarContext"
import "chart.js/auto"
import { healthAPI } from "../../api/api"
import { getInitialTheme, toggleTheme } from "../../utils/theme-utils"
import AIStatus from "../../components/AIStatus"
import { HealthInterpreter } from "../../../components/ui/HealthInterpreter"

export default function Dashboard() {
  const { isSidebarOpen } = useSidebar()
  const [darkMode, setDarkMode] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<{
    summary: string;
    insights: string[];
  }>({
    summary: "Connect your health tracking devices to get personalized recommendations.",
    insights: [
      "We'll analyze your health data to provide tailored insights.",
      "Track your daily activities to receive AI-powered health advice.",
      "Your data helps us understand your habits and suggest improvements.",
      "Enable Google Fit sync for real-time health monitoring.",
    ]
  })
  const [healthFacts, setHealthFacts] =useState<string[]>([
    "Walking boosts your immune function.",
    "Sleep helps regulate hormones.",
    "Staying active reduces stress.",
  ])
  const [chartData, setChartData] =  useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Steps",
        data: [4000, 6000, 5000, 7000, 6500, 8000, 5346],
        borderColor: "#1e3a8a",
        backgroundColor: "rgba(30, 58, 138, 0.2)",
        tension: 0.4,
      },
    ],
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isAiOnline, setIsAiOnline] = useState(false)
  const [metrics, setMetrics] = useState({
    steps: { value: 5346, trend: "stable" },
    sleep: { value: 7, trend: "stable" },
    heartRate: { value: 67, trend: "stable" },
    weight: { value: 57, trend: "stable" },
    calories: { value: 83, trend: "stable" },
    activeMinutes: { value: 53, trend: "stable" },
  })
  const [showAllFacts, setShowAllFacts] = useState(false)
  const [weeklySummary, setWeeklySummary] = useState<{
    summary: string[];
    trends: {
      steps: number;
      sleep: number;
      heart_rate: number;
      weight: number;
      calories: number;
      active_minutes: number;
    };
    status: string;
  } | null>({
    summary: ["No data available", "No data available", "No data available"],
    trends: {
      steps: 0,
      sleep: 0,
      heart_rate: 0,
      weight: 0,
      calories: 0,
      active_minutes: 0
    },
    status: "loading"
  })
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [metricValue, setMetricValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const API_ENDPOINT = "http://127.0.0.1:8000"
  
  // Sleep breakdown data
  const [sleepBreakdownData, setSleepBreakdownData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "rgba(30, 58, 138, 0.6)",
          "rgba(59, 130, 246, 0.6)",
          "rgba(99, 102, 241, 0.6)",
          "rgba(139, 92, 246, 0.6)",
        ],
        borderColor: [
          "rgba(30, 58, 138, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(99, 102, 241, 1)",
          "rgba(139, 92, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  })
  
  // Weekly activity data
  const [weeklyActivityData, setWeeklyActivityData] = useState({
    labels: [],
    datasets: [
      {
        label: "Active Minutes",
        data: [],
        backgroundColor: "rgba(30, 58, 138, 0.6)",
      },
    ],
  })

  // Initialize theme on component mount
  useEffect(() => {
    // Add safe user data retrieval
    const userData = localStorage.getItem("user");
    let username = "";
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        username = parsedUser?.username || "Guest";
      } catch (error) {
        console.error("Error parsing user data:", error);
        username = "Guest";
      }
    } else {
      username = "Guest";
    }
    
    console.log("Current username:", username);

    const initialDarkMode = getInitialTheme();
    setDarkMode(initialDarkMode);

    // Apply theme to document
    if (initialDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [])

  const handleToggleTheme = () => {
    const newDarkMode = toggleTheme(darkMode)
    setDarkMode(newDarkMode)
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get username from localStorage
        const userData = localStorage.getItem("user");
        if (!userData) {
          console.error("No user data found in localStorage");
          return;
        }

        const { username } = JSON.parse(userData);
        console.log("Fetching recommendations for username:", username);

        // Fetch AI recommendations
        try {
          const { recommendations, status } = await healthAPI.recommendations(username);
        
          if (recommendations?.general) {
            setAiRecommendations(recommendations.general);
            setIsAiOnline(status === 200 || String(status) === "success");
          } else {
            setAiRecommendations({
              summary: "Connect your Google Fit account to get personalized recommendations.",
              insights: [
                "We'll analyze your health data to provide tailored insights.",
                "Track your daily activities to receive AI-powered health advice.",
                "Your data helps us understand your habits and suggest improvements.",
                "Enable Google Fit sync for real-time health monitoring.",
              ]
            });
            setIsAiOnline(false);
          }
        } catch (err: any) {
          console.error("Failed to fetch AI recommendations:", err.message);
          setAiRecommendations({
            summary: "Unable to fetch recommendations. Please check your Google Fit connection.",
            insights: [
              "Make sure you have granted all necessary permissions to access your health data.",
              "Try refreshing the page or reconnecting your Google Fit account.",
              "Check your internet connection and try again.",
              "Contact support if the issue persists.",
            ]
          });
          setIsAiOnline(false);
        }

        // Fetch health facts
        try {
          const factsResponse = await fetch(`${API_ENDPOINT}/facts`, {
            "method": "POST",
            "headers": {
              "Content-Type": "application/json",
              //Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            "body": JSON.stringify({ username }),
          });
          if (factsResponse.ok) {
            const factsData = await factsResponse.json();
            if (factsData && factsData.facts) {
              setHealthFacts(factsData.facts);
            } else {
              setHealthFacts([]);
            }
          } else {
            console.error("Failed to fetch health facts");
            setHealthFacts([]);
          }
        } catch (error) {
          console.error("Error fetching health facts:", error);
          setHealthFacts([]);
        }

        // Fetch metrics data
        try {
          const res = await fetch(`${API_ENDPOINT}/last_data`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          });
          if (res.ok) {
            const metricsData = await res.json();
            setMetrics({
              steps: { value: metricsData.steps || 0, trend: metricsData.steps_trend || "stable" },
              sleep: { value: metricsData.sleep || 0, trend: metricsData.sleep_trend || "stable" },
              heartRate: { value: metricsData.heart_rate || 0, trend: metricsData.heart_rate_trend || "stable" },
              weight: { value: metricsData.weight || 0, trend: metricsData.weight_trend || "stable" },
              calories: { value: metricsData.calories || 0, trend: metricsData.calories_trend || "stable" },
              activeMinutes: { value: metricsData.active_minutes || 0, trend: metricsData.active_minutes_trend || "stable" },
            });
          }
        } catch (error) {
          console.error("Error fetching metrics data:", error);
        }

        // Fetch chart data for steps
        try {
          const stepsRes = await fetch(`${API_ENDPOINT}/step_data`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          if (stepsRes.ok) {
            const stepsData = await stepsRes.json();
            if (stepsData && stepsData.labels && stepsData.values) {
              setChartData({
                labels: stepsData.labels,
                datasets: [
                  {
                    label: "Steps",
                    data: stepsData.values,
                    borderColor: "#1e3a8a",
                    backgroundColor: "rgba(30, 58, 138, 0.2)",
                    tension: 0.4,
                  },
                ],
              });
            } else {
              setChartData({
                labels: [],
                datasets: [
                  {
                    label: "Steps",
                    data: [],
                    borderColor: "#1e3a8a",
                    backgroundColor: "rgba(30, 58, 138, 0.2)",
                    tension: 0.4,
                  },
                ],
              });
            }
          }
        } catch (error) {
          console.error("Error fetching steps data:", error);
          setChartData({
            labels: [],
            datasets: [
              {
                label: "Steps",
                data: [],
                borderColor: "#1e3a8a",
                backgroundColor: "rgba(30, 58, 138, 0.2)",
                tension: 0.4,
              },
            ],
          });
        }

        // Fetch weekly activity data
        try {
          const activityRes = await fetch(`${API_ENDPOINT}/activity_data`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          
          if (activityRes.ok) {
            const activityData = await activityRes.json();
            
            if (activityData && activityData.labels && activityData.values) {
              setWeeklyActivityData({
                labels: activityData.labels,
                datasets: [
                  {
                    label: "Active Minutes",
                    data: activityData.values,
                    backgroundColor: "rgba(30, 58, 138, 0.6)",
                  },
                ],
              });
            }
          }
        } catch (error) {
          console.error("Error fetching activity data:", error);
        }

        // Fetch sleep breakdown data
        try {
          const sleepRes = await fetch(`${API_ENDPOINT}/sleep_data`, {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          });
          
          if (sleepRes.ok) {
            const data = await sleepRes.json();
            if (data && data.labels && data.values) {
              setSleepBreakdownData({
                labels: data.labels,
                datasets: [
                  {
                    data: data.values,
                    backgroundColor: [
                      "rgba(30, 58, 138, 0.6)",
                      "rgba(59, 130, 246, 0.6)",
                      "rgba(99, 102, 241, 0.6)",
                      "rgba(139, 92, 246, 0.6)",
                    ],
                    borderColor: [
                      "rgba(30, 58, 138, 1)",
                      "rgba(59, 130, 246, 1)",
                      "rgba(99, 102, 241, 1)",
                      "rgba(139, 92, 246, 1)",
                    ],
                    borderWidth: 1,
                  },
                ],
              });
            }
          }
        } catch (error) {
          console.error("Error fetching sleep data:", error);
        }
        
        // Fetch weekly summary
        try {
          const summaryRes = await fetch(`${API_ENDPOINT}/weekly_summary`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: username })
          });
          
          if (summaryRes.ok) {
            const data = await summaryRes.json();
            setWeeklySummary(data);
          } else {
            setWeeklySummary(null);
          }
        } catch (error) {
          console.error("Error fetching weekly summary:", error);
          setWeeklySummary(null);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setAiRecommendations({
          summary: "Unable to fetch recommendations. Please check your Google Fit connection.",
          insights: [
            "Make sure you have granted all necessary permissions to access your health data.",
            "Try refreshing the page or reconnecting your Google Fit account.",
            "Check your internet connection and try again.",
            "Contact support if the issue persists.",
          ]
        });
        setIsAiOnline(false);
        setHealthFacts([]);
        setChartData({
          labels: [],
          datasets: [
            {
              label: "Steps",
              data: [],
              borderColor: "#1e3a8a",
              backgroundColor: "rgba(30, 58, 138, 0.2)",
              tension: 0.4,
            },
          ],
        });
        setWeeklySummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to render trend icon
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <span className="text-green-500">↑</span>;
      case "down":
        return <span className="text-red-500">↓</span>;
      case "stable":
        return <span className="text-blue-500">→</span>;
      default:
        return null;
    }
  };

  const handleAddMetric = async (metric: string) => {
    setSelectedMetric(metric);
    setIsAddMenuOpen(false);
  };

  const handleSubmitMetric = async () => {
    if (!selectedMetric || !metricValue) return;

    setIsSubmitting(true);
    try {
      // Send the metric to the server
      await fetch("https://healthrec.onrender.com/add_metric", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          metric: selectedMetric,
          value: parseFloat(metricValue)
        }),
      });
      
      // Reset form
      setMetricValue("");
      setSelectedMetric(null);
      
      // Refresh metrics data
      const res = await fetch("https://healthrec.onrender.com/last_data", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
      
      if (res.ok) {
        const metricsData = await res.json();
        setMetrics({
          steps: { value: metricsData.steps || 0, trend: metricsData.steps_trend || "stable" },
          sleep: { value: metricsData.sleep || 0, trend: metricsData.sleep_trend || "stable" },
          heartRate: { value: metricsData.heart_rate || 0, trend: metricsData.heart_rate_trend || "stable" },
          weight: { value: metricsData.weight || 0, trend: metricsData.weight_trend || "stable" },
          calories: { value: metricsData.calories || 0, trend: metricsData.calories_trend || "stable" },
          activeMinutes: { value: metricsData.active_minutes || 0, trend: metricsData.active_minutes_trend || "stable" },
        });
      }
    } catch (error) {
      console.error("Error adding metric:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${isSidebarOpen ? "ml-64" : "ml-0"} transition-all duration-300`}>
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <AIStatus isOnline={isAiOnline} />
            <button 
              onClick={handleToggleTheme} 
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Health Interpreter Section */}
        <div className="mt-8">
          <HealthInterpreter />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Recommendations */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-lg shadow-lg text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FaBrain className="text-2xl mr-3" />
                  <h2 className="text-xl font-bold">AI Health Recommendations</h2>
                </div>
                <AIStatus isOnline={isAiOnline} />
              </div>
              {aiRecommendations && (
                <>
                  <p className="text-lg mb-4">{aiRecommendations.summary}</p>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Additional Insights:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {aiRecommendations.insights.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              <div className="mt-4 text-sm text-blue-100">
                <FaInfoCircle className="inline-block mr-1" />
                Recommendations are personalized based on your health data and goals
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Steps */}
              <Link to="/metrics/steps" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaWalking className="text-blue-600 text-2xl mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Steps</h2>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.steps.value.toLocaleString()} {renderTrendIcon(metrics.steps.trend)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Sleep */}
              <Link to="/metrics/sleep" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaBed className="text-indigo-600 text-2xl mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Sleep</h2>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.sleep.value} hrs {renderTrendIcon(metrics.sleep.trend)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Heart Rate */}
              <Link to="/metrics/heart-rate" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaHeartbeat className="text-red-600 text-2xl mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Heart Rate</h2>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.heartRate.value} bpm {renderTrendIcon(metrics.heartRate.trend)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Weight */}
              <Link to="/metrics/weight" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaWeight className="text-green-600 text-2xl mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Weight</h2>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.weight.value} kg {renderTrendIcon(metrics.weight.trend)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Calories */}
              <Link to="/metrics/calories" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaAppleAlt className="text-orange-600 text-2xl mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Calories</h2>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.calories.value} kcal {renderTrendIcon(metrics.calories.trend)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Active Minutes */}
              <Link to="/metrics/active-minutes" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaRunning className="text-emerald-600 text-2xl mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Active Minutes</h2>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {metrics.activeMinutes.value} min {renderTrendIcon(metrics.activeMinutes.trend)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Steps Graph */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Weekly Steps</h2>
                {chartData ? (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          mode: "index",
                          intersect: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          grid: {
                            color: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                          },
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading chart data...</p>
                )}
              </div>

              {/* Weekly Activity */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Weekly Activity</h2>
                <Bar
                  data={weeklyActivityData}
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
                        grid: {
                          color: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                        },
                        title: {
                          display: true,
                          text: "Minutes",
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* Sleep Breakdown */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Sleep Breakdown</h2>
                <div className="flex items-center justify-center">
                  <div style={{ width: "70%", height: "auto" }}>
                    <Doughnut
                      data={sleepBreakdownData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: "right",
                            labels: {
                              color: darkMode ? "#f3f4f6" : "#1f2937",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Health Facts */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Health Facts</h2>
                <div className="space-y-4">
                  {healthFacts.length > 0 ? (
                    <>
                      {healthFacts.slice(0, showAllFacts ? 5 : 3).map((fact, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full mr-3">
                            <span className="text-blue-600 dark:text-blue-300 font-bold">{index + 1}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{fact}</p>
                        </div>
                      ))}
                      {healthFacts.length > 3 && (
                        <button 
                          onClick={() => setShowAllFacts(!showAllFacts)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          {showAllFacts ? "Show less" : "View more health facts"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">Connect your health account to see interesting health facts.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Weekly Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {weeklySummary ? (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h3 className="font-medium text-gray-800 dark:text-white mb-2">Active minutes</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {weeklySummary?.summary?.[0] || "Analyzing your activity trends..."}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h3 className="font-medium text-gray-800 dark:text-white mb-2">Sleep Analysis</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {weeklySummary?.summary?.[1] || "Analyzing your sleep patterns..."}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h3 className="font-medium text-gray-800 dark:text-white mb-2">Heart Health</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {weeklySummary?.summary?.[2] || "Analyzing your heart health..."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 text-center p-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Connect your health account to see your weekly summary.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
    </div>
  )
}
