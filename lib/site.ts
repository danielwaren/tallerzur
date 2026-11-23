/**
 * Un solo lugar para el dominio del sitio.
 *
 * Antes vivía duplicado en `app/layout.tsx` y `app/page.tsx` — dos
 * constantes con el mismo valor a mano, la clase de duplicación que se
 * desincroniza el día que alguien cambia una y olvida la otra.
 *
 * TODO: confirmar que este proyecto reemplaza a tallerzur.cl (hoy Astro en
 * Vercel, ver /tallerzur) antes de que el DNS apunte de verdad acá.
 */
export const SITE_URL = "https://tallerzur.cl";
