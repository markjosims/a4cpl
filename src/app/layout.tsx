import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A4CPL - AI-Assisted Assessment for Credit for Prior Learning",
  description:
    "An AI-driven assessment tool to support the equitable award of Credit for Prior Learning (CPL) for Fire Technology courses.",
  keywords: [
    "Credit for Prior Learning",
    "CPL",
    "AI Assessment",
    "Fire Technology",
    "LACCD",
    "UCSD",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Skip to main content for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
