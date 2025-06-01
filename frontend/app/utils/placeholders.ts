// Utility function to generate placeholder image URLs
export const getPlaceholderImage = (width: number, height: number, text = "") => {
  // Use Next.js built-in placeholder instead of external service
  return `/placeholder.svg?height=${height}&width=${width}&text=${encodeURIComponent(text)}`
}

// Team member placeholder images
export const teamPlaceholders = [
  { name: "Adam Lawal", role: "Lead Data Engineer", image: "/images/adam.jpg" },
  { name: "Ugoeze Eluchie", role: "Backend / UI Engineer", image: "/images/Ugoeze.jpg" },
  { name: "Daniel Ibironke", role: "Backend Developer", image: getPlaceholderImage(200, 200, "Daniel") },
]

// Favicon placeholder
export const faviconPlaceholder = "/favicon.ico";

