export const siteMetadata = {
  title: "Collability | Real-time workspace",
  description:
    "A real-time collaborative team workspace combining Kanban boards and documents.",
} as const;

export const brandName = "Collability";

export const primaryNavigationLinks = [
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
] as const;

export const mobileFeatureLinks = [
  { href: "/features/kanban", label: "Kanban Boards" },
  { href: "/features/realtime", label: "Real-Time Collaboration" },
  { href: "/features/offline", label: "Offline First" },
] as const;

export const footerLinkGroups = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

export const socialLinks = [
  {
    href: "https://github.com/hafzism/collability",
    label: "GitHub",
  },
] as const;
