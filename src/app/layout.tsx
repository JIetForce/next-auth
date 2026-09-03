import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ChatWidgetGate } from "@/components/chat/chat-widget-gate";
import { getPublicBaseUrl } from "@/lib/auth/environment";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicBaseUrl()),
  title: {
    default: "Siftloom — Curated AI, SaaS & Workflow Tools",
    template: "%s | Siftloom",
  },
  description:
    "We sift through the noise so you can scale. Curated AI, SaaS, and workflow tools for modern teams and digital professionals.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Siftloom — Curated AI, SaaS & Workflow Tools",
    description:
      "We sift through the noise so you can scale. Curated AI, SaaS, and workflow tools for modern teams and digital professionals.",
    url: "/",
    siteName: "Siftloom",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Siftloom — Curated AI, SaaS & Workflow Tools",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Siftloom — Curated AI, SaaS & Workflow Tools",
    description:
      "We sift through the noise so you can scale. Curated AI, SaaS, and workflow tools for modern teams and digital professionals.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-md focus:outline-none"
        >
          Skip to content
        </a>
        <Providers>
          {children}
          <Suspense fallback={null}>
            <ChatWidgetGate />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
