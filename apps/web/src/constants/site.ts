export const siteMetadata = {
  title: "Collability | Team Kanban Workspace",
  description:
    "A realtime team workspace for Kanban boards, card comments, presence, notifications, and role-based collaboration.",
} as const;

export const brandName = "Collability";

export const primaryNavigationLinks = [
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
] as const;

export const mobileFeatureLinks = [
  { href: "/features/kanban", label: "Kanban Boards" },
  { href: "/features/realtime", label: "Realtime Board Updates" },
  { href: "/features/notifications", label: "Notifications" },
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
