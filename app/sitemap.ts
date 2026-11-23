import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Fecha de la última publicación con cambios de contenido. */
const LAST_CONTENT_UPDATE = "2026-11-23";

/**
 * Una sola URL hoy — es un sitio de una página. `lastModified` es fijo: con
 * `new Date()` cada visita de Google veía el sitio "recién cambiado" y la
 * señal perdía valor. Si la Fase 2 de SEO agrega
 * páginas dedicadas por rubro (`/para/hostales`, `/para/restaurantes`, ver
 * la estrategia entregada), este es el archivo que crece, no uno nuevo.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
