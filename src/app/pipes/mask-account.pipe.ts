import { Pipe, PipeTransform } from '@angular/core';

/**
 * Masks an account number, revealing only the last `visibleDigits` (default 4).
 * Values with `visibleDigits` or fewer characters are returned unchanged.
 */
@Pipe({
  name: 'maskAccount',
  standalone: true
})
export class MaskAccountPipe implements PipeTransform {
  transform(value?: string | number | null, visibleDigits = 4): string {
    if (value === null || value === undefined || value === '') return '';
    const raw = String(value);
    if (raw.length <= visibleDigits) return raw;
    return `${'*'.repeat(raw.length - visibleDigits)}${raw.slice(-visibleDigits)}`;
  }
}
