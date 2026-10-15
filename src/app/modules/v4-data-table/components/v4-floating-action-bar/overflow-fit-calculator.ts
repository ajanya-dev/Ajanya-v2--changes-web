export interface FitOptions {
  /** Horizontal gap between adjacent buttons, in px. */
  gap?: number;
  /** Width reserved for the trailing "More" trigger, in px. */
  overflowTriggerWidth?: number;
}

/**
 * Decides how many buttons fit in `available` px.
 * Returns `null` when every button fits, otherwise the count to render inline;
 * the remainder belongs in the overflow menu.
 */
export function fitButtons(
  widths: number[],
  available: number,
  { gap = 8, overflowTriggerWidth = 76 }: FitOptions = {}
): number | null {
  const total = widths.reduce((sum, w, i) => sum + w + (i ? gap : 0), 0);
  if (total <= available) return null;

  let used = 0;
  let count = 0;
  for (let i = 0; i < widths.length; i += 1) {
    const w = widths[i] + (i ? gap : 0);
    if (used + w + overflowTriggerWidth > available) break;
    used += w;
    count += 1;
  }
  return count;
}
