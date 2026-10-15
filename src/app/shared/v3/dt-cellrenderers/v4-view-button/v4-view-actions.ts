import { ICheckActionList } from 'src/app/modules/payments/model/payments';
import { environment } from 'src/environments/environment';

/**
 * @description Lucide icon name mapping for each action label.
 */
export const ACTION_LUCIDE_ICONS: Record<string, string> = {
  Print: 'printer',
  Edit: 'pencil',
  Void: 'ban',
  Delete: 'trash-2',
  'Clone This Check': 'copy',
  'Payee Summary': 'circle-user',
  'Vendor Summary': 'circle-user',
  'Audit Activity': 'activity',
  'Add Comment': 'message-square',
  'Add Attachment': 'paperclip',
  'Send Mail Payment Proof': 'mail',
  'Send Payment Proof': 'receipt',
  'Edit Payee': 'square-pen',
  'Get Signed Receipt': 'file-text',
  'View Receipt': 'file-text',
  Approve: 'check',
  Reject: 'x',
  Clone: 'copy',
  're-email': 'send',
  'force-email': 'check'
};

/**
 * @description Tooltip text for each action label.
 */
export const ACTION_TOOLTIPS: Record<string, string> = {
  Print: 'Print your {{itemType}} instantly online on check paper using your own printer.',
  Edit: 'Quickly update the amount, date, memo, or other details online.',
  Void: "Void this payment so it can't be used. It stays in your ledger for audit, left out of totals.",
  Delete: 'Remove this {{itemType}} from your account in one click.',
  'Clone This Check': 'Instantly duplicate this {{itemType}} — just update what you need, like the amount or date.',
  'Payee Summary': "See this payee's full payment history at a glance.",
  'Vendor Summary': "See this payee's full payment history at a glance.",
  'Audit Activity': 'See every action on this {{itemType}} — who, what, and when — at a glance.',
  'Add Comment': 'Add a quick note to this {{itemType}} in seconds.',
  'Add Attachment': 'Instantly attach an invoice, receipt, or other document to this {{itemType}}.',
  'Send Payment Proof': 'Instantly send the recipient proof of payment online.',
  'Edit Payee': "Quickly update this payee's name, address, or other saved details.",
  'Get Signed Receipt': 'Request a signed receipt from the recipient in one click.',
  'Send/Req Proof of Delivery': 'Instantly send or request proof of delivery online.'
};

/**
 * @description Represents a class used to render row item actions conditionally (v4 version with Lucide icons).
 */
export class V4ActionItems {
  static checkActionsItems(): ICheckActionList[] {
    return [
      {
        label: 'Print',
        icon: 'printer',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label: 'Edit',
        icon: 'pencil',
        disableAt: {
          COMPLETED: ['EMAIL CHECK', 'ACH', 'MAIL CHECK'],
          PENDING: [],
          PROCESSING: ['MAIL CHECK', 'ACH'],
          CANCELED: [],
          FAILED: ['ACH', 'EMAIL CHECK'],
          SCHEDULED: []
        }
      },
      {
        label: 'Void',
        icon: 'ban',
        disableAt: {
          COMPLETED: ['ACH', 'MAIL CHECK'],
          PENDING: [],
          PROCESSING: ['ACH'],
          CANCELED: [],
          FAILED: ['ACH', 'EMAIL CHECK'],
          SCHEDULED: []
        }
      },
      {
        label: 'Delete',
        icon: 'trash-2',
        disableAt: {
          COMPLETED: ['ACH', 'MAIL CHECK'],
          PENDING: [],
          PROCESSING: ['MAIL CHECK', 'ACH'],
          CANCELED: [],
          FAILED: ['ACH', 'EMAIL CHECK'],
          SCHEDULED: []
        }
      },
      {
        label: 'Clone This Check',
        icon: 'copy',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label:
          environment.env_id === 'compass' ? 'Vendor Summary' : 'Payee Summary',
        icon: 'circle-user',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label: 'Audit Activity',
        icon: 'activity',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label: 'Add Comment',
        icon: 'message-square',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label: 'Add Attachment',
        icon: 'paperclip',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label: 'Send Mail Payment Proof',
        icon: 'mail',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label: 'Send Payment Proof',
        icon: 'receipt',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label: 'Edit Payee',
        icon: 'square-pen',
        disableAt: {
          COMPLETED: ['EMAIL CHECK', 'ACH', 'MAIL CHECK'],
          PENDING: [],
          PROCESSING: ['MAIL CHECK', 'ACH'],
          CANCELED: [],
          FAILED: ['ACH', 'EMAIL CHECK'],
          SCHEDULED: []
        }
      },
      {
        label: 'Get Signed Receipt',
        icon: 'file-text',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      }
    ];
  }

  static checkActionsItemsForCSNHC(): ICheckActionList[] {
    return [
      {
        label: 'Print',
        icon: 'printer',
        disableAt: {
          COMPLETED: [],
          PENDING: [],
          PROCESSING: [],
          CANCELED: [],
          FAILED: [],
          SCHEDULED: []
        }
      },
      {
        label: 'Edit',
        icon: 'pencil',
        disableAt: {
          COMPLETED: ['EMAIL CHECK', 'ACH', 'MAIL CHECK'],
          PENDING: [],
          PROCESSING: ['MAIL CHECK', 'ACH'],
          CANCELED: [],
          FAILED: ['ACH', 'EMAIL CHECK'],
          SCHEDULED: []
        }
      },
      {
        label: 'Delete',
        icon: 'trash-2',
        disableAt: {
          COMPLETED: ['ACH', 'MAIL CHECK'],
          PENDING: [],
          PROCESSING: ['MAIL CHECK', 'ACH'],
          CANCELED: [],
          FAILED: ['ACH', 'EMAIL CHECK'],
          SCHEDULED: []
        }
      }
    ];
  }
}
