# TallerZur

Desarrollo web, mantenimiento y servicios digitales para pymes de la Región de Aysén.

**Stack:** Astro · React · TypeScript · Tailwind CSS · GSAP · Swiper · Decap CMS

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera /dist
```

## Deploy en Vercel

1. Sube el proyecto a un repositorio de GitHub
2. En vercel.com → "Add New Project" → importa el repo
3. Vercel detecta Astro automáticamente. Deploy.

## Blog con Decap CMS (panel /admin)

Los posts viven como archivos `.md` en `src/content/blog/`. El panel en
`/admin` permite crear y editar posts desde el navegador; cada publicación
hace commit al repo y Vercel reconstruye el sitio automáticamente.

### Configuración OAuth (requisito en Vercel)

Decap necesita autenticarse con GitHub. En Vercel debes desplegar un
proveedor OAuth pequeño (5 minutos):

1. Despliega https://github.com/vencax/netlify-cms-github-oauth-provider en Vercel (o cualquier proveedor OAuth compatible con Decap)
2. En GitHub → Settings → Developer settings → OAuth Apps → crea una app:
   - Homepage URL: `https://tallerzur.cl`
   - Callback URL: `https://TU-OAUTH-PROVIDER.vercel.app/callback`
3. Agrega `OAUTH_CLIENT_ID` y `OAUTH_CLIENT_SECRET` como variables de entorno del proveedor
4. En `public/admin/config.yml` actualiza `repo` y `base_url`

### Crear un post manualmente

También puedes simplemente agregar un archivo `.md` en `src/content/blog/`
con este frontmatter:

```yaml
---
title: "Título del post"
description: "Descripción para SEO"
pubDate: 2026-06-10
service: desarrollo   # desarrollo | mantenimiento | servicios
---
```

## Pendientes antes de publicar

- [ ] Reemplazar el número de WhatsApp en `src/components/Contact.astro`
- [ ] Reemplazar imágenes del hero por fotos propias de Aysén (en `src/components/Hero.tsx`)
- [ ] Configurar dominio tallerzur.cl en Vercel
- [ ] Configurar OAuth de Decap (ver arriba)
- [ ] Agregar más proyectos al portafolio en `src/components/Portfolio.astro`
