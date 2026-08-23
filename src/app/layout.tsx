import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://experience-genome.vercel.app"),
  title: {
    default: "EXPERIENCE//COMPILER",
    template: "%s — EXPERIENCE//COMPILER",
  },
  description:
    "Compile observed interactive experiences and human judgment into reusable design rules for any coding AI.",
  openGraph: {
    title: "EXPERIENCE//COMPILER",
    description:
      "The machine records what happened. You decide what mattered. Compile the result for any coding AI.",
    images: ["/art/experience-archive-concept.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
