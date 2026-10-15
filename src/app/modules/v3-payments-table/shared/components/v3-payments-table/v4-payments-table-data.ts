import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { IPayFromItem } from 'src/app/modules/payments/model/payments';

export class V4PaymentsTableData {
  static dynamicWhiteLabelService = new DynamicWhiteLabelService();

  static getPayFromItems(): IPayFromItem[] {
    const payFromItems: IPayFromItem[] = [
      {
        label: 'Wallet',
        shortLabel: 'Wallet',
        id: 'wallet',
        sourceType: 'WALLET',
        fontawsomeIconClass: 'fa-solid fa-wallet icon-wallet',
        fontawesomeIconDataV35: {
          icon: ['fas', 'wallet'],
          color: 'common-violet-color'
        },
        fontawesomeIconDataV4: {
          lucideIcon: 'wallet',
          color: 'v4-primary-brand-color'
        },
        payOptions: [
          {
            label: 'ACH / DD',
            id: 'ach',
            fontawsomeIconClass: 'f fa-solid fa-building-columns'
          },
          {
            label: 'Wire',
            id: 'wire',
            fontawsomeIconClass: 'fa-solid fa-globe'
          },
          {
            label: 'Virtual Card',
            id: 'virtualCard',
            fontawsomeIconClass: 'fa-solid fa-credit-card-front'
          },
          {
            label: 'Check Mail',
            id: 'checkMail',
            fontawsomeIconClass: 'fa-solid fa-money-check-dollar'
          },
          {
            label: 'Check Email',
            id: 'checkEmail',
            fontawsomeIconClass: 'fa-solid fa-money-check-dollar'
          },
          {
            label: 'Check Print',
            id: 'checkPrint',
            fontawsomeIconClass: 'fa-solid fa-money-check-dollar'
          }
        ]
      },
      {
        label: 'Bank Account',
        shortLabel: 'Bank',
        id: 'bankaccount',
        sourceType: 'BANK',
        fontawsomeIconClass:
          'fa-sharp fa-solid fa-building-columns icon-bank-acs',
        fontawesomeIconDataV35: {
          icon: ['fas', 'building-columns'],
          color: 'common-blue-color'
        },
        fontawesomeIconDataV4: {
          lucideIcon: 'building-2',
          color: 'v4-primary-brand-color'
        },
        payOptions: [
          {
            label: 'ACH / DD',
            id: 'ach',
            fontawsomeIconClass: 'f fa-solid fa-building-columns'
          },
          {
            label: 'Check',
            id: 'check',
            fontawsomeIconClass: 'fa-solid fa-money-check-dollar'
          }
        ]
      },
      {
        label: 'Credit Card',
        shortLabel: 'Card',
        id: 'card',
        sourceType: 'CARD',
        fontawsomeIconClass: 'fa-solid fa-credit-card-front icon-cards',
        fontawesomeIconDataV35: {
          icon: ['fas', 'credit-card'],
          color: 'common-yellow-color'
        },
        fontawesomeIconDataV4: {
          lucideIcon: 'credit-card',
          color: 'v4-primary-brand-color'
        },
        payOptions: [
          {
            label: 'ACH / DD',
            id: 'ach',
            fontawsomeIconClass: 'f fa-solid fa-building-columns'
          },
          {
            label: 'Wire',
            id: 'wire',
            fontawsomeIconClass: 'fa-solid fa-globe ',
            extraId: 'card-wire-transfer'
          },
          // {
          //   label: 'Virtual Card',
          //   id: 'virtualCard',
          //   fontawsomeIconClass: 'fa-solid fa-credit-card-front'
          // },
          {
            label: 'Check Mail',
            id: 'checkMail',
            fontawsomeIconClass: 'fa-solid fa-money-check-dollar'
          }
        ]
      }
    ];

    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isFilterCardFromDropdown'
      )
    ) {
      return payFromItems.filter((ele) => ele.id !== 'card');
    }
    return payFromItems;
  }
}

export const paymentsTableStatus = [
  { value: '0', name: 'PENDING' },
  { value: '1', name: 'PROCESSING' },
  { value: '2', name: 'COMPLETED' },
  { value: '3', name: 'CANCELED' },
  { value: '4', name: 'FAILED' },
  { value: '6', name: 'APPROVAL REQUIRED' },
  { value: '7', name: 'APPROVED' },
  { value: '8', name: 'REJECTED' }
];
