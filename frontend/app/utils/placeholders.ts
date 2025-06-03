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
    image: "/images/dark_blue.jpg",
  },
  {
    name: "Ugoeze Eluchie",
    role: "Backend / UI Engineer",
    description: "Full Stack Developer with a passion for AI",
    image: "/images/dark_blue.jpg",
  },
  {
    name: "Daniel Ibironke",
    role: "Backend Developer",
    description: "Expert in scalable backend systems",
    image: "/images/dark_blue.jpg",
  },
];

// Favicon placeholder
export const faviconPlaceholder = "/images/dark_blue.jpg";

