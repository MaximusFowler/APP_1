import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura Blooms — Plant Survival Simulator",
  description:
    "AI-powered botanical analysis. Point your camera at any room corner and get a precise 2-year plant survival prediction using light physics and Gemini Vision.",
  keywords: ["plant care", "AI", "light analysis", "plant survival", "indoor plants", "grow light"],
  authors: [{ name: "Aura Blooms" }],
  openGraph: {
    title: "Aura Blooms — Will Your Plant Survive?",
    description: "AI-powered 2-year plant survival simulation using camera, GPS, and botanical physics.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0f0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-[#0a0f0a] text-white`}>
        {children}
      </body>
    </html>
  );
}
