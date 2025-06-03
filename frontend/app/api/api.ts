import axios from "axios";
//import { HealthInterpreter } from "components/ui/HealthInterpreter";

// Development API URL
const DEV_API_URL = "https://healthrec.onrender.com" // Production backend URL
// const DEV_API_URL = "http://127.0.0.1:8000" // Local development URL

// Use environment variable in production, fallback to development URL
const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL || DEV_API_URL
    : DEV_API_URL;

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Add request interceptor to add auth token and CSRF token
apiClient.interceptors.request.use(
  async (config) => {
    // Get CSRF token from cookie
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
    if (csrfCookie) {
      const csrfToken = csrfCookie.split('=')[1];
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Error handler
const handleError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return "An unexpected error occurred";
};

// Function to get CSRF token before making requests
export const getCsrfToken = async () => {
  try {
    const response = await apiClient.get("/csrf-cookie", {
      withCredentials: true
    });
    
    // Try to get token from response
    const token = response.data.csrfToken;
    if (token) {
      apiClient.defaults.headers["X-CSRFToken"] = token;
      return token;
    }
    
    // If no token in response, try to get from cookie
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
    if (csrfCookie) {
      const cookieToken = csrfCookie.split('=')[1];
      apiClient.defaults.headers["X-CSRFToken"] = cookieToken;
      return cookieToken;
    }
    
    // If still no token, try to get from response headers
    const csrfHeader = response.headers['x-csrftoken'];
    if (csrfHeader) {
      apiClient.defaults.headers["X-CSRFToken"] = csrfHeader;
      return csrfHeader;
    }
    
    console.error("No CSRF token found in response or cookies");
    return null;
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    return null;
  }
};

// Authentication API
export const authAPI = {
  basic_signup: async (email: string, password: string) => {
    try {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        throw new Error("Failed to get CSRF token");
      }

      const response = await apiClient.post(
        "/basic_signup",
        { username: email, password },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
          },
          withCredentials: true
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Store user data with correct structure
      const userData = {
        username: email,
        name: email.split('@')[0], // Use part before @ as name
        email: email
      };
      localStorage.setItem("user", JSON.stringify(userData));

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("An error occurred during signup. Please try again.");
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
      
      // Store user data with correct structure
      const userData = {
        username: username,
        name: username.split('@')[0], // Use part before @ as name
        email: username
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      if (response.data.csrfToken) {
        apiClient.defaults.headers["X-CSRFToken"] = response.data.csrfToken;
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
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("No user data found in localStorage");
      }
      const { username, name, email } = JSON.parse(userData);
      const response = await apiClient.get(`/profile?username=${username}`);
      return {
        name: name || response.data.name || username,
        email: email || response.data.email || username
      };
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.put("/update_profile", profileData, {
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
        "/update_settings",
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
    const response = await fetch(`${API_BASE_URL}/user_settings/`, {
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
      `${API_BASE_URL}/account_deletion`,
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
      `${API_BASE_URL}/cancel_deletion`,
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
      const response = await apiClient.get('/google_login/');
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  // Connect Google Fit
  connectGoogleFit: async () => {
    try {
      const response = await apiClient.get("connect_google_fit");
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
      const response = await apiClient.get("google_fit_status/");
      return response.data.connected;
    } catch (error) {
      console.error("Error checking Google Fit status:", error);
      return false;
    }
  },

  // Add status check endpoints
  checkOpenAIStatus: async () => {
    const response = await apiClient.get("/check_openai_status");
    return response.data;
  },

  // Verify token validity
  verifyToken: async (token: string) => {
    try {
      const response = await apiClient.get("/verify_token/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error("Invalid token");
    }
  },

  googleCallback: async (code: string) => {
    try {
      const response = await apiClient.post('/google_callback', { code });
      return response.data;
    } catch (error) {
      console.error('Google callback error:', error);
      throw error;
    }
  },
};

// Health Recommendations API
export const healthAPI = {
  getHealthRecommendation: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.post("/get_health_recommendation", { username });
      return response.data;
    } catch (error) {
      console.error("Error fetching health recommendations:", error);
      return {
        recommendations: {
          general: {
            summary: "Unable to fetch recommendations. Please try again later.",
            insights: [
              "Make sure you have granted all necessary permissions.",
              "Try refreshing the page.",
              "Check your internet connection and try again.",
              "Contact support if the issue persists."
            ]
          },
          correlation: []
        }
      };
    }
  },

  // Get all health_data
  getHealthData: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("No user data found in localStorage");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/health_data?username=${username}`);
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Get health facts
  getHealthFacts: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("No user data found in localStorage");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.post("/HealthFacts", { username });
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  getStepData: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/step_data?username=${username}`);
      if (!response.data || !Array.isArray(response.data.labels) || !Array.isArray(response.data.values)) {
        return { labels: [], values: [] };
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching step data:", error);
      return { labels: [], values: [] };
    }
  },

  getSleepData: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/sleep_data?username=${username}`);
      if (!response.data || !Array.isArray(response.data.labels) || !Array.isArray(response.data.values)) {
        return { labels: [], values: [] };
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching sleep data:", error);
      return { labels: [], values: [] };
    }
  },

  getHeartRateData: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/heart_data?username=${username}`);
      if (!response.data || !Array.isArray(response.data.labels) || !Array.isArray(response.data.values)) {
        return { labels: [], values: [] };
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching heart rate data:", error);
      return { labels: [], values: [] };
    }
  },

  getWeightData: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/weight_data?username=${username}`);
      if (!response.data || !Array.isArray(response.data.labels) || !Array.isArray(response.data.values)) {
        return { labels: [], values: [] };
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching weight data:", error);
      return { labels: [], values: [] };
    }
  },

  getCaloriesData: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/calories_data?username=${username}`);
      if (!response.data || !Array.isArray(response.data.labels) || !Array.isArray(response.data.values)) {
        return { labels: [], values: [] };
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching calories data:", error);
      return { labels: [], values: [] };
    }
  },

  getActivityData: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/activity_data?username=${username}`);
      if (!response.data || !Array.isArray(response.data.labels) || !Array.isArray(response.data.values)) {
        return { labels: [], values: [] };
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching activity data:", error);
      return { labels: [], values: [] };
    }
  },

  // Get latest metrics
  getMetrics: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("No user data found in localStorage");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/get_metrics?username=${username}`);
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Add new function to fetch chart data
  getMetricsChart: async (metricType: string) => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("No user data found in localStorage");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/metrics_chart/${metricType}?username=${username}`);
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  // Generate doctor's report
  getDoctorReport: async (
    email: string,
    metrics: string[],
    customNotes: string = "",
  ) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.post(
        "/get_doctor_report",
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
  downloadHealthData: async (format: 'json' | 'csv' = 'json') => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("No user data found in localStorage");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.get(`/download_health_data?username=${username}&format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  getWeeklySummary: async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.post("/weekly_summary", { username });
      return response.data;
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      return {
        summary: ["No data available", "No data available", "No data available"],
        trends: {
          steps: 0,
          sleep: 0,
          heart_rate: 0,
          weight: 0,
          calories: 0,
          active_minutes: 0
        },
        status: "error"
      };
    }
  },

  // Add a new metric
  addMetric: async (metricType: string, value: number) => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not logged in");
      }
      const { username } = JSON.parse(userData);
      const response = await apiClient.post("/add_metric", {
        username,
        metric_type: metricType,
        value
      });
      return response.data;
    } catch (error) {
      console.error("Error adding metric:", error);
      throw error;
    }
  },

  explainHealthMetric: async (message: string) => {
    try {
      console.log('Making request to /health_interpreter with message:', message);
      const response = await apiClient.post("/health_interpreter", { message });
      console.log('Received response from /health_interpreter:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error in explainHealthMetric:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
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
    const response = await apiClient.get("/google_login");
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
    const response = await apiClient.get("/google_status");
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
  const getUrl = `/google_callback?code=${encodeURIComponent(code)}`;
  const postUrl = "/google_callback";
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
  contactSupport: async (name: string, email: string, message: string) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiClient.post("/support_contact", {
        name,
        email,
        message
      }, {
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
      });
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },

  getFAQs: async () => {
    try {
      const response = await apiClient.get("/get_faqs");
      return response.data;
    } catch (error: unknown) {
      throw handleError(error);
    }
  },
};

