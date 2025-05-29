


import axios from "axios";

// Development API URL
const DEV_API_URL = "http://127.0.0.1:8000" // this is for Django connection
// const DEV_API_URL = "https://healthrec.onrender.com/"; // this is for the mock server

// Use environment variable in production, fallback to development URL
const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL
    : DEV_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Include credentials to handle cookies for session-based auth
  withCredentials: true, // Changed to true for CORS in development
});

// Utility function to handle errors
const handleError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      "An error occurred";
    console.error("API Error:", errorMessage);
    return errorMessage;
  } else if (error instanceof Error) {
    console.error("Error:", error.message);
    return error.message;
  } else {
    console.error("Unknown error:", error);
    return "An unknown error occurred";
  }
};

// Function to get CSRF token before making requests
export const getCsrfToken = async () => {
  try {
    const response = await apiClient.get("/api/csrf-token/");
    apiClient.defaults.headers["X-CSRFToken"] = response.data.csrfToken;
    return response.data.csrfToken;
  } catch (error) {
    console.error("Failed to get CSRF token:", handleError(error));
    return null;
  }
};

// Authentication API
export const authAPI = {
  signup: async (username: string, password: string) => {
    try {
      const csrfToken = await getCsrfToken(); 
      const response = await fetch(`${API_BASE_URL}/basic_signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}), // Include CSRF token if available
        },
        body: JSON.stringify({ username, password }), // Pass the username and password in the request body
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }
      const data = await response.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      return data; // Return the response data
    } catch (error: unknown) {
      throw handleError(error); // Handle errors appropriately
    }
  },

  login: async (username: string, password: string) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.post(
        "/login",
        { username, password },
        {
          headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
        },
      );
      // Store token on successful login
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  logout: async () => {
    try {
      const csrfToken = await getCsrfToken(); // Ensure CSRF token is set
      const response = await apiClient.post(
        "/logout",
        {},
        {
          headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
        },
      );
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get("/profile");
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.put("/api/user/profile/", profileData, {
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
      });
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Update user settings
  updateSettings: async (settingsData: any) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.put(
        "/api/user/settings/",
        settingsData,
        {
          headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
        },
      );
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Get user settings
  getSettings: async () => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_BASE_URL}/api/user/settings/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch settings");
    }
    return response.json();
  },

  scheduleAccountDeletion: async (days: number) => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(
      `${API_BASE_URL}/api/user/settings/schedule-deletion/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ days }),
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to schedule account deletion");
    }
    return response.json();
  },

  cancelAccountDeletion: async () => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(
      `${API_BASE_URL}/api/user/settings/cancel-deletion/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to cancel account deletion");
    }
    return response.json();
  },

  googleLogin: async () => {
    try {
      const response = await apiClient.get("/api/user/google/login/");
      if (response.status === 200 && response.data.authUrl) {
        // Clear any existing auth tokens first
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");

        // Redirect to Google's auth page
        window.location.href = response.data.authUrl;
        return true;
      } else {
        console.error("Failed to get Google login URL:", response.data);
        throw new Error("Failed to get Google login URL");
      }
    } catch (error) {
      console.error("Google login error:", handleError(error));
      throw error;
    }
  },

  // Connect Google Fit
  connectGoogleFit: async () => {
    try {
      const response = await apiClient.get("/api/user/google/login/");
      if (response.status === 200 && response.data.authUrl) {
        window.location.href = response.data.authUrl;
        return true;
      } else {
        console.error("Failed to get Google login URL:", response.data);
        throw new Error("Failed to get Google login URL");
      }
    } catch (error) {
      console.error("Google Fit connection error:", handleError(error));
      throw error;
    }
  },

  // Check Google Fit connection status
  checkGoogleFitStatus: async () => {
    try {
      const response = await apiClient.get("/api/user/google/status/");
      return response.data.connected;
    } catch (error) {
      console.error("Error checking Google Fit status:", error);
      return false;
    }
  },

  // Add status check endpoints
  checkOpenAIStatus: async () => {
    const response = await apiClient.get("/api/openai/status/");
    return response.data;
  },

  // Verify token validity
  verifyToken: async (token: string) => {
    try {
      const response = await apiClient.get("/api/auth/verify/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error("Invalid token");
    }
  },
};

// Health Recommendations API
export const healthAPI = {
  getRecommendations: async () => {
    try {
      const response = await apiClient.get("/api/health/recommendations");
      return {
        recommendations: response.data.recommendations,
        status: response.data.status,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error("Please log in to get personalized recommendations");
      }
      throw new Error(
        error.response?.data?.message || "Unable to generate recommendations",
      );
    }
  },

  // Get health facts
  getHealthFacts: async () => {
    try {
      const response = await apiClient.get("/api/health/facts");
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Get latest metrics
  getLatestMetrics: async () => {
    try {
      const response = await apiClient.get("/api/health/metrics/latest");
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Add new function to fetch chart data
  getChartData: async (metricType: string, timeRange = "week") => {
    try {
      const response = await apiClient.get(
        `/api/health/metrics/${metricType}`,
        {
          params: { timeRange },
        },
      );
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Get correlation insights between metrics
  getCorrelationInsights: async () => {
    try {
      const response = await apiClient.get("/api/health/insights/correlations");
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Generate doctor's report
  generateDoctorReport: async (
    email: string,
    metrics: string[],
    customNotes: string = "",
  ) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.post(
        "/api/health/doctor-report",
        { email, metrics, custom_notes: customNotes },
        {
          headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
        },
      );
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Download health data
  downloadHealthData: async (format = "json") => {
    try {
      const response = await apiClient.get("/api/health/download", {
        params: { format },
        responseType: "blob",
      });
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  getWeeklySummary: async () => {
    const response = await apiClient.get("/api/weekly-summary/");
    return response.data;
  },

  // Add new metric
  addMetric: async (metricType: string, value: number) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.post(
        "/api/health/metrics/add",
        { metric_type: metricType, value },
        {
          headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
        },
      );
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },
};

// Google Login - updated path to include /api/
export const googleLogin = async (): Promise<void> => {
  console.log("Initiating Google OAuth login flow");

  try {
    // Clear any existing tokens first
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    console.log("Cleared existing auth tokens");

    // Request the Google authorization URL from the backend
    const response = await apiClient.get("/api/user/google/login/");
    console.log("Google login response received:", response.status);

    if (response.status === 200 && response.data.authUrl) {
      console.log("Redirecting to Google auth page");
      window.location.href = response.data.authUrl;
    } else {
      console.error("Invalid response format:", response.data);
      throw new Error("Failed to get Google login URL");
    }
  } catch (error) {
    console.error("Error initiating Google login:", error);
    throw new Error("Failed to initiate Google login");
  }
};

// Updated path to include /api/
export const checkGoogleStatus = async () => {
  try {
    const response = await apiClient.get("/api/user/google/status/");
    return response.data;
  } catch (error) {
    console.error("Error checking Google status:", error);
    return { connected: false }; // Return a default object instead of throwing
  }
};

// Google Callback - this handles the client-side code exchange flow
export const googleCallback = async (code: string): Promise<any> => {
  console.log(
    "Processing Google callback with code:",
    code.substring(0, 10) + "...",
  );

  // Log the current base URL and paths we're going to try
  console.log("API base URL:", apiClient.defaults.baseURL);
  const getUrl = `/api/user/google/callback/?code=${encodeURIComponent(code)}`;
  const postUrl = "/api/user/google/callback/";
  console.log("GET URL:", getUrl);
  console.log("POST URL:", postUrl);

  // First try with GET request
  try {
    console.log("Attempting GoogleCallback with GET request");
    const response = await apiClient.get(getUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    console.log("GoogleCallback GET response status:", response.status);
    console.log("Response data:", response.data);

    // If we got a 302 redirect response
    if (response.status === 302 && response.headers.location) {
      console.log("Received redirect response:", response.headers.location);
      return { redirected: true, location: response.headers.location };
    }

    // If we got a successful response with token
    if (response.status === 200 && response.data) {
      console.log("GoogleCallback GET successful:", Object.keys(response.data));

      // Check if the response has a token
      if (response.data.token) {
        console.log("Token found in response");
      } else if (response.data.success === false) {
        console.error(
          "Authentication failed with error:",
          response.data.error || "Unknown error",
        );
      }

      return response.data;
    }

    // If we got here, response is not what we expected
    console.log("Unexpected response format from GET:", response.data);
    return response.data;
  } catch (error) {
    console.log("GoogleCallback GET request failed, trying POST:", error);

    // Fall back to POST request
    try {
      console.log("Attempting GoogleCallback with POST request");
      const response = await apiClient.post(
        postUrl,
        { code },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      console.log("GoogleCallback POST response status:", response.status);
      console.log("Response data:", response.data);

      if (response.status === 200 && response.data) {
        console.log(
          "GoogleCallback POST successful:",
          Object.keys(response.data),
        );

        if (response.data.token) {
          console.log("Token found in POST response");
          return response.data;
        }

        if (response.data.success === false) {
          console.error(
            "Authentication failed with error:",
            response.data.error,
          );
          throw new Error(response.data.error || "Authentication failed");
        }

        return response.data;
      }

      console.log("Unexpected response format from POST:", response.data);
      return response.data;
    } catch (postError: any) {
      console.error("GoogleCallback POST request failed:", postError);

      // If we have response data, return it to preserve any error messages
      if (postError.response && postError.response.data) {
        console.log("Error response data:", postError.response.data);
        return {
          ...postError.response.data,
          error:
            postError.response.data.error ||
            "Failed to authenticate with Google",
        };
      }

      throw new Error(
        postError.message || "Failed to authenticate with Google",
      );
    }
  }
};

// Contact/Support API
export const supportAPI = {
  submitContactForm: async (formData: any) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.post("/api/support/contact", formData, {
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
      });
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  getFAQs: async () => {
    try {
      const response = await apiClient.get("/api/support/faqs");
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },
};

