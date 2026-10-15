import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneNumberFormatter',
  standalone: true
})
export class PhoneNumberFormatterPipe implements PipeTransform {
  transform(value?: string): string {
    // Basic formatting: (XXX) XXX-XXXX
    if (value) {
      const numericPhoneNumber = value.replace(/\D/g, '');
      const formattedNumber = numericPhoneNumber.replace(
        /(\d{3})(\d{3})(\d{4})/,
        '($1) $2-$3'
      );
      return formattedNumber;
    }
    return '';
  }
}
