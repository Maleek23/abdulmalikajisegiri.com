import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "Abdulmalik Ajisegiri",
  DESCRIPTION: "Abdulmalik Ajisegiri is a systems engineering and model risk professional specializing in model validation, AI/ML governance, advanced analytics, and MBSE.",
  AUTHOR: "Abdulmalik Ajisegiri",
}

// About Page
export const ABOUT: Page = {
  TITLE: "About",
  DESCRIPTION: "Professional background of Abdulmalik Ajisegiri: model risk and validation engineer at DTCC, systems engineering, AI/ML governance, CISA-certified.",
}

// Engineering Page
export const ENGINEERING: Page = {
  TITLE: "Engineering",
  DESCRIPTION: "Engineering practice of Abdulmalik Ajisegiri: model-based systems engineering, model risk and validation, AI/ML systems, and optimization.",
}

// Research Page
export const RESEARCH: Page = {
  TITLE: "Research Library",
  DESCRIPTION: "Twenty research notes by Abdulmalik Ajisegiri on model validation, systems engineering, MBSE, optimization, and quantitative methods — the working library behind the case studies.",
}

// Projects Page
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Engineering and quantitative projects by Abdulmalik Ajisegiri: model validation frameworks, MBSE tooling, optimization engines, and market-data platforms.",
}

// Quant Page
export const QUANT: Page = {
  TITLE: "Quantitative Work",
  DESCRIPTION: "Quantitative research and analytics by Abdulmalik Ajisegiri, including the Quant Edge project.",
}

// Photography Page
export const PHOTOGRAPHY: Page = {
  TITLE: "Photography & Film",
  DESCRIPTION: "Photography and filmmaking by Abdulmalik Ajisegiri under the Leekshotit brand.",
}

// Resume Page
export const RESUME: Page = {
  TITLE: "Resume",
  DESCRIPTION: "Resume of Abdulmalik Ajisegiri: model risk and validation engineer at DTCC; Collins Aerospace, Deloitte; M.S. Systems Engineering, University of Oklahoma.",
}

// Contact Page
export const CONTACT: Page = {
  TITLE: "Contact",
  DESCRIPTION: "Contact Abdulmalik Ajisegiri about engineering, quantitative research, or photography and film work.",
}

// Now Page
export const NOW: Page = {
  TITLE: "Now",
  DESCRIPTION: "What Abdulmalik Ajisegiri is focused on right now.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all research notes and projects by keyword.",
}

// Links
export const LINKS: Links = [
  {
    TEXT: "About",
    HREF: "/about",
  },
  {
    TEXT: "Engineering",
    HREF: "/engineering",
  },
  {
    TEXT: "Projects",
    HREF: "/projects",
  },
  {
    TEXT: "Research",
    HREF: "/research",
  },
  {
    TEXT: "Quant",
    HREF: "/quant",
  },
  {
    TEXT: "Photography",
    HREF: "/photography",
  },
  {
    TEXT: "Resume",
    HREF: "/resume",
  },
  {
    TEXT: "Contact",
    HREF: "/contact",
  },
]

// Socials
// TODO: add real handles — LinkedIn, X, YouTube, Instagram — then
// also add them to the sameAs array in BaseHead.astro.
export const SOCIALS: Socials = [
  {
    NAME: "Email",
    ICON: "email",
    TEXT: "me@abdulmalikajisegiri.com",
    HREF: "mailto:me@abdulmalikajisegiri.com",
  },
  {
    NAME: "Github",
    ICON: "github",
    TEXT: "Maleek23",
    HREF: "https://github.com/Maleek23",
  },
]
