'use client';

import gsap from 'gsap';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { useDescentStore } from '@/lib/store/descent';

const FADE_THRESHOLD = 0.05;

export function ScrollHint() {
  const t = useTranslations('home');
  const containerRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chevronRef.current) return;
    const tween = gsap.to(chevronRef.current, {
      y: 8,
      repeat: -1,
      yoyo: true,
      duration: 0.85,
      ease: 'sine.inOut',
    });
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    const apply = (progress: number) => {
      if (!containerRef.current) return;
      containerRef.current.style.opacity = progress > FADE_THRESHOLD ? '0' : '1';
    };
    apply(useDescentStore.getState().act1Progress);
    return useDescentStore.subscribe((state) => apply(state.act1Progress));
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ivory/65">
        {t('scrollHint')}
      </p>
      <svg
        ref={chevronRef}
        viewBox="0 0 24 24"
        className="h-5 w-5 text-ivory/65"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
