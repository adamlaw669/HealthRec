// Theme utility functions

// Check if the user prefers dark mode
export const getInitialTheme = (): boolean => {
  // Check if theme was previously set in localStorage
  if (typeof window !== "undefined" && window.localStorage) {
    const storedTheme = window.localStorage.getItem("darkMode")
    if (typeof storedTheme === "string") {
      return storedTheme === "true"
    }

    // If no theme in localStorage, check user preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return true
    }
  }

  // Default to light mode
  return false
}

// Set theme in localStorage and apply to document
export const setTheme = (isDark: boolean): void => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("darkMode", isDark.toString())

    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }
}

// Toggle between light and dark mode
export const toggleTheme = (currentTheme: boolean): boolean => {
  const newTheme = !currentTheme
  setTheme(newTheme)
  return newTheme
}

