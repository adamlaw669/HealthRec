// Utility function to generate placeholder image URLs
// Replace the getPlaceholderImage function with this
export const getPlaceholderImage = (width: number, height: number, text = "") => {
  // Use Next.js built-in placeholder instead of external service
  return `/placeholder.svg?height=${height}&width=${width}&text=${encodeURIComponent(text)}`
}

// Team member placeholder images
export const teamPlaceholders = [
  { name: "Adrien", role: "Frontend Lead", image: "/images/adrien.jpg" },
  { name: "Adam", role: "Lead Data Engineer", image: "/images/adam.jpg" },
  { name: "Emmanuel", role: "UI Engineer", image: "/images/emmanuel.jpg" },
  { name: "Shukhriya", role: "Frontend developer", image:"/images/shukrah.jpg" },
  { name: "Anjola", role: "Graphic Designer", image: "/images/anjola.jpg" },
  { name: "Esther", role: "Backend Developer", image: "/images/esther.jpg" },
  { name: "Daniel", role: "Backend Developer", image: getPlaceholderImage(200, 200, "Daniel") },
]

// Favicon placeholder
export const faviconPlaceholder = "/favicon.ico";

