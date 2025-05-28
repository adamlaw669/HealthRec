import { useState, useEffect } from "react"
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa"
import { apiClient } from "../api/api"

export const TestConnection = () => {
  const [backendStatus, setBackendStatus] = useState<"loading" | "success" | "error">("loading")
  const [googleFitStatus, setGoogleFitStatus] = useState<"loading" | "success" | "error">("loading")
  const [openAIStatus, setOpenAIStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const checkConnections = async () => {
      try {
        // Test backend connection
        const backendResponse = await apiClient.get("/api/health-check/")
        setBackendStatus(backendResponse.status === 200 ? "success" : "error")
        
        // Test Google Fit connection
        const googleResponse = await apiClient.get("/api/user/google/status/")
        setGoogleFitStatus(googleResponse.data.connected ? "success" : "error")
        
        // Test OpenAI connection
        const openAIResponse = await apiClient.get("/api/openai/status/")
        setOpenAIStatus(openAIResponse.data.connected ? "success" : "error")
      } catch (error: any) {
        setBackendStatus("error")
        setErrorMessage(error.response?.data?.message || error.message || "Connection failed")
      }
    }

    checkConnections()
  }, [])

  const StatusIndicator = ({ status, label }: { status: string; label: string }) => (
    <div className="flex items-center space-x-2 mb-2">
      {status === "loading" && <FaSpinner className="animate-spin text-blue-500" />}
      {status === "success" && <FaCheckCircle className="text-green-500" />}
      {status === "error" && <FaTimesCircle className="text-red-500" />}
      <span className={`
        ${status === "loading" ? "text-blue-500" : ""}
        ${status === "success" ? "text-green-500" : ""}
        ${status === "error" ? "text-red-500" : ""}
      `}>
        {label}: {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">API Connection Test</h2>
      <div className="space-y-4">
        <StatusIndicator status={backendStatus} label="Backend Connection" />
        <StatusIndicator status={googleFitStatus} label="Google Fit API" />
        <StatusIndicator status={openAIStatus} label="OpenAI API" />
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-md">
            <p className="text-sm font-medium">Error Details:</p>
            <p className="text-xs mt-1">{errorMessage}</p>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Last checked: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  )
} 