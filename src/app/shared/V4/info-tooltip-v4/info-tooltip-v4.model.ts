/** A `label: value` line inside the tooltip body (e.g. "ACH  1-3 business days"). */
export interface IInfoTooltipV4Row {
  label: string;
  value: string;
}

/** Highlighted footer note, optionally prefixed with a lucide icon. */
export interface IInfoTooltipV4Note {
  /** Lucide icon name, e.g. 'clock'. Omit for a text-only note. */
  icon?: string;
  /** Each entry renders on its own line. */
  lines: string[];
}

/**
 * Content of the tooltip panel. Sections render in this order and any of them
 * can be omitted: title -> description -> bullets -> rows -> note.
 */
export interface IInfoTooltipV4Content {
  title?: string;
  description?: string;
  bullets?: string[];
  rows?: IInfoTooltipV4Row[];
  note?: IInfoTooltipV4Note;
}

/** Which part of the trigger the panel lines up with. */
export type TInfoTooltipV4Align = 'left' | 'center' | 'right';
