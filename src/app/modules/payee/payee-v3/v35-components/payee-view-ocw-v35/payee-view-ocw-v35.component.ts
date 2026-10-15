import { Component, OnDestroy, inject, computed, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { Subject } from 'rxjs';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { AddContactModalComponent } from 'src/app/shared/modal/add-contact/add-contact-modal/add-contact-modal.component';
import { AddToDoModalComponent } from 'src/app/shared/modal/todo/add-to-do-modal/add-to-do-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { finalize, takeUntil } from 'rxjs/operators';
import type {
  IPayeeViewDetails,
  IPayeeViewMoreInfo
} from 'src/app/modules/payee/payee-v2/model/payee';
import type { IGetComment } from 'src/app/models/common';
import { TodoService } from 'src/app/shared/service/todo/todo.service';
import { ContactService } from 'src/app/shared/service/contact/contact.service';
import type { IGetTodo } from 'src/app/shared/modal/todo/model/todo';
import type { IGetContact } from 'src/app/shared/modal/add-contact/model/contact';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { NgClass, TitleCasePipe } from '@angular/common';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { environment } from 'src/environments/environment';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { IIndustryTypes } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';

@Component({
  selector: 'app-payee-view-ocw-v35',
  templateUrl: './payee-view-ocw-v35.component.html',
  styleUrls: ['./payee-view-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    MatTabGroup,
    MatTab,
    MatCheckbox,
    TitleCasePipe,
    WhiteLabelPipe
  ]
})
export class PayeeViewOcwV35Component implements OnDestroy {
  /** dependancy injection using inject method */
  private dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private shareService = inject(SharedService);
  private todoService = inject(TodoService);
  private contactService = inject(ContactService);
  public payeeDataService = inject(PayeeDataV35Service);

  @Input() payeeId: string;

  /** variables */
  addButton: string;
  isBank = false;
  link!: string;
  isChecked = false;
  arr: { key: string; value: string | number | null | Date }[] = [];
  destroy$ = new Subject();
  industryTypes: IIndustryTypes[] = [];
  industryType: string = '';
  industryTypeCode: string;
  env = environment;
  private allTabs = [
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

  /** Tabs to hide for compass environment */
  private compassHiddenTabs = ['Contacts', 'To-Dos', 'Comments', 'Attachments'];

  /** Filtered tabs based on environment */
  get tabArray() {
    if (this.env.env_id === 'compass') {
      return this.allTabs.filter(
        (tab) => !this.compassHiddenTabs.includes(tab.name)
      );
    }
    return this.allTabs;
  }

  payeeDetailsSignal = computed(
    () => this.payeeDataService.payeeViewSignal().data?.payee_information
  );

  moreDetailsSignal = computed(
    () => this.payeeDataService.payeeViewSignal().data?.payee_more_information
  );

  loadingSignal = computed(
    () => this.payeeDataService.payeeViewSignal().loading
  );

  auditTrialSignal = computed(
    () => this.payeeDataService.payeeViewSignal().auditTrial
  );

  contactDataSignal = computed(
    () => this.payeeDataService.payeeViewSignal().contactData?.data
  );

  todosSignal = computed(
    () => this.payeeDataService.payeeViewSignal().todos?.data
  );

  commentsSignal = computed(
    () => this.payeeDataService.payeeViewSignal().comments?.data
  );

  attachmentSignal = computed(
    () => this.payeeDataService.payeeViewSignal().attachments?.data
  );

  constructor() {
    this.getSelectedPayee();
    this.getIndustryTypes();
  }

  getIndustryTypes() {
    this.payeeService
      .getIndustryTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.industryTypes = res.data;
          // const selectedIndustry = this.industryTypes.find(
          //   (item) => item.mcc_code === this.industryTypeCode
          // );
          // if (selectedIndustry) {
          //   this.industryType = selectedIndustry.mcc_description;
          // }
        }
      });
  }

  /**
   * @description gets the latest selected payee and calls the functions to load their corresponding data's
   */
  getSelectedPayee() {
    toObservable(this.payeeDataService.payeeDataSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          if (res?.merchantCategory) {
            this.industryTypeCode = res?.merchantCategory.toString();
            // const selectedIndustry = this.industryTypes.find(
            //   (item) => item.mcc_code === this.industryTypeCode
            // );
            // if (selectedIndustry) {
            //   this.industryType = selectedIndustry.mcc_description;
            // }
          } else {
            this.industryType = '';
          }
        }

        if (
          res &&
          (this.payeeId !== res.encryptedId ||
            this.payeeDataService.payeeViewSignal().data === undefined)
        ) {
          this.payeeDataService.payeeViewSignal.update(() => ({
            loading: false,
            data: undefined,
            auditTrial: []
          }));
          this.payeeId = res.encryptedId as string;
          this.getPayeeData(this.payeeId);
          this.getAuditTrial();
          this.onTabChanged(this.tabArray[0].name);
          this.payeeDataService.editedPayeeSignal.set(undefined);
        } else {
          this.payeeMore(this.moreDetailsSignal() as IPayeeViewMoreInfo);
        }
      });
    toObservable(this.payeeDataService.editedPayeeSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.payeeId = res.encryptedId as string;
          this.getPayeeData(this.payeeId);
          this.getAuditTrial();
          this.payeeDataService.editedPayeeSignal.set(undefined);
        }
      });
  }

  /**
   * @description gets the whole datas including payee details, payee summary,etc..
   */
  getPayeeData(payeeId: string): void {
    this.payeeDataService.payeeViewSignal.update((val) => ({
      ...val,
      loading: true
    }));
    this.payeeService
      .viewPayee(payeeId)
      .pipe(
        finalize(() => {
          this.payeeDataService.payeeViewSignal.update((val) => ({
            ...val,
            loading: false
          }));
        })
      )
      .subscribe((res: IPayeeViewDetails) => {
        if (res) {
          this.payeeDataService.payeeViewSignal.update((val) => ({
            ...val,
            data: res.data
          }));
          this.payeeMore(res.data.payee_more_information);
        }
      });
  }

  /**
   * @description To get the audit trial data of selected payee
   */
  getAuditTrial() {
    this.payeeService.getPayeeAuditTrail(this.payeeId).subscribe((res) => {
      this.payeeDataService.payeeViewSignal.update((val) => ({
        ...val,
        auditTrial: [...res.data]
      }));
    });
  }

  /**
   * @description to get the default payment method
   * @param type
   * @returns
   */
  getDefaultPaymethod(type: number | string): string | null {
    if (type === 1 || type === '1') {
      return 'Printable Check';
    }
    if (type === 2 || type === '2') {
      return 'Mail Check by USPS';
    }
    if (type === 3 || type === '3') {
      return 'Direct Deposit';
    }
    if (type === 4 || type === '4') {
      return 'Email Check';
    }
    return null;
  }

  /**
   * @description checks wheather customer individual or company
   * @param type
   * @returns
   */
  getCustomerType(type: number | string): string | null {
    if (type === 1 || type === '1') {
      return 'Individual';
    }
    if (type === 2 || type === '2') {
      return 'Company';
    }
    return null;
  }

  /**
   * @description get payment terms
   * @param type
   * @returns
   */
  getPaymentTerms(type: number | string): string | null {
    if (type === 1) {
      return 'Due upon receipt';
    }
    if (type === 2) {
      return 'Net 15';
    }
    if (type === 3) {
      return 'Net 10';
    }
    if (type === 4) {
      return 'Net 5';
    }
    return null;
  }

  /**
   * @description checks wheather vendor or not
   * @param value
   * @returns
   */
  loadvendor_1099(value: number | string): string | null {
    if (value === 1) {
      return 'Yes';
    }
    if (value === 2) {
      return 'No';
    }
    return null;
  }

  /**
   * @description gets the employee type
   * @param value
   * @returns
   */
  getEmployeeType(value: number | string) {
    if (value === 1) {
      return 'Salaried';
    }
    if (value === 2) {
      return 'Paid by the Hour';
    }
    if (value === 3) {
      return 'Contractor (1099)';
    }
    return null;
  }

  /**
   * @description gets the payment schedule
   * @param value
   * @returns
   */
  loadEmployeePaymentShedule(value: number | string): string | null {
    if (value === 1) {
      return 'Annually';
    }
    if (value === 2) {
      return 'Quarterly';
    }
    if (value === 3) {
      return 'Monthly';
    }
    if (value === 4) {
      return 'Biweekly';
    }
    if (value === 5) {
      return 'Weekly';
    }
    return null;
  }

  /**
   * @description gets the martial status
   * @param value
   * @returns
   */
  loadEmployeeFilingStatus(value: number | string): string | null {
    if (value === 1) {
      return 'Single';
    }
    if (value === 2) {
      return 'Head of Household';
    }
    if (value === 3) {
      return 'Widow(er)';
    }
    if (value === 4) {
      return 'Married';
    }
    if (value === 5) {
      return 'Married Filing Saparatly';
    }
    return null;
  }

  /**
   * @description gets the contact no type wheather its primary ,secondary, additional
   * @param value
   * @returns
   */
  getContactType(value: string | undefined): string | null {
    if (value === '1') {
      return 'Additional Contact';
    }
    if (value === '2') {
      return 'Primary Contact';
    }
    if (value === '3') {
      return 'Secondary Contact';
    }
    return null;
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

  /**
   * @description get all attatchment of payee
   */
  getAttachment(force: boolean): void {
    if (
      this.payeeId ===
        this.payeeDataService.payeeViewSignal().attachments?.payee &&
      this.payeeDataService.payeeViewSignal().attachments !== undefined &&
      !force
    )
      return;

    this.shareService
      .getAttachment('payees', this.payeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.payeeDataService.payeeViewSignal.update((val) => ({
          ...val,
          attachments: {
            payee: this.payeeId,
            data: [...res.data]
          }
        }));
      });
  }

  /**
   * @description to delete an attatchment of payee
   * @param id
   */
  deleteAttachments(id: string): void {
    const data = {
      content: 'Are you sure to delete this attachment?',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);
    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.shareService
          .deleteAttachment('payees', this.payeeId, id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res) {
              this.getAttachment(true);
              const successData = {
                title: 'Success!',
                content: 'Attachment deleted.',
                close: true
              };
              this.alertService.successAlert(successData);
            }
          });
      }
    });
  }

  /**
   * @description gets the whole details about the selected attachment
   * @param id
   */
  openAttachment(id: string): void {
    this.shareService
      .openAttachment('payees', this.payeeId, id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.link = res.data;
        if (res.success) {
          const urlLoaded = window.open(this.link);
          if (
            !urlLoaded ||
            urlLoaded.closed ||
            typeof urlLoaded.closed === 'undefined'
          ) {
            this.openWarningAlert(
              'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
            );
          }
        }
      });
  }

  /**
   * @description add a new attachment
   * @returns
   */
  onAddAttachment(): void {
    const attachments = this.attachmentSignal();
    if (attachments && attachments.length >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add attachment ',
        isCancel: false
      });
      return;
    }
    const data: { id: number | string; type: string } = {
      id: this.payeeId ? this.payeeId : 0,
      type: 'payees'
    };

    const dialogRef: MatDialogRef<
      AddAttachmentModalComponent,
      { id: string | number; Type: string }
    > = this.dialog.open(AddAttachmentModalComponent, {
      maxWidth: '600px',
      width: '93%',
      disableClose: true,
      data
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getAttachment(true);
      }
    });
  }

  openWarningAlert(content: string): void {
    const data = {
      title: 'Error',
      content
    };
    this.alertService.warningAlert(data);
  }

  /**
   * @description gets all comments
   */
  getComment(force: boolean): void {
    if (
      this.payeeId ===
        this.payeeDataService.payeeViewSignal().comments?.payee &&
      this.payeeDataService.payeeViewSignal().comments !== undefined &&
      !force
    )
      return;

    this.shareService
      .getAllComments('payees', this.payeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.payeeDataService.payeeViewSignal.update((val) => ({
          ...val,
          comments: {
            payee: this.payeeId,
            data: res.data as IGetComment[]
          }
        }));
      });
  }

  /**
   * @description delete a comment
   * @param id
   */
  deleteComment(id: string): void {
    const data = {
      title: 'Are you sure?',
      content: 'You want delete this Comment?',
      doneMsg: 'Yes, delete it!',
      cancelMsg: 'No, cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);
    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.shareService
          .deleteComment('payees', this.payeeId, id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res) {
              this.getComment(true);
              const successData = {
                title: 'Success!',
                content: 'Comment deleted.',
                close: true
              };
              this.alertService.successAlert(successData);
            }
          });
      }
    });
  }

  /**
   * @description add a new comment
   * @returns
   */
  onAddComment(): void {
    const comments = this.commentsSignal();
    if (comments && comments.length >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add comments ',
        isCancel: false
      });
      return;
    }
    const data: { id: string | number; type: string; count: number } = {
      id: this.payeeId ? this.payeeId : 0,
      type: 'payees',
      count: comments?.length ?? 0
    };
    const dialogRef: MatDialogRef<
      AddCommentsModalComponent,
      { id: string | number; Type: string; count: number }
    > = this.dialog.open(AddCommentsModalComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getComment(true);
      }
    });
  }

  /**
   * @description get all todo
   */
  getTodo(force: boolean): void {
    if (
      this.payeeId === this.payeeDataService.payeeViewSignal().todos?.payee &&
      this.payeeDataService.payeeViewSignal().todos !== undefined &&
      !force
    )
      return;

    this.todoService
      .getAllTodo('payees', this.payeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.payeeDataService.payeeViewSignal.update((val) => ({
          ...val,
          todos: { payee: this.payeeId, data: [...res.data] }
        }));
      });
  }

  /**
   * @description edit an existing todo
   * @param item
   */
  editTodo(item: IGetTodo): void {
    const dialogRefm: MatDialogRef<AddToDoModalComponent> = this.dialog.open(
      AddToDoModalComponent,
      {
        maxWidth: '450px',
        width: '93%',
        disableClose: true,
        data: {
          data: item,
          type: 'payees',
          id: this.payeeId ? this.payeeId : 0,
          editMode: true
        }
      }
    );
    dialogRefm.afterClosed().subscribe((res) => {
      if (res) {
        this.getTodo(true);
      }
    });
  }

  /**
   * @description delete a todo
   * @param id
   */
  deleteTodo(id: string): void {
    const data = {
      title: 'Are you sure?',
      content: 'You want delete this Todo?',
      doneMsg: 'Yes, delete it!',
      cancelMsg: 'No, cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);
    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.todoService
          .deleteTodo('payees', this.payeeId, id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            this.getTodo(true);
            const successData = {
              title: 'Success!',
              content: res.data,
              close: true
            };
            this.alertService.successAlert(successData);
          });
      }
    });
  }

  /**
   * @description change the status of a todo
   * @param Checked
   * @param id
   * @param index
   */
  completeTask(Checked: boolean | undefined, id: string, index: number): void {
    const body: { [key: string]: string } = {};
    const todos = this.todosSignal();
    if (!todos) return;

    if (Checked) {
      body.status = 'done';
      todos[index].todo_status = 'done';
      this.isChecked = true;
      this.payeeDataService.payeeViewSignal.update((val) => ({
        ...val,
        todos: { payee: val.todos?.payee as string, data: todos }
      }));
    } else {
      todos[index].todo_status = 'active';
      this.isChecked = false;
      body.status = 'active';
      this.payeeDataService.payeeViewSignal.update((val) => ({
        ...val,
        todos: { payee: val.todos?.payee as string, data: todos }
      }));
    }

    this.todoService
      .getTodoStatus('payees', this.payeeId, id, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  /**
   * @description adding a new todo
   * @returns
   */
  onAddTodo(): void {
    const todoData = this.todosSignal();
    if (todoData && todoData.length >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add to do',
        isCancel: false
      });
      return;
    }
    const data: { id: number | string; type: string } = {
      id: this.payeeId ? this.payeeId : 0,
      type: 'payees'
    };
    const dialogRefm: MatDialogRef<
      AddToDoModalComponent,
      { id: string | number; Type: string }
    > = this.dialog.open(AddToDoModalComponent, {
      maxWidth: '450px',
      width: '93%',
      disableClose: true,
      data
    });

    dialogRefm.afterClosed().subscribe((result) => {
      if (result) {
        this.getTodo(true);
      }
    });
  }

  /**
   * @description get existing contacts
   */
  getContact(force?: boolean): void {
    if (
      this.payeeId ===
        this.payeeDataService.payeeViewSignal().contactData?.payee &&
      this.payeeDataService.payeeViewSignal().contactData !== undefined &&
      !force
    )
      return;
    this.contactService
      .getAllContact('payees', this.payeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.payeeDataService.payeeViewSignal.update((val) => ({
          ...val,
          contactData: {
            payee: this.payeeId,
            data: [...res.data]
          }
        }));
      });
  }

  /**
   * @description edit an existing contact
   * @param item
   */
  editContact(item: IGetContact): void {
    const dialogRefm: MatDialogRef<AddContactModalComponent> = this.dialog.open(
      AddContactModalComponent,
      {
        maxWidth: '450px',
        width: '93%',
        disableClose: true,
        data: {
          data: item,
          type: 'payees',
          id: this.payeeId ? this.payeeId : 0,
          editMode: true
        }
      }
    );
    dialogRefm.afterClosed().subscribe((res: boolean) => {
      if (res) {
        this.getContact(true);
      }
    });
  }

  /**
   * @description delete an existing contact
   * @param id
   */
  deleteContact(id: string | undefined): void {
    const data = {
      title: 'Are you sure?',
      content: 'You want delete this Contact?',
      doneMsg: 'Yes, delete it!',
      cancelMsg: 'No, cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);
    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.contactService
          .deleteContact('payees', this.payeeId, id as string)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            this.getContact(true);
            const successData = {
              title: 'Success!',
              content: res.data,
              close: true
            };
            this.alertService.successAlert(successData);
          });
      }
    });
  }

  /**
   * @description adds a new contact
   * @returns
   */
  onAddContact(): void {
    const contactData = this.contactDataSignal();
    if (contactData && contactData.length >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add contact ',
        isCancel: false
      });
      return;
    }
    const data: { id: number | string; type: string } = {
      id: this.payeeId ? this.payeeId : 0,
      type: 'payees'
    };
    const dialogRefm: MatDialogRef<
      AddContactModalComponent,
      { id: string | number; Type: string }
    > = this.dialog.open(AddContactModalComponent, {
      maxWidth: '450px',
      width: '93%',
      disableClose: true,
      data
    });
    dialogRefm.afterClosed().subscribe((result) => {
      if (result) {
        this.getContact(true);
      }
    });
  }

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

  /**
   * @description get more additional details about payee if it exists
   * @param obj
   */
  payeeMore(obj: IPayeeViewMoreInfo): void {
    const payeeType =
      this.payeeDetailsSignal()?.payee_type_name?.toLowerCase() as string;
    this.arr.length = 0;

    const array = [
      'customer_bank_account_id',
      'employee_bank_account_id',
      'vendor_bank_account_id',
      'customer_account_number',
      'employee_account_number',
      'vendor_account_number',
      'employee_dob'
    ];
    Object.keys(obj).forEach((key) => {
      if (
        key.startsWith(payeeType) &&
        obj[key as keyof IPayeeViewMoreInfo] &&
        !array.includes(key)
      ) {
        const head = key.split(payeeType)[1].replaceAll('_', ' ');
        if (key === 'employee_type') {
          this.arr.push({
            key: 'employee type',
            value: this.getEmployeeType(obj[key])
          });
        } else if (key === 'customer_type' || key === 'vendor_type') {
          this.arr.push({
            key: key === 'customer_type' ? 'customer type' : 'vendor type',
            value: this.getCustomerType(obj[key])
          });
        } else if (
          key === 'customer_default_pay_method' ||
          key === 'employee_default_pay_method' ||
          key === 'vendor_default_pay_method'
        ) {
          this.arr.push({
            key: 'default pay method',
            value: this.getDefaultPaymethod(obj[key])
          });
        } else if (key === 'employee_filling_status') {
          this.arr.push({
            key: 'filling status',
            value: this.loadEmployeeFilingStatus(obj[key])
          });
        } else if (key === 'employee_payment_schedule') {
          this.arr.push({
            key: 'payment schedule',
            value: this.loadEmployeePaymentShedule(obj[key])
          });
        } else if (key === 'vendor_1099') {
          this.arr.push({
            key: '1099 Vendor',
            value: this.loadvendor_1099(obj[key])
          });
        } else if (key === 'vendor_payment_terms') {
          this.arr.push({
            key: 'payment terms',
            value: this.getPaymentTerms(obj[key])
          });
        } else if (
          key === 'employee_bank_account_name' ||
          key === 'customer_bank_account_name' ||
          key === 'vendor_bank_account_name'
        ) {
          this.arr.push({
            key: 'Default Pay from Bank Account',
            value: obj[key]
          });
        } else if (key === 'employee_ssn') {
          this.arr.push({ key: 'SSN', value: obj[key] });
        } else {
          this.arr.push({
            key: head,
            value: obj[key as keyof IPayeeViewMoreInfo]
          });
        }
      }
    });
  }

  /**
   * @descripiton unsubscribe the whole subscritions subscribed from this component
   * when the component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
