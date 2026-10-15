import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import {
  CommonButtonV35Component,
  TCButtonType
} from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

import {
  IconLookup,
  IconName,
  IconPrefix,
  faArrowsRotate,
  faCaretDown,
  faEye
} from '@fortawesome/pro-solid-svg-icons';
import { MatTabsModule } from '@angular/material/tabs';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { IIntroBankAccount, introBanksList } from './intro-bank';
import { BankDataV35Service } from '../../../bank/bank-v3/v35-services/bank-data-v35.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    V35CommonDropDownSelectorComponent,
    FontAwesomeModule,
    MatMenuModule,
    FormsModule,
    CommonButtonV35Component,
    MatTabsModule,
    DemoVideoComponent,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-intro-bank-acounts',
  templateUrl: './intro-bank-acounts.component.html',
  styleUrls: ['./intro-bank-acounts.component.scss']
})
export class IntroBankAcountsComponent {
  public bankDataService = inject(BankDataV35Service);
  private cdr = inject(ChangeDetectorRef);

  dialog = inject(MatDialog);

  isGridView = true;
  isLoading = false;
  ltrTransition: boolean;
  importDropDown: boolean;
  selectedAccount: IIntroBankAccount;

  faArrowsRotate = faArrowsRotate;
  faEye = faEye;
  faCaretDown = faCaretDown;
  bankList: IIntroBankAccount[] = introBanksList;
  accountNumberVisible = false;

  sendButtonType: TCButtonType = { style: 'green', name: 'money-action' };
  receiveButtonType: TCButtonType = { style: 'blue', name: 'money-action' };
  transferButtonType: TCButtonType = { style: 'violet', name: 'money-action' };
  editButtonType: TCButtonType = 'list';

  settings: {
    name: string;
    id: string;
    icon: string;
    faIcon: [IconPrefix, IconName] | IconLookup;
  }[] = [
    {
      name: 'Edit',
      id: 'id_editRow',
      icon: 'fa fa-edit',
      faIcon: ['fas', 'edit']
    },
    {
      name: 'Edit Design',
      id: 'id_edit_design_row',
      icon: 'fa fa-pencil',
      faIcon: ['fas', 'pencil']
    },
    {
      name: 'Delete',
      id: 'id_delete_row',
      icon: 'fa fa-trash',
      faIcon: ['fas', 'trash']
    },
    {
      name: 'Change Starting Number',
      id: 'id_change_starting_number',
      icon: 'fa fa-exchange',
      faIcon: ['fas', 'exchange']
    },
    {
      name: 'Clone Design',
      id: 'id_clone_design_row',
      icon: 'fa fa-clone',
      faIcon: ['fas', 'clone']
    },
    {
      name: 'ACH Authorization Form',
      id: 'id_ach_authorization_form',
      icon: 'fa-ballot-check fal ',
      faIcon: ['fas', 'ballot-check']
    }
  ];

  selectedTab: 'account' | 'info' | 'audit-trail' | 'all' = 'all';
  switchArray = [
    { id: 0, name: 'account', title: 'Account' },
    { id: 1, name: 'info', title: 'Info' },
    { id: 2, name: 'audit-trail', title: 'Audit Trail' }
  ] as const;

  selectAccount(item: IIntroBankAccount) {
    this.selectedAccount = item;
    this.cdr.detectChanges();
    if (this.selectedTab === 'all') {
      this.selectedTab = 'account';
    }
  }

  viewToggle(val: boolean) {
    this.isGridView = val;
  }

  /**
   * @description hide/show account number
   */
  displayAccountNumber() {
    this.accountNumberVisible = !this.accountNumberVisible;
  }

  /**
   * @description Toggle tabs
   */
  toggleAccountDetails(tabName: 'account' | 'info' | 'audit-trail' | 'all') {
    this.selectedTab = tabName;
  }

  searchboxComponent = DtSearchBoxComponent;
  v3UpdatedAtComponent = DataRangeV35Component;

  public gridViewHeaderElements = signal<IV3DtHeaderElements>({
    buttons: [
      {
        text: 'New',
        id: 'new-payment',
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        isAddIcon: true,
        toolTip: 'Add new payee'
      },
      {
        text: 'Delete',
        id: 'delete',
        icon: ['fas', 'trash'],
        isAddIcon: true,
        disabled: true,
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        toolTip: 'Delete payee'
      }
    ],
    topRightButtons: [
      {
        text: 'Merge',
        id: 'merge',
        isAddIcon: true,
        icon: ['fas', 'code-merge'],
        textColorInput: 'var(--main-text-color)',
        type: 'borderless',
        boxshadow: 'none',
        toolTip: 'Import Payments'
      }
    ]
  });

  gridTableRowData = signal([
    {
      nickName: 'Payee nickname one',
      name: 'Payee one',
      accountNo: '********1233',
      achStatus: 'Enable ACH',
      bankName: 'FEDERAL RESERVE BANK',
      verified: 'Verify Now'
    },
    {
      nickName: 'Payee nickname two',
      name: 'Payee one',
      accountNo: '********1223',
      achStatus: 'Enable ACH',
      bankName: 'FEDERAL RESERVE BANK',
      verified: 'Verify Now'
    }
  ]);

  transactionsRowData = signal([
    {
      payee: 'Payee 1',
      source: 'Bank name 1',
      amount: 12,
      modeOfTransfer: 'Check',
      status: 'Pending',
      description: 'description 1',
      updatedAt: '02/20/2024',
      referenceId: '1003',
      view: 'Source'
    },
    {
      payee: 'Payee 2',
      source: 'Bank name 2',
      amount: 12,
      modeOfTransfer: 'Check',
      status: 'Pending',
      description: 'description 1',
      updatedAt: '02/20/2024',
      referenceId: '1002',
      view: 'Source'
    }
  ]);

  onHeaderButtonClick(id?: string) {}
}
