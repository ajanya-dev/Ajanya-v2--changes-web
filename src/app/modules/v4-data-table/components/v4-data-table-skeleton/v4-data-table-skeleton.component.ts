import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type TSkeletonCellKind =
  | 'check'
  | 'action'
  | 'avatar'
  | 'pill'
  | 'date'
  | 'text';

export interface ISkeletonColumn {
  label: string;
  /** Column width in px (mirrors the real column rhythm). */
  width: number;
  kind: TSkeletonCellKind;
  /** Frozen column side, mirroring the grid's pinning. */
  pinned?: 'left' | 'right' | null;
  /** Sticky offset (px) from the left edge for left-pinned columns. */
  stickyLeft?: number;
  /** Sticky offset (px) from the right edge for right-pinned columns. */
  stickyRight?: number;
  /** The last left-pinned / first right-pinned column carries the edge shadow. */
  pinEdge?: boolean;
}

/**
 * Loading skeleton for v4 data tables (design O18). Renders the real column
 * headers + a placeholder filter row, then N shimmer rows mirroring the column
 * rhythm, a 3px indeterminate bar, and a "Loading…" footer in place of the pager.
 * Shown while the first page of rows is still pending so the chrome never flashes.
 */
@Component({
  standalone: true,
  selector: 'app-v4-data-table-skeleton',
  imports: [LucideAngularModule],
  templateUrl: './v4-data-table-skeleton.component.html',
  styleUrls: ['./v4-data-table-skeleton.component.scss']
})
export class V4DataTableSkeletonComponent {
  columns = input<ISkeletonColumn[]>([]);
  rowCount = input<number>(12);
  /** Body row height in px — mirrors the real grid's rowHeight. */
  rowHeight = input<number>(44);
  /** Compact tables shrink the header font (9.5px) — mirror that. */
  compact = input<boolean>(false);
  loadingText = input<string>('Loading…');

  rows = computed(() => Array.from({ length: this.rowCount() }, (_, i) => i));

  /** Deterministic per-cell bar width so the rhythm looks organic, not uniform. */
  barWidth(rowIndex: number, colIndex: number): number {
    return 50 + ((rowIndex * 7 + colIndex * 13) % 4) * 12; // 50–86%
  }
}
