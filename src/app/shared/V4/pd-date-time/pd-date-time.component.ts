import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';

/**
 * Date over time, for v4 detail panels.
 *
 * Wherever a panel shows a timestamp, the date is the first line and the time
 * sits **under** it, one step smaller and lighter. The date inherits whatever
 * size and colour the surrounding cell uses, so the same component reads
 * correctly in a `.v4-ocw-table` cell (12px main text) and in a timeline
 * timestamp — put the date's styling on the host, this only styles the time.
 *
 * A value with no time part renders the date alone; an empty value renders `—`.
 * Whatever the source format, the date is normalised to `MM/DD/YYYY`.
 *
 * @example
 * <app-pd-date-time [value]="item.date" />
 */
@Component({
  standalone: true,
  selector: 'app-pd-date-time',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="pd-date">{{ parts().date || '—' }}</span>
    @if (parts().time && showTime()) {
      <span class="pd-time">{{ parts().time }}</span>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        line-height: 1.3;
      }
      .pd-date {
        display: block;
        white-space: nowrap;
      }
      // One step down from the date in both size and weight of colour, so the
      // two lines never read as one wrapped string.
      .pd-time {
        display: block;
        margin-top: 1px;
        font-size: 10px;
        color: var(--v4-tertiary-text-color);
        white-space: nowrap;
      }
      // A struck-through host (e.g. .todo-closed) means both lines should
      // read as closed, not just the date.
      :host-context(.todo-closed) .pd-time {
        color: inherit;
        text-decoration: inherit;
      }
    `
  ]
})
export class PdDateTimeComponent {
  value = input<string | null | undefined>('');
  showTime = input<boolean>(true);
  parts = computed(() => this.splitDateTime(this.value()));

  splitDateTime(value?: string | null): {
    date: string;
    time: string;
  } {
    const raw = (value ?? '').trim();
    if (!raw) return { date: '', time: '' };

    const match = raw.match(
      /^(.*\d)(?:[\s-]+|\s*\()\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?)\)?$/i
    );
    return match
      ? { date: this.toSlashDate(match[1].trim()), time: match[2].trim() }
      : { date: this.toSlashDate(raw), time: '' };
  }

  /**
   * Any recognised date shape → `MM/DD/YYYY`; anything else is passed through
   * untouched, so an unexpected string still shows rather than turning blank.
   * String-only, no `Date` parsing: `new Date('2025-08-29')` is read as UTC and
   * would show the previous day west of Greenwich.
   */
  private toSlashDate(date: string): string {
    const pad = (n: string) => n.padStart(2, '0');

    // 2025-08-29 / 2025.08.29 / 2025/08/29
    const ymd = date.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymd) return `${pad(ymd[2])}/${pad(ymd[3])}/${ymd[1]}`;

    // 08-29-2025 / 08.29.25 / 08/29/2025
    const mdy = date.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (mdy) return `${pad(mdy[1])}/${pad(mdy[2])}/${mdy[3]}`;

    // 29 Aug 2025 / Aug 29, 2025 / August 29 2025
    const named = date.match(
      /^(?:(\d{1,2})[\s-]+([a-z]{3})[a-z]*|([a-z]{3})[a-z]*[\s-]+(\d{1,2}))[\s,-]+(\d{2,4})$/i
    );
    if (named) {
      const month = PdDateTimeComponent.MONTHS.indexOf(
        (named[2] ?? named[3]).toLowerCase()
      );
      if (month >= 0) {
        return `${pad(String(month + 1))}/${pad(named[1] ?? named[4])}/${named[5]}`;
      }
    }

    return date;
  }

  private static readonly MONTHS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec'
  ];
}
