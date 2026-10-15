import { ICellRendererParams } from '@ag-grid-community/core';

/**
 * Date over time, matching the Updated/Created Date columns in Payments Out.
 *
 * The v4-created-at/v4-updated-at cell components render the same thing, but
 * they split a single backend string on '-' via Utils.splitDate and read a
 * fixed row key, so they only suit endpoints shaped that way. Columns that
 * format the value themselves (DatePipe) or get it space-separated use these.
 */
export function stackedDateTimeHtml(date: string, time = ''): string {
  if (!date) {
    return '';
  }
  return `
    <div style="display:flex;flex-direction:column;gap:1px;line-height:1.25;white-space:nowrap">
      <span>${date}</span>
      ${
        time
          ? `<span style="font-size:10px;color:var(--v4-secondary-text-color)">${time}</span>`
          : ''
      }
    </div>
  `;
}

/**
 * cellRenderer for columns whose value arrives as one space-separated
 * "MM/DD/YYYY hh:mm am" string.
 */
export function renderStackedDateTime(params: ICellRendererParams): string {
  const value = params.value?.toString();
  if (!value) {
    return '';
  }
  const [date, ...rest] = value.split(' ');
  return stackedDateTimeHtml(date, rest.join(' '));
}
