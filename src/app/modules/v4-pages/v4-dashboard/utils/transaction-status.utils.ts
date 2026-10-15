import { PAYMENTS_STATUS_MAP } from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { ICheckStatus } from 'src/app/modules/check/model/check';

export interface StatusBadge {
  label: string;
  bg: string;
  textColor: string;
}

const SENT_PAYMENT_TYPES = ['send-payment', 'virtual-card', 'bill'];

export function isSentPayment(type: string): boolean {
  return SENT_PAYMENT_TYPES.includes(type);
}

export function getStatusBadge(status: number, statusDescription: string = ''): StatusBadge {
  if (statusDescription.toUpperCase() === 'PENDING') {
    return {
      label: 'Pending',
      bg: 'var(--v4-badge-warning-bg-color)',
      textColor: 'var(--v4-badge-warning-text-color)'
    };
  }

  switch (status) {
    case 0:
      return {
        label: 'Pending',
        bg: 'var(--v4-badge-warning-bg-color)',
        textColor: 'var(--v4-badge-warning-text-color)'
      };
    case 1:
      return {
        label: 'Processing',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-badge-info-text-color)'
      };
    case 2:
      return {
        label: 'Completed',
        bg: 'var(--v4-badge-success-bg-color)',
        textColor: 'var(--v4-badge-success-text-color)'
      };
    case 3:
      return {
        label: 'Canceled',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-badge-error-text-color)'
      };
    case 4:
      return {
        label: 'Failed',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-badge-error-text-color)'
      };
    case 5:
      return {
        label: 'Refunded',
        bg: 'var(--v4-badge-success-bg-color)',
        textColor: 'var(--v4-badge-success-text-color)'
      };
    case 6:
      return {
        label: 'Approval Required',
        bg: 'var(--v4-badge-warning-bg-color)',
        textColor: 'var(--v4-badge-warning-text-color)'
      };
    case 7:
      return {
        label: 'Approved',
        bg: 'var(--v4-badge-success-bg-color)',
        textColor: 'var(--v4-badge-success-text-color)'
      };
    case 8:
      return {
        label: 'Rejected',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-badge-error-text-color)'
      };
    case 9:
      return {
        label: 'Set Recurring',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-badge-info-text-color)'
      };
    case 10:
      return {
        label: 'Scheduled',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-badge-info-text-color)'
      };
    default:
      return {
        label: 'Processing',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-badge-info-text-color)'
      };
  }
}

export interface InvoiceData {
  paid: string;
  is_emailed: number;
  is_mailed: number;
  balance: string;
}

export function getInvoiceStatusBadge(status: number, invoiceData?: InvoiceData): StatusBadge {
  const paid = parseFloat(invoiceData?.paid || '0');
  const balance = parseFloat(invoiceData?.balance || '0');
  const isEmailed = invoiceData?.is_emailed === 1;
  const isMailed = invoiceData?.is_mailed === 1;

  if (status === 1) {
    if (paid > 0) {
      return {
        label: 'Partially Paid',
        bg: 'var(--v4-badge-warning-bg-color)',
        textColor: 'var(--v4-badge-warning-text-color)'
      };
    }
    if (isEmailed) {
      return {
        label: 'Emailed',
        bg: 'var(--v4-badge-sky-bg-color)',
        textColor: 'var(--v4-badge-sky-text-color)'
      };
    }
    if (isMailed) {
      return {
        label: 'Mailed',
        bg: 'var(--v4-badge-sky-bg-color)',
        textColor: 'var(--v4-badge-sky-text-color)'
      };
    }
    if (balance > 0) {
      return {
        label: 'New',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-badge-info-text-color)'
      };
    }
    return {
      label: 'Pay',
      bg: 'var(--v4-badge-info-bg-color)',
      textColor: 'var(--v4-badge-info-text-color)'
    };
  }

  switch (status) {
    case 2:
      return {
        label: 'Paid',
        bg: 'var(--v4-badge-success-bg-color)',
        textColor: 'var(--v4-badge-success-text-color)'
      };
    case 3:
      return {
        label: 'Voided',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-badge-error-text-color)'
      };
    case 6:
      return {
        label: 'Rejected',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-badge-error-text-color)'
      };
    case 7:
    case 10:
    case 11:
    case 12:
    case 13:
    case 14:
    case 16:
      return {
        label: 'Imported',
        bg: 'var(--v4-badge-neutral-bg-color)',
        textColor: 'var(--v4-badge-neutral-text-color)'
      };
    default:
      return {
        label: 'New',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-badge-info-text-color)'
      };
  }
}

export function getCheckDraftStatusBadge(status: number): StatusBadge {
  switch (status) {
    case 0:
      return {
        label: 'New',
        bg: 'var(--v4-badge-accent-bg-color)',
        textColor: 'var(--v4-common-violet-color)'
      };
    case 1:
      return {
        label: 'Printed',
        bg: 'var(--v4-badge-success-bg-color)',
        textColor: 'var(--v4-common-green-color)'
      };
    case 5:
      return {
        label: 'PA',
        bg: 'var(--v4-badge-warning-bg-color)',
        textColor: 'var(--v4-common-yellow-color)'
      };
    case 6:
      return {
        label: 'AV',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-common-blue-color)'
      };
    case 7:
      return {
        label: 'Approved',
        bg: 'var(--v4-badge-success-bg-color)',
        textColor: 'var(--v4-common-green-color)'
      };
    case 8:
      return {
        label: 'Rejected',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-common-red-color)'
      };
    case 10:
      return {
        label: 'DD Initiated',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-common-blue-color)'
      };
    case 11:
      return {
        label: 'DD Completed',
        bg: 'var(--v4-badge-success-bg-color)',
        textColor: 'var(--v4-common-green-color)'
      };
    case 12:
      return {
        label: 'DD Rejected',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-common-red-color)'
      };
    case 13:
      return {
        label: 'DD Returned',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-common-red-color)'
      };
    case 15:
      return {
        label: 'VOIDED',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-common-red-color)'
      };
    case 20:
      return {
        label: 'Permission Needed',
        bg: 'var(--v4-badge-error-bg-color)',
        textColor: 'var(--v4-common-red-color)'
      };
    default:
      return {
        label: 'New',
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-common-blue-color)'
      };
  }
}

export function getPaymentStatusBadge(statusDescription: string): StatusBadge {
  const desc = (statusDescription || '').toUpperCase();
  const badge = PAYMENTS_STATUS_MAP[desc] ?? PAYMENTS_STATUS_MAP[statusDescription];
  
  if (badge) {
    return {
      label: badge.status,
      bg: badge.bgColor,
      textColor: badge.textColor
    };
  }

  const label = formatStatusText(statusDescription) || 'Pending';
  const colors = statusNameToColors(label);
  return { label, ...colors };
}

const CHECK_STATUS_COLOR_MAP: Record<string, { bg: string; textColor: string }> = {
  Pending: { bg: 'var(--v4-badge-warning-bg-color)', textColor: 'var(--v4-common-yellow-color)' },
  PA: { bg: 'var(--v4-badge-warning-bg-color)', textColor: 'var(--v4-common-yellow-color)' },
  DD: { bg: 'var(--v4-badge-info-bg-color)', textColor: 'var(--v4-common-blue-color)' },
  Processing: { bg: 'var(--v4-badge-info-bg-color)', textColor: 'var(--v4-common-blue-color)' },
  AV: { bg: 'var(--v4-badge-info-bg-color)', textColor: 'var(--v4-common-blue-color)' },
  Printed: { bg: 'var(--v4-badge-success-bg-color)', textColor: 'var(--v4-common-green-color)' },
  Mailed: { bg: 'var(--v4-badge-success-bg-color)', textColor: 'var(--v4-common-green-color)' },
  Emailed: { bg: 'var(--v4-badge-success-bg-color)', textColor: 'var(--v4-common-green-color)' },
  DDC: { bg: 'var(--v4-badge-success-bg-color)', textColor: 'var(--v4-common-green-color)' },
  'DD Completed': { bg: 'var(--v4-badge-success-bg-color)', textColor: 'var(--v4-common-green-color)' },
  Approved: { bg: 'var(--v4-badge-success-bg-color)', textColor: 'var(--v4-common-green-color)' },
  'DD Rejected': { bg: 'var(--v4-badge-error-bg-color)', textColor: 'var(--v4-common-red-color)' },
  'DD Returned': { bg: 'var(--v4-badge-error-bg-color)', textColor: 'var(--v4-common-red-color)' },
  VOIDED: { bg: 'var(--v4-badge-error-bg-color)', textColor: 'var(--v4-common-red-color)' },
  Rejected: { bg: 'var(--v4-badge-error-bg-color)', textColor: 'var(--v4-common-red-color)' },
  Failed: { bg: 'var(--v4-badge-error-bg-color)', textColor: 'var(--v4-common-red-color)' },
  'Permission Needed': { bg: 'var(--v4-badge-error-bg-color)', textColor: 'var(--v4-common-red-color)' }
};

export function getCheckStatusBadgeFromApi(
  checkStatusMap: Record<string, ICheckStatus> | null,
  statusCode: number,
  fallbackDescription: string
): StatusBadge {
  if (!checkStatusMap) {
    return getPaymentStatusBadge(fallbackDescription);
  }

  const checkStatus = checkStatusMap[statusCode];
  if (!checkStatus) {
    return getPaymentStatusBadge(fallbackDescription);
  }

  let label = checkStatus.statusShortDescription;

  if (label === 'New' || label === 'Pay') {
    label = 'Pending';
  }

  label = formatStatusText(label);

  const colors = CHECK_STATUS_COLOR_MAP[label] ?? statusNameToColors(label);

  return { label, ...colors };
}

export function getSourceBadge(source: string): { bg: string; textColor: string } {
  switch (source.toUpperCase()) {
    case 'BANK':
      return {
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-common-blue-color)'
      };
    case 'WALLET':
      return {
        bg: 'var(--v4-badge-success-bg-color)',
        textColor: 'var(--v4-common-green-color)'
      };
    default:
      return {
        bg: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-common-blue-color)'
      };
  }
}

export function formatStatusText(value: string): string {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map(word => {
      if (word.length <= 3) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function statusNameToColors(statusName: string): { bg: string; textColor: string } {
  const s = statusName.toLowerCase().replace(/[-_\s]+/g, ' ').trim();

  if (['completed', 'success', 'active', 'approved', 'settled', 'cashed', 'deposited', 'printed', 'mailed', 'emailed', 'ddc','accepted'].some(k => s.includes(k)))
    return { bg: 'var(--v4-badge-success-bg-color)', textColor: 'var(--v4-common-green-color)' };

  if (['void', 'failed', 'rejected', 'canceled', 'cancelled', 'returned', 'declined', 'inactive', 'stopped'].some(k => s.includes(k)))
    return { bg: 'var(--v4-badge-error-bg-color)', textColor: 'var(--v4-common-red-color)' };

  if (['pending', 'approval required', 'approval', 'scheduled', 'hold', 'requested'].some(k => s.includes(k)))
    return { bg: 'var(--v4-badge-warning-bg-color)', textColor: 'var(--v4-common-yellow-color)' };

  if (['saved', 'new', 'draft'].some(k => s.includes(k)))
    return { bg: 'var(--v4-badge-accent-bg-color)', textColor: 'var(--v4-common-violet-color)' };

  return { bg: 'var(--v4-badge-info-bg-color)', textColor: 'var(--v4-common-blue-color)' };
}
