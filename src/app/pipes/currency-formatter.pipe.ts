import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'currencyFormatter',
  standalone: true
})
export class CurrencyFormatterPipe implements PipeTransform {
  transform(value: any, excludedFormat: ['K', 'M', 'B', 'T']): string {
    let n: string;
    let isCurrency = '';

    if (value?.toString()?.includes('$')) {
      //If currency pipe applied
      n = value?.toString()?.substring(1)?.replace(/,/g, '');
      isCurrency = '$';
    } else {
      n = value;
    }

    const formatter = (n: any): string => {
      if (n < 1e3) return isCurrency + n;

      if (n >= 1e3 && n < 1e6 && !excludedFormat?.includes('K'))
        return isCurrency + (n / 1e3).toFixed(1) + 'K';

      if (n >= 1e6 && n < 1e9 && !excludedFormat?.includes('M'))
        return isCurrency + (n / 1e6).toFixed(1) + 'M';

      if (n >= 1e9 && n < 1e12 && !excludedFormat?.includes('B'))
        return isCurrency + (n / 1e9).toFixed(1) + 'B';

      if (n >= 1e12 && !excludedFormat?.includes('T'))
        return isCurrency + (n / 1e12).toFixed(1) + 'T';

      return isCurrency + n;
    };

    if (formatter(n) != 'null') {
      return formatter(n);
    } else {
      return '0';
    }
  }
}
