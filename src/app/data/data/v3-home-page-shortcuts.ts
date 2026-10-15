export const v3HomeSubSidebarItems: ISubSideBarItem[] = [
  {
    label: 'Check',
    route: '/manage/payments/main/pay/bankaccount/check',
    fontawsomeIcon: 'fa-sharp fa-solid fa-money-check',
    enabled: true,
    id: 'check'
  },
  {
    label: 'Bill',
    fontawsomeIcon: 'fa-solid fa-file-invoice',
    enabled: true,
    id: 'bill'
  },
  {
    label: 'Invoice',
    fontawsomeIcon: 'fa-solid fa-file-invoice',
    enabled: false,
    id: 'invoice'
  },
  {
    label: 'Bank',
    route: '/manage/users/add-bank-account',
    fontawsomeIcon: 'fa-solid fa-building-columns',
    enabled: false,
    id: 'bank'
  },
  {
    label: 'Payee',
    fontawsomeIcon: 'fa-solid fa-user',
    enabled: false,
    id: 'payee'
  }
  // {
  //   label: 'Check Draft',
  //   route: '/manage/checkdraft/index',
  //   fontawsomeIcon: 'fa-solid fa-money-check-dollar',
  //   enabled: false,
  //   id: 'draft',
  // },
];

export const v3ShortCutModaleData: ISubSideBarItem[] = [
  {
    label: 'Check',
    fontawsomeIcon: 'fa-sharp fa-solid fa-money-check',
    enabled: true,
    id: 'check'
  },
  {
    label: 'Bill',
    fontawsomeIcon: 'fa-solid fa-file-invoice',
    enabled: true,
    id: 'bill'
  },
  {
    label: 'Invoice',
    fontawsomeIcon: 'fa-solid fa-file-invoice',
    enabled: false,
    id: 'invoice'
  },
  {
    label: 'Bank',
    fontawsomeIcon: 'fa-solid fa-building-columns',
    enabled: false,
    id: 'bank'
  },
  {
    label: 'Payee',
    fontawsomeIcon: 'fa-solid fa-user',
    enabled: false,
    id: 'payee'
  }
  // {
  //   label: 'Check Draft',
  //   route: '/manage/checkdraft/index',
  //   fontawsomeIcon: 'fa-solid fa-money-check-dollar',
  //   enabled: false,
  //   id: 'draft',
  // },
];

export interface ISubSideBarItem {
  label: string;
  fontawsomeIcon?: string;
  route?: string;
  enabled: boolean;
  id: string;
}
