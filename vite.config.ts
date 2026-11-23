import { fileURLToPath } from "node:url";
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

/**
 * Destino del build:
 * - "cloudflare" (por defecto): dev local, `build:local`, tests y `preview`.
 * - "nitro": producción en Vercel. Se activa solo en Vercel (variable
 *   VERCEL) o con DEPLOY_TARGET=nitro. Nitro detecta el preset de Vercel y
 *   emite `.vercel/output` (Build Output API).
 */
const useNitro = process.env.DEPLOY_TARGET === "nitro" || Boolean(process.env.VERCEL);

/**
 * Redirecciones 301 del sitio Astro anterior, desde la misma fuente que usa
 * el worker de Cloudflare (lib/redirects.ts). En Vercel quedan como reglas
 * estáticas: no pasan por la función.
 */
async function legacyRouteRules() {
  const { BLOG_REDIRECTS } = await import("./lib/redirects");
  const rule = (to: string) => ({ redirect: { to, status: 301 as const } });
  // Nitro genera regex que aceptan la barra final, así que basta una clave
  // por ruta; las específicas quedan antes del comodín.
  const rules: Record<string, ReturnType<typeof rule>> = { "/blog": rule("/") };
  for (const [slug, to] of Object.entries(BLOG_REDIRECTS)) rules[`/blog/${slug}`] = rule(to);
  rules["/blog/**"] = rule("/");
  return rules;
}

export default defineConfig(async () => {
  const server = {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    ...(isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : {}),
  };

  if (useNitro) {
    const { nitro } = await import("nitro/vite");
    return {
      server,
      // En el entorno de servidor de Nitro, el resolvedor de CSS de Vite no
      // encuentra el paquete de `@import "tailwindcss"` (con Cloudflare sí).
      // Se apunta directo a su hoja; @tailwindcss/postcss la procesa igual.
      resolve: {
        alias: [{ find: /^tailwindcss$/, replacement: fileURLToPath(new URL("./node_modules/tailwindcss/index.css", import.meta.url)) }],
      },
      plugins: [vinext(), nitro({ routeRules: await legacyRouteRules() })],
    };
  }

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
