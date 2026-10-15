import { NgZone } from '@angular/core';

/**
 * Closes a body-appended dropdown when anything outside it scrolls, so the
 * panel never drifts away from its trigger. Scrolls inside a dropdown panel
 * are ignored, keeping infinite-scroll lists usable.
 *
 * Arms one frame late so the scroll-into-view caused by the select focusing
 * itself on open does not immediately close it.
 *
 * @returns cleanup that removes the listener.
 */
export function closeOnOutsideScroll(
  zone: NgZone,
  close: () => void
): () => void {
  const handler = (event: Event) => {
    const { target } = event;
    if (target instanceof Element && target.closest('.ng-dropdown-panel')) {
      return;
    }
    zone.run(close);
  };
  let frame: number | null = null;
  zone.runOutsideAngular(() => {
    frame = requestAnimationFrame(() => {
      frame = null;
      document.addEventListener('scroll', handler, {
        capture: true,
        passive: true
      });
    });
  });
  return () => {
    if (frame !== null) cancelAnimationFrame(frame);
    document.removeEventListener('scroll', handler, { capture: true });
  };
}
