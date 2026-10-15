import { Injectable, Pipe, PipeTransform } from '@angular/core';

export type SortOrder = 'asc' | 'desc';

@Injectable()
@Pipe({
  name: 'sort',
  standalone: true
})
export class SortPipe implements PipeTransform {
  transform(
    value: any[],
    sortOrder: SortOrder,
    sortKey?: string
  ): string[] | number[] {
    sortOrder = sortOrder && (sortOrder.toLowerCase() as any);

    if (!value || (sortOrder !== 'asc' && sortOrder !== 'desc')) return value;

    let numberArray = [];
    let stringArray = [];

    if (!sortKey) {
      numberArray = value.filter((item) => typeof item === 'number').sort();
      stringArray = value.filter((item) => typeof item === 'string').sort();
    } else {
      numberArray = value
        .filter((item) => typeof item[sortKey] === 'number')
        .sort((a, b) => a[sortKey] - b[sortKey]);
      stringArray = value
        .filter((item) => typeof item[sortKey] === 'string')
        .sort((a, b) => {
          if (a[sortKey].toLowerCase() < b[sortKey].toLowerCase()) return -1;
          else if (a[sortKey].toLowerCase() > b[sortKey].toLowerCase())
            return 1;
          else return 0;
        });
    }
    const sorted = numberArray.concat(stringArray);
    return sortOrder === 'asc' ? sorted : sorted.reverse();
  }
}
