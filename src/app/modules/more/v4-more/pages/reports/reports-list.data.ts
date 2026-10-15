import { TReportIds } from 'src/app/modules/more/model/all-reports';
import { environment } from 'src/environments/environment';

export interface IV4Report {
  id: TReportIds;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  iconBgLight: string;
  isComingSoon: boolean;
}

export const v4ReportList: IV4Report[] = [
  {
    id: 'payee-report',
    name: environment.env_id === 'compass' ? 'Vendor Report' : 'Payee Report',
    description: `Download or send transactions report of ${environment.env_id === 'compass' ? 'vendors' : 'payees'}`,
    icon: 'user',
    iconBg: 'var(--v4-common-blue-color)',
    iconBgLight: 'rgba(59,130,246,0.12)',
    isComingSoon: false
  },
  {
    id: 'nec',
    name: 'Form 1099-NEC',
    description: 'Generate IRS Form 1099 for Nonemployee Compensation',
    icon: 'file-text',
    iconBg: 'var(--v4-accent-violet-color)',
    iconBgLight: 'rgba(139,92,246,0.12)',
    isComingSoon: false
  },
  {
    id: 'void-report',
    name: 'Void Report',
    description: 'Get all voided check history',
    icon: 'truck',
    iconBg: 'var(--v4-common-violet-color)',
    iconBgLight: 'rgba(150,114,223,0.12)',
    isComingSoon: false
  },
  {
    id: 'delete-report',
    name: 'Delete Report',
    description: 'Get all deleted check history',
    icon: 'file-text',
    iconBg: '#ec4899',
    iconBgLight: 'rgba(236,72,153,0.15)',
    isComingSoon: false
  },
  {
    id: 'payment',
    name: 'Payment Report',
    description: 'Download payment report',
    icon: 'file-text',
    iconBg: 'var(--v4-common-green-color)',
    iconBgLight: 'rgba(8,177,96,0.12)',
    isComingSoon: false
  },
  {
    id: 'central-report',
    name: 'Central Report',
    description: 'View consolidated report of checks, deposit slips and cash expenses',
    icon: 'chart-line',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)',
    isComingSoon: false
  },
  {
    id: 'bank-report',
    name: 'Bank Report',
    description: 'Get all the transaction done from your bank accounts',
    icon: 'building-2',
    iconBg: 'var(--v4-badge-neutral-text-color)',
    iconBgLight: 'rgba(71,85,105,0.12)',
    isComingSoon: true
  }
];

export const v4CustomReportList: IV4Report[] = [
  {
    id: 'check-register-report',
    name: 'Check Register Report',
    description: 'Download check register report by date range',
    icon: 'file-text',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)',
    isComingSoon: false
  },
  {
    id: 'job-processing-summary',
    name: 'Job Processing Summary',
    description: 'Download job processing summary by date range',
    icon: 'file-text',
    iconBg: 'var(--v4-common-yellow-color)',
    iconBgLight: 'rgba(250,156,16,0.12)',
    isComingSoon: false
  },
  {
    id: 'user-summary-report',
    name: 'User Summary Report',
    description: 'Download user summary report by date range',
    icon: 'file-text',
    iconBg: 'var(--v4-primary-brand-color)',
    iconBgLight: 'rgba(32,49,157,0.12)',
    isComingSoon: false
  }
];
