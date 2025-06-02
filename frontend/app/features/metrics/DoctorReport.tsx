"use client"
import { useState } from "react"
import { healthAPI } from "../../api/api"
import { FaEnvelope, FaInfoCircle, FaClipboard, FaCheckCircle, FaEdit } from "react-icons/fa"

interface DoctorReportProps {
  onClose: () => void
}

export const DoctorReport = ({ onClose }: DoctorReportProps) => {
  const [email, setEmail] = useState("")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customNotes, setCustomNotes] = useState("")

  const handleMetricToggle = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric))
    } else {
      setSelectedMetrics([...selectedMetrics, metric])
    }
  }

  const handleGenerateReport = async () => {
    try {
      await healthAPI.getDoctorReport(
        email,
        selectedMetrics,
        customNotes
      );
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await handleGenerateReport()
      setIsSuccess(true)
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to generate report. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
              <FaCheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Report Sent Successfully!</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your health report has been sent to {email}. Your doctor will receive it shortly.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FaClipboard className="mr-2 text-blue-600 dark:text-blue-400" />
            Generate Weekly Doctor's Report
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
          <p className="text-sm">
            <FaInfoCircle className="inline-block mr-1" />
            This report will include your health data for the past week.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="doctor-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Doctor's Email Address
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                id="doctor-email"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="doctor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your health data will be sent to this email address.
            </p>
          </div>

          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Health Metrics to Include
            </span>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="steps"
                  name="steps"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  checked={selectedMetrics.includes("steps")}
                  onChange={() => handleMetricToggle("steps")}
                />
                <label htmlFor="steps" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Steps & Activity
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="heart-rate"
                  name="heart-rate"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  checked={selectedMetrics.includes("heart-rate")}
                  onChange={() => handleMetricToggle("heart-rate")}
                />
                <label htmlFor="heart-rate" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Heart Rate
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="sleep"
                  name="sleep"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  checked={selectedMetrics.includes("sleep")}
                  onChange={() => handleMetricToggle("sleep")}
                />
                <label htmlFor="sleep" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Sleep
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="weight"
                  name="weight"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  checked={selectedMetrics.includes("weight")}
                  onChange={() => handleMetricToggle("weight")}
                />
                <label htmlFor="weight" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Weight & BMI
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="nutrition"
                  name="nutrition"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  checked={selectedMetrics.includes("nutrition")}
                  onChange={() => handleMetricToggle("nutrition")}
                />
                <label htmlFor="nutrition" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Nutrition & Calories
                </label>
              </div>
            </div>
          </div>

          {/* Custom Notes Section */}
          <div className="mb-4">
            <label htmlFor="custom-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Notes for Your Doctor
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FaEdit className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                id="custom-notes"
                rows={4}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Add any additional information you'd like your doctor to know..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              These notes will be included in your report to provide additional context for your doctor.
            </p>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading || selectedMetrics.length === 0 || !email}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading || selectedMetrics.length === 0 || !email
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {isLoading ? (
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
                  Sending...
                </>
              ) : (
                "Send Report to Doctor"
              )}
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              By sending this report, you consent to sharing your health data with your healthcare provider. Your data
              is encrypted and secure.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DoctorReport

