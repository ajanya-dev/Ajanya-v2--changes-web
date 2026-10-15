import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textMasking',
  standalone: true
})
export class TextMaskingPipe implements PipeTransform {
  transform(value: string, startIndex: number, endIndex: number): string {
    if (!value) return value;

    const { length } = value;
    const maskedPart =
      '*'.repeat(Math.max(0, startIndex)) +
      value.slice(startIndex, endIndex) +
      '*'.repeat(Math.max(0, length - endIndex));

    return maskedPart;
  }
}
