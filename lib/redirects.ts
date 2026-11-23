/**
 * Redirecciones 301 desde las URLs del sitio anterior (Astro, /tallerzur).
 *
 * Van en el worker (worker/index.ts) y no en `next.config` porque vinext, en
 * producción, responde `permanent: true` con 308 e ignora `statusCode`. Google
 * trata 308 y 301 igual, pero se pidió 301 explícito y así queda.
 *
 * Cada artículo del blog viejo apunta a la sección más cercana del sitio
 * nuevo (la mantención vive en la tarjeta 02 de servicios). Cualquier otra URL bajo /blog va al inicio: mejor que un 404.
 */
export const BLOG_REDIRECTS: Record<string, string> = {
  "cuanto-cuesta-pagina-web-aysen": "/#preguntas",
  "por-que-tu-sitio-necesita-mantenimiento": "/#servicios",
  "5-herramientas-web-hostal-restaurante": "/#servicios",
  "seo-local-como-aparecer-en-google": "/#servicios",
  "velocidad-web-patagonia": "/#preguntas",
  "whatsapp-business-vs-pagina-web": "/#preguntas",
};

/** Destino de una URL vieja, o `null` si la URL es del sitio nuevo. */
export function legacyRedirect(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  if (path === "/blog") return "/";
  const article = path.match(/^\/blog\/([^/]+)$/);
  if (article) return BLOG_REDIRECTS[decodeURIComponent(article[1])] ?? "/";
  if (path.startsWith("/blog/")) return "/";
  return null;
}
