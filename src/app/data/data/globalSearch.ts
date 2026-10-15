import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

export class SearchAreas {
  static searchPages() {
    return [
      {
        icon: 'money-check',
        name: 'Checks',
        routingLink: '/manage/cheque/checkrecords'
      },
      {
        icon: 'plus-circle',
        name: 'Create Check',
        routingLink: '/manage/payments/main/pay/bankaccount/check'
      },
      {
        icon: 'file',
        name: 'Blank Check',
        routingLink: '/manage/',
        onClick: 'blankCheck'
      },
      {
        icon: 'clone',
        name: 'Multiple Checks',
        routingLink: '/manage/cheque/multiplecheck/create'
      },
      {
        icon: 'arrow-to-bottom',
        name: 'Import from Excel/CSV',
        routingLink: '/manage/cheque/multi_import/step1'
      },
      {
        icon: 'bank',
        name: 'Cloud Bank',
        routingLink: '/manage/search',
        onClick: 'cloudBank'
      },
      {
        icon: 'list-ul',
        name: 'Bank Account List',
        routingLink: '/manage/bank-accounts/index'
      },
      {
        icon: 'plus-square',
        name: 'Add New Bank Account',
        routingLink: '/manage/',
        onClick: 'addBank'
      },
      {
        icon: 'user-friends',
        name: 'Payee',
        routingLink: '/manage/payees'
      },
      {
        icon: 'arrow-to-bottom',
        name: 'Import Payee',
        routingLink: '/manage/payee/payee_data_import/step1'
      },
      {
        icon: 'comment-lines',
        name: 'Support: Live Chat',
        outsideLink: StaticWhiteLabelConditions.zohoSupportChat ?? undefined
      },
      {
        icon: 'comment-alt-dots',
        name: 'Support: Tickets',
        routingLink: '/manage/user-support'
      },
      {
        icon: 'info-circle',
        name: 'Support: Knowledge Base',
        outsideLink: StaticWhiteLabelConditions.supportWebsite
      },
      {
        icon: 'phone-alt',
        name: 'Support: Contact Us',
        outsideLink: 'https://onlinecheckwriter.com/contact'
      },
      {
        icon: 'user-circle',
        name: 'Profile Setup',
        routingLink: '/manage/user-profile/index'
      },
      {
        icon: 'key',
        name: 'Change Password',
        routingLink: '/manage/user-profile/changepassword'
      },
      {
        icon: 'ballot-check',
        name: 'Billing Statement',
        routingLink: '/manage/financialstatement/index'
      },
      {
        icon: 'envelope-open-dollar',
        name: 'Email a Check',
        routingLink: '/manage/cheque/checkrecords'
      },
      {
        icon: 'file-import',
        name: 'Request a Payment',
        routingLink: "/manage/payments/main/receive/''/''"
      },
      {
        icon: 'file-check',
        name: 'Approve a Check',
        routingLink: '/manage/cheque/checkrecords'
      },
      {
        icon: 'file-download',
        name: 'Received Payments',
        routingLink: '/manage/receivedchecks/index'
      },
      {
        icon: 'ballot-check',
        name: 'Payment Links',
        routingLink: '/manage/payment-links/index'
      },
      {
        icon: 'ballot-check',
        name: 'Payment Link: Create',
        routingLink: '/manage/payment-links/create'
      },
      {
        icon: 'credit-card',
        name: 'Refill Credit',
        routingLink: '/manage/refill-credit/show-refillform'
      },
      {
        icon: 'check',
        name: 'Verify Bank Account',
        routingLink: '/manage/bank-accounts/index'
      },
      {
        icon: 'scroll',
        name: 'Deposit Slip',
        routingLink: '/manage/depositslips/index'
      },
      {
        icon: 'file-invoice',
        name: 'Invoice',
        routingLink: '/manage/invoice'
      },
      {
        icon: 'chart-line',
        name: 'Central Report',
        routingLink: '/manage/central_accounting/index'
      },
      {
        icon: 'money-check-edit',
        name: 'Check Draft',
        routingLink: '/manage/checkdraft/index'
      },
      {
        icon: 'ballot-check',
        name: 'Order Check Paper',
        routingLink: '/manage/shop/index'
      },
      {
        icon: 'wallet',
        name: 'Cash Expense',
        routingLink: '/manage/cashexp/index'
      },
      {
        icon: 'ballot-check',
        name: 'Bank Data',
        routingLink: '/manage/business-tools/bank-data'
      },
      {
        icon: 'envelope',
        name: 'Mail a Check',
        routingLink: '/manage/cheque/checkrecords'
      },
      {
        icon: 'repeat-alt',
        name: 'Switch Company',
        routingLink: '/manage/company_management/select_company_dashboard'
      },
      {
        icon: 'plus',
        name: 'Add New Company',
        routingLink: '/manage/company_management/index'
      },
      {
        icon: 'plus',
        name: 'Positive Pay',
        routingLink: '/manage/search',
        onClick: 'positivePay'
      },
      {
        icon: 'envelope-open-dollar',
        name: 'Mail Document',
        routingLink: '/manage/business-tools/document-mail'
      }
    ];
  }
}
