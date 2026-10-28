import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, Work_Sans } from "next/font/google";
import Script from "next/script";
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { ThemeProvider } from '@/components/common/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import "./globals.css";

// The type of sagyamthapa.com.np: Work Sans for text, Space Grotesk for headings, JetBrains Mono for commands.
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('http://linite.sagyamthapa.com.np'),
  title: {
    default: "Linite - Bulk Linux Package Installer",
    template: "%s | Linite",
  },
  description: "Select apps from our curated catalog and generate a single command to install everything on your Linux distribution. Supports apt, dnf, pacman, Flatpak, Snap, and more.",
  keywords: [
    "linux",
    "package installer",
    "bulk install",
    "linux apps",
    "apt",
    "dnf",
    "pacman",
    "flatpak",
    "snap",
    "ubuntu",
    "fedora",
    "arch linux",
    "debian",
    "linux distro",
    "package manager",
  ],
  authors: [{ name: "Sagyam Thapa" }],
  creator: "Sagyam Thapa",
  publisher: "Linite",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Linite - Bulk Linux Package Installer",
    description: "Select apps from our curated catalog and generate a single command to install everything on your Linux distribution.",
    siteName: "Linite",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Linite - Bulk Linux Package Installer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Linite - Bulk Linux Package Installer",
    description: "Select apps from our curated catalog and generate a single command to install everything on your Linux distribution.",
    images: ["/opengraph-image"],
    creator: "@linite",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export const runtime = 'nodejs';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script
          defer
          src="/stats/script.js"
          data-website-id="bfb4175b-5ce9-4a4d-aa0f-c44314ad6a8b"
          strategy="afterInteractive"
        />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              {children}
              <Toaster />
            </ErrorBoundary>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
