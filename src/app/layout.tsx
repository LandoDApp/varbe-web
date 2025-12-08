import type { Metadata } from "next";
import { Bangers, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Varbe - Art Marketplace",
  description: "The exclusive marketplace for verified artists.",
};

// Root layout - This should rarely be rendered as middleware redirects to [locale]
// But Next.js requires html and body tags here
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen antialiased",
          bangers.variable,
          inter.variable
        )}
        style={{ backgroundColor: '#fafafa' }}
      >
        {children}
      </body>
    </html>
  );
}
