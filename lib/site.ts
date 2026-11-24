/**
 * Un solo lugar para el dominio del sitio: de aquí salen el canonical, el
 * sitemap, robots, Open Graph y el JSON-LD.
 *
 * Con `www` a propósito: en Vercel, tallerzur.cl redirige (308) a
 * www.tallerzur.cl. Un canonical que apunta a una URL que redirige es una
 * señal contradictoria para Google.
 */
export const SITE_URL = "https://www.tallerzur.cl";
