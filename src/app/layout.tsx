import type { Metadata } from "next";
import {Space_Grotesk, Work_Sans, Geist_Mono} from "next/font/google";
import Script from "next/script";
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import "./globals.css";

const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-sans'});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

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
    apple: '/logo.svg',
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
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body
        className={`${workSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="/api/umami-script"
          data-website-id="bfb4175b-5ce9-4a4d-aa0f-c44314ad6a8b"
          data-host-url="https://linite.sagyamthapa.com.np"
          data-endpoint="/api/umami-collect"
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
