'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import { IBIZA_PATH, IBIZA_PIN, IBIZA_VIEWBOX } from '@/lib/data/ibiza-path';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PIN_X = IBIZA_PIN.x;
const PIN_Y = IBIZA_PIN.y;

type Props = {
  /** Document scroll position where the trace begins (progress 0). */
  startScroll: number;
  /** Document scroll position where the trace completes (progress 1). */
  endScroll: number;
  /** Localised label rendered next to the pulsing pin. */
  pinLabel: string;
};

export function IbizaSilhouette({ startScroll, endScroll, pinLabel }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const pinGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const pinGroup = pinGroupRef.current;
    if (!path) return;

    // Manual stroke-dashoffset scrub. DrawSVG (Club) would do this with one
    // line; the public-tier equivalent is to set dasharray=length and animate
    // dashoffset from length → 0.
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    let pinShown = false;
    const trigger = ScrollTrigger.create({
      start: startScroll,
      end: endScroll,
      scrub: 1,
      onUpdate: (self) => {
        if (!path) return;
        path.style.strokeDashoffset = String(length * (1 - self.progress));
        // Pin appears once the trace is essentially complete; reverses cleanly
        // when the user scrolls back up.
        if (pinGroup) {
          const shouldShow = self.progress > 0.95;
          if (shouldShow !== pinShown) {
            pinShown = shouldShow;
            pinGroup.style.opacity = shouldShow ? '1' : '0';
          }
        }
      },
    });

    return () => trigger.kill();
  }, [startScroll, endScroll]);

  return (
    <svg
      viewBox={IBIZA_VIEWBOX}
      className="w-full max-w-[520px] h-auto"
      aria-hidden
      role="img"
    >
      <path
        ref={pathRef}
        d={IBIZA_PATH}
        stroke="#C9A86B"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <g
        ref={pinGroupRef}
        style={{ opacity: 0, transition: 'opacity 0.6s ease-out' }}
      >
        {/* Connector line from pin to label */}
        <line
          x1={PIN_X}
          y1={PIN_Y}
          x2={PIN_X + 32}
          y2={PIN_Y - 24}
          stroke="#C9A86B"
          strokeWidth={0.6}
          strokeOpacity={0.7}
        />
        {/* Label */}
        <text
          x={PIN_X + 36}
          y={PIN_Y - 28}
          fill="#F5F0E6"
          fontSize={11}
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.15em"
          style={{ textTransform: 'uppercase' }}
        >
          {pinLabel}
        </text>
        {/* Pulsing pin — wrapped in a group so the scale animation has a clean
            origin. Two concentric circles: solid core + softer halo. */}
        <g transform={`translate(${PIN_X}, ${PIN_Y})`} className="pulse-pin">
          <circle r={8} fill="#C9A86B" fillOpacity={0.25} />
          <circle r={3.5} fill="#C9A86B" />
        </g>
      </g>
    </svg>
  );
}
