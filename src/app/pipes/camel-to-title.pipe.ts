import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'camelToTitle',
  standalone: true
})
export class CamelToTitlePipe implements PipeTransform {
  transform(text: string): string {
    const result = text.replace(/([A-Z])/g, ' $1');
    const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
    return finalResult;
  }
}
