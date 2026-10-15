import { ICheckActionList } from 'src/app/modules/payments/model/payments';
import { environment } from 'src/environments/environment';
/**
 * @description Represents a class used to render row item actions conditionally.
 */
export class ActionItems {
  static checkActionsItems(): ICheckActionList[] {
    return [
      {
        label: 'Print',
        icon: 'print',
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
        icon: 'edit',
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
        icon: 'cancel',
        disableAt: {
          COMPLETED: ['ACH'],
          PENDING: [],
          PROCESSING: ['ACH'],
          CANCELED: [],
          FAILED: ['ACH', 'EMAIL CHECK'],
          SCHEDULED: []
        }
      },
      {
        label: 'Delete',
        icon: 'delete',
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
        icon: 'file_copy',
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
        icon: 'account_circle',
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
        label: 'Check Activity',
        icon: 'timer',
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
        icon: 'add_comment',
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
        icon: 'attach_file',
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
        icon: 'edit',
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
    ];
  }

  static checkActionsItemsForCSNHC(): ICheckActionList[] {
    return [
      {
        label: 'Print',
        icon: 'print',
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
        icon: 'edit',
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
        icon: 'delete',
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

  static checkActionsItemsForCSNHCClient(): ICheckActionList[] {
    return [
      {
        label: 'Print',
        icon: 'print',
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
}
