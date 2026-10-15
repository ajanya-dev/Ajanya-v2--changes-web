import type { Column, ILoadingOverlayParams } from '@ag-grid-community/core';

/**
 * Loading skeleton for every v4 ag-grid table.
 */

type TSkeletonKind = 'check' | 'pill' | 'date' | 'text';

/** Text-bar widths (%) cycled per row so the rhythm reads organic, not uniform. */
const TEXT_WIDTHS = [
  [58, 82, 46, 70, 62, 88],
  [76, 54, 68, 90, 44, 64],
  [48, 70, 86, 56, 78, 52],
  [84, 62, 52, 74, 66, 46]
];

export interface IV4TableSkeletonOverlayParams {
  /** Body row height in px — pass the grid's own `rowHeight`. */
  rowHeight?: number;
  /** How many shimmer rows to paint. */
  rowCount?: number;
}

type TParams = ILoadingOverlayParams & IV4TableSkeletonOverlayParams;

/** Which placeholder shape a column gets, inferred from its own colDef. */
function kindOf(col: Column): TSkeletonKind {
  const def = col.getColDef();
  if (def.checkboxSelection || def.headerCheckboxSelection) return 'check';
  const id = col.getColId().toLowerCase();
  if (id === 'id' || id === 'checkbox' || id === 'select') return 'check';
  const key = `${def.field ?? id} ${def.headerName ?? ''}`.toLowerCase();
  if (/status|\btype\b/.test(key)) return 'pill';
  if (/date|_at\b/.test(key)) return 'date';
  return 'text';
}

/**
 * Placeholder markup for the kinds that never vary by row — built once at module
 * load. Inlining these in `cellHtml` re-created all four strings on every call,
 * only to throw away three of them.
 */
const STATIC_INNER: Record<Exclude<TSkeletonKind, 'text'>, string> = {
  check: '<i class="dt-pulse dt-skel-check"></i>',
  pill: '<i class="dt-pulse dt-skel-pill"></i>',
  date:
    '<span class="dt-skel-stack">' +
    '<i class="dt-pulse" style="width:66%"></i>' +
    '<i class="dt-pulse dt-skel-sub" style="width:42%"></i>' +
    '</span>'
};

function cellHtml(
  kind: TSkeletonKind,
  width: number,
  textWidth: number
): string {
  const inner =
    kind === 'text'
      ? `<i class="dt-pulse dt-skel-line" style="width:${textWidth}%"></i>`
      : STATIC_INNER[kind];
  const justify = kind === 'check' ? ';justify-content:end' : '';
  return `<span class="dt-skel-cell dt-skel-${kind}" style="width:${width}px${justify}">${inner}</span>`;
}

export class V4TableSkeletonOverlay {
  private eGui = document.createElement('div');

  init(params: TParams): void {
    const rowHeight = params.rowHeight ?? 44;
    const rowCount = params.rowCount ?? 12;
    const { api } = params;

    // Display order straight from the grid: pinned-left, centre, pinned-right.
    const sections: { cls: string; cols: Column[] }[] = [
      { cls: 'dt-skel-pin-l', cols: api?.getDisplayedLeftColumns?.() ?? [] },
      { cls: 'dt-skel-mid', cols: api?.getDisplayedCenterColumns?.() ?? [] },
      { cls: 'dt-skel-pin-r', cols: api?.getDisplayedRightColumns?.() ?? [] }
    ].filter((s) => s.cols.length);

    // Per-column constants. Kind and width are identical on every row, so read
    // them once here rather than re-deriving them inside the row loop — that was
    // rowCount × columns calls to getActualWidth() for rowCount identical answers.
    const kinds = sections.map((s) => s.cols.map(kindOf));
    const colWidths = sections.map((s) =>
      s.cols.map((c) => Math.round(c.getActualWidth()))
    );
    // Running column index per section, so the width pattern keeps advancing
    // across the section boundaries rather than restarting at each one.
    const colOffsets = sections.map((_, i) =>
      sections.slice(0, i).reduce((n, s) => n + s.cols.length, 0)
    );

    // A row's cells depend only on `r % TEXT_WIDTHS.length`, so serialise that
    // many bodies and reuse the strings. At the caller's 20-row cap this builds
    // 4 bodies instead of 20 — the row wrapper below still varies per row, which
    // is what carries the staggered sweep delay.
    const bodies = TEXT_WIDTHS.map((textWidths) =>
      sections
        .map((section, si) => {
          const cells = section.cols
            .map((_, i) =>
              cellHtml(
                kinds[si][i],
                colWidths[si][i],
                textWidths[(colOffsets[si] + i) % textWidths.length]
              )
            )
            .join('');
          return `<span class="dt-skel-sec ${section.cls}">${cells}</span>`;
        })
        .join('')
    );

    const rows: string[] = [];
    for (let r = 0; r < rowCount; r += 1) {
      // Staggered sweep so the shimmer reads as a wave down the table.
      rows.push(
        `<div class="dt-skel-row" style="height:${rowHeight}px;--dt-skel-delay:${
          (r % 8) * 70
        }ms">${bodies[r % bodies.length]}</div>`
      );
    }

    this.eGui.className = 'dt-skel';
    this.eGui.setAttribute('role', 'status');
    this.eGui.setAttribute('aria-label', 'Loading rows');
    this.eGui.innerHTML = `<div class="dt-skel-bar" aria-hidden="true"><span></span></div>${rows.join(
      ''
    )}`;

    // The offset that drops the skeleton below the real header is pure CSS —
    // see `.dt-skel` in ag-theme-v4.scss. It used to be measured here in a rAF
    // via `header.offsetHeight`, which forced a synchronous layout of the
    // just-inserted skeleton on every single refresh.
  }

  getGui(): HTMLElement {
    return this.eGui;
  }
}
