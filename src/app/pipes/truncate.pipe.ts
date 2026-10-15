import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(text: string, length = 20, suffix = '...'): string {
    if (text?.length > length) {
      const truncated: string = text.substring(0, length).trim() + suffix;
      return truncated;
    }

    return text;
  }
}
