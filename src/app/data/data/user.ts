import { IconProp } from '@fortawesome/fontawesome-svg-core';

export class UserManagment {
  static filterUserAcitivity(): {
    id: 'list' | 'date';
    title: string;
    img: string;
    icon: IconProp;
    tooltip: string;
  }[] {
    return [
      {
        id: 'list',
        title: 'Listwise',
        img: '../../../../assets/images/filter-icon.svg',
        icon: ['fas', 'filter'],
        tooltip: 'Switch to Feature Wise'
      },
      {
        id: 'date',
        title: 'Datewise',
        img: '../../../../assets/images/calendar-icon.svg',
        icon: ['fas', 'calendar-days'],
        tooltip: 'Switch to Date Wise'
      }
    ];
  }
}
