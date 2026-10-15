import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from '../data/utils';

@Pipe({
  name: 'moveSelectedToTop',
  standalone: true
})
export class MoveSelectedToTopPipe<T> implements PipeTransform {
  transform(value: T[], selectedBankAccount: T, searchInput: string): T[] {
    if (selectedBankAccount) {
      const index = value.findIndex((account) =>
        Utils.areObjectsEqual(account, selectedBankAccount)
      );
      if (index !== -1) {
        value.splice(index, 1);
        value.unshift(selectedBankAccount);
      } else if (index === -1 && searchInput === '') {
        value.unshift(selectedBankAccount);
      }
    }
    return value;
  }
}
