import { IconName } from '@fortawesome/fontawesome-svg-core';
import { environment } from 'src/environments/environment';

export interface IV3SidebarLinks {
  title: string;
  icon: IconName;
  id: string;
  tooltip?: string;
  routerLink?: string;
  isDropdown?: boolean;
  isNotV3?: boolean;
  subItem?: {
    title: string;
    id: string;
    icon: IconName;
    tooltip: string;
    routerLink: string;
    isNotV3?: boolean;
  }[];
  isHide?: boolean;
  highlight?: boolean;
}

export interface IMobileSidebarLinks {
  title: string;
  icon?: IconName;
  id: string;
  tooltip?: string;
  routerLink?: string;
  onClick?: string;
  highlight?: boolean;
}

export interface IMobileNavSection {
  id: string;
  title: string;
  icon: string;
  links: IMobileSidebarLinks[];
  iconColor?: string;
  routerLink?: string;
  highlight?: boolean;
}

export class V3SideBar {
  static firstMenuSection(): IV3SidebarLinks[] {
    const sidebarItems: IV3SidebarLinks[] = [
      {
        title: 'Verification Center',
        icon: 'circle-check',
        id: 'verification',
        routerLink: 'verification/index',
        tooltip: 'Verification',
        isNotV3: true
      },
      {
        title: 'Home Page',
        icon: 'house',
        id: 'home',
        routerLink: 'home',
        tooltip: 'Home',
        isNotV3: true
      },
      {
        title: 'My Accounts',
        icon: 'building-columns',
        id: 'my-accounts',
        tooltip: 'Bank Accounts',
        isDropdown: true,
        subItem: [
          {
            tooltip: 'Bank Accounts',
            title: 'Bank Accounts',
            id: 'bank-accounts',
            icon: 'building-columns',
            routerLink: 'bank-accounts/index',
            isNotV3: true
          },
          {
            tooltip: 'Wallets',
            title: 'Wallets',
            id: 'wallets',
            icon: 'wallet',
            routerLink: 'wallet/transactions',
            isNotV3: true
          },
          {
            tooltip: 'My Cards',
            title: 'My Cards',
            id: 'cards',
            icon: 'credit-card',
            routerLink: 'cards',
            isNotV3: true
          },
          {
            tooltip: 'Cloud Bank',
            title: 'Cloud Bank',
            id: 'cloud-bank',
            icon: 'building-columns',
            routerLink: 'cloud-bank',
            isNotV3: true
          }
        ]
      },
      {
        title: environment.env_id === 'compass' ? 'Vendors' : 'Payees',
        icon: 'address-book',
        id: 'payees',
        tooltip: 'Payees',
        routerLink: 'payees',
        isNotV3: true
      },
      {
        title: 'Payments',
        icon: 'dollar-sign',
        id: 'payments-table',
        tooltip: 'Payments',
        routerLink: 'payments-table/index',
        isNotV3: true
      }
    ];
    return sidebarItems;
  }

  static secondMenuSection(): IV3SidebarLinks[] {
    const sidebarItems: IV3SidebarLinks[] = [
      {
        title: 'Bill',
        icon: 'file-invoice',
        id: 'bill',
        routerLink: 'bill/index',
        isDropdown: false,
        isNotV3: true
      },
      {
        title: 'Receivables',
        icon: 'hand-holding-dollar',
        id: 'receivables',
        isDropdown: true,
        subItem: [
          {
            tooltip: 'Receive Payments',
            title: 'Receive Payments',
            id: 'receivedchecks',
            icon: 'hand-holding-dollar',
            routerLink: 'receivedchecks/index',
            isNotV3: true
          },
          {
            tooltip: 'Check Draft',
            title: 'Check Draft',
            id: 'checkdraft',
            icon: 'money-check-dollar',
            routerLink: 'checkdraft/index',
            isNotV3: true
          },
          {
            tooltip: 'Invoice',
            title: 'Invoice',
            id: 'invoice',
            icon: 'file-invoice-dollar',
            routerLink: 'invoice',
            isNotV3: true
          },
          {
            tooltip: 'Payment Links',
            title: 'Payment Links',
            id: 'payment-links',
            icon: 'link',
            routerLink: 'payment-links',
            isNotV3: true
          }
        ]
      },
      {
        title: 'Business Tools',
        icon: 'toolbox',
        id: 'businesstools',
        isDropdown: true,
        subItem: [
          {
            tooltip: 'Cash Expense',
            title: 'Cash Expense',
            id: 'cashexp',
            icon: 'money-bill-trend-up',
            routerLink: 'cashexp/index',
            isNotV3: true
          },
          {
            tooltip: 'Deposit Slip',
            title: 'Deposit Slip',
            id: 'depositslips',
            icon: 'file',
            routerLink: 'depositslips/index',
            isNotV3: true
          },
          {
            tooltip: 'Mail Document',
            title: 'Mail Document',
            id: 'document-mail',
            icon: 'mail-reply',
            routerLink: 'business-tools/document-mail',
            isNotV3: true
          },
          {
            tooltip: 'View More',
            title: 'View More',
            id: 'business-tools',
            icon: 'angles-right',
            routerLink: 'business-tools',
            isNotV3: true
          }
        ]
      },
      {
        title: 'Apps',
        icon: 'grid-2',
        id: 'thirdparty_app',
        tooltip: 'Apps',
        routerLink: 'thirdparty_app/index',
        isNotV3: true
      },
      {
        title: 'Payroll by Credit Card',
        icon: 'dollar-sign',
        id: 'payroll-card',
        routerLink: 'payroll-card',
        tooltip: 'Payroll by Credit Card',
        isNotV3: true
      },
      {
        title: 'Issue Visa Card',
        icon: 'credit-card',
        id: 'virtual-card',
        routerLink: 'virtual-card',
        tooltip: 'Issue Visa Card',
        isNotV3: true,
        highlight: true
      },
      {
        title: 'International Payment',
        icon: 'globe',
        id: 'international-payment',
        routerLink: 'international-payment/index',
        tooltip: 'International Payment',
        isNotV3: true,
        highlight: true
      },
      {
        title: 'Marketplace',
        icon: 'cart-shopping',
        id: 'marketplace',
        routerLink: 'marketplace',
        isNotV3: true,
        tooltip: 'Marketplace'
      },
      {
        title: 'Bank Data',
        icon: 'building-columns',
        id: 'bank-data',
        routerLink: 'business-tools/bank-data',
        isNotV3: true,
        tooltip: 'Bank Data',
      },
      ...(environment.env_id === 'compass' ? [{
        title: 'Application Error',
        icon: 'triangle-exclamation' as IconName,
        id: 'application-error',
        routerLink: 'application-error',
        isNotV3: true,
        tooltip: 'Application Error'
      }] : [])
    ];
    return sidebarItems;
  }

  static bottomMenuSection(): IV3SidebarLinks[] {
    return [
      {
        title: 'Users',
        icon: 'user',
        id: 'manage-users',
        isNotV3: true,
        routerLink: 'manage-users/index',
        tooltip: 'User Panel'
      },
      {
        title: 'Settings',
        icon: 'gear',
        id: 'user-settings',
        isNotV3: true,
        routerLink: 'user-profile/user-settings',
        tooltip: 'Settings'
      },
      {
        title: 'More',
        icon: 'angles-right',
        id: 'more',
        tooltip: 'More'
      }
    ];
  }

  static v3payableLinks(): IMobileSidebarLinks[] {
    return [
      {
        title: 'Payments',
        tooltip: 'Payments',
        routerLink: '/manage/payments-table/index',
        id: 'payments-table'
      },
      {
        title: 'Bill',
        tooltip: 'Create Bill',
        routerLink: '/manage/bill',
        id: 'bill'
      }
    ];
  }

  static v3AccountsLink(): IMobileSidebarLinks[] {
    return [
      {
        title: 'Bank Accounts',
        tooltip: 'Bank Accounts',
        routerLink: '/manage/bank-accounts',
        id: 'bank-accounts'
      },
      {
        title: 'Wallets',
        tooltip: 'wallets',
        routerLink: '/manage/wallet/transactions',
        id: 'wallets'
      },
      {
        title: 'My Cards',
        tooltip: 'My Cards',
        routerLink: 'cards',
        id: 'cards'
      },
      {
        title: 'Cloud Bank',
        icon: 'building-columns',
        tooltip: 'Cloud Bank',
        id: 'cloud-bank',
        routerLink: 'cloud-bank'
      }
    ];
  }

  static receivableLinks(): IMobileSidebarLinks[] {
    return [
      {
        title: 'Receive Payment',
        tooltip: 'Receive Payment',
        routerLink: '/manage/receivedchecks',
        id: 'receivedchecks'
      },
      {
        title: 'Check Draft',
        tooltip: 'Check Draft',
        routerLink: '/manage/checkdraft',
        id: 'checkdraft'
      },
      {
        title: 'Invoice',
        tooltip: 'Invoice',
        routerLink: '/manage/invoice',
        id: 'invoice'
      },
      {
        title: 'Payment Link',
        tooltip: 'Payment Link',
        routerLink: '/manage/payment-links',
        id: 'payment-links'
      }
    ];
  }

  static businessLinks(): IMobileSidebarLinks[] {
    const businessLinks = [
      {
        title: 'Cash Expense',
        tooltip: 'Cash Expense',
        routerLink: '/manage/cashexp',
        id: 'cashexp'
      },
      {
        title: 'Deposit Slip',
        tooltip: 'Deposit Slip',
        routerLink: '/manage/depositslips/index',
        id: 'depositslips'
      },
      {
        title: 'Mail Document',
        tooltip: 'Mail Document',
        routerLink: 'business-tools/document-mail',
        id: 'document-mail'
      },
      {
        title: 'View More',
        tooltip: 'View More Business Tools',
        routerLink: '/manage/business-tools',
        id: 'business-tools'
      }
    ];
    return businessLinks;
  }

  static integrationLinks(): IMobileSidebarLinks[] {
    return [
      {
        title: 'QuickBooks',
        tooltip: 'QuickBooks',
        routerLink: '/manage/thirdparty_app/index',
        id: 'quickBook'
      },
      {
        title: 'View All',
        tooltip: 'View All',
        routerLink: '/manage/thirdparty_app',
        id: 'viewAllIntegration'
      }
    ];
  }

  static settingsLinks(): IMobileSidebarLinks[] {
    return [
      {
        title: 'Users',
        tooltip: 'Users',
        routerLink: '/manage/manage-users',
        id: 'user'
      }
      // {
      //   title: 'Shop',
      //   tooltip: 'Shop',
      //   routerLink: '/manage/shop',
      //   id: 'shop'
      // },
      // {
      //   title: 'More',
      //   tooltip: 'More',
      //   id: 'more'
      // }
    ];
  }

  static v3SettingsMenuList(): IMobileSidebarLinks[] {
    return [
      {
        title: 'Category',
        icon: 'stream',
        routerLink: '/manage/checkcatagory',
        id: 'checkcatagory'
      },
      {
        title: 'Recharge My Credits',
        icon: 'file-invoice',
        routerLink: '/manage/refill-credit',
        id: 'refill-credit'
      },
      {
        title: 'Calculator',
        icon: 'calculator',
        onClick: 'openCalculator',
        id: 'calculator'
      },
      {
        title: 'Check Report',
        icon: 'file-spreadsheet',
        routerLink: '/manage/cheque/check-report-custom',
        id: 'check-report-custom'
      },
      {
        title: 'Refer & Earn',
        icon: 'dollar-sign',
        routerLink: '/manage/affiliate/index',
        id: 'affiliate'
      },
      {
        title: 'My Credits Statement',
        icon: 'file-invoice-dollar',
        routerLink: '/manage/financialstatement',
        id: 'financialstatement'
      },
      {
        title: 'Billing/Plan',
        icon: 'crown',
        routerLink: '/manage/subscription',
        id: 'subscription'
      },
      {
        title: 'Developer Panel',
        icon: 'code',
        routerLink: '/manage/developer',
        id: 'developer'
      },
      {
        title: 'Report',
        icon: 'file-spreadsheet',
        routerLink: '/manage/more/report',
        id: 'report'
      },
      {
        title: 'Shop',
        icon: 'cart-shopping',
        routerLink: '/manage/shop/index',
        id: 'shop'
      }
    ];
  }

  static mobileNavigation(): IMobileNavSection[] {
    return [
      {
        id: 'verification',
        title: 'Verification Center',
        icon: 'shield-check',
        links: [],
        iconColor: 'text-common-green-color',
        routerLink: '/manage/verification/index'
      },
      {
        id: 'home',
        title: 'Home',
        icon: 'house',
        links: [],
        iconColor: 'text-common-green-color',
        routerLink: '/manage/home'
      },
      {
        id: 'accounts',
        title: 'My Accounts',
        icon: 'building-columns',
        links: this.v3AccountsLink(),
        iconColor: 'text-common-green-color'
      },
      {
        id: 'payees',
        title: environment.env_id === 'compass' ? 'Vendors' : 'Payees',
        icon: 'address-book',
        links: [],
        iconColor: 'text-common-green-color',
        routerLink: '/manage/payees'
      },
      {
        id: 'payables',
        title: 'Payables',
        icon: 'money-bill-wave',
        links: this.v3payableLinks(),
        iconColor: 'text-white'
      },
      {
        id: 'receivables',
        title: 'Receivables',
        icon: 'hand-holding-dollar',
        links: this.receivableLinks(),
        iconColor: 'text-white'
      },
      {
        id: 'thirdparty_app',
        title: 'Apps',
        icon: 'grid-2',
        links: [],
        iconColor: 'text-white',
        routerLink: '/manage/thirdparty_app/index'
      },
      {
        id: 'payroll-card',
        title: 'Payroll by Card',
        icon: 'dollar-sign',
        links: [],
        iconColor: 'text-white',
        routerLink: '/manage/payroll-card/index'
      },
      {
        id: 'virtual-card',
        title: 'Issue Visa Card',
        icon: 'credit-card',
        links: [],
        iconColor: 'text-white',
        routerLink: '/manage/virtual-card'
      },
      {
        id: 'international-payment',
        title: 'International Payment',
        icon: 'globe',
        links: [],
        iconColor: 'text-white',
        routerLink: '/manage/international-payment/index',
        highlight: true
      },
      {
        id: 'manage-users',
        title: 'Users',
        icon: 'user',
        links: [],
        iconColor: 'text-white',
        routerLink: '/manage/manage-users/index'
      },
      {
        id: 'user-settings',
        title: 'Settings',
        icon: 'gear',
        links: [],
        iconColor: 'text-white',
        routerLink: '/manage/user-profile/user-settings'
      },
      {
        id: 'business',
        title: 'Business Tools',
        icon: 'briefcase',
        links: this.businessLinks(),
        iconColor: 'text-white'
      },
      {
        id: 'more',
        title: 'More',
        icon: 'angles-right',
        links: this.v3SettingsMenuList(),
        iconColor: 'text-white'
      }
    ];
  }
}
