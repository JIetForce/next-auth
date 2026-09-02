import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Siftloom — Curated AI, SaaS & Workflow Tools",
  description:
    "We sift through the noise so you can scale. Curated AI, SaaS, and workflow tools for modern teams and digital professionals.",
  icons: {
    icon: "/siftloom-logo.png",
    shortcut: "/siftloom-logo.png",
    apple: "/siftloom-logo.png",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
