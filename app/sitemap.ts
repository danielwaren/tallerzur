import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Una sola URL hoy — es un sitio de una página. Si la Fase 2 de SEO agrega
 * páginas dedicadas por rubro (`/para/hostales`, `/para/restaurantes`, ver
 * la estrategia entregada), este es el archivo que crece, no uno nuevo.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
