export function Preloader() {
  // Step 3 will replace this with a real preloader bound to <useProgress /> from drei
  // and a DrawSVG gold-line progress bar (DrawSVG requires GSAP Club — TODO).
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ivory">
      <span className="font-display text-deep text-[8vw] font-light tracking-[-0.02em]">
        The Boat House
      </span>
    </div>
  );
}
