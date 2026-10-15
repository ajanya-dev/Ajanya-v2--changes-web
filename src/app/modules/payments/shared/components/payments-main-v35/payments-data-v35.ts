import {
  IPayFromItem,
  IReceivePayItem
} from 'src/app/modules/payments/model/payments';

export class PaymentData {
  static getPayFromItems(): IPayFromItem[] {
    const payFromItems: IPayFromItem[] = [
      {
        label: 'Bank Account',
        id: 'bankaccount',
        shortLabel: 'Bank',
        fontawesomeIconDataV35: {
          icon: ['fas', 'building-columns']
        },
        payOptions: [
          {
            label: 'Check',
            id: 'check',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            },
            isSelectable: true
          },
          {
            label: 'ACH / Direct Deposit',
            id: 'ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            toolTip:
              '• Standard electronic bank transfer. \n• Takes 1-3 business days to arrive.',
            isSelectable: true
          },
          {
            label: 'Wire',
            id: 'wire',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            toolTip:
              '• Immediate bank-to-bank transfer. \n• Available within hours.',
            isSelectable: false
          },
          {
            label: 'Virtual Card',
            id: 'virtual-card',
            fontawesomeIconDataV35: {
              icon: ['fas', 'credit-card-front']
            },
            toolTip:
              '• Digital payment card via email. \n• Recipient can use immediately online.',
            isSelectable: false
          },
          {
            label: 'Real Time Instant Payment',
            id: 'rtp',
            fontawesomeIconDataV35: {
              icon: ['fas', 'circle-dollar']
            },
            toolTip:
              '• Money available immediately 24/7. \n• Instant transfer any time.',
            isSelectable: false
          },
          {
            label: 'Same Day ACH',
            id: 'same-ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            toolTip:
              '• Cut-off: 10:30 AM PST (12:30 PM CST). \n• Same-day processing if submitted on time. \n• Late submissions process next business day.',
            isSelectable: false
          },
          {
            label: 'International Payment',
            id: 'international-payment',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            toolTip:
              '• Send money outside United States. \n• Includes currency conversion. \n• Wallet to Bank transfer.',
            isSelectable: false
          }
        ]
      },
      {
        label: 'Credit Card',
        id: 'card',
        shortLabel: 'Card',
        fontawesomeIconDataV35: {
          icon: ['fas', 'credit-card-front']
        },
        payOptions: [
          {
            label: 'Same Day ACH',
            id: 'same-ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            toolTip:
              '• Cut-off: 10:30 AM PST (12:30 PM CST). \n• Same-day processing if submitted on time. \n• Late submissions process next business day.',
            isSelectable: false
          },
          {
            label: 'ACH / Direct Deposit',
            id: 'ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            toolTip:
              '• Standard electronic bank transfer. \n• Takes 1-3 business days to arrive.',
            isSelectable: true
          },
          {
            label: 'Wire',
            id: 'wire',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            toolTip:
              '• Immediate bank-to-bank transfer. \n• Available within hours.',
            isSelectable: true
          },
          {
            label: 'Virtual Card',
            id: 'virtual-card',
            fontawesomeIconDataV35: {
              icon: ['fas', 'credit-card-front']
            },
            toolTip:
              '• Digital payment card via email. \n• Recipient can use immediately online.',
            isSelectable: false
          },
          {
            label: 'Check Mail (USPS / FedEx)',
            id: 'check_mail',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            },
            toolTip:
              '• Physical Check Mailed to the recipient. \n• Cut-off Time: USPS – 12:30 PM CST | FedEx – 1:00 PM CST.',
            isSelectable: true
          },
          {
            label: 'Real Time Instant Payment',
            id: 'rtp',
            fontawesomeIconDataV35: {
              icon: ['fas', 'circle-dollar']
            },
            toolTip:
              '• Money available immediately 24/7. \n• Instant transfer any time.',
            isSelectable: false
          },
          {
            label: 'International Payment',
            id: 'international-payment',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            toolTip:
              '• Send money outside United States. \n• Includes currency conversion. \n• Wallet to Bank transfer.',
            isSelectable: false
          },
          {
            label: 'Check Print',
            id: 'check_print',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            },
            toolTip:
              '• Instantly print the check using your own printer. \n• You can use either check paper or regular white paper.',
            isSelectable: false
          }
        ]
      },
      {
        label: 'Wallet',
        id: 'wallet',
        shortLabel: 'Wallet',
        fontawesomeIconDataV35: {
          icon: ['fas', 'wallet']
        },
        payOptions: [
          {
            label: 'Same Day ACH',
            id: 'same-ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            toolTip:
              '• Cut-off: 10:30 AM PST (12:30 PM CST). \n• Same-day processing if submitted on time. \n• Late submissions process next business day.',
            isSelectable: true
          },
          {
            label: 'ACH / Direct Deposit',
            id: 'ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            toolTip:
              '• Standard electronic bank transfer. \n• Takes 1-3 business days to arrive.',
            isSelectable: true
          },
          {
            label: 'Wire',
            id: 'wire',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            toolTip:
              '• Immediate bank-to-bank transfer. \n• Available within hours.',
            isSelectable: true
          },
          {
            label: 'Real Time Instant Payment',
            id: 'rtp',
            fontawesomeIconDataV35: {
              icon: ['fas', 'circle-dollar']
            },
            toolTip:
              '• Money available immediately 24/7. \n• Instant transfer any time.',
            isSelectable: true
          },
          {
            label: 'International Payment',
            id: 'international-payment',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            toolTip:
              '• Send money outside United States. \n• Includes currency conversion. \n• Wallet to Bank transfer.',
            isSelectable: true
          },
          {
            label: 'Virtual Card',
            id: 'virtual-card',
            fontawesomeIconDataV35: {
              icon: ['fas', 'credit-card-front']
            },
            toolTip:
              '• Digital payment card via email. \n• Recipient can use immediately online.',
            isSelectable: true
          },
          {
            label: 'Check Mail (USPS / FedEx)',
            id: 'check_mail',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            },
            toolTip:
              '• Physical Check Mailed to the recipient. \n• Cut-off Time: USPS – 12:30 PM CST | FedEx – 1:00 PM CST.',
            isSelectable: true
          },
          {
            label: 'Check Email (Instant)',
            id: 'check_email',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            },
            toolTip:
              '• Check is instantly emailed to the recipient. \n• Recipient can print and deposit it easily.',
            isSelectable: true
          },
          {
            label: 'Check Print (Yourself)',
            id: 'check_print',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            },
            toolTip:
              '• Instantly print the check using your own printer. \n• You can use either check paper or regular white paper.',
            isSelectable: true
          }
        ]
      },
      {
        label: 'Cloud Bank',
        id: 'cloud',
        shortLabel: 'Cloud',
        img: '../../../../assets/icon/zill.svg',
        payOptions: [
          {
            label: 'ACH',
            id: 'ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            isSelectable: true
          },
          {
            label: 'Wire - Domestic',
            id: 'domestic',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            isSelectable: true
          },
          {
            label: 'Wire - International',
            id: 'international',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            isSelectable: true
          },
          {
            label: 'Virtual Card',
            id: 'virtual-card',
            fontawesomeIconDataV35: {
              icon: ['fas', 'credit-card-front']
            },
            isSelectable: false
          },
          {
            label: 'Real Time Instant Payment',
            id: 'rtp',
            fontawesomeIconDataV35: {
              icon: ['fas', 'circle-dollar']
            },
            toolTip:
              '• Money available immediately 24/7. \n• Instant transfer any time.',
            isSelectable: false
          },
          {
            label: 'Same Day ACH',
            id: 'same-ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            toolTip:
              '• Cut-off: 10:30 AM PST (12:30 PM CST). \n• Same-day processing if submitted on time. \n• Late submissions process next business day.',
            isSelectable: false
          },
          {
            label: 'International Payment',
            id: 'international-payment',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            toolTip:
              '• Send money outside United States. \n• Includes currency conversion. \n• Wallet to Bank transfer.',
            isSelectable: false
          },
          {
            label: 'Check Mail (USPS / FedEx)',
            id: 'check_mail',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            },
            toolTip:
              '• Physical Check Mailed to the recipient. \n• Cut-off Time: USPS – 12:30 PM CST | FedEx – 1:00 PM CST.',
            isSelectable: false
          },
          {
            label: 'Check Print',
            id: 'check_print',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            },
            toolTip:
              '• Instantly print the check using your own printer. \n• You can use either check paper or regular white paper.',
            isSelectable: false
          }
          // {
          //   label: 'Instant Cloud Transfer',
          //   id: 'intra_bank',
          //   fontawesomeIconDataV35: {
          //     icon: ['fas', 'globe']
          //   }
          // }
        ]
        //   {
        //   label: "ACH",
        //   id: 'ach',
        //   fontawesomeIconDataV35: {
        //     icon: ['fas', 'building-columns'],
        //   },
        // },
        // {
        //   label: "Wire - Domestic",
        //   id: 'domestic',
        //   fontawesomeIconDataV35: {
        //     icon: ['fas', 'globe'],
        //   },
        // },
        // },
        // {
        //   label: "Debit Card",
        //   id: 'debit_card',
        //   fontawesomeIconDataV35: {
        //     icon: ['fas', 'credit-card-front'],
        //   },
        // },
        // {
        //   label: "Check Mail",
        //   id: 'check_mail',
        //   fontawesomeIconDataV35: {
        //     icon: ['fas', 'money-check-dollar'],
        //   },
        // },
        // {
        //   label: "Gift Card",
        //   fontawesomeIconDataV35: {
        //     icon: ['fas', 'credit-card-front'],
        //   },
        //   id: 'gift_card',
        // },
        // {
        //   label: "Intra Bank",
        //   img: "../../../../assets/icon/zill.svg",
        //   id: 'intra_bank',
        // }]
      }
    ];
    return payFromItems;
  }

  static getReceiveToItems(): IReceivePayItem[] {
    return [
      {
        label: 'Wallet',
        id: 'bank',
        fontawesomeIconDataV35: {
          icon: ['fas', 'wallet']
        },
        payOptions: [
          {
            label: 'Payee',
            id: 'payer',
            fontawesomeIconDataV35: {
              icon: ['fas', 'user']
            }
          },
          {
            label: 'Email',
            id: 'email',
            fontawesomeIconDataV35: {
              icon: ['fas', 'envelope']
            }
          },
          {
            label: 'SMS',
            id: 'sms',
            fontawesomeIconDataV35: {
              icon: ['fas', 'message']
            }
          }
        ]
      }
      // {
      //   label: "Cloud - Debit Pull",
      //   id: 'debit_pull',
      //   img: "../../../../assets/icon/zill.svg",
      //   payOptions: []
      //   label: "Payer",
      //   id: 'payer',
      //   fontawesomeIconDataV35: {
      //     icon: ['fas', 'user'],
      //   },
      // }]

      // },
      // {
      //   label: "Cloud - Check Deposit",
      //   id: 'check_deposit',
      //   img: "../../../../assets/icon/zill.svg",
      //   payOptions: []
      //   {
      //   label: "Payer",
      //   id: 'payer',
      //   fontawesomeIconDataV35: {
      //     icon: ['fas', 'user'],
      //   },
      // }

      // },
    ];
  }

  static enablePaymentMethods(pageId?: TPageId): { [key: string]: string } {
    const paymentMethods: { [key: string]: string } = {
      isCloudBankEnabled: 'cloud',
      internationalWireEnabled: 'international',
      debitPullEnabled: 'debit_pull',
      debitPushEnabled: 'debit_card',
      checkDepositEnabled: 'check_deposit',
      isVirtualCardSendEnabled: 'virtual-card',
      isCheckMailSendEnabled: 'check_mail',
      isPaymentWireTransferEnabled: 'wire',
      isCardRailPaymentWireTransferEnabled:'card-wire-transfer',
      isPayrollWireTransferEnabled: 'wire',
      isPaymentRtpTransferEnabled: 'rtp',
      isPayrollRtpTransferEnabled: 'rtp',
      isInternationalPaymentEnabled: 'international-payment',
      isWalletWirePaymentEnabled: 'wallet-wire',
    };
    if (pageId === 'payment_home_page') {
      delete paymentMethods.isPayrollWireTransferEnabled;
      delete paymentMethods.isPayrollRtpTransferEnabled;
    }
    if (pageId === 'payroll_by_cards_page') {
      delete paymentMethods.isPaymentWireTransferEnabled;
      delete paymentMethods.isPaymentRtpTransferEnabled;
      delete paymentMethods.isCardRailPaymentWireTransferEnabled;
    }

    return paymentMethods;
  }

  static getCompassPayFromItems(): IPayFromItem[] {
    const payFromItems: IPayFromItem[] = [
      {
        label: 'Bank Account',
        id: 'bankaccount',
        shortLabel: 'Bank',
        fontawesomeIconDataV35: {
          icon: ['fas', 'building-columns']
        },
        payOptions: [
          {
            label: 'Check',
            id: 'check',
            fontawesomeIconDataV35: {
              icon: ['fas', 'money-check-dollar']
            }
          },
          {
            label: 'ACH / Direct Deposit',
            id: 'ach',
            fontawesomeIconDataV35: {
              icon: ['fas', 'building-columns']
            },
            toolTip:
              '• Standard electronic bank transfer. \n• Takes 1-3 business days to arrive.'
          },
          {
            label: 'Wire',
            id: 'wire',
            fontawesomeIconDataV35: {
              icon: ['fas', 'globe']
            },
            toolTip:
              '• Immediate bank-to-bank transfer. \n• Available within hours.'
          },
          {
            label: 'Virtual Card',
            id: 'virtual-card',
            fontawesomeIconDataV35: {
              icon: ['fas', 'credit-card-front']
            },
            toolTip:
              '• Digital payment card via email. \n• Recipient can use immediately online.'
          }
        ]
      }
    ];
    return payFromItems;
  }
}

export type TPageId = 'payment_home_page' | 'payroll_by_cards_page';
