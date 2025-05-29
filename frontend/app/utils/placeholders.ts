// Utility function to generate placeholder image URLs
// Replace the getPlaceholderImage function with this
export const getPlaceholderImage = (width: number, height: number, text = "") => {
  // Use Next.js built-in placeholder instead of external service
  return `/placeholder.svg?height=${height}&width=${width}&text=${encodeURIComponent(text)}`
}

// Team member placeholder images
export const teamPlaceholders = [
  { name: "Adam Lawal", role: "Lead Data Engineer", image: "/images/adam.jpg" },
  { name: "Ugoeze", role: "UI Engineer", image: "/images/emmanuel.jpg" },
  { name: "Daniel Ibironke", role: "Backend Developer", image: getPlaceholderImage(200, 200, "Daniel") },
]

// Favicon placeholder
export const faviconPlaceholder = "/favicon.ico";

