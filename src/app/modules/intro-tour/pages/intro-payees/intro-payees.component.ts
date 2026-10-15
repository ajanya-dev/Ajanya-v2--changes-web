import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { IIntroPayee, intoTabsArray, introPayees } from './payeeModel';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { TCButtonType } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

import { faArrowsRotate, faCaretDown, faEye } from '@fortawesome/pro-solid-svg-icons';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { MatTabsModule } from '@angular/material/tabs';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';

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
  selector: 'app-intro-payees',
  templateUrl: './intro-payees.component.html',
  styleUrls: ['./intro-payees.component.scss']
})
export class IntroPayeesComponent {
  dialog = inject(MatDialog);

  isGridView = true;
  isLoading = false;

  faArrowsRotate = faArrowsRotate;
  faEye = faEye;
  faCaretDown = faCaretDown;

  filterCategory = '0';
  selectedPayeeId: string = introPayees[0].id;
  selectedPayee: IIntroPayee = introPayees[0];
  tabsArray = intoTabsArray;
  payeeList = introPayees;
  searchTerm = '';
  activeAccTab = 'domestic';
  importDropDown = false;
  ltrTransition = false;
  activeTab = 'details';
  sendButtonType: TCButtonType = { style: 'green', name: 'money-action' };
  receiveButtonType: TCButtonType = { style: 'blue', name: 'money-action' };
  editButtonType: TCButtonType = 'list';
  payeeType = [
    { value: '0', name: '' },
    { value: '1', name: 'Customer' },
    { value: '2', name: 'Vendor' },
    { value: '3', name: 'Employee' }
  ];

  settings = [
    {
      name: 'Edit',
      id: 'id_editRow',
      icon: 'fa fa-edit'
    },
    {
      name: 'Delete',
      id: 'id_delete_row',
      icon: 'fa fa-trash'
    }
  ];

  addButton: string;
  isBank = false;
  arr: { key: string; value: string | number | null | Date }[] = [];
  tabArray = [
    {
      name: 'Contacts',
      value: 3,
      tableHead: [
        'Full Name',
        'Email Address',
        'Phone Number',
        'Contact Type',
        'Action'
      ]
    },
    {
      name: 'To-Dos',
      value: 4,
      tableHead: ['Status', 'Date', 'Details', 'Action']
    },
    {
      name: 'Comments',
      value: 5,
      tableHead: ['Date', 'Note', 'Action']
    },
    {
      name: 'Attachments',
      value: 6,
      tableHead: ['Date', 'File Name', 'File', 'Action']
    },
    {
      name: 'Audit Trial',
      value: 8,
      tableHead: ['Date', 'Status', 'By', 'Device', 'Notes']
    },
    {
      name: 'More',
      value: 7
    }
  ];

  /**
   * @description filter the payees by category
   * @param val  = all || vendor || customer || employee
   */
  categoryFilter(val: string) {
    this.filterCategory = val;
    if (val === '0') {
      this.payeeList = introPayees;
      return;
    }
    this.payeeList = introPayees.filter((payees) => {
      return payees.payeeTypeId === val;
    });
    this.selectedPayee = this.payeeList[0];
  }

  /**
   * @description select a payee
   * @param item
   */
  selectPayee(item?: IIntroPayee) {
    if (item) {
      this.selectedPayee = item;
      this.selectedPayeeId = item.id;
    }
  }

  /**
   * @description modal for editing existing payee
   * @param id
   */
  openEditPayee(id?: string | undefined) {}

  /**
   * @description payee delete confirmation
   * @param id
   */
  deletePayee(id: string | undefined) {}

  /**
   * @description modal for adding new payee
   */
  openAddPayee() {}

  /**
   * @description the Entered searchTerm will be stored in subjectKeyUp subject()
   */
  fetchSearchData(search: string) {}

  /**
   * @description change the view into list view
   * */
  viewToggle(val: boolean) {
    this.isGridView = val;
  }

  /**
   * @description Navigate into payment source and populate the selected payee
   * @param mode pay or recieve
   */
  goToPayments(mode: 'pay' | 'receive') {}

  /**
   * @description toggle the sub tabs inside the accounts tab
   * @param val domestic || interntional
   */
  toggleAccTab(val: string) {
    this.activeAccTab = val;
  }

  /**
   * @description open third party import modal
   */
  openThirdPartyImport() {}

  /**
   * @descripiton Mat menu close event will call this function
   */
  onMatMenuClosed() {
    this.importDropDown = false;
  }

  /**
   * @description navigate into import page
   */
  import() {}

  /**
   * @description get all attatchment of payee
   */
  getAttachment(force: boolean): void {}

  /**
   * @description add a new attachment
   * @returns
   */
  onAddAttachment(): void {}

  /**
   * @description gets all comments
   */
  getComment(force: boolean): void {}

  /**
   * @description add a new comment
   * @returns
   */
  onAddComment(): void {}

  /**
   * @description get all todo
   */
  getTodo(force: boolean): void {}

  /**
   * @description adding a new todo
   * @returns
   */
  onAddTodo(): void {}

  /**
   * @description get existing contacts
   */
  getContact(force?: boolean): void {}

  /**
   * @description adds a new contact
   * @returns
   */
  onAddContact(): void {}

  /**
   * @description toggle the main tabs
   * @param val details || more || accounts
   */
  toggleTab(val: string) {
    this.activeTab = val;
    if (this.activeTab === 'more') {
      this.ltrTransition = true;
    } else if (this.activeTab === 'accounts') {
      if (val === 'more') {
        this.ltrTransition = false;
      } else if (val === 'details') {
        this.ltrTransition = true;
      }
    } else {
      this.ltrTransition = false;
    }
  }

  /**
   * @description tab changing and display corresponding details
   * @param selectedTab
   */
  onTabChanged(selectedTab: string | undefined): void {
    if (selectedTab === 'Contacts') {
      this.addButton = 'Add Contact';
      this.isBank = true;
      this.getContact(false);
    } else if (selectedTab === 'To-Dos') {
      this.addButton = 'Add To-Dos';
      this.isBank = true;
      this.getTodo(false);
    } else if (selectedTab === 'Comments') {
      this.addButton = 'Add Comment';
      this.isBank = true;
      this.getComment(false);
    } else if (selectedTab === 'Attachments') {
      this.addButton = 'Add Attachment';
      this.isBank = true;
      this.getAttachment(false);
    } else if (selectedTab === 'More') {
      this.isBank = false;
    }
  }

  searchboxComponent = DtSearchBoxComponent;
  v3UpdatedAtComponent = DataRangeV35Component;

  public transactionTableHeaderElements = signal<IV3DtHeaderElements>({
    headerText: 'Transactions',});

  payeeTransactionRowData = signal([
    {
      source: 'intro bank 1',
      amount: 12,
      modeOfTransfer: 'Mail Check',
      status: 'Processing',
      reference_id: '1003',
      description: 'intro row one descript...',
      updated_at: '03/15/2025',
      referenceId: '345345'
    },
    {
      source: 'intro bank 2',
      amount: 26,
      modeOfTransfer: 'Check',
      status: 'Pending',
      reference_id: '1003',
      description: 'intro row two descript...',
      updated_at: '03/12/2025',
      referenceId: '34534345'
    }
  ]);

  // HEADER ELEMENTS PROPERTIES
  public bankAccountHeaderElements = signal<IV3DtHeaderElements>({
    buttons: [
      {
        text: 'New',
        id: 'new-payment',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        toolTip: 'Create new payment'
      }
    ]
  });

  bankAccountRowData = signal([
    {
      bankAccountHolderName: 'Intro 1 bank ac holder',
      routingNumber: '011000015',
      accountNumber: '12345678',
      accountType: 'BUSINESS',
      defaultForDD: 'true',
      view: ''
    },
    {
      bankAccountHolderName: 'Intro 2 bank ac holder',
      routingNumber: '011000015',
      accountNumber: '87654321',
      accountType: 'CHECKING',
      defaultForDD: 'false',
      view: ''
    }
  ]);

  internationalBankAccountRowData = signal([
    {
      accountNumber: '12345678',
      bankName: 'Intro bank one',
      accountType: 'CHECKING',
      indentifierType: 'swift',
      stiftBic: '12345',
      country: 'US',
      view: ''
    },
    {
      accountNumber: '12345678',
      bankName: 'Intro bank two',
      accountType: 'BUSINESS',
      indentifierType: 'swift',
      stiftBic: '54321',
      country: 'CANADA',
      view: ''
    }
  ]);

  /**
   * @description function to open corresponding modal
   * @param name
   */
  openModal(name: string): void {
    if (name === 'Add Comment') {
      this.onAddComment();
    } else if (name === 'Add Attachment') {
      this.onAddAttachment();
    } else if (name === 'Add Contact') {
      this.onAddContact();
    } else if (name === 'Add To-Dos') {
      this.onAddTodo();
    }
  }


  // HEADER ELEMENTS PROPERTIES
  public gridViewHeaderElements = signal<IV3DtHeaderElements>({

    buttons: [
      {
        text: 'New',
        id: 'new-payment',
        isAddIcon: false,
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Add new payee'
      },
      {
        text: 'Edit',
        id: 'edit',
        icon: ['fas', 'pen-to-square'],
        isAddIcon: true,
        disabled:true,
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        toolTip: 'Edit payee'
      },
      {
        text: 'Delete',
        id: 'delete',
        icon: ['fas', 'trash'],
        isAddIcon: true,
        disabled:true,
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
      addressOne: 'payee one addre..',
      addressTwo: 'payee one addre..',
      company: 'company one',
      date: '02/20/2024',
      city: 'Intro city',
      state: 'Intro state',
      country: 'Intro country',
      email: 'intro@gmail.com',
      type: 'Customer',
      ssn: '34534',
      phone:'9746585263',
      zip:'671541',
      view: 'Source',
    },
    {
      nickName: 'Payee nickname two',
      name: 'Payee one',
      addressOne: 'payee two addre..',
      addressTwo: 'payee two addre..',
      company: 'company two',
      date: '02/20/2024',
      city: 'Intro city',
      state: 'Intro state',
      country: 'Intro country',
      email: 'intro@gmail.com',
      type: 'Employee',
      phone:'8129824263',
      ssn: '5656',
      zip:'671541',
      view: 'Source',
    }
  ]);

  onHeaderButtonClick(id?: string) {}
}


