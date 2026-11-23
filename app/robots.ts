import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * `robots.txt`, generado en vez de escrito a mano.
 *
 * REVISION.md §9.6 lo marcaba como ausente: "Sin robots.txt, sin
 * sitemap.xml, sin JSON-LD." El JSON-LD y las coordenadas se arreglaron en
 * Fase 0; esto cierra el resto del hallazgo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
