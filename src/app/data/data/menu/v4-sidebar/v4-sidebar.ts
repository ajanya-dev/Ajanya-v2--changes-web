import { IconName } from '@fortawesome/fontawesome-svg-core';

export interface IV4MenuItem {
  name: string;
  icon: IconName;
  /** Lucide icon name (kebab-case) for v4 layout */
  lucideIcon?: string;
  id: string;
  routerLink?: string;
  queryParams?: Record<string, string>;
  isNotV3?: boolean;
  highlight?: boolean;
  action?: string;
}

export interface IV4MenuSection {
  category: string;
  routerLink?: string;
  items: IV4MenuItem[];
}

export class V4SideBar {
  static menuSections(): IV4MenuSection[] {
    return [
      {
        category: 'MAIN',
        items: [
          {
            name: 'Dashboard',
            icon: 'house',
            lucideIcon: 'layout-dashboard',
            id: 'home',
            routerLink: 'home',
            isNotV3: true
          },
          {
            name: 'Verification Center',
            icon: 'circle-check',
            lucideIcon: 'shield-check',
            id: 'verification',
            routerLink: 'verification/index',
            isNotV3: true
          }
        ]
      },
      {
        category: 'PAYABLES',
        routerLink: 'payables',
        items: [
          {
            name: 'Send Payment',
            icon: 'paper-plane',
            lucideIcon: 'send',
            id: 'send-payment',
            routerLink: 'payments',
            isNotV3: true
          },
          {
            name: 'Payments Out',
            icon: 'dollar-sign',
            lucideIcon: 'arrow-up-right',
            id: 'payments-out',
            routerLink: 'payments-out/detailed/all',
            isNotV3: true
          },
          {
            name: 'Payroll by Credit Card',
            icon: 'credit-card',
            lucideIcon: 'dollar-sign',
            id: 'payroll-card',
            routerLink: 'payroll-card',
            isNotV3: true
          },
          {
            name: 'Payees',
            icon: 'address-book',
            lucideIcon: 'users',
            id: 'payee',
            routerLink: 'payee',
            isNotV3: true
          },
          {
            name: 'Bulk Payment Center',
            icon: 'money-bills',
            id: 'bulk-payment',
            routerLink: 'bulk-payments',
            isNotV3: true
          },
          {
            name: 'Issue Visa Card',
            icon: 'credit-card',
            lucideIcon: 'credit-card',
            id: 'virtual-card',
            routerLink: 'virtual-card',
            isNotV3: true
          },
          {
            name: 'International Payment',
            icon: 'globe',
            lucideIcon: 'globe',
            id: 'international-payment',
            routerLink: 'international-payment/index',
            isNotV3: true
          },
          // {
          //   name: 'Vendors',
          //   icon: 'address-book',
          //   lucideIcon: 'users',
          //   id: 'payees',
          //   routerLink: 'payees',
          //   isNotV3: true
          // },
          {
            name: 'Bills',
            icon: 'file-invoice',
            lucideIcon: 'file-text',
            id: 'bill',
            routerLink: 'bill/detailed',
            isNotV3: true
          },
          {
            name: 'Bill Inbox',
            icon: 'envelope',
            lucideIcon: 'mail',
            id: 'bill-inbox',
            routerLink: 'bill/inbox',
            isNotV3: true
          }
          // {
          //   name: 'Employees',
          //   icon: 'users',
          //   lucideIcon: 'user-check',
          //   id: 'employees',
          //   routerLink: 'payees',
          //   queryParams: { type: 'employee' },
          //   isNotV3: true
          // },
        ]
      },
      {
        category: 'RECEIVABLES',
        routerLink: 'receivables',
        items: [
          {
            name: 'Receive Payment',
            icon: 'hand-holding-dollar',
            lucideIcon: 'hand-coins',
            id: 'receivedchecks',
            routerLink: 'payments/receive',
            isNotV3: true
          },
          {
            name: 'Payments In',
            icon: 'hand-holding-dollar',
            lucideIcon: 'arrow-down-left',
            id: 'payments-in',
            routerLink: 'payments-in/detailed',
            isNotV3: true
          },
          {
            name: 'Customers',
            icon: 'user-group',
            lucideIcon: 'users',
            id: 'customers',
            routerLink: 'payees',
            queryParams: { type: 'customer' },
            isNotV3: true
          },
          {
            name: 'Check Draft',
            icon: 'money-check-dollar',
            lucideIcon: 'banknote',
            id: 'checkdraft',
            routerLink: 'checkdraft/index',
            isNotV3: true
          },
          {
            name: 'Payment Link',
            icon: 'link',
            lucideIcon: 'link-2',
            id: 'payment-links',
            routerLink: 'payment-links',
            isNotV3: true
          },
          {
            name: 'Invoice',
            icon: 'file-invoice-dollar',
            lucideIcon: 'file-text',
            id: 'invoice',
            routerLink: 'invoice',
            isNotV3: true
          }
        ]
      },
      {
        category: 'ACCOUNTS',
        routerLink: 'accounts',
        items: [
          // {
          //   name: 'My Credits',
          //   icon: 'coins',
          //   lucideIcon: 'dollar-sign',
          //   id: 'refill-credit',
          //   routerLink: 'refill-credit',
          //   isNotV3: true
          // },
          {
            name: 'Bank Accounts',
            icon: 'building-columns',
            lucideIcon: 'building-2',
            id: 'bank-accounts',
            routerLink: 'bank-accounts/index',
            isNotV3: true
          },
          {
            name: 'My Cards',
            icon: 'credit-card',
            lucideIcon: 'credit-card',
            id: 'cards',
            routerLink: 'cards',
            isNotV3: true
          },
          {
            name: 'Wallets',
            icon: 'wallet',
            lucideIcon: 'wallet',
            id: 'wallets',
            routerLink: 'wallets',
            isNotV3: true
          },
          {
            name: 'Bank Data',
            icon: 'chart-line',
            lucideIcon: 'database',
            id: 'bank-data',
            routerLink: 'v4-business-tools/bank-data',
            isNotV3: true
          },
          {
            name: 'Cloud Bank',
            icon: 'cloud',
            lucideIcon: 'cloud',
            id: 'cloud-bank',
            routerLink: 'cloud-bank',
            isNotV3: true
          }
        ]
      },
      {
        category: 'BUSINESS TOOLS',
        routerLink: 'business-tools-overview',
        items: [
          {
            name: 'Cash Expense',
            icon: 'money-bill-trend-up',
            lucideIcon: 'wallet',
            id: 'cashexp',
            routerLink: 'cashexp/index',
            isNotV3: true
          },
          {
            name: 'Deposit Slip',
            icon: 'file',
            lucideIcon: 'file-box',
            id: 'depositslips',
            routerLink: 'depositslips/index',
            isNotV3: true
          },
          {
            name: 'Mail Document',
            icon: 'envelope-open-text',
            lucideIcon: 'mail',
            id: 'document-mail',
            routerLink: 'business-tools/document-mail',
            isNotV3: true
          },
          {
            name: 'More',
            icon: 'angles-right',
            lucideIcon: 'ellipsis',
            id: 'business-tools',
            routerLink: 'v4-business-tools/more',
            isNotV3: true
          }
        ]
      },
      {
        category: 'SERVICES',
        routerLink: 'services',
        items: [
          {
            name: 'App Integrations',
            icon: 'grid-2',
            lucideIcon: 'layers',
            id: 'thirdparty_app',
            routerLink: 'thirdparty_app/index',
            isNotV3: true
          },
          {
            name: 'Marketplace',
            icon: 'cart-shopping',
            lucideIcon: 'package',
            id: 'marketplace',
            routerLink: 'marketplace',
            isNotV3: true
          }
        ]
      },
      {
        category: 'SETTINGS',
        routerLink: 'settings',
        items: [
          {
            name: 'User Management',
            icon: 'user-gear',
            lucideIcon: 'users',
            id: 'manage-users',
            routerLink: 'manage-users/index',
            isNotV3: true
          },
          {
            name: 'App Settings',
            icon: 'gear',
            lucideIcon: 'settings',
            id: 'user-settings',
            routerLink: 'user-profile/user-settings',
            isNotV3: true
          },
          {
            name: 'Support',
            icon: 'headset',
            lucideIcon: 'message-square',
            id: 'support',
            routerLink: 'user-support',
            isNotV3: true
          },
          {
            name: 'More',
            icon: 'ellipsis',
            lucideIcon: 'ellipsis',
            id: 'more-settings',
            routerLink: 'more',
            isNotV3: true
          }
        ]
      }
    ];
  }
}
