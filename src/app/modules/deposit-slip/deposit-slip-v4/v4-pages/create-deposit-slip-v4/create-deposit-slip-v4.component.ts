import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild
} from '@angular/core';
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
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown } from 'src/app/models/bank';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import {
  IGetAttachment,
  IGetComment,
  IV3DropDownOnReady
} from 'src/app/models/common';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { MatTooltip } from '@angular/material/tooltip';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { faQuestionCircle } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-create-deposit-slip-v4',
  templateUrl: './create-deposit-slip-v4.component.html',
  styleUrls: ['./create-deposit-slip-v4.component.scss'],
  standalone: true,
  imports: [
    BankAcDropdownV4Component,
    PayeeDropdownV4Component,
    FormsModule,
    MatTooltip,
    MatCheckbox,
    ReactiveFormsModule,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    CommonButtonV4Component,
    NgClass,
    LucideAngularModule,
    V4DatePickerComponent
  ]
})
export class CreateDepositSlipV4Component implements OnInit, AfterViewInit, OnDestroy {
  private memoBox = viewChild<ElementRef<HTMLTextAreaElement>>('memoBox');
  private depositService = inject(DepositSlipsService);
  private dialog = inject(MatDialog);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  public fb = inject(UntypedFormBuilder);
  public datePipe = inject(DatePipe);
  private bankModalService = inject(BankModalService);

  subscriptions: Subscription[] = [];
  loaders = {
    submitting: false,
    submittingAndNew: false,
    printing: false
  };

  slipId!: string;
  routeData!: IRouteData;
  utils = Utils;
  ischecked = false;
  checked = false;
  blank!: number;
  payees!: IItems[];
  checks!: IItems[];
  refId!: string;
  bankAccount: IBankDropdown | undefined;
  date: Date | string = new Date();
  memo = '';
  cashForm!: FormGroup<{ rows: FormArray }>;
  checkForm!: FormGroup<{ rows: FormArray }>;
  dataFromCheck!: ICheckDeposit[];
  checkId!: string;
  selectedIds!: string[];
  referenceType!: string;
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
  cashType = 1;
  faQuestionCircle = faQuestionCircle;

  cashierClerkConfig: Iv4ngSelectConfig = {
    placeholder: 'Cashier/Clerk',
    displayField: 'name',
    outputField: 'name',
    style: { size: 1 }
  };

  cashTypeConfig: Iv4ngSelectConfig = {
    placeholder: 'Type',
    displayField: 'label',
    outputField: 'value',
    style: { size: 1 }
  };

  checkTypeConfig: Iv4ngSelectConfig = {
    placeholder: 'Type',
    displayField: 'label',
    outputField: 'value',
    style: { size: 1 }
  };

  cashTypeItems = [
    { label: 'CASH', value: 'cash' },
    { label: 'COIN', value: 'coin' }
  ];

  checkTypeItems = [
    { label: 'Business Check', value: 'chk' },
    { label: 'Personal Check', value: 'p-chk' },
    { label: 'Money Order', value: 'mo' },
    { label: 'Cashier Check', value: 'cash chk' }
  ];

  ngOnInit(): void {
    this.routeData = this.route.snapshot.data as IRouteData;
    this.subscriptions.push(
      this.route.queryParams.subscribe((_value) => {
        this.selectedIds = _value?.Ids;
      })
    );

    this.initCashForm();
    this.initCheckForm();

    // A new slip (create or clone) takes the next Ref ID; an edit keeps the slip's own.
    if (this.routeData.mode !== 'edit') {
      this.getRefId();
    }
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

  ngAfterViewInit(): void {
    this.resizeMemo();
  }

  /** Grow the memo field with its text: one 44px line up to three lines, then scroll. */
  resizeMemo(): void {
    const el = this.memoBox()?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 84)}px`;
  }

  initCashForm() {
    this.cashForm = this.fb.group({
      rows: this.fb.array([])
    });
  }

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

  setDepositslip() {
    let memo: string;
    this.dataFromCheck.forEach((e) => {
      const {
        memo: itemMemo,
        bankAccountId,
        bankAccountNickName,
        bankAccountName,
        chequeSerialNumber,
        id
      } = e;

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

  get cashFormRows() {
    return this.cashForm.controls.rows;
  }

  getCashRow(data?: ICashRow) {
    return this.fb.group({
      amount: [data ? data.amount : '', [Validators.required]],
      denominations: [data ? data.denominations : []],
      payeeName: [data ? data.payeeName : null],
      misc: [data ? data.misc : ''],
      checkType: [data ? data.checkType : 'cash']
    });
  }

  blankdeposit(event: MatCheckbox) {
    if (event.checked) {
      this.ischecked = true;
    } else {
      this.ischecked = false;
    }
  }

  pushCashRow(num = 1) {
    this.addRow();
    for (let i = 0; i < num; i += 1) {
      this.cashFormRows.push(this.getCashRow());
    }
  }

  popCashRow() {
    this.popRow();
    this.cashFormRows.removeAt(this.cashFormRows.length - 1);
  }

  initCheckForm() {
    this.checkForm = this.fb.group({
      rows: this.fb.array([])
    });
  }

  get checkFormRows() {
    return this.checkForm.controls.rows as FormArray;
  }

  getCheckRow(checRowData?: ICheckRow | ICheckDeposit) {
    const data = checRowData as ICheckRow;

    let checkFromValue = null;
    if (data?.checkFrom) {
      if (typeof data.checkFrom === 'object') {
        checkFromValue =
          data.checkFrom.id || data.checkFrom.encryptedId || null;
      } else if (typeof data.checkFrom === 'string') {
        checkFromValue = data.checkFrom;
      }
    }

    // A clone keeps the amount, payer, cashier, note and type of every check row,
    // but never the check number: the same check is never deposited twice.
    const isClone = this.routeData?.mode === 'clone';

    return this.fb.group({
      amount: [data?.amount ? data?.amount : '', [Validators.required]],
      checkFrom: [checkFromValue],
      payeeName: [data?.payeeName ? data?.payeeName : null],
      misc: [data?.misc ? data?.misc : ''],
      checkTo: [!isClone && data?.checkTo ? data?.checkTo : ''],
      checkType: [data?.checkType ? data?.checkType : 'chk'],
      referenceId: [!isClone && data?.referenceId ? data?.referenceId : '']
    });
  }

  toggleBreakdown(i: number) {
    this.activeBreakdownIndex = this.activeBreakdownIndex === i ? null : i;
  }

  handleBreakdownApplied(
    event: {
      amount: string;
      denominations: { value: string; count: number }[];
    },
    index: number
  ) {
    const formGroup = this.cashFormRows.at(index);
    formGroup.get('amount')?.setValue(event.amount);
    formGroup.get('denominations')?.setValue(event.denominations);
  }

  onAmountInputFocus() {
    this.activeBreakdownIndex = null;
  }

  addRow() {
    const cashFormRowsLength = this.cashFormRows?.controls.length || 0;
    const checkFormRowsLength = this.checkFormRows?.controls.length || 0;

    if (cashFormRowsLength + checkFormRowsLength >= 26) {
      this.disablePushBtn = false;
    }
  }

  popRow() {
    const cashFormRowsLength = this.cashFormRows?.controls.length || 0;
    const checkFormRowsLength = this.checkFormRows?.controls.length || 0;

    if (cashFormRowsLength + checkFormRowsLength < 28) {
      this.disablePushBtn = true;
    }
  }

  pushCheckRow(num = 1) {
    this.addRow();
    for (let i = 0; i < num; i += 1) {
      this.checkFormRows.push(this.getCheckRow());
    }
  }

  popCheckRow() {
    this.popRow();
    this.checkFormRows.removeAt(this.checkFormRows.length - 1);
  }

  onBankSelect(event: IBankDropdown) {
    this.bankAccount = event;
  }

  getRefId() {
    this.subscriptions.push(
      this.depositService.getRefId().subscribe((data) => {
        if (data?.success) {
          this.refId = data.data.refId;
        }
      })
    );
  }

  getPayeeItems() {
    this.subscriptions.push(
      this.depositService.getPayeeItems().subscribe((data) => {
        if (data?.success) {
          this.payees = data.data;
        }
      })
    );
  }

  getChecksform() {
    this.subscriptions.push(
      this.depositService.getChecksForm().subscribe((data) => {
        if (data?.success) {
          this.checks = data.data;
        }
      })
    );
  }

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

    if (this.routeData.mode !== 'clone') {
      this.refId = data.refId;
    }
    this.memo = data.memo;
    setTimeout(() => this.resizeMemo());
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

  saveSlip(reset?: boolean, print?: boolean) {
    if (this.ischecked) {
      if (!this.bankAccount?.id) {
        this.alertService.warningAlert({
          title: 'Error',
          content: 'Please select a bank account'
        });
        return;
      }

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
                  this.router.navigate(['/v4/manage/depositslips/index']);
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
                this.router.navigate(['/v4/manage/depositslips/index']);
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
          const checkRow = { ...e.value };

          if (
            checkRow.checkFrom &&
            typeof checkRow.checkFrom === 'object' &&
            checkRow.checkFrom.encryptedId
          ) {
            checkRow.checkFrom = checkRow.checkFrom.encryptedId;
          } else if (
            checkRow.checkFrom &&
            typeof checkRow.checkFrom === 'string'
          ) {
            // Already a string ID — keep as-is
          } else {
            checkRow.checkFrom = null;
          }

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
                  this.cashFormRows.controls.forEach((row) => {
                    row.get('denominations')?.setValue([]);
                  });
                } else if (print) {
                  this.resetForm();
                  this.printBulk([data.data.id]);
                } else {
                  this.navigateToIndex();
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
                  this.navigateToIndex();
                }
              })
          );
        }
      }
    }
  }

  saveAndPrint() {
    this.saveSlip(false, true);
  }

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
            this.navigateToIndex();
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
    const dialogRef = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.slipId && this.routeData.mode !== 'clone' ? this.slipId : 0,
        type: 'deposit-slips',
        existingData: this.attachmentList
      }
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (res: { existingData: IGetAttachment[]; isRefresh: boolean }) => {
          if (res?.isRefresh) {
            if (this.slipId) {
              this.getAttachments();
            } else if (res?.existingData?.length > 0) {
              this.attachmentList = res.existingData;
            } else {
              this.attachmentList = [];
            }
          }
        }
      );
  }

  openAddComment() {
    const dialogRef = this.dialog.open(V4AddCommentCommonModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.slipId && this.routeData.mode !== 'clone' ? this.slipId : 0,
        type: 'deposit-slips',
        existingData: this.commentList,
        enableDelete: true
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((res: { listData: IGetComment[]; refresh: boolean }) => {
        if (res?.refresh) {
          if (this.slipId) {
            this.getComments();
          } else if (res?.listData?.length) {
            this.commentList = res.listData;
          }
        }
      });
  }

  getAttachmentsAndCommentsArray() {
    const comments = this.commentList.map((data) => data.encrypted_id);
    const attachments = this.attachmentList.map((data) => data.encrypted_id);
    return { attachments, comments };
  }

  renform() {
    this.sharedService.setNewBankCreatedData();
    this.memo = '';
    this.date = new Date().toISOString().split('T')[0];
  }

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

  removeCashRow(i: number) {
    const removeitem = this.cashFormRows;
    if (removeitem.length > 1) {
      removeitem.removeAt(i);
    }
  }

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

  navigateToIndex() {
    if (this.routeData.mode === 'create') {
      this.router.navigate(['../index'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../../index'], { relativeTo: this.route });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
