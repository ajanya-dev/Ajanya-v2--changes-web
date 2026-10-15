import { environment } from 'src/environments/environment';

export const reportList = [
  {
    icon: '/assets/images/all-reports/user.svg',
    name: environment.env_id === 'compass' ? 'Vendor Report' : 'Payee Report',
    description: `Download or send transactions report of ${environment.env_id === 'compass' ? 'vendors' : 'payees'}`,
    id: 'payee-report',
    isComingSoon: false
  },
  {
    icon: '/assets/images/all-reports/form.svg',
    name: 'Form 1099-NEC',
    description: 'Generate IRS Form 1099 for Nonemployee Compensation',
    id: 'nec',
    isComingSoon: false
  },
  {
    icon: '/assets/images/all-reports/void-check.svg',
    name: 'Void Report',
    description: 'Get all voided check history',
    id: 'void-report',
    isComingSoon: false
  },
  {
    icon: '/assets/images/all-reports/delete-check.svg',
    name: 'Delete Report',
    description: 'Get all deleted check history',
    id: 'delete-report',
    isComingSoon: false
  },
  {
    icon: '/assets/images/all-reports/form.svg',
    name: 'Payment Report',
    description: 'Download payment report',
    id: 'payment',
    isComingSoon: false
  },
  {
    icon: '/assets/images/all-reports/bank.svg',
    name: 'Bank Report',
    description: 'Get all the transaction done from your bank accounts',
    id: 'bank-report',
    isComingSoon: true
  }
];

export const customReportLsit = [
  {
    icon: '/assets/images/all-reports/form.svg',
    name: 'Check Register Report',
    description: 'Download check register report by date range',
    id: 'check-register-report',
    isComingSoon: false
  },
  {
    icon: '/assets/images/all-reports/form.svg',
    name: 'Job Processing Summary',
    description: 'Download job processing summary by date range',
    id: 'job-processing-summary',
    isComingSoon: false
  },
  {
    icon: '/assets/images/all-reports/form.svg',
    name: 'User Summary Report',
    description: 'Download user summary report by date range',
    id: 'user-summary-report',
    isComingSoon: false
  }
];
