import { useEffect, useState } from 'react';

export type ViewportFlags = { phone: boolean; narrow: boolean };

/**
 * useViewport — mirrors the redesign spec's two breakpoints:
 *  - `phone`:  viewport width < 700px  (single column, smaller paddings)
 *  - `narrow`: viewport width < 1040px (sidebar auto-collapses, 2-col -> 1-col)
 */
export function useViewport(): ViewportFlags {
  const [flags, setFlags] = useState<ViewportFlags>(() => {
    if (typeof window === 'undefined') return { phone: false, narrow: false };
    const w = window.innerWidth;
    return { phone: w < 700, narrow: w < 1040 };
  });

  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      const phone = w < 700;
      const narrow = w < 1040;
      setFlags((prev) => (prev.phone === phone && prev.narrow === narrow ? prev : { phone, narrow }));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return flags;
}
