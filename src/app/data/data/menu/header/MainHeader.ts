import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { IHeaderLinks } from 'src/app/layout/model/header';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { environment } from 'src/environments/environment';

export class MainHeader {
  // MAIN HEADER DROPDOWN
  static headerDropdownLink(): IHeaderLinks[] {
    const links: IHeaderLinks[] = [
      {
        title: 'ACH',
        icon: '../../../../../assets/images/header/header-main-menu/ACH.svg',
        routerLink: '/manage/payments/main/pay/bankaccount/ach',
        id: 'ach',
        faIcon: ['fas', 'circle-dollar'],
        iconColor: 'text-common-blue-color',
        iconBackground: '!bg-common-secondary-blue-color',
        favoriteIconId:1,
        requiresCustomAction: true
      },
      {
        title: 'Invoice',
        icon: '../../../../../assets/images/header/header-main-menu/invoice.svg',
        routerLink: '/manage/invoice',
        onClick: 'addInvoice',
        id: 'invoice',
        faIcon: ['fas', 'file-invoice-dollar'],
        iconColor: 'text-common-green-color',
        iconBackground: '!bg-common-secondary-green-color',
        favoriteIconId:2,
        v4RouterLink: '/v4/manage/invoice'
      },
      {
        title: 'Bill',
        icon: '../../../../../assets/images/header/header-main-menu/bill.svg',
        routerLink: '/manage/bill',
        onClick: 'newBill',
        id: 'bill',
        faIcon: ['fas', 'file-invoice'],
        iconColor: 'text-common-yellow-color',
        iconBackground: '!bg-common-secondary-yellow-color',
        favoriteIconId:3,
        v4RouterLink: '/v4/manage/bill/detailed'
      },
      {
        title: 'Bulk Pay',
        icon: '../../../../../assets/images/header/header-main-menu/multi_check.svg',
        routerLink: '/manage/group-payments/main',
        id: 'multiChecks',
        faIcon: ['fas', 'list-check'],
        iconColor: 'text-common-blue-color',
        iconBackground: '!bg-common-secondary-blue-color',
        favoriteIconId:4,
        v4RouterLink: '/v4/manage/bulk-payments'
      },
      {
        title: 'Check Draft',
        icon: '../../../../../assets/images/header/header-main-menu/check_draft.svg',
        routerLink: '/manage/checkdraft/index',
        id: 'checkDraft',
        faIcon: ['fas', 'money-check-dollar'],
        iconColor: 'text-common-violet-color',
        iconBackground: '!bg-common-secondary-violet-color',
        favoriteIconId:5,
        v4RouterLink: '/v4/manage/checkdraft'
      },
      {
        title: 'Import Check',
        icon: '../../../../../assets/images/header/header-main-menu/import_check.svg',
        routerLink: '/manage/cheque/multi_import/step1',
        id: 'importCheck',
        faIcon: ['fas', 'down-to-line'],
        iconColor: 'text-common-green-color',
        iconBackground: '!bg-common-secondary-green-color',
        favoriteIconId:6,
        requiresCustomAction: true
      },
      {
        title: 'Multiple Checks',
        icon: '../../../../../assets/images/header/header-main-menu/multi_check.svg',
        routerLink: '/manage/cheque/multiplecheck/create',
        id: 'multipleCheck',
        faIcon: ['fas', 'money-check-dollar-pen'],
        iconColor: 'text-common-violet-color',
        iconBackground: '!bg-common-secondary-violet-color',
        favoriteIconId:7,
        v4RouterLink: '/v4/manage/bulk-payments/index?tab=create&method=manual-entry'
      },
      {
        title: 'Blank Checks',
        icon: '../../../../../assets/images/header/header-main-menu/check.svg',
        onClick: 'blankCheck',
        id: 'blankChecks',
        faIcon: ['fas', 'money-check'],
        iconColor: 'text-common-green-color',
        iconBackground: '!bg-common-secondary-green-color',
        favoriteIconId:8,
        requiresCustomAction: true
      },
      {
        title: 'Deposit Slip',
        icon: '../../../../../assets/images/header/header-main-menu/deposit_slip.svg',
        routerLink: '/manage/depositslips/index',
        id: 'depositSlip',
        faIcon: ['fas', 'file'],
        iconColor: 'text-common-green-color',
        iconBackground: '!bg-common-secondary-green-color',
        favoriteIconId:9,
        v4RouterLink: '/v4/manage/depositslips'
      },
      {
        title: 'Fund Wallet',
        icon: '../../../../../assets/images/header/header-main-menu/fund_wallet.svg',
        routerLink: '/manage/wallet/transactions',
        onClick: 'fundYourWallet',
        id: 'fundWallet',
        faIcon: ['fas', 'wallet'],
        iconColor: 'text-common-violet-color',
        iconBackground: '!bg-common-secondary-violet-color',
        favoriteIconId:10,
        v4RouterLink: '/v4/manage/wallets'
      },
      {
        title: 'Bank',
        icon: '../../../../../assets/images/header/header-main-menu/bank_data.svg',
        routerLink: '/manage/bank-accounts',
        onClick: 'addBank',
        id: 'bank',
        faIcon: ['fas', 'building-columns'],
        iconColor: 'text-common-green-color',
        iconBackground: '!bg-common-secondary-green-color',
        favoriteIconId:11,
        v4RouterLink: '/v4/manage/bank-accounts'
      },
      {
        title: environment.env_id === 'compass' ? 'Vendor' : 'Payee',
        icon: '../../../../../assets/images/header/header-main-menu/payee.svg',
        routerLink: '/manage/payees',
        onClick: 'addPayee',
        id: 'payee',
        faIcon: ['fas', 'user'],
        iconColor: 'text-common-blue-color',
        iconBackground: '!bg-common-secondary-blue-color',
        favoriteIconId:12,
        v4RouterLink: '/v4/manage/payees'
      },
      {
        title: 'Mail Document',
        icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
        routerLink: '/manage/business-tools/document-mail',
        onClick: 'mailDocument',
        id: 'mailDocument',
        faIcon: ['fas', 'envelope-open-text'],
        iconColor: 'text-common-blue-color',
        iconBackground: '!bg-common-secondary-blue-color',
        favoriteIconId:13,
        v4RouterLink: '/v4/manage/business-tools/document-mail'
      },
      // {
      //   title: 'Shipping Label',
      //   icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
      //   onClick: 'shippingLabel',
      //   id: 'shippingLabel',
      //   faIcon: ['fas', 'cart-flatbed'],
      //   iconColor: 'text-common-violet-color',
      //   iconBackground: '!bg-common-secondary-violet-color',
      //   favoriteIconId:14,
      //   requiresCustomAction: true
      // },
      {
        title: 'Credit Card',
        icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
        routerLink: '/manage/cards',
        onClick: 'creditCart',
        id: 'creditCard',
        faIcon: ['fas', 'credit-card'],
        iconColor: 'text-common-yellow-color',
        iconBackground: '!bg-common-secondary-yellow-color',
        favoriteIconId:15,
        v4RouterLink: '/v4/manage/cards'
      },
      {
        title: 'Payment Link',
        icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
        routerLink: '/manage/payment-links/index',
        onClick: 'paymentLink',
        id: 'paymentLink',
        faIcon: ['fas', 'link'],
        iconColor: 'text-common-green-color',
        iconBackground: '!bg-common-secondary-green-color',
        favoriteIconId:16,
        v4RouterLink: '/v4/manage/payment-links'
      },
      {
        title: 'User',
        icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
        routerLink: '/manage/manage-users/index',
        onClick: 'user',
        id: 'user',
        faIcon: ['fas', 'user-tie'],
        iconColor: 'text-common-blue-color',
        iconBackground: '!bg-common-secondary-blue-color',
        favoriteIconId:17,
        v4RouterLink: '/v4/manage/manage-users'
      },

      {
        title: 'Cash Expense',
        icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
        routerLink: '/manage/cashexp/index',
        onClick: 'cashExpense',
        id: 'user-cash',
        faIcon: ['fas', 'money-bills'],
        iconColor: 'text-common-yellow-color',
        iconBackground: '!bg-common-secondary-yellow-color',
        favoriteIconId:18,
        v4RouterLink: '/v4/manage/cashexp'
      },
      {
        title: 'Mail Check',
        icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
        routerLink: '/manage/payments-table/check',
        onClick: 'mailCheck',
        id: 'mailCheck',
        faIcon: ['fas', 'envelope'],
        iconColor: 'text-common-blue-color',
        iconBackground: '!bg-common-secondary-blue-color',
        favoriteIconId:19,
        v4RouterLink: '/v4/manage/payments-out/detailed/check'
      },
      {
        title: 'Mailing Dashboard',
        icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
        routerLink: '/manage/business-tools/mail-dashboard/index',
        onClick: 'mailDashboard',
        id: 'mailDashboard',
        faIcon: ['fas', 'envelope'],
        iconColor: 'text-common-blue-color',
        iconBackground: '!bg-common-secondary-blue-color',
        favoriteIconId:20,
        v4RouterLink: '/v4/manage/business-tools/mail-dashboard/index'
      },
      {
        title: 'Positive Pay',
        icon: '../../../../../assets/images/header/header-main-menu/positive_pay.svg',
        onClick: 'positivePay',
        id: 'positivePay',
        favoriteIconId:21,
        requiresCustomAction: true
      },
      {
        title: 'Issue Visa Card',
        icon: '../../../../../assets/images/header/header-main-menu/user_fill.svg',
        routerLink: '/manage/virtual-card',
        onClick: 'issueVisaCard',
        id: 'issueVisaCard',
        faIcon: ['fas', 'credit-card'],
        iconColor: 'text-common-yellow-color',
        iconBackground: '!bg-common-secondary-yellow-color',
        favoriteIconId:22,
        v4RouterLink: '/v4/manage/virtual-card'
      }
    ];
    if (environment.env_id === 'compass') {
      return links.filter(
        (link) =>
          ![
            'ach',
            'fundWallet',
            'mailDocument',
            'shippingLabel',
            'paymentLink',
            'creditCard',
            'multiChecks'
          ].includes(link.id)
      );
    }

    return links;
  }

  // SUPPPORT DROPDOWN
  static supportDropdownLink(): IHeaderLinks[] {
    const supportItems = [
      {
        title: 'Live Chat',
        icon: 'fad fa-comments',
        faIcon: ['fas', 'comments'] as IconProp,
        routerLink: '',
        type: 'liveChat',
        id: 'liveChat'
      },
      {
        title: 'Live Screen Sharing',
        icon: 'fas fa-desktop-alt',
        faIcon: ['fas', 'desktop-alt'] as IconProp,
        routerLink: 'https://join.zoho.com/',
        type: 'outside',
        id: 'liveScreenSharing'
      },
      {
        title: 'Help/ Tutorial',
        icon: 'fas fa-life-ring',
        faIcon: ['fas', 'life-ring'] as IconProp,
        routerLink: '',
        id: 'helpTutorial'
      },
      {
        title: 'Video Tutorial',
        icon: 'fas fa-video',
        faIcon: ['fas', 'video'] as IconProp,
        routerLink: '',
        id: 'videoTutorial'
      },
      {
        title: 'Submit an Idea',
        icon: 'fa-solid fa-grid-2-plus',
        faIcon: ['fas', 'grid-2-plus'] as IconProp,
        routerLink: '',
        id: 'requestfeature'
      },
      {
        title: 'Report an Issue',
        icon: 'fas fa-question-circle',
        faIcon: ['fas', 'question-circle'] as IconProp,
        routerLink: '/manage/user-support',
        id: 'tickets'
      },
      {
        title: 'Our Compliance',
        icon: 'fas fa-shield-check',
        faIcon: ['fas', 'shield-check'] as IconProp,
        routerLink: '/manage/user-profile/user-settings',
        id: 'our-compliance'
      },
      {
        title: 'Instant Demo',
        icon: 'fas fa-puzzle-piece',
        faIcon: ['fas', 'puzzle-piece'] as IconProp,
        routerLink: '',
        id: 'BookADemo'
      },
      {
        title: 'Text Us',
        icon: 'fas fa-text-size',
        faIcon: ['fas', 'text-size'] as IconProp,
        routerLink: '',
        type: 'textUs',
        id: 'textUs'
      },
      {
        title: StaticWhiteLabelConditions.customerSupportNo ?? '',
        icon: 'fas fa-phone-alt',
        faIcon: ['fas', 'phone-alt'] as IconProp,
        routerLink: '',
        type: 'phone',
        id: 'phoneNumber'
      },
      {
        title: 'Contact Us',
        icon: 'fas fa-address-book',
        faIcon: ['fas', 'address-book'] as IconProp,
        routerLink: environment?.help_website,
        type: 'outside',
        id: 'contactUs'
      }
    ];

    const sanboxAllowedItems = [
      'liveChat',
      'helpTutorial',
      'contactUs',
      'phoneNumber'
    ];
    if (environment.env_id === 'sandbox') {
      const filteredItems = supportItems.filter((item) =>
        sanboxAllowedItems.includes(item.id)
      );
      return filteredItems;
    }
    if (
      environment.env_id === 'quickbanked' ||
      environment.env_id === 'quickbanked-sandbox'
    ) {
      return supportItems.filter(
        (supportItem) => !['BookADemo'].includes(supportItem.id)
      );
    }
    return supportItems.filter((el) => el.id !== 'contactUs');
  }

  static whiteLabelSupportDropdownLink(): IHeaderLinks[] {
    const supportItems = [
      {
        title: 'Live Chat',
        icon: 'fad fa-comments',
        faIcon: ['fas', 'comments'] as IconProp,
        routerLink: '',
        type: 'liveChat',
        id: 'liveChat'
      },
      {
        title: 'Tickets/Question',
        icon: 'fas fa-question-circle',
        routerLink:
          environment.env_id === 'quickbanked' ||
          environment.env_id === 'quickbanked-sandbox'
            ? 'https://quickbanked.com/contact-us.html'
            : '/manage/user-support',
        faIcon: ['fas', 'question-circle'] as IconProp,
        id: 'tickets'
      },
      {
        title: 'Contact Us',
        icon: 'fas fa-address-book',
        routerLink: StaticWhiteLabelConditions.helpWebsite,
        type: 'outside',
        faIcon: ['fas', 'address-book'] as IconProp,
        id: 'contactUs'
      },
      {
        title: StaticWhiteLabelConditions.customerSupportNo ?? '',
        icon: 'fas fa-phone-alt',
        routerLink: '',
        type: 'phone',
        faIcon: ['fas', 'phone-alt'] as IconProp,
        id: 'phoneNumber'
      }
    ];

    if (
      environment.env_id === 'quickbanked' ||
      environment.env_id === 'quickbanked-sandbox'
    ) {
      return supportItems.filter((item) => item.id !== 'liveChat');
    }

    return supportItems;
  }
}
