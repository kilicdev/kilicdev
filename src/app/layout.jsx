import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://kilicdev.com"),
  title: {
    default: "kilicdev — Software Architect & Live GitHub Telemetry",
    template: "%s | kilicdev",
  },
  description:
    "Official portfolio & live GitHub telemetry dashboard of Kılıç Sarsılmaz (kilicdev) — Software Architect & Senior Full Stack Engineer. Specializing in high-performance backend architectures, microservices, and web platforms.",
  keywords: [
    "kilicdev",
    "Kılıç Sarsılmaz",
    "Software Architect",
    "Senior Full Stack Engineer",
    "GitHub Telemetry",
    "React",
    "Next.js",
    "Node.js",
    "TypeScript",
    "Distributed Systems",
    "Software Engineer Portfolio",
  ],
  authors: [{ name: "Kılıç Sarsılmaz", url: "https://kilicdev.com" }],
  creator: "Kılıç Sarsılmaz",
  publisher: "kilicdev",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://kilicdev.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kilicdev.com",
    siteName: "kilicdev",
    title: "kilicdev — Software Architect & Live Telemetry Dashboard",
    description:
      "Explore live GitHub commit telemetry, active repository activity streams, and software architecture portfolio of Kılıç Sarsılmaz.",
    images: [
      {
        url: "https://kilicdev.com/libs/readme-stats.svg",
        width: 1280,
        height: 860,
        alt: "kilicdev GitHub Activity Telemetry Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "kilicdev — Software Architect & Live Telemetry Dashboard",
    description:
      "Software Architect & Senior Full Stack Engineer. Live commit telemetry and software engineering portfolio.",
    images: ["https://kilicdev.com/libs/readme-stats.svg"],
    creator: "@kilicdev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/libs/kilic.png",
    shortcut: "/libs/kilic.png",
    apple: "/libs/kilic.png",
  },
};

export const viewport = {
  themeColor: "#080811",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Kılıç Sarsılmaz",
    alternateName: "kilicdev",
    url: "https://kilicdev.com",
    image: "https://kilicdev.com/libs/kilic.png",
    jobTitle: "Software Architect & Senior Full Stack Engineer",
    worksFor: {
      "@type": "Organization",
      name: "kilicdev Labs",
    },
    sameAs: [
      "https://github.com/kilicdev",
    ],
    knowsAbout: [
      "Software Architecture",
      "Full Stack Development",
      "React",
      "Next.js",
      "Node.js",
      "TypeScript",
      "Distributed Systems",
      "Microservices",
      "Database Systems",
    ],
    description:
      "Software Architect & Senior Full Stack Engineer crafting high-performance systems and live telemetry platforms.",
  };

  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${jetbrainsMono.variable} ${plusJakartaSans.variable} font-sans bg-[#080811] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
