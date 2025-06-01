// Utility function to generate placeholder image URLs
export const getPlaceholderImage = (width: number, height: number, text = "") => {
  // Use a general placeholder icon
  return `/placeholder.svg?height=${height}&width=${width}&text=${encodeURIComponent(text)}`;
};

// Team member placeholder data
export const teamPlaceholders = [
  {
    name: "Adam Lawal",
    role: "CEO & Cofounder",
    description: "Data Engineer and Visionary Leader",
    image: getPlaceholderImage(200, 200, "Adam"),
  },
  {
    name: "Ugoeze Eluchie",
    role: "Backend / UI Engineer",
    description: "Full Stack Developer with a passion for design",
    image: getPlaceholderImage(200, 200, "Ugoeze"),
  },
  {
    name: "Daniel Ibironke",
    role: "Backend Developer",
    description: "Expert in scalable backend systems",
    image: getPlaceholderImage(200, 200, "Daniel"),
  },
];

// Favicon placeholder
export const faviconPlaceholder = "/favicon.ico";

