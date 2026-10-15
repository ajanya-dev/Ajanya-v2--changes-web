/* eslint-disable no-param-reassign */
import { Pipe, PipeTransform } from '@angular/core';

const timeDivisions = {
  YEAR: 31536000,
  MONTH: 2592000,
  DAY: 86400,
  HOUR: 3600,
  MINUTE: 60
} as const;

@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: false
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: Date) {
    if (!(value instanceof Date)) value = new Date(value);

    const seconds: number = Math.floor(
      (new Date().getTime() - value.getTime()) / 1000
    );

    let interval: number = Math.floor(seconds / timeDivisions.YEAR);
    if (interval >= 1)
      return `${interval} ${interval === 1 ? 'year' : 'years'} ago`;

    interval = Math.floor(seconds / timeDivisions.MONTH);
    if (interval >= 1)
      return `${interval} ${interval === 1 ? 'month' : 'months'} ago`;

    interval = Math.floor(seconds / timeDivisions.DAY);
    if (interval >= 1)
      return `${interval} ${interval === 1 ? 'day' : 'days'} ago`;

    interval = Math.floor(seconds / timeDivisions.HOUR);
    if (interval >= 1)
      return `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;

    interval = Math.floor(seconds / timeDivisions.MINUTE);
    if (interval >= 1)
      return `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;

    return `few seconds ago`;
  }
}
