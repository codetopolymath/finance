import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

/** Fades + rises direct children marked `data-fade-item` in on mount (and
 * whenever `deps` changes, e.g. a tab switch) — one small orchestrated
 * moment instead of an instant swap. No-ops under prefers-reduced-motion. */
export function useFadeInStagger<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-fade-item]', {
          autoAlpha: 0,
          y: 10,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.06,
        })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: deps },
  )

  return ref
}
