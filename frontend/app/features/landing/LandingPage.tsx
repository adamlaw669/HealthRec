import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import { FaMoon, FaSun } from "react-icons/fa"
import "../../../assets/styles/background-effects.css"
import { teamPlaceholders } from "../../utils/placeholders"
//import { authAPI } from "../../api/api"
import { getInitialTheme, toggleTheme } from "../../utils/theme-utils"
import { FaGoogle,  FaPencilAlt, FaBrain, FaShieldAlt } from "react-icons/fa" // icons for features

interface Testimonial {
  author: string
  text: string
}

const testimonials: Testimonial[] = [
  {
    author: "Mr. Yomi Denzel",
    text: "HealthRec Engine has revolutionized my daily routine. The recommendations are spot-on!",
  },
  { author: "Mr. Kaanu Olaniyi", text: "I love how detailed yet easy-to-read my health metrics are. A game changer!" },
  { author: "Hon Wasilat Adegoke", text: "Simple, intuitive, and packed with powerful insights. Highly recommended!" },
  { author: "Mr Azuibike Ishiekwene", text: "I now feel more in control of my health thanks to HealthRec Engine." },
  {
    author: "Mr. Victor",
    text: "The personalized insights make all the difference. It's like having a coach in my pocket!",
  },
  { author: "Ladipo Samuel", text: "Tracking my health has never been easier. This app is a must-have!" },
  { author: "Adesipe Emmanuel", text: "A state-of-the-art tool that delivers exactly what I need to stay healthy. realy glad to have come across it." },
  { author: "Daniel Martinez", text: "HealthRec Engine's interface is super attractive and easy to use." },
  { author: "Olivia Anderson", text: "Finally, an app that understands my health goals and helps me reach them." },
  { author: "Liam Thomas", text: "I can't imagine going back to the old way of tracking health. This is fantastic!" },
]

const teamMembers = teamPlaceholders

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false)

  // Add contact form state
  const [contactForm, setContactForm] = useState({
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Add contact form handlers
  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    })
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      // TODO: Implement contact form submission
      // For now, just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitSuccess(true)
      setContactForm({ email: '', subject: '', message: '' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Initialize theme on component mount
  useEffect(() => {
    const initialDarkMode = getInitialTheme()
    setDarkMode(initialDarkMode)
  }, [])

  const handleToggleTheme = () => {
    const newDarkMode = toggleTheme(darkMode)
    setDarkMode(newDarkMode)
  }
/*
  const handleGoogleLogin = async () => {
    try {
      await authAPI.googleLogin()
    } catch (error) {
      console.error("Failed to initiate Google login:", error)
    }
  }
*/
  // Settings for the testimonials slider
  const testimonialSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
  }

  // Settings for the team members slider
  const teamSettings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  }

  // Add scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img src="/healthreclogo.png" alt="HealthRec Logo" className="h-8 w-8" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">HealthRec</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Contact
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleToggleTheme}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
              </button>
              <Link
                to="/auth?mode=signin"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link 
                to="/auth?mode=signup" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Add padding to account for fixed navbar */}
      <div className="pt-16">
      {/* Hero Section */}
      <section className="relative gradient-background pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 lg:max-w-2xl lg:w-full">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Your Personal</span>
                  <span className="block text-blue-200">Health Companion</span>
                </h1>
                <p className="mt-3 text-base text-gray-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Track your health metrics, get AI-powered insights, and make informed decisions about your well-being.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                      <Link
                        to="/auth?mode=signup"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                        Get Started
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        to="/auth?mode=signin"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-colors"
                      >
                        Sign In
                      </Link>
                    </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Features Section */}
        <section id="features" className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to track your health
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {/* Manual Data Entry */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <FaPencilAlt className="h-6 w-6" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Manual Data Entry</h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                      Record your health metrics manually and keep track of your progress over time.
                    </p>
                  </div>
                </div>

              {/* Google Fit Integration */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <FaGoogle className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Google Fit Integration</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                      Optional integration with Google Fit to automatically sync your health data.
                  </p>
                </div>
              </div>

                {/* AI Insights */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <FaBrain className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">AI-Powered Insights</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                      Get personalized recommendations and insights based on your health data.
                  </p>
                </div>
              </div>

                {/* Data Privacy */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <FaShieldAlt className="h-6 w-6" />
                </div>
                <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Data Privacy</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                      Your health data is encrypted and secure. You have full control over your information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
        <section id="about" className="py-16 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">About Us</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            HealthRec Engine is dedicated to helping you monitor your health in a simple yet powerful way. Our mission
            is to provide personalized insights that empower you to take control of your wellbeing.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How does Google Fit integration work?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our app securely connects to your Google Fit account to sync your health data. This includes steps, heart rate, sleep patterns, and other fitness metrics. You can control which data you want to share.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">What kind of AI insights do you provide?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI analyzes your health data to provide personalized recommendations, identify patterns, and suggest improvements to your health routine. The insights are based on your specific health goals and data.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Is my health data secure?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes, we take data security seriously. All your health data is encrypted, and we follow strict privacy guidelines. You have full control over your data and can delete it at any time.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How often is my data updated?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your Google Fit data is automatically synced every few minutes. You can also manually trigger a sync at any time from the dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">What Our Users Say</h2>
          <Slider {...testimonialSettings}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="px-4">
                <blockquote className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 glass-card">
                  <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.text}"</p>
                  <cite className="block mt-4 text-gray-800 dark:text-white font-bold">– {testimonial.author}</cite>
                </blockquote>
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">Meet Our Team</h2>
          <Slider {...teamSettings}>
            {teamMembers.map((member, index) => (
              <div key={index} className="px-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 glass-card">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={`Team Member ${member.name}`}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{member.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{member.role}</p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

        {/* Call to Action */}
      <section className="bg-blue-600 dark:bg-blue-800">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start tracking your health?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-100">
              Create your account today and take control of your health journey.
          </p>
            <Link
              to="/auth?mode=signup"
            className="mt-8 w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
          >
              Get Started Now
            </Link>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-8 text-center">Contact Us</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8">
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                Have questions or need support? We're here to help!
              </p>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="contact-subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleContactInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter subject"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactInputChange}
                    required
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your message"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
                {submitSuccess && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-400 text-sm">Message sent successfully!</p>
                  </div>
                )}
                {submitError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{submitError}</p>
                  </div>
                )}
              </form>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-center text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} HealthRec Engine. All rights reserved.
        </div>
      </footer>
      </div>
    </div>
  )
}
