const KEYFRAMES: Keyframe[] = [
  { offset: 0, transform: 'translateX(0)' },
  { offset: 0.15, transform: 'translateX(-5px)' },
  { offset: 0.3, transform: 'translateX(4px)' },
  { offset: 0.45, transform: 'translateX(-3px)' },
  { offset: 0.6, transform: 'translateX(2px)' },
  { offset: 0.75, transform: 'translateX(-1px)' },
  { offset: 1, transform: 'translateX(0)' }
];

const OPTIONS: KeyframeAnimationOptions = {
  duration: 500,
  easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)'
};

export function shakeElement(el: HTMLElement): Animation | null {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (typeof el.animate !== 'function') return null;
  el.getAnimations?.().forEach((a) => a.cancel());
  return el.animate(KEYFRAMES, OPTIONS);
}

const FOCUSABLE =
  'input, textarea, select, button, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function focusField(el: HTMLElement): void {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = el.matches(FOCUSABLE)
    ? el
    : el.querySelector<HTMLElement>(FOCUSABLE);
  focusable?.focus({ preventScroll: true });
}
