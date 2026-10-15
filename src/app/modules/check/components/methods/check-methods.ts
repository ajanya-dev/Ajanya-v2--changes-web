import {
  IDtCellrendererBtn,
  IDtHeaderElements,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { environment } from 'src/environments/environment';

export class CheckTableList {
  /** HEADER ELEMENTS */
  static HeaderElements(): IDtHeaderElements {
    const buttons = [
      {
        name: 'New',
        id: 'id_btnNew',
        icon: 'fa fa-plus',
        cssClass: 'ocw-data-btn ocw-btn ocw-btn-light-green check_new_intro',
        toolTip: 'New check'
      },
      {
        name: 'Print',
        id: 'print_parent',
        icon: 'fa fa-print',
        cssClass: 'ocw-data-btn ocw-btn ocw-btn-light-blue btn-hide-desk',
        toolTip: 'Print',

        includes: [
          {
            id: 'id_printCheck',
            name: 'Print on Check Paper',
            icon: 'fa fa-print'
          },
          {
            id: 'id_printCheck_white',
            name: 'Print on White Paper',
            icon: 'fa fa-print'
          }
        ]
      },

      {
        name: 'Print-Check Paper',
        id: 'id_printCheck',
        icon: 'fa fa-print',
        cssClass:
          'ocw-data-btn ocw-btn ocw-btn-dark-blue btn-hide-tab check_print_intro',
        toolTip: 'Print your checks on blank check paper.'
      },
      {
        name: 'Print-White Paper',
        id: 'id_printCheck_white',
        icon: 'fa fa-print',
        cssClass: 'ocw-data-btn ocw-btn ocw-btn-light-blue btn-hide-tab',
        toolTip: 'Print your checks on white paper.'
      },
      {
        name: 'Send',
        icon: 'fa fa-envelope',
        cssClass: 'ocw-data-btn ocw-btn ocw-btn-dark-violet btn-hide-desk',
        id: 'send_parent',
        includes: [
          {
            id: 'id_mail',
            name: 'Mail Check',
            icon: 'fa fa-envelope',
            toolTip: 'Mail your checks via USPS or FedEx.'
          },
          {
            id: 'id_email',
            name: 'Email Check',
            icon: 'fa fa-envelope',
            toolTip:
              'E-Mail one time printable pdf check to your payee directly.'
          }
        ]
      },
      {
        name: 'Mail',
        id: 'id_mail',
        icon: 'fa fa-envelope',
        cssClass:
          'ocw-data-btn ocw-btn ocw-btn-dark  btn-hide-tab check_mail_intro',
        toolTip: 'Mail your checks via USPS or FedEx.'
      },
      {
        name: 'Email',
        id: 'id_email',
        icon: 'fa fa-envelope',
        cssClass: 'ocw-data-btn ocw-btn ocw-btn-light-dark btn-hide-tab',
        toolTip: 'E-Mail one time printable PDF Check to your payee directly'
      },
      {
        name: 'ACH / Direct Deposit',
        id: 'id_direct_deposit',
        icon: 'fa fa-bank',
        cssClass: 'ocw-data-btn ocw-btn ocw-btn-skyblue direct_depo_intro',
        toolTip: 'Direct Deposit.'
      },
      {
        name: '',
        id: 'id_btnVoid',
        icon: '',
        cssClass: '',
        RoundIcon: 'fa fa-ban',
        borderCss: 'ocw-round-btn-yellow',
        toolTip: 'Void your check.'
      },
      {
        name: '',
        icon: '',
        cssClass: '',
        id: 'id_btnTrash',
        RoundIcon: 'fa fa-trash',
        borderCss: 'ocw-round-btn-danger',
        toolTip: 'Delete your check.'
      },
      {
        name: '',
        icon: '',
        cssClass: '',
        id: 'id_mark_as_cleared',
        RoundIcon: 'fa fa-check',
        borderCss: 'ocw-round-btn-green',
        toolTip: 'Mark as posted will clear the check from your bank account'
      }
    ];
    const filteredButtons = buttons.map((button) => {
      const newButton = { ...button };
      if (newButton.includes) {
        newButton.includes = newButton.includes.filter(
          (item) => item.id !== 'id_printCheck_white'
        );
      }
      return newButton;
    });

    const compassHeaderButtons = filteredButtons.filter(
      (button) =>
        button.id !== 'id_printCheck_white' && button.id !== 'id_direct_deposit'
    );

    return {
      panelButtons: [],
      buttons:
        environment.env_id === 'compass' ? compassHeaderButtons : buttons,
      videoButton: [
        {
          slug: 'check'
        }
      ]
    };
  }

  /** FILTER CUSTOM COMPONENTS PROPERTIES */
  static floatingFilterCompProp(): IDtFloatingFilterProp {
    return {
      selectBox: [
        {
          id: 'cheques.cheque_status',
          values: [
            { value: '0', name: 'New' },
            { value: '1', name: 'Printed' },
            { value: '2', name: 'Void' },
            { value: '3', name: 'Archived' },
            { value: '4', name: 'Printing' },
            { value: '7', name: 'Mailed' },
            { value: '11', name: 'Refunded' },
            { value: '50', name: 'Schedule' },
            { value: '807', name: 'Mailed & Voided' },
            { value: 'emailed', name: 'Emailed' },
            { value: 'eprinted', name: 'E-Printed' },
            { value: 'requested', name: 'Requested' },
            { value: 'dd', name: 'DD' },
            { value: 'dd-funding', name: 'DD-Funding' },
            { value: 'dd-failed', name: 'DD-Failed' },
            { value: 'ddw', name: 'DDW' },
            { value: 'dd-depositing', name: 'DD-Depositing' },
            { value: 'dd-depositing-failed', name: 'DD-Deposit-F' },
            { value: 'ddc', name: 'DDC' },
            { value: 'show_posted', name: 'Posted' },
            { value: 'show_un_posted', name: 'Un-Posted' },
            { value: 'userapprovalstatus', name: 'Approval-required' },
            { value: 'unmapped-checks', name: 'Unmapped-checks' },
            { value: 'export', name: 'Exported' },
            { value: 'not-exported', name: 'Not Exported' },
            { value: 'show_blank', name: 'Blank' },
            { value: 'third_party', name: 'Imported' },
            { value: '508', name: 'Email Recurring' },
            { value: '509', name: 'Email Scheduled' },
          ]
        },
        {
          id: 'payee_default_payment_method',
          values: [
            { value: '1', name: 'Printable Check' },
            { value: '2', name: 'Mail Check by USPS' },
            { value: '3', name: 'Direct Deposit' },
            { value: '4', name: 'Email Check' }
          ]
        },
        {
          id: 'custom_field_position',
          values: [
            { value: '1', name: 'Dealer' },
            { value: '2', name: 'Manager' },
            { value: '3', name: 'Advisor' },
            { value: '4', name: 'Technician' }
          ]
        }
      ],
      selectDate: [
        { id: 'cheque_issue_date', initialRange: 'All Time' },
        { id: 'cheques.created_at', initialRange: 'All Time', isPrimary: true },
        { id: 'scheduled_checks.schedule_date', initialRange: 'All Time' }
      ]
    };
  }

  /** CELL RENDERER ACTION BUTTONS */
  static cellRendererActionBtn(): IDtCellrendererBtn {
    return {
      action: [
        {
          name: 'Print',
          id: 'RId_print',
          icon: 'fa-solid fa-print'
        },
        {
          name: 'Edit',
          id: 'RId_edit',
          icon: 'fa-solid fa-pen-to-square'
        },
        {
          name: 'Void',
          id: 'RId_void',
          icon: 'fa-solid fa-xmark'
        },
        {
          name: 'Delete',
          id: 'RId_delete',
          icon: 'fa-solid fa-trash'
        },
        {
          name: 'Pay by Credit Card',
          id: 'RId_card',
          icon: 'fa-solid fa-credit-card'
        },
        {
          name: 'Clone This Check',
          id: 'RId_clone',
          icon: 'fa-solid fa-clone'
        },
        {
          name:
            environment.env_id === 'compass'
              ? 'Vendor Summary'
              : 'Payee Summary',
          id: 'RId_summary',
          icon: 'fa-solid fa-user'
        },
        {
          name: 'Check Activity',
          id: 'RId_activity',
          icon: 'fa-solid fa-clock-rotate-left'
        },
        {
          name: 'Add Comment',
          id: 'RId_commentCheck',
          icon: 'fa-solid fa-comments'
        },
        {
          name: 'Add Attachment',
          id: 'RId_attachmentCheck',
          icon: 'fa-solid fa-paperclip'
        },
        {
          name: 'Proof of Mail',
          id: 'RId_printReceipt',
          icon: 'fa-solid fa-print'
        }
      ]
    };
  }
}

/**
 * An object that maps filter names (keys) to an array of check status codes (values).
 */
export const statusCodesWithFilter = {
  0: [0],
  1: [1],
  2: [2,807],
  3: [3],
  4: [4],
  7: [7],
  11: [11],
  50: [50],
  807: [807],
  emailed: [12, 13, 500, 501, 502, 503, 504],
  eprinted: [14, 505, 506],
  requested: [520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530],
  userapprovalstatus: [35, 36, 37],
  dd: [
    300, 301, 302, 303, 304, 305, 306, 308, 311, 312, 400, 410, 412, 420, 430,
    432, 433, 440
  ],
  ddc: [304, 431],
  'dd-funding': [410],
  'dd-failed': [412],
  ddw: [420],
  'dd-depositing': [430],
  'dd-depositing-failed': [432]
};

/**
 * An array that contains used check status codes.
 */
export const checkStatus = [
  0, 1, 2, 3, 4, 7, 11, 12, 13, 14, 35, 36, 37, 50, 300, 301, 302, 303, 304, 305,
  306, 308, 311, 312, 400, 410, 412, 420, 430, 431, 432, 433, 440, 500, 501,
  502, 503, 504, 505, 506, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530,
  807
];
