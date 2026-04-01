import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";

import { SiteHeader } from "@/components/navigation/site-header";
import { siteMetadata } from "@/constants/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  icons: {
    icon: "/collability_outline_white.svg",
    shortcut: "/collability_outline_white.svg",
    apple: "/collability_outline_white.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark scroll-smooth antialiased ${inter.variable} ${lexend.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
