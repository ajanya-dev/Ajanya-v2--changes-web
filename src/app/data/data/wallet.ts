export class CardTimeInterval {
  static timeIntervalList(): {
    name: string;
    value: string;
    checked: boolean;
  }[] {
    return [
      {
        name: 'Per Day',
        value: 'daily',
        checked: false
      },
      {
        name: 'Per Week',
        value: 'weekly',
        checked: false
      },
      {
        name: 'Per Month',
        value: 'monthly',
        checked: false
      },
      {
        name: 'Per Year',
        value: 'yearly',
        checked: false
      },
      {
        name: 'All Time',
        value: 'allTime',
        checked: false
      },
      {
        name: 'Per Transactions',
        value: 'perTransaction',
        checked: false
      }
    ];
  }
}
