import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormGroup,
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import {
  IItems,
  ICashRow,
  ICheckRow,
  IRouteData,
  INewSaveSlipBody,
  INewBlankDepositSlip,
  ICheckDeposit,
  IDepositSlip
} from 'src/app/modules/deposit-slip/model/depositslips';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown } from 'src/app/models/bank';
import { MatCheckbox } from '@angular/material/checkbox';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import {
  IGetAttachment,
  IGetComment,
  IV3DropDownOnReady
} from 'src/app/models/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import {
  faComment,
  faPaperclip,
  faPlus
} from '@fortawesome/pro-solid-svg-icons';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { BankAcDropdownV3Component } from '../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-create-deposit-slip',
  templateUrl: './create-deposit-slip.component.html',
  styleUrls: ['./create-deposit-slip.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    BankAcDropdownV3Component,
    FormsModule,
    MatTooltip,
    MatBadge,
    FaIconComponent,
    MatCheckbox,
    ReactiveFormsModule,
    AmountInputComponent,
    NgSelectModule,
    CommonButtonV35Component,
    NgClass,
    PayeeDropdownV3Component
  ]
})
export class CreateDepositSlipComponent implements OnInit, OnDestroy {
  private depositService = inject(DepositSlipsService);
  private dialog = inject(MatDialog);
  private sharedService = inject(SharedService);
  private alertService = inject(AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public fb = inject(UntypedFormBuilder);
  public datePipe = inject(DatePipe);
  private bankModalService = inject(BankModalService);

  subscriptions: Subscription[] = [];
  loaders = {
    submitting: false,
    submittingAndNew: false,
    printing: false
  };

  slipId: string;
  routeData: IRouteData;
  utils = Utils;
  ischecked = false;
  checked = false;
  blank: number;
  payees: IItems[];
  checks: IItems[];
  refId: string;
  bankAccount: IBankDropdown | undefined;
  date: Date | string = new Date();
  memo = '';
  cashForm: FormGroup<{ rows: FormArray }>;
  checkForm: FormGroup<{ rows: FormArray }>;
  dataFromCheck: ICheckDeposit[];
  checkId: string;
  selectedIds: string[];
  referenceType: string;
  comments: string[] = [];
  attachments: string[] = [];
  commentList: IGetComment[] = [];
  attachmentList: IGetAttachment[] = [];
  payee: IPayeeDropdown | undefined;
  depositFrom: IPayeeDropdown | undefined;
  deposlipData = signal<IDepositSlip | undefined>(undefined);
  isLoading = signal(false);
  disablePushBtn = true;
  activeBreakdownIndex: number | null = null;
  cashType: number = 1;
  faComment = faComment;
  faPaperclip = faPaperclip;
  faPlus = faPlus;

  ngOnInit(): void {
    this.routeData = this.route.snapshot.data as IRouteData;
    this.subscriptions.push(
      this.route.queryParams.subscribe((_value) => {
        this.selectedIds = _value?.Ids;
      })
    );

    this.initCashForm();
    this.initCheckForm();

    this.getRefId();
    this.getPayeeItems();
    this.getChecksform();

    if (this.routeData.mode === 'edit' || this.routeData.mode === 'clone') {
      this.slipId = this.route.snapshot.params.slipId;
      this.getEditData();
      this.getComments();
      this.getAttachments();
    } else if (this.routeData.mode === 'create') {
      if (this.selectedIds) {
        this.GetDataFromParams();
        this.pushCashRow(5);
        this.pushCheckRow(0);
      } else {
        this.pushCashRow(5);
        this.pushCheckRow(5);
        this.date = (this.date as unknown as Date).toISOString().split('T')[0];
      }
    }
  }

  /**
   * @description Initializes the cash form.
   */
  initCashForm() {
    this.cashForm = this.fb.group({
      rows: this.fb.array([])
    });
  }

  /**
   * @description Retrieves data from query parameters and loads corresponding data.
   */
  GetDataFromParams() {
    this.subscriptions.push(
      this.route.queryParams.subscribe((_value) => {
        const getIdsFromBill = _value?.Ids || _value?.checkId;
        this.referenceType = _value.referenceType;
        if (_value?.checkId) {
          this.checkId = _value.checkId;
        }
        
        if (getIdsFromBill) {
          this.loadData(getIdsFromBill);
        }
      })
    );
  }

  /**
   * @description Loads data based on the provided IDs
   * @param {string} ids - Comma-separated string of IDs for which data needs to be loaded.
   */
  loadData(ids: string) {
    const Ids = ids.split(',');
    this.pushCheckRow(0);
    this.selectedIds = Ids;

    this.subscriptions.push(
      this.depositService
        .createSlip(Ids, this.referenceType)
        .subscribe((res) => {
          if (res?.success) {
            this.dataFromCheck = res.data[0];

            this.setDepositslip();
          }
        })
    );
  }

  /**
   * @description Sets the deposit slip based on the data retrieved from the check.
   */
  setDepositslip() {
    let memo: string;
    this.dataFromCheck.forEach((e) => {
      const { memo: itemMemo, bankAccountId, bankAccountNickName, bankAccountName, chequeSerialNumber, id } = e;
      
      if (memo === undefined) {
        memo = itemMemo;
      }

      if (memo === itemMemo) {
        this.memo = itemMemo;
      } else if (memo !== itemMemo) {
        this.memo = '';
      } else {
        this.memo = itemMemo;
      }

      this.bankAccount = {
        id: bankAccountId,
        name: bankAccountNickName
      } as IBankDropdown;
      this.sharedService.setNewBankCreatedData({
        bankAccountNickName: bankAccountNickName || bankAccountName
      });

      if (chequeSerialNumber) {
        e.checkTo = chequeSerialNumber;
      }

      if (id) {
        e.referenceId = id;
      }

      this.checkFormRows.push(this.getCheckRow(e));
    });
  }

  /**
   * @description Getter for accessing the 'rows' form control within the 'cashForm' FormGroup.
   */
  get cashFormRows() {
    return this.cashForm.controls.rows;
  }

  /**
   * @description Creates a FormGroup representing a cash row for the 'rows' form control in the cashForm.
   * @param {ICashRow} [data] - Optional parameter containing data to initialize the cash row.
   */
  getCashRow(data?: ICashRow) {
    return this.fb.group({
      amount: [data ? data.amount : '', [Validators.required]],
      denominations: [data ? data.denominations : []],
      payeeName: [data ? data.payeeName : null],
      misc: [data ? data.misc : ''],
      checkType: [data ? data.checkType : 'cash']
    });
  }

  /**
   * @description  Handles the event when the 'blank deposit' checkbox state changes.
   * @param {MatCheckbox} event - The MatCheckbox change event.
   */
  blankdeposit(event: MatCheckbox) {
    if (event.checked) {
      this.ischecked = true;
    } else {
      this.ischecked = false;
    }
  }

  /**
   * @description Adds one or more cash rows to the 'rows' form control within the 'cashForm'.
   * @param {number} [num=1] - Optional parameter specifying the number of cash rows to add.
   */
  pushCashRow(num = 1) {
    this.addRow();
    for (let i = 0; i < num; i += 1) {
      this.cashFormRows.push(this.getCashRow());
    }
  }

  /**
   * @description Removes the last cash row from the 'rows' form control within the 'cashForm'.
   */
  popCashRow() {
    this.popRow();
    this.cashFormRows.removeAt(this.cashFormRows.length - 1);
  }

  /**
   * @description Initializes the check form using Angular Reactive Forms.
   */
  initCheckForm() {
    this.checkForm = this.fb.group({
      rows: this.fb.array([])
    });
  }

  /**
   * @description Getter for accessing the 'rows' form control within the 'checkForm' FormGroup.
   */
  get checkFormRows() {
    return this.checkForm.controls.rows as FormArray;
  }

  /**
   * @description  Creates a FormGroup representing a check row for the 'rows' form control within the 'checkForm'.
   * @param {ICheckRow | ICheckDeposit} [checRowData] - Optional parameter containing data to initialize the check row.
   */
  getCheckRow(checRowData?: ICheckRow | ICheckDeposit) {
    const data = checRowData as ICheckRow;
    // Creating check row with provided data
    
    // Handle checkFrom field properly - it could be an object with id/encryptedId or a string
    let checkFromValue = null;
    if (data?.checkFrom) {
      if (typeof data.checkFrom === 'object') {
        // If it's an object, use the id or encryptedId
        checkFromValue = data.checkFrom.id || data.checkFrom.encryptedId || null;
      } else if (typeof data.checkFrom === 'string') {
        // If it's already a string, use it directly
        checkFromValue = data.checkFrom;
      }
    }
    
    return this.fb.group({
      amount: [data?.amount ? data?.amount : '', [Validators.required]],
      checkFrom: [checkFromValue],
      payeeName: [data?.payeeName ? data?.payeeName : null],
      misc: [data?.misc ? data?.misc : ''],
      checkTo: [data?.checkTo ? data?.checkTo : ''],
      checkType: [data?.checkType ? data?.checkType : 'chk'],
      referenceId: [data?.referenceId ? data?.referenceId : '']
    });
  }

  toggleBreakdown(i: number) {
    this.activeBreakdownIndex = this.activeBreakdownIndex === i ? null : i;
  }

  handleBreakdownApplied(event: { amount: string; denominations: {value: string, count: number}[] }, index: number) {
    const formGroup = this.cashFormRows.at(index);
    formGroup.get('amount')?.setValue(event.amount);
    formGroup.get('denominations')?.setValue(event.denominations);
  }

  onAmountInputFocus() {
    this.activeBreakdownIndex = null;
  }

  /**
   * @description Checks the total number of rows in both cashForm and checkForm and disables the push button if the limit is reached.
   */
  addRow() {
    const cashFormRowsLength = this.cashFormRows?.controls.length || 0;
    const checkFormRowsLength = this.checkFormRows?.controls.length || 0;

    if (cashFormRowsLength + checkFormRowsLength >= 26) {
      this.disablePushBtn = false;
    }
  }

  /**
   * @description Checks the total number of rows in both cashForm and checkForm and enables the push button if there is room for more rows.
   */
  popRow() {
    const cashFormRowsLength = this.cashFormRows?.controls.length || 0;
    const checkFormRowsLength = this.checkFormRows?.controls.length || 0;

    if (cashFormRowsLength + checkFormRowsLength < 28) {
      this.disablePushBtn = true;
    }
  }

  /**
   * @description Adds one or more check rows to the 'rows' form control within the 'checkForm'.
   * @param {number} [num=1] - Optional parameter specifying the number of check rows to add.
   */
  pushCheckRow(num = 1) {
    this.addRow();
    for (let i = 0; i < num; i += 1) {
      this.checkFormRows.push(this.getCheckRow());
    }
  }

  /**
   * @description Removes the last check row from the 'rows' form control within the 'checkForm'.
   */
  popCheckRow() {
    this.popRow();
    this.checkFormRows.removeAt(this.checkFormRows.length - 1);
  }

  /**
   * @description Handles the bank selection event and updates the bank account in the component.
   * @param {IBankDropdown} event - The bank selection event.
   */
  onBankSelect(event: IBankDropdown) {
    this.bankAccount = event;
  }

  /**
   * @description Retrieves a reference ID from the deposit service and updates the 'refId' property in the component.
   */
  getRefId() {
    this.subscriptions.push(
      this.depositService.getRefId().subscribe((data) => {
        if (data?.success) {
          this.refId = data.data.refId;
        }
      })
    );
  }

  /**
   * @description Retrieves payee items from the deposit service and updates the 'payees' property in the component.
   */
  getPayeeItems() {
    this.subscriptions.push(
      this.depositService.getPayeeItems().subscribe((data) => {
        if (data?.success) {
          this.payees = data.data;
        }
      })
    );
  }

  /**
   * @description  Retrieves check forms from the deposit service and updates the 'checks' property in the component.
   */
  getChecksform() {
    this.subscriptions.push(
      this.depositService.getChecksForm().subscribe((data) => {
        if (data?.success) {
          this.checks = data.data;
        }
      })
    );
  }

  /**
   * @description  Retrieves edit data from the deposit service based on the slip ID and updates component properties accordingly.
   */
  getEditData() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.depositService
        .getEditBody(this.slipId)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((data) => {
          if (data?.success) {
            this.deposlipData.set(data.data);
            this.blank = data.data.total_items;
            if (data.data.total_items === 0) {
              this.ischecked = true;
            }
            this.passEditData(data.data);
          }
        })
    );
  }

  passEditData(data: IDepositSlip) {
    this.bankAccount = {
      id: data.bankAccount.bankAccountId,
      name: data.bankAccount.bankAccountName
    } as IBankDropdown;
    this.sharedService.setNewBankCreatedData({
      bankAccountNickName: data.bankAccount.bankAccountNickName
        ? data.bankAccount.bankAccountNickName
        : data.bankAccount.bankAccountName
    });

    this.refId = data.refId;
    this.memo = data.memo;
    if (this.routeData.mode === 'clone') {
      this.date = (this.date as Date).toISOString().split('T')[0];
    } else {
      this.date = this.datePipe.transform(
        data.depositDate,
        'yyyy-MM-dd'
      ) as string;
    }

    data.cash.forEach((e) => {
      this.cashFormRows.push(this.getCashRow(e));
    });

    data.check.forEach((e) => {
      this.checkFormRows.push(this.getCheckRow(e));
    });

    if (!data.cash?.length) {
      this.pushCashRow();
    }

    if (!data.check?.length) {
      this.pushCheckRow();
    }

    const referenceType = '';
    this.referenceType = referenceType;
  }

  /**
   * @description Saves the deposit slip based on the provided conditions.
   * @param {boolean} [reset=false] - Optional parameter indicating whether to reset the form after saving.
   * @param {boolean} [print=false] - Optional parameter indicating whether to trigger printing after saving.
   */
  saveSlip(reset?: boolean, print?: boolean) {
    if (this.ischecked) {
      if (!this.bankAccount?.id) {
        this.alertService.warningAlert({
          title: 'Error',
          content: 'Please select a bank account'
        });
        return;
      }
      // if (!this.payee?.id) {
      //   this.alertService.warningAlert({
      //     title: 'Error',
      //     content: 'Please select deposit from'
      //   });
      //   return;
      // }
      // MM/dd/yyyy
      const formatedDate = this.datePipe.transform(
        this.date,
        'MM/dd/yyy'
      ) as string;
      if (!formatedDate) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'Please enter a valid date'
        });
        return;
      }

      const body: INewBlankDepositSlip = {
        depositslipAccountId: this.bankAccount?.id,
        depositDate: formatedDate,
        dsStart: formatedDate,
        comments: this.memo,
        payeeId: this.payee?.encryptedId as string,
        refId: this.refId?.toString()
      };
      this.buttonLoaderHandler(reset, print, true);

      if (this.routeData.mode === 'create' || this.routeData.mode === 'clone') {
        body.attachmentIds = this.getAttachmentsAndCommentsArray().attachments;
        body.commentIds = this.getAttachmentsAndCommentsArray().comments;
        this.subscriptions.push(
          this.depositService
            .blankDepositslip(body)
            .pipe(finalize(() => this.buttonLoaderHandler(reset, print, false)))

            .subscribe((data) => {
              if (data?.success) {
                this.bankAccount = undefined;
                this.alertService.successAlert({
                  title: 'New deposit slip added!',
                  close: true,
                  timeout: 2000
                });
                if (reset) {
                  this.renform();
                } else if (print) {
                  this.renform();
                  this.printBulk([data.data.id]);
                } else {
                  this.router.navigate(['manage/depositslips/index']);
                }
              }
            })
        );
      }

      if (this.routeData.mode === 'edit' && this.ischecked) {
        this.subscriptions.push(
          this.depositService
            .updateblankdepositslip(body, this.slipId)
            .pipe(finalize(() => this.buttonLoaderHandler(reset, print, false)))

            .subscribe((data) => {
              if (data?.success) {
                this.alertService.successAlert({
                  title: 'Deposit slip updated!',
                  close: true,
                  timeout: 2000
                });
                this.router.navigate(['manage/depositslips/index']);
              }
            })
        );
      }
    }

    if (this.ischecked === false) {
      if (!this.bankAccount?.id) {
        this.alertService.warningAlert({
          title: 'Error',
          content: 'Please select a bank account'
        });
        return;
      }

      // if (!this.payee?.id) {
      //   this.alertService.warningAlert({
      //     title: 'Error',
      //     content: 'Please select deposit from'
      //   });
      //   return;
      // }

      // MM/dd/yyyy
      const formatedDate = this.datePipe.transform(
        this.date,
        'MM/dd/yyy'
      ) as string;
      if (!formatedDate) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'Please enter a valid date'
        });
        return;
      }

      if (!this.selectedIds) {
        const referenceType = '';
        this.referenceType = referenceType;
      }

      this.cashFormRows.controls.forEach((e) => {
        const denominations = e.get('denominations')?.value;
        if (denominations && denominations.length > 0) {
          this.cashType = 2;
        }
      });

      const body: INewSaveSlipBody = {
        type: this.cashType,
        depositslipAccountId: this.bankAccount?.id,
        depositDate: formatedDate,
        dsStart: formatedDate,
        comments: this.memo,
        refId: this.refId?.toString(),
        referenceType: this.referenceType,
        check: [],
        cash: [],
        payeeId: this.payee?.encryptedId as string
      };

      this.cashFormRows.controls.forEach((e) => {
        if (e.value.amount && parseInt(e.value.amount, 10)) {
          body.cash.push(e.value);
        }
      });

      this.checkFormRows.controls.forEach((e) => {
        if (e.value.amount && parseInt(e.value.amount, 10)) {
          // Create a copy of the form value to avoid modifying the original form
          const checkRow = { ...e.value };
          
          // Extract the encryptedId from checkFrom if it exists
          if (checkRow.checkFrom && typeof checkRow.checkFrom === 'object' && checkRow.checkFrom.encryptedId) {
            checkRow.checkFrom = checkRow.checkFrom.encryptedId;
          } else if (checkRow.checkFrom && typeof checkRow.checkFrom === 'string') {
            // If checkFrom is already a string (ID), keep it as is
            // No need to reassign the same value
          } else {
            // If no checkFrom is selected, set it to null or empty string
            checkRow.checkFrom = null;
          }
          
          // Check row prepared for API
          body.check.push(checkRow);
        }
      });
      if (!(body.check.length || body.cash.length)) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'Please enter the amount'
        });
        return;
      }

      this.buttonLoaderHandler(reset, print, true);
      if (this.routeData.mode === 'create' || this.routeData.mode === 'clone') {
        body.attachmentIds = this.getAttachmentsAndCommentsArray().attachments;
        body.commentIds = this.getAttachmentsAndCommentsArray().comments;
        this.subscriptions.push(
          this.depositService
            .saveDepositSlip(body)
            .pipe(
              finalize(() => {
                this.buttonLoaderHandler(reset, print, false);
              })
            )
            .subscribe((data) => {
              if (data?.success) {
                this.bankAccount = undefined;
                this.alertService.successAlert({
                  title: 'New deposit slip added!',
                  close: true,
                  timeout: 2000
                });
                if (reset) {
                  this.resetForm();
                  this.cashFormRows.controls.forEach(row => {
                    row.get('denominations')?.setValue([]);
                  });
                } else if (print) {
                  this.resetForm();
                  this.printBulk([data.data.id]);
                } else {
                  this.router.navigate(['manage/depositslips/index']);
                }
              }
            })
        );
      } else if (this.routeData.mode === 'edit') {
        if (this.routeData.mode === 'edit' && !this.ischecked) {
          this.subscriptions.push(
            this.depositService
              .updateDepositSlip(body, this.slipId)
              .pipe(
                finalize(() => this.buttonLoaderHandler(reset, print, false))
              )
              .subscribe((data) => {
                if (data?.success) {
                  this.alertService.successAlert({
                    title: 'Deposit slip updated!',
                    close: true,
                    timeout: 2000
                  });
                  this.router.navigate(['manage/depositslips/index']);
                }
              })
          );
        }
      }
    }
  }

  /**
   * @description Saves the deposit slip and triggers printing functionality.
   */
  saveAndPrint() {
    this.saveSlip(false, true);
  }

  /**
   * @description Triggers the printing of deposit slips in bulk based on the provided IDs.
   * @param {string[]} ids - An array of deposit slip IDs to be printed in bulk.
   */
  printBulk(ids: string[]) {
    this.buttonLoaderHandler(false, true, true);
    this.subscriptions.push(
      this.depositService
        .printBulk(ids)
        .pipe(
          finalize(() => {
            this.buttonLoaderHandler(false, true, false);
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.router.navigate(['manage/depositslips/index']);
            if (data?.data?.url) {
              window.open(data?.data?.url, '_blank')?.focus();
            } else if (data.data.printData) {
              const iframe = document.createElement('iframe');
              iframe.srcdoc = data.data.printData;
              iframe.style.visibility = 'hidden';
              document.body.appendChild(iframe);
            }
          }
        })
    );
  }

  getComments() {
    this.subscriptions.push(
      this.sharedService
        .getAllComments('deposit-slips', this.slipId)
        .subscribe((res) => {
          if (res.data) {
            if (this.routeData.mode !== 'clone') {
              this.commentList = res.data as IGetComment[];
            }
          }
        })
    );
  }

  getAttachments() {
    this.subscriptions.push(
      this.sharedService
        .getAttachment('deposit-slips', this.slipId)
        .subscribe((res) => {
          if (res.data) {
            if (this.routeData.mode !== 'clone') {
              this.attachmentList = res.data;
            }
          }
        })
    );
  }

  openAddAttachment() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.slipId && this.routeData.mode !== 'clone' ? this.slipId : 0,
        type: 'deposit-slips',
        existingData: this.attachmentList
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((res: { listData: IGetAttachment[]; refresh: boolean }) => {
        if (res.refresh) {
          if (this.slipId) {
            this.getAttachments();
          } else if (res?.listData?.length > 0) {
            this.attachmentList = res.listData;
          } else {
            this.attachmentList = [];
          }
        }
      });
  }

  openAddComment() {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: this.slipId && this.routeData.mode !== 'clone' ? this.slipId : 0,
        type: 'deposit-slips',
        existingData: this.commentList,
        enableDelete: true
      }
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (res: { listData: { [key: string]: string }; refresh: boolean }) => {
          if (res.refresh) {
            if (this.slipId) {
              this.getComments();
            } else {
              this.comments.push(res.listData.encrypted_id);
            }
          }
        }
      );
  }

  getAttachmentsAndCommentsArray() {
    const comments = this.commentList.map((data) => data.encrypted_id);
    const attachments = this.attachmentList.map((data) => data.encrypted_id);
    return { attachments, comments };
  }

  /**
   * @description Resets the form properties and updates shared data.
   */
  renform() {
    this.sharedService.setNewBankCreatedData();
    this.memo = '';
    this.date = new Date().toISOString().split('T')[0];
  }

  /**
   * @description Resets the form properties, updates shared data, and resets individual form controls within cashForm and checkForm.
   */
  resetForm() {
    this.sharedService.setNewBankCreatedData();
    this.memo = '';
    this.date = new Date().toISOString().split('T')[0];

    this.cashFormRows.controls.forEach((row) => {
      row.reset({ checkType: 'cash' });
    });
    this.checkFormRows.controls.forEach((row) => {
      row.reset({ checkType: 'chk' });
    });
  }

  /**
   * @description Opens a modal to create a new bank account and updates shared data upon successful creation.
   */
  openBankAccModal() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBank().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.sharedService.setNewBankCreatedData(result);
                this.onBankSelect(result.res as IBankDropdown);
              }
            })
          );
        }
      })
    );
  }

  /**
   * This function is used to handle the button loader states.
   * @param saveAndNew - A boolean value indicating whether to set the submittingAndNew loader state or not.
   * @param print - A boolean value indicating whether to set the printing loader state or not.
   * @param loaderState - A boolean value indicating whether to set the submitting loader state or not.
   */
  buttonLoaderHandler(
    saveAndNew?: boolean,
    print?: boolean,
    loaderState?: boolean
  ) {
    if (saveAndNew) {
      this.loaders.submittingAndNew = loaderState ?? false;
    } else if (print) {
      this.loaders.printing = loaderState ?? false;
    } else {
      this.loaders.submitting = loaderState ?? false;
    }
  }

  /**
   * @description Remove selected row from Cash Table
   * @param i Index of selected row.
   */
  removeCashRow(i: number) {
    const removeitem = this.cashFormRows;
    if (removeitem.length > 1) {
      removeitem.removeAt(i);
    }
  }

  /**
   * @description Remove selected row from Check table.
   * @param i Index of selected row.
   */
  removeCheckRow(i: number) {
    const removeitem = this.checkFormRows;
    if (removeitem.length > 1) {
      removeitem.removeAt(i);
    }
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
