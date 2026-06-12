import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

export default function ScrollFX() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    const ctx = gsap.context(() => {

      // ── Standard reveal (y + opacity) ──────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      // ── Staggered children reveal ───────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((parent) => {
        const children = parent.children;
        gsap.from(children, {
          y: 50,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: parent, start: 'top 85%' },
        });
      });

      // ── Horizontal line draws ───────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-line]').forEach((el) => {
        gsap.from(el, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.4,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: el, start: 'top 90%' },
        });
      });

      // ── Animated counter numbers ────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const target = parseInt(el.getAttribute('data-count') || '0', 10);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 80%' },
          onUpdate: () => {
            el.textContent = Math.round(obj.val).toString();
          },
        });
      });

      // ── Large headline word-by-word reveal ─────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-words]').forEach((el) => {
        const text = el.textContent || '';
        const words = text.split(' ');
        el.innerHTML = words
          .map(w => `<span class="inline-block overflow-hidden"><span class="inline-block word-inner">${w}</span></span>`)
          .join(' ');
        gsap.from(el.querySelectorAll('.word-inner'), {
          y: '110%',
          opacity: 0,
          duration: 0.8,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });

      // ── Parallax on images ──────────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-parallax') || '0.3');
        gsap.to(el, {
          yPercent: speed * -40,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });

      // ── Horizontal ticker (infinite scroll) ────────────────────────────────
      const ticker = document.querySelector<HTMLElement>('[data-ticker]');
      if (ticker) {
        const track = ticker.querySelector<HTMLElement>('[data-ticker-track]');
        if (track) {
          const clone = track.cloneNode(true) as HTMLElement;
          ticker.appendChild(clone);
          gsap.to([track, clone], {
            xPercent: -100,
            repeat: -1,
            duration: 22,
            ease: 'none',
          });
          ticker.addEventListener('mouseenter', () => gsap.globalTimeline.timeScale(0.3));
          ticker.addEventListener('mouseleave', () => gsap.globalTimeline.timeScale(1));
        }
      }

      // ── Magnetic CTA buttons ────────────────────────────────────────────────
      document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
        const inner = btn.querySelector<HTMLElement>('[data-magnetic-inner]') || btn;
        const strength = 0.35;
        btn.addEventListener('mousemove', (e: MouseEvent) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - (rect.left + rect.width / 2);
          const y = e.clientY - (rect.top + rect.height / 2);
          gsap.to(inner, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(inner, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
        });
      });

      // ── Scale-in cards ──────────────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-scale-in]').forEach((el, i) => {
        gsap.from(el, {
          scale: 0.88,
          opacity: 0,
          duration: 0.9,
          delay: i * 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      // ── Clip-path reveal (wipe up) ──────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-wipe]').forEach((el) => {
        gsap.from(el, {
          clipPath: 'inset(100% 0% 0% 0%)',
          duration: 1.1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });

      // ── Section background fade ─────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-bg-reveal]').forEach((el) => {
        gsap.from(el, {
          backgroundColor: 'transparent',
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 80%' },
        });
      });

    });

    return () => ctx.revert();
  }, []);

  return null;
}
