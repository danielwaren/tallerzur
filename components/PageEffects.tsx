"use client";

import { useEffect } from "react";
import { onFirstInteraction } from "@/lib/idle";

/**
 * Efectos de scroll de la página. No dibuja nada: solo engancha GSAP y las
 * apariciones suaves sobre el HTML que ya llegó del servidor. Si este JS no
 * carga, la página se ve completa y estática.
 */
export default function PageEffects() {
  /**
   * Apariciones suaves de los bloques comerciales. La clase `js-reveal` solo
   * se pone con JS y sin reduced-motion: sin ella, todo está visible desde el
   * primer pintado.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    // Lo que ya está en pantalla al cargar no se esconde.
    const fold = window.innerHeight;
    items.forEach((item) => {
      if (item.getBoundingClientRect().top < fold) item.classList.add("is-in");
      else observer.observe(item);
    });
    root.classList.add("js-reveal");
    return () => { observer.disconnect(); root.classList.remove("js-reveal"); };
  }, []);

  /**
   * Red de seguridad del apilado: si en esta pantalla alguna tarjeta no cabe
   * entera (su contenido desborda), se apaga el sticky y las tarjetas fluyen
   * una tras otra. Se revisa al cargar, cuando llegan las fuentes (cambian la
   * altura del texto) y al cambiar el tamaño de la ventana.
   */
  useEffect(() => {
    // Cada lista (servicios, proyectos) se revisa por separado.
    const stacks = [...document.querySelectorAll<HTMLElement>(".projects-stack")];
    if (!stacks.length) return;
    let timer = 0;
    const check = () => stacks.forEach((stack) => {
      stack.classList.remove("stack-off");
      const panels = [...stack.querySelectorAll<HTMLElement>(".project-panel")];
      if (!panels.length || getComputedStyle(panels[0]).position !== "sticky") return;
      const overflows = panels.some((panel) => {
        const inner = panel.querySelector<HTMLElement>(".project-inner");
        const copy = panel.querySelector<HTMLElement>(".project-copy");
        if (!inner || !copy) return false;
        // offsetTop/offsetHeight ignoran los transforms de GSAP (scrollHeight
        // no). En escritorio el texto va alineado abajo y, si no cabe,
        // desborda hacia arriba (offsetTop negativo); en el celular empuja
        // hacia abajo.
        return copy.offsetTop < -1 || copy.offsetTop + copy.offsetHeight > inner.clientHeight + 1;
      });
      stack.classList.toggle("stack-off", overflows);
    });
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(check, 150); };
    check();
    void document.fonts?.ready.then(check);
    window.addEventListener("resize", onResize);
    return () => { window.clearTimeout(timer); window.removeEventListener("resize", onResize); };
  }, []);

  /**
   * Scrubs con GSAP solo si el usuario no pidió menos movimiento, y recién en
   * la primera interacción (scroll, toque, tecla): los scrubs solo existen al
   * desplazarse, y en la posición inicial la página se ve idéntica con o sin
   * GSAP. Así sus ~110 KB no compiten con la carga.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let revert: (() => void) | null = null;

    const cancelStart = onFirstInteraction(() => {
      void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
        .then(([gsapModule, scrollModule]) => {
          if (cancelled) return;
          const gsap = gsapModule.gsap;
          const ScrollTrigger = scrollModule.ScrollTrigger;
          gsap.registerPlugin(ScrollTrigger);
          const ctx = gsap.context(() => {
            const hero = gsap.timeline({
              scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 },
            });
            hero
              .fromTo(".hero-image", { scale: 1.1, yPercent: -3 }, { scale: 1.02, yPercent: 5, duration: 1, ease: "none" }, 0)
              .to(".hero-copy", { yPercent: -10, opacity: 0, duration: .45, ease: "power1.in" }, .3)
              .to(".hero-bottom", { opacity: 0, y: -20, duration: .3, ease: "power1.in" }, .2)
              .to(".hero-dark", { opacity: .85, duration: .6, ease: "none" }, .4);

            /**
             * Tarjetas apiladas de servicios. Solo transform y opacity (se
             * componen en GPU, sin repintar):
             * - al entrar, la foto se abre desde un leve zoom y el texto sube
             *   en cascada;
             * - mientras la siguiente se desliza encima, la anterior se
             *   encoge desde arriba y se oscurece, como un mazo.
             */
            gsap.utils.toArray<HTMLElement>(".projects-stack").forEach((stack) => {
            const panels = gsap.utils.toArray<HTMLElement>(stack.querySelectorAll(".project-panel"));
            if (!panels.length) return;
            // Punto donde se fija cada tarjeta (bajo el header). Si no hay
            // apilado (pantalla baja), la referencia es el borde superior.
            const stickAt = () => {
              const top = parseFloat(getComputedStyle(panels[0]).top);
              return Number.isFinite(top) && getComputedStyle(panels[0]).position === "sticky" ? top : 0;
            };
            panels.forEach((panel, index) => {
              // Las capturas de proyectos no llevan parallax: se recortaría
              // la parte de arriba del sitio, que es la que importa.
              const isShot = panel.classList.contains("project-work");
              const media = panel.querySelector(".project-media");
              gsap.fromTo(media, { scale: .93, y: 36 }, {
                scale: 1, y: 0, ease: "none",
                scrollTrigger: { trigger: panel, start: "top bottom", end: () => `top ${stickAt() + 40}px`, scrub: .5 },
              });
              gsap.fromTo(panel.querySelector(".project-media img"), isShot ? { scale: 1.08 } : { scale: 1.18, yPercent: -5 }, {
                ...(isShot ? { scale: 1 } : { scale: 1.04, yPercent: 4 }), ease: "none",
                scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: .6 },
              });
              gsap.fromTo(panel.querySelectorAll(".project-copy > *"), { y: 28, opacity: 0 }, {
                y: 0, opacity: 1, stagger: .08, ease: "power2.out",
                scrollTrigger: { trigger: panel, start: "top 85%", end: () => `top ${stickAt() + 120}px`, scrub: .5 },
              });
              if (index < panels.length - 1) {
                const next = panels[index + 1];
                const behind = { trigger: next, start: "top bottom", end: () => `top ${stickAt()}px`, scrub: .5 };
                gsap.fromTo(panel.querySelector(".project-inner"), { scale: 1 }, {
                  scale: .9, ease: "none", scrollTrigger: behind,
                });
                gsap.fromTo(panel.querySelector(".project-shade"), { opacity: 0 }, {
                  opacity: .55, ease: "none", scrollTrigger: { ...behind },
                });
              }
            });
            });

            gsap.timeline({
              scrollTrigger: { trigger: ".company", start: "top bottom", end: "bottom bottom", scrub: .7 },
            })
              .fromTo(".company-bg", { opacity: .2, scale: 1.04 }, { opacity: 1, scale: 1, ease: "none" }, 0)
              .fromTo(".company-bg img", { scale: 1.12, yPercent: -5 }, { scale: 1.02, yPercent: 3, ease: "none" }, 0)
              .fromTo(".company-title", { yPercent: 18 }, { yPercent: 0, ease: "power2.out" }, 0);
          }, document.querySelector(".site") ?? undefined);
          revert = () => ctx.revert();
        })
        .catch(() => {
          // Si el chunk de GSAP no carga, el sitio se queda estático pero entero.
          document.documentElement.classList.add("motion-unavailable");
        });
    });

    return () => { cancelled = true; cancelStart(); revert?.(); };
  }, []);

  return null;
}
