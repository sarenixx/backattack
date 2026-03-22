import type { Metadata } from "next";
import { Literata, Space_Grotesk } from "next/font/google";
import "./globals.css";

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BackAttack - Chair Score",
  description: "Paste your chair URL and get a back-health score with better options.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${space.variable} ${literata.variable}`}>
      <body>{children}</body>
    </html>
  );
}
