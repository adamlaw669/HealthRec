"use client"
import { Link } from "react-router-dom"
import { 
  FaBars, 
  FaTimes, 
  FaTachometerAlt, 
  FaChartLine, 
  FaCog, 
  FaUserCircle
} from "react-icons/fa"
import { useSidebar } from "../context/SidebarContext"
import { useUser } from "../context/UserContext"
import { useEffect, memo, useCallback } from "react"

// Memoize the navigation links to prevent unnecessary re-renders
const NavigationLinks = memo(({ isSidebarOpen }: { isSidebarOpen: boolean }) => (
  <nav className="flex-1 flex items-center justify-center py-8">
    <div className="space-y-6 w-full px-2">
      <Link
        to="/dashboard"
        className={`flex items-center ${
          isSidebarOpen ? "px-4" : "justify-center"
        } py-3 text-white hover:bg-blue-500 dark:hover:bg-gray-700 rounded-lg transition-colors group`}
      >
        <FaTachometerAlt className="w-5 h-5" />
        {isSidebarOpen && <span className="ml-3 text-base font-bold">Dashboard</span>}
      </Link>
      <Link
        to="/metrics"
        className={`flex items-center ${
          isSidebarOpen ? "px-4" : "justify-center"
        } py-3 text-white hover:bg-blue-500 dark:hover:bg-gray-700 rounded-lg transition-colors group`}
      >
        <FaChartLine className="w-5 h-5" />
        {isSidebarOpen && <span className="ml-3 text-base font-bold">Metrics</span>}
      </Link>
      <Link
        to="/settings"
        className={`flex items-center ${
          isSidebarOpen ? "px-4" : "justify-center"
        } py-3 text-white hover:bg-blue-500 dark:hover:bg-gray-700 rounded-lg transition-colors group`}
      >
        <FaCog className="w-5 h-5" />
        {isSidebarOpen && <span className="ml-3 text-base font-bold">Settings</span>}
      </Link>
    </div>
  </nav>
))

NavigationLinks.displayName = "NavigationLinks"

// Memoize the profile section to prevent unnecessary re-renders
const ProfileSection = memo(({ isSidebarOpen, user }: { isSidebarOpen: boolean, user: any }) => (
  <div className="p-4 border-t border-blue-500 dark:border-gray-700">
    <Link
      to="/profile"
      className={`flex items-center ${
        isSidebarOpen ? "w-full px-4" : "justify-center w-full"
      } py-3 text-white hover:bg-blue-500 dark:hover:bg-gray-700 rounded-lg transition-colors group`}
    >
      <FaUserCircle className="w-5 h-5" />
      {isSidebarOpen && (
        <div className="ml-3 text-left">
          <span className="text-base font-bold block">{user?.name || 'User'}</span>
          <span className="text-sm opacity-75">{user?.email || 'user@example.com'}</span>
        </div>
      )}
    </Link>
  </div>
))

ProfileSection.displayName = "ProfileSection"

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const { user } = useUser()

  // Memoize the click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const sidebar = document.getElementById('sidebar')
    const toggleButton = document.getElementById('sidebar-toggle')
    
    if (isSidebarOpen && 
        sidebar && 
        !sidebar.contains(event.target as Node) && 
        toggleButton && 
        !toggleButton.contains(event.target as Node)) {
      toggleSidebar()
    }
  }, [isSidebarOpen, toggleSidebar])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-800 border-r border-blue-700 dark:border-gray-700 transition-all duration-300 z-50
          ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-24'}
          shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Toggle Section */}
          <div className="flex items-center justify-between p-4 border-b border-blue-500 dark:border-gray-700">
            <Link to="/" className="flex items-center bg-white dark:bg-gray-800 rounded-lg transition-all duration-300 p-2">
              <img 
                src="/healthreclogo.png" 
                alt="HealthRec Logo" 
                className={`object-contain transition-all duration-300 ${
                  isSidebarOpen ? "w-10 h-10" : "w-8 h-8 md:w-20 md:h-20"
                }`} 
              />
              {isSidebarOpen && (
                <span className="ml-3 text-2xl font-bold text-blue-600 dark:text-white tracking-tight">HealthRec</span>
              )}
            </Link>
            <button
              id="sidebar-toggle"
              onClick={toggleSidebar}
              className={`p-2 rounded-lg hover:bg-blue-500 dark:hover:bg-gray-700 transition-colors
                ${isSidebarOpen ? "ml-auto" : "absolute left-1/2 transform -translate-x-1/2 top-20 md:block hidden"}`}
            >
              {isSidebarOpen ? <FaTimes className="w-5 h-5 text-white" /> : <FaBars className="w-5 h-5 text-white" />}
            </button>
          </div>

          {/* Navigation Links */}
          <NavigationLinks isSidebarOpen={isSidebarOpen} />

          {/* Profile Section */}
          <ProfileSection isSidebarOpen={isSidebarOpen} user={user} />
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <button
        id="mobile-toggle"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white md:hidden"
      >
        <FaBars className="w-5 h-5" />
      </button>
    </>
  )
}

export default memo(Sidebar)

