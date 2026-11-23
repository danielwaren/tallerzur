import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import { SITE_TITLE, SITE_DESCRIPTION } from "@/lib/seo";
import { OG_IMAGE } from "@/lib/media";
import "./fonts.css";
import "./globals.css";

/**
 * Tipografía autoalojada.
 *
 * Antes: la identidad entera colgaba de `Iowan Old Style`, que solo existe en
 * macOS — el resto del mundo recibía Times New Roman. Y se descargaban Geist y
 * Geist Mono, que el CSS no usaba en ninguna parte.
 *
 * Fraunces (serif variable de display) e Inter (etiquetas en versalitas) se
 * sirven desde /fonts. NO se usa `next/font/google`: bajo vinext emite rutas
 * absolutas del sistema de archivos —url(C:/Users/.../.vinext/fonts/...)— en
 * el CSS del build, que jamás resuelven en producción. Verificado sobre el
 * artefacto compilado. Ver app/fonts.css.
 */

/**
 * SEO local, no genérico: el título y la descripción van en el idioma real
 * de la búsqueda ("página web para hostal en Coyhaique"), no en jerga de
 * agencia. Viven en lib/seo.ts junto al JSON-LD para que digan lo mismo.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s · TallerZur" },
  description: SITE_DESCRIPTION,
  applicationName: "TallerZur",
  authors: [{ name: "TallerZur" }],
  keywords: [
    "TallerZur", "página web Aysén", "diseño web Coyhaique", "página web Puerto Cisnes",
    "página web para hostal", "página web para cabañas", "página web para restaurante",
    "mantención de sitios web", "reservas online hostal", "SEO local Aysén", "Región de Aysén",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: "TallerZur",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: OG_IMAGE.alt, type: "image/jpeg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#090b08",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body className="antialiased">{children}</body>
    </html>
  );
}
