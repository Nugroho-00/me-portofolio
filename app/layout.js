import "./globals.css";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const siteUrl = "https://satrionugroho.com";
const description =
  "Satrio Nugroho is a Fullstack Developer focused on backend architecture, system integration, and reliable digital products for government, banking, healthcare, and logistics.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Satrio Nugroho",
  description,
  authors: [{ name: "Satrio Nugroho", url: siteUrl }],
  creator: "Satrio Nugroho",
  keywords: [
    "Satrio Nugroho",
    "Fullstack Developer",
    "Backend Developer",
    "Node.js",
    "NestJS",
    "Python",
    "Django",
    "System Integration",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Satrio Nugroho — Fullstack Developer",
    description: "Backend architecture, system integration, and dependable fullstack products.",
    url: "/",
    siteName: "Satrio Nugroho",
    type: "profile",
    locale: "en_US",
    images: [{ url: "/assets/images/photo.png", alt: "Satrio Nugroho" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Satrio Nugroho — Fullstack Developer",
    description: "Backend architecture, system integration, and dependable fullstack products.",
    images: ["/assets/images/photo.png"],
  },
  icons: {
    icon: "/assets/images/logo.svg",
    apple: "/assets/images/logo.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f7fa",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Satrio Nugroho",
  jobTitle: "Fullstack Developer",
  description: "Backend Development and System Integration Specialist",
  url: `${siteUrl}/`,
  image: `${siteUrl}/assets/images/photo.png`,
  sameAs: [
    "https://github.com/Nugroho-00",
    "https://www.linkedin.com/in/nugroho-satrio/",
  ],
  knowsAbout: [
    "Node.js",
    "NestJS",
    "Python",
    "Django",
    "PostgreSQL",
    "Backend Development",
    "API Development",
    "System Integration",
  ],
  workLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Jakarta",
      addressCountry: "Indonesia",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${ibmPlexMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
