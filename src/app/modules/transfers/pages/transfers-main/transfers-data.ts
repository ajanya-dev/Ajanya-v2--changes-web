import { ITransferToItem } from 'src/app/modules/payments/model/payments';

export class TransferData {
  static getTransferToItems(): ITransferToItem[] {
    const transferToItems = [
      {
        label: 'Cloud Bank',
        transferComponent: 3,
        img: '../../../../assets/icon/zill.svg'
      },
      {
        label: 'Wallet',
        transferComponent: 2,
        fontawsomeIconClass: 'fa-solid fa-wallet icon-wallet',
        fontAWesomeV35IconData: {
          icon: ['fas', 'wallet'],
          colorVariable: 'common-violet-color'
        }
      },
      {
        label: 'Account',
        dropDownLabel: 'Local Bank',
        transferComponent: 1,
        fontawsomeIconClass:
          'fa-sharp fa-solid fa-building-columns icon-bank-acs',
        fontAWesomeV35IconData: {
          icon: ['fas', 'building-columns'],
          colorVariable: 'common-blue-color'
        }
      }
    ] as ITransferToItem[];
    return transferToItems;
  }
}
