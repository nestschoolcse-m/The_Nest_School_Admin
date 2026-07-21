import type React from "react"
import type { Metadata } from "next"
import { Outfit, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import ClientLayout from "./ClientLayout"

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "The Nest School - Admin Dashboard",
  description: "Student and Parent Entry Check System",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
      </body>
    </html>
  )
}
