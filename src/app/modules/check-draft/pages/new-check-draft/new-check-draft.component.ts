import { DatePipe, NgClass, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
  ICheckDraftCloneData,
  INewCheckDraft,
  IPayeeCheckDraftSummary,
  IPayeeLastTransactions,
  IPayeeSingleBankData
} from 'src/app/modules/check-draft/model/Checkdraft';
import { Utils } from 'src/app/data/utils';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { AddPayeeBankModalComponent } from 'src/app/shared/modal/payee-bank-modal/add-payee-bank-modal/add-payee-bank-modal.component';
import { IGetAttachment, IGetComment } from 'src/app/models/common';
import { IBankDropdown } from 'src/app/models/bank';
import {
  IPayeeBankDetails,
  IPayeeDropdown,
  IShowPayeeDetails
} from 'src/app/modules/payee/payee-v2/model/payee';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { HttpHeaders } from '@angular/common/http';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { SetRecurringModalComponent } from '../../modal/set-recurring-modal/set-recurring-modal.component';
import { TruncatePipe } from '../../../../pipes/truncate.pipe';
import { DropDownPayeeBankComponent } from '../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { NewPhoneInputComponent } from '../../../../shared/components/new-phone-input/new-phone-input.component';
import { DropDownCategoryComponent } from '../../../../shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownPayeeComponent } from '../../../../shared/components/drop-downs/drop-down-payee/drop-down-payee.component';

/**
 * @description Represents the NewCheckDraftComponent class.
 */
@Component({
  selector: 'app-new-check-draft',
  templateUrl: './new-check-draft.component.html',
  styleUrls: ['./new-check-draft.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    DropDownPayeeComponent,
    FaIconComponent,
    ControlMessageComponent,
    DropDownBankComponent,
    AmountInputComponent,
    DropDownCategoryComponent,
    NewPhoneInputComponent,
    NgSelectModule,
    DropDownPayeeBankComponent,
    MatTooltip,
    CurrencyPipe,
    TruncatePipe
  ]
})
export class NewCheckDraftComponent implements OnInit, OnDestroy {
  id: string;
  checkDraftForm!: UntypedFormGroup;
  isRemittence = false;
  subscriptions: Subscription[] = [];
  selectedPayee: IShowPayeeDetails | undefined;
  payeeBankData: IPayeeBankDetails[] = [];
  payeeSelected: IPayeeBankDetails;
  selectedPayeeBank?: IPayeeSingleBankData;
  payeeId: string;
  payeeSummery: IPayeeCheckDraftSummary | undefined;
  lastTransaction: IPayeeLastTransactions[] | undefined;
  today: string;
  smsCost = '0.00';
  page = 1;
  remittanceItem: string[] = [];
  allAttachments: string[] = [];
  allComments: string[] = [];
  invoiceNumberList: number[] = [];
  itemNameList: string[] = [];
  itemDescriptionList: string[] = [];
  itemQuantityList: number[] = [];
  itemUnitCostList: number[] = [];
  totalSingleRowList: number[] = [];
  cloneDatas: Omit<ICheckDraftCloneData, 'checkIssueDate'> & {
    checkIssueDate?: string;
  };

  isAction = false;

  PhoneValidation: boolean | { invalidPhoneNumber: boolean };
  EmailValidation: boolean | { invalidEmailAddress: boolean };
  AppStatus: number;
  validPhoneNumber = true;
  isPhoneNumberUpdating = false;
  isDisablePermissionSms = false;
  attachmentList:IGetAttachment[] = [];
  commentsList:IGetComment[] = [];
  utils = Utils;

  private fb = inject(UntypedFormBuilder);
  public dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);
  private alertService = inject(AlertService);
  private checkDraftService = inject(CheckDraftService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private checkService = inject(CheckService);
  private activatedRoute = inject(ActivatedRoute);
  private headerservice = inject(HeaderService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private bankModalService = inject(BankModalService);
  private payeeModalService = inject(PayeeModalService);

  titleCase= new TitleCasePipe();

  ngOnInit(): void {
    const date = new Date();
    date.setDate(date.getDate());
    this.today = this.datePipe.transform(date, 'yyyy-MM-dd') as string;
    this.initCheckDraftForm();

    // ======LOAD REMITTANCE ROW
    const addRow = this.getRemittanceFormControl();
    for (let i = 1; i <= 5; i += 1) {
      addRow.push(this.remittanceFormBody());
    }
    addRow.reset();

    this.activatedRoute.queryParams.subscribe((data) => {
      this.id = data.id;
    });

    if (this.id) {
      this.cloneData(this.id);
    }

    this.ApplicationStatus();
  }

  /**
   * @description Retrieves and sets the application status.
   */
  ApplicationStatus() {
    this.subscriptions.push(
      this.checkDraftService.checkDraftStatus().subscribe((res) => {
        if (res) {
          this.AppStatus = res.data;
        }
      })
    );
  }

  /**
   * @description Retrieves and populates the form with clone data from server.
   * @param id - The ID of the clone data.
   */
  cloneData(id: string) {
    this.subscriptions.push(
      this.checkDraftService.getCloneData(id).subscribe((res) => {
        if (res.success) {
          this.cloneDatas = res.data;
          delete this.cloneDatas.checkIssueDate;
          this.checkDraftForm.patchValue(this.cloneDatas);

          this.sharedService.setNewPayeeCreatedData({
            payeeId: this.cloneDatas.payeeId
          });
          this.selectPayeeData(this.cloneDatas.payeeId);
          this.getPayeeBankAccounts(this.cloneDatas.payeeId);
          this.getPayeeSummery(this.cloneDatas.payeeId);
          this.payeeId = this.cloneDatas.payeeId;
          this.checkDraftForm.controls.payeeId.setValue(this.payeeId);

          this.sharedService.setNewBankCreatedData({
            bankAccountId: this.cloneDatas.bankaccountId
          });

          this.sharedService.setNewCategoryCreatedData({
            categoryId: this.cloneDatas.categoryId
          });
          this.checkDraftForm.controls.categoryId.setValue(res.data.categoryId);

          this.checkDraftForm.controls.bankaccountId.setValue(
            this.cloneDatas.bankaccountId
          );
        }
      })
    );
  }

  /**
   * @description Toggles the display of the remittance section.
   */
  toggleRemittance() {
    this.isRemittence = !this.isRemittence;
    this.loadRemittanceItems();
  }

  /**
   * @description Retrieves the remittance form control.
   * @returns - The remittance form control.
   */
  getRemittanceFormControl(): UntypedFormArray {
    return this.checkDraftForm.get('remittence') as UntypedFormArray;
  }

  /**
   * @description Initializes the check draft form with default values and structure.
   */
  initCheckDraftForm(): void {
    this.checkDraftForm = this.fb.group({
      payeeId: ['', Validators.required],
      payeeCheckId: new UntypedFormControl('', [Validators.required]),
      bankaccountId: new UntypedFormControl('', [Validators.required]),
      amount: new UntypedFormControl('', [
        Validators.required,
        Validators.min(0.01)
      ]),
      chequeSerialNumber: ['', Validators.required],
      checkIssueDate: [this.today, Validators.required],
      categoryId: '',
      ac: '',
      Inv: '',
      Note: '',
      memo: '',
      isThisNeedPermission: false,
      sendPermissionEmail: '',
      permissionEmail: '',
      permissionSms: '',
      permissionPhone: '',
      allAttachments: '',
      allComments: '',
      invoiceNumber: '',
      itemName: '',
      itemDescription: '',
      itemQuantity: '',
      itemUnitCost: '',
      totalSingleRow: '',
      attachRemittanceToCheck: 0,
      remittence: this.fb.array([this.remittanceFormBody()])
    });

    this.subscriptions.push(
      this.checkDraftForm
        .get('permissionPhone')
        ?.valueChanges.subscribe((phone) => {
          if (!this.isPhoneNumberUpdating && phone) {
            this.validPhoneNumber = phone.length > 10;
            if (!this.validPhoneNumber) {
              this.isDisablePermissionSms = true;
              this.checkDraftForm.controls.permissionSms.patchValue(1);
            }
          }
          this.isPhoneNumberUpdating = false;
          if (!phone) {
            this.isDisablePermissionSms = false;
          }
        }) as Subscription
    );
    this.subscriptions.push(
      this.checkDraftForm
        .get('permissionSms')
        ?.valueChanges.subscribe((permission) => {
          if (permission) {
            this.validPhoneNumber =
              this.checkDraftForm.get('permissionPhone')?.value.length > 10;
          } else {
            this.validPhoneNumber = true;
          }
        }) as Subscription
    );
  }

  smsPermissionValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const permissionSms = control.get('permissionSms');
    const permissionPhone = control.get('permissionPhone');

    if (permissionSms && permissionPhone) {
      const phoneLength = permissionPhone.value
        ? permissionPhone.value.toString().length
        : 0;
      const smsPermissionValue = permissionSms.value;

      if (smsPermissionValue && phoneLength <= 10) {
        return { smsPermissionInvalid: true };
      }
    }

    return null;
  }

  /**
   * @description Creates the payload for a new check draft based on the form values.
   * @returns - The check draft data for creation.
   */
  CreateCheckdraftBody(): INewCheckDraft {
    const data = this.checkDraftForm.value;
    return {
      payeeId: data.payeeId,
      payeeCheckId: data.payeeCheckId,
      bankaccountId: data.bankaccountId,
      amount: data.amount,
      chequeSerialNumber: data.chequeSerialNumber,
      checkIssueDate: data.checkIssueDate,
      categoryId: data.categoryId,
      ac: data.ac,
      Inv: data.Inv,
      Note: data.Note,
      memo: data.memo,
      isThisNeedPermission: data.isThisNeedPermission,
      sendPermissionEmail: data.sendPermissionEmail,
      permissionEmail: data.permissionEmail,
      permissionSms: data.permissionSms,
      permissionPhone: data.permissionPhone,
      allAttachments: data.allAttachments,
      allComments: data.allComments,
      invoiceNumber: data.invoiceNumber,
      itemName: data.itemName,
      itemDescription: data.itemDescription,
      itemQuantity: data.itemQuantity,
      itemUnitCost: data.itemUnitCost,
      totalSingleRow: data.totalSingleRow,
      attachRemittanceToCheck: data.attachRemittanceToCheck
    };
  }

  /**
   * @description Generates a form group structure for remittance rows.
   * @returns - The remittance row form group.
   */
  remittanceFormBody() {
    return this.fb.group({
      invoice: [''],
      item: [''],
      description: [''],
      quantity: [''],
      unitCost: [''],
      total: ['']
    });
  }

  /**
   * @description Loads remittance items for selection.
   */
  loadRemittanceItems() {
    this.subscriptions.push(
      this.checkService
        .getCheckRemiitanceItems(this.page, '')
        .subscribe((res) => {
          if (res.success === true) {
            this.remittanceItem = res.data.items;
          }
        })
    );
  }

  /**
   * @description Handles the scroll event for loading more remittance items.
   */
  onScrollItems() {
    this.page += 1;
    this.subscriptions.push(
      this.checkService
        .getCheckRemiitanceItems(this.page, '')
        .subscribe((res) => {
          res.data.items.forEach((element: string) => {
            this.remittanceItem.push(element);
          });
        })
    );
  }

  /**
   * @description Handles the search event for filtering remittance items.
   * @param event - The keyboard event containing the search term.
   */
  onSearchItems(event: KeyboardEvent & { target: HTMLInputElement }) {
    const searchTerm = event.target.value;
    this.subscriptions.push(
      this.checkService
        .getCheckRemiitanceItems(this.page, searchTerm)
        .subscribe((res) => {
          this.remittanceItem = res.data.items;
        })
    );
  }

  /**
   * @description Adds a new remittance row to the form.
   */
  addNewRow(): void {
    const addRow = this.getRemittanceFormControl();

    addRow.push(this.remittanceFormBody());
  }

  /**
   * @description Handles key events to allow only numbers, decimal point, and negative sign.
   * @param event - The keyboard event.
   * @returns - True if the event is allowed, false otherwise.
   */
  numberOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (
      charCode > 31 &&
      (charCode < 48 || charCode > 57) &&
      charCode !== 45 &&
      charCode !== 46
    ) {
      return false;
    }
    return true;
  }

  /**
   * @description Calculates the total for a single remittance row.
   * @param i - The index of the row.
   */
  total(i: number) {
    const control = this.getRemittanceFormControl();
    const formGroup = control.controls[i] as UntypedFormGroup;
    const quantity = Number(formGroup.get('quantity')?.value);
    const unitCost = Number(formGroup.get('unitCost')?.value);
    const total = quantity * unitCost;
    if (!Number.isNaN(total)) {
      // Avoid NaN of field
      formGroup.get('total')?.setValue(total);
    } else {
      formGroup.get('total')?.setValue(0.0);
    }
  }

  /**
   * @description Calculates the grand total of all remittance rows.
   * @returns - The calculated grand total.
   */
  grandTotal() {
    const control = this.getRemittanceFormControl().controls;
    let grandTotal = 0;
    for (let i = 0; i < control.length; i += 1) {
      grandTotal += control[i].get('total')?.value ?? 0;
    }
    return grandTotal;
  }

  /**
   * @description Removes a specific remittance row.
   * @param i - The index of the row to be removed.
   */
  removeSelectedRow(i: number) {
    const removeitem = this.getRemittanceFormControl();
    if (removeitem.length > 1) {
      removeitem.removeAt(i);
      // this.isRemittanceSaved = false;
    }
  }

  /**
   * @description Removes the last remittance row.
   */
  removeRow(): void {
    const removeitem = this.getRemittanceFormControl();
    if (removeitem.length > 1) {
      removeitem.removeAt(removeitem.length - 1);
    }
  }

  /**
   * @description Clears all remittance rows.
   */
  clearAllRow() {
    const alert = this.openConfirmAlert(
      'Are you sure you want to clear all data?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        const removeitem = this.getRemittanceFormControl();
        removeitem.reset();
      }
    });
  }

  /**
   * @description Opens a confirmation dialog.
   * @param content - The content of the confirmation message.
   * @returns - An observable that resolves with the user's choice.
   */
  openConfirmAlert(content: string) {
    const data = {
      title: 'Alert!',
      content,
      doneMsg: 'Ok',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  /**
   * @description Updates the check amount with the calculated grand total.
   */
  insertRemiValueToCheck() {
    if (this.grandTotal() > 100000000) {
      this.warningAlert(
        'The check amount should be in-between 0 and 100000000.'
      );
    } else {
      this.checkDraftForm.controls.amount.patchValue(this.grandTotal());
    }
  }

  /**
   * @description Adds a new bank account to the selected payee.
   */
  AddBankAccountToPayee(): void {
    const dialog = this.dialog.open(AddPayeeBankModalComponent, {
      width: '600px',
      data: { payeeId: this.payeeId, editMode: false }
    });
    dialog.afterClosed().subscribe((r) => {
      if (r) {
        this.successAlert('Bank account created');
        this.getPayeeBankAccounts(this.payeeId);
      }
    });
  }

  /**
   * @description Opens a modal to edit the selected bank account of the payee.
   */
  EditBankAccountOfPayee(): void {
    const payeeBank = this.selectedPayeeBank as IPayeeSingleBankData & {
      editMode: true;
      payeeId: string;
    };
    payeeBank.editMode = true;
    payeeBank.payeeId = this.payeeId;
    const dialog = this.dialog.open(AddPayeeBankModalComponent, {
      width: '600px',
      data: payeeBank
    });

    dialog.afterClosed().subscribe((r) => {
      if (r) {
        this.successAlert('Bank account updated');
        this.getPayeeBankAccounts(this.payeeId);
      }
    });
  }

  /**
   * @description Opens a modal for adding attachments to the check draft.
   */
  openAttachmentModal() {
    const dialogRef = this.dialog.open<
      AddAttachmentModalComponent,
      { id: number; type: string,attachments:IGetAttachment[] },
      { listData: IGetAttachment[]; refresh: boolean }
    >(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: 0,
        type: 'cheque-drafts',
        attachments:this.attachmentList
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {        
        this.attachmentList = res.listData;
        res.listData.forEach((el) => {
          this.allAttachments.push(el.encrypted_id);
        });
      }
    });
  }

  /**
   * @description Opens a modal for adding comments to the check draft.
   */
  openAddCommentsModal() {
    const dialogRef = this.dialog.open<
      AddCommentsModalComponent,
      { id: number; type: string,existingData:IGetComment[] },
      { listData: IGetComment[]; refresh: boolean }
    >(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        id: 0,
        type: 'cheque-drafts',
        existingData:this.commentsList
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.commentsList = res.listData;
        res.listData.forEach((el) => {
          this.allComments.push(el.encrypted_id);
        });
      }
    });
  }

  /**
   * @description Creates a new check draft.
   * Either prints it, saving it or creating a recurring check draft.
   * @param type - The type of check draft to create.
   */
  newCheckDraft(type: string) {
    this.checkDraftForm.markAllAsTouched();
    if (this.checkDraftForm.invalid) {
      return;
    }
    if (!this.validPhoneNumber) {
      return;
    }

    if (this.checkDraftForm.controls.payeeCheckId.value === '') {
      if (this.payeeBankData.length === 0) {
        const res = this.warningAlert('Please add bank account for payee.');
        res.afterClosed().subscribe((data) => {
          if (data) {
            this.AddBankAccountToPayee();
          }
        });
      } else {
        this.warningAlert('Please select a payee bank account as default');
        return;
      }
    }

    if (this.checkDraftForm.controls.amount.value > 100000000) {
      this.warningAlert(
        'The check amount should be in-between 0 and 100000000.'
      );
      return;
    }

    if (
      this.checkDraftForm.controls.isThisNeedPermission.value &&
      this.checkDraftForm.controls.sendPermissionEmail.value === false &&
      this.checkDraftForm.controls.permissionSms.value === false
    ) {
      this.wariningMsg();
      return;
    }

    if (this.checkDraftForm.controls.isThisNeedPermission.value) {
      this.checkDraftForm.controls.isThisNeedPermission.setValue(1);
    } else {
      this.checkDraftForm.controls.isThisNeedPermission.setValue(0);
    }

    if (this.checkDraftForm.controls.sendPermissionEmail.value) {
      this.checkDraftForm.controls.sendPermissionEmail.setValue(1);
    } else {
      this.checkDraftForm.controls.sendPermissionEmail.setValue(0);
    }

    if (this.checkDraftForm.controls.permissionSms.value) {
      this.checkDraftForm.controls.permissionSms.setValue(1);
    } else {
      this.checkDraftForm.controls.permissionSms.setValue(0);
    }

    const control = this.getRemittanceFormControl().controls;
    for (let i = 0; i < control.length; i += 1) {
      if (
        control[i].get('quantity')?.value &&
        control[i].get('unitCost')?.value &&
        control[i].get('total')?.value
      ) {
        this.invoiceNumberList.push(control[i].get('invoice')?.value);
        this.itemNameList.push(control[i].get('item')?.value);
        this.itemDescriptionList.push(control[i].get('description')?.value);
        this.itemQuantityList.push(control[i].get('quantity')?.value);
        this.itemUnitCostList.push(control[i].get('unitCost')?.value);
        this.totalSingleRowList.push(control[i].get('total')?.value);
      }
    }

    if (this.grandTotal() !== 0) {
      this.checkDraftForm.controls.attachRemittanceToCheck.setValue(1);
    } else {
      this.checkDraftForm.controls.attachRemittanceToCheck.setValue(0);
    }

    this.checkDraftForm.controls.allAttachments.setValue(this.allAttachments);
    this.checkDraftForm.controls.allComments.setValue(this.allComments);
    this.checkDraftForm.controls.invoiceNumber.setValue(this.invoiceNumberList);
    this.checkDraftForm.controls.itemName.setValue(this.itemNameList);
    this.checkDraftForm.controls.itemDescription.setValue(
      this.itemDescriptionList
    );
    this.checkDraftForm.controls.itemQuantity.setValue(this.itemQuantityList);
    this.checkDraftForm.controls.itemUnitCost.setValue(this.itemUnitCostList);
    this.checkDraftForm.controls.totalSingleRow.setValue(
      this.totalSingleRowList
    );

    delete this.checkDraftForm.value.remittence;

    if (type === 'R') {
      delete this.checkDraftForm.value.allAttachments;
      delete this.checkDraftForm.value.allComments;
      delete this.checkDraftForm.value.invoiceNumber;
      delete this.checkDraftForm.value.itemDescription;
      delete this.checkDraftForm.value.itemName;
      delete this.checkDraftForm.value.itemQuantity;
      delete this.checkDraftForm.value.itemUnitCost;
      delete this.checkDraftForm.value.totalSingleRow;

      this.openRecurringModal();
    } else {
      this.creatNewCheckDradt(this.CreateCheckdraftBody(), type);
    }
  }

  openWarningAlert(msg: string) {
    const data = {
      content: msg,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now',
      isOk: true,
      isCancel: true
    };
    const action = this.alertService.warningAlert(data);
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  /**
   * @description Retrieves the last digits of a bank account and formats it.
   * @param val - The bank account value.
   * @returns The masked bank account number.
   */
  getBankAccount(val: string) {
    return `*****${String(val).slice(-4)}`;
  }

  /**
   * @description Opens the recurring modal for creating recurring check drafts.
   */
  openRecurringModal() {
    const dialogRef = this.dialog.open(SetRecurringModalComponent, {
      width: '450px',
      maxWidth: '1000px',
      disableClose: true,
      data: {
        from: 'create',
        data: this.checkDraftForm.value
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        const responce = this.successAlert(
          'Check draft has set for recurring. You can manage them in recurring list.',
          3000
        );
        responce.afterClosed().subscribe((resp) => {
          if (resp) {
            this.router.navigateByUrl('manage/checkdraft/recurring');
          }
        });
      }
    });
  }

  /**
   * @description Displays a warning message for missing email or SMS selection.
   */
  wariningMsg() {
    const data = {
      tittle: 'Error',
      content: 'Please select either email or sms',
      doneMsg: 'OK'
    };

    this.alertService.warningAlert(data);
  }

  /**
   * @description Opens the add payee modal.
   */
  addNewPayee() {
    this.subscriptions.push(
      this.payeeModalService.openAddPayee().subscribe((payeeModal) => {
        if (payeeModal) {
          this.subscriptions.push(
            payeeModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.sharedService.setNewPayeeCreatedData({
                  payeeId: result.id
                });
                this.selectedPayee = undefined;
                this.selectedPayeeBank = undefined;
                this.payeeSummery = undefined;
                this.lastTransaction = undefined;
                this.selectPayeeData(result.id);
                this.getPayeeBankAccounts(result.id);
                this.getPayeeSummery(result.id);
                this.payeeId = result.id;
                this.checkDraftForm.controls.payeeId.setValue(this.payeeId);
              }
            })
          );
        }
      })
    );
  }

  /**
   * @description Adds a new bank account for a payee using a modal dialog.
   */
  addNewBankAccount() {
    if(this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBank().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.sharedService.setNewBankCreatedData({
                  bankAccountId: result.id
                });
                this.checkDraftForm.controls.bankaccountId.setValue(
                  result.id
                );

                // Not approved check draft
                if (
                  this.AppStatus === 1 ||
                  this.AppStatus === 2 ||
                  this.AppStatus === 3
                ) {
                  const approved = this.alertService.warningAlert({
                    content:
                      'You are not approved for check draft. This check draft will be voided, Are you sure you want to continue?',
                    doneMsg: 'Yes',
                    isCancel: true,
                    cancelMsg: 'Not Now'
                  });
                  approved.afterClosed().subscribe((res) => {
                    if (!res) {
                      this.checkDraftForm.controls.bankaccountId.setValue('');
                      this.sharedService.setNewBankCreatedData();
                    }
                  });
                } else if (this.AppStatus === 0) {
                  // Not verified bank acount
                  const close = this.alertService.warningAlert({
                    content:
                      'This bank account is not verified.  This check draft will be voided, Are you sure you want to continue?',
                    doneMsg: 'Yes',
                    isCancel: true,
                    cancelMsg: 'Not Now'
                  });
                  close.afterClosed().subscribe((res) => {
                    if (res) {
                      this.checkDraftForm.controls.bankaccountId.setValue(
                        result.id
                      );
                    } else {
                      this.checkDraftForm.controls.bankaccountId.setValue('');
                      this.sharedService.setNewBankCreatedData();
                    }
                  });
                }
              }
            })
          );
        }
      })
    );
  }

  /**
   * @description Adds a new category for a check draft.
   */
  addNewCategory(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.success != null) {
        this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
        this.checkDraftForm.controls.categoryId.setValue(res.id);
      }
    });
  }

  /**
   * @description Handles the change event when a payee is selected.
   * @param env - The selected payee details.
   */
  onChange(env: IPayeeDropdown) {
    if (this.id) {
      this.warningAlert('Could not change current payee');
      return;
    }
    if (env !== undefined) {
      this.selectedPayee = undefined;
      this.selectedPayeeBank = undefined;
      this.payeeSummery = undefined;
      this.lastTransaction = undefined;
      this.selectPayeeData(env.id);
      this.getPayeeBankAccounts(env.id);
      this.getPayeeSummery(env.id);
      this.payeeId = env.id;
      this.checkDraftForm.controls.payeeId.setValue(this.payeeId);
      this.getSerialNumber();
    } else {
      this.checkDraftForm.controls.payeeId.setValue('');
      this.selectedPayee = undefined;
      this.selectedPayeeBank = undefined;
      this.payeeSummery = undefined;
      this.lastTransaction = undefined;
    }
  }

  /**
   * @description Selects payee data and updates form controls.
   * @param id - The ID of the selected payee.
   */
  selectPayeeData(id: string) {
    this.subscriptions.push(
      this.payeeService.showPayee(id).subscribe((res) => {
        if (res.success) {
          this.selectedPayee = res.data;

          if (this.selectedPayee?.phone) {
            this.checkDraftForm.controls.permissionPhone.patchValue(
              this.selectedPayee?.phone
            );
            if (
              this.checkDraftForm.controls.permissionPhone.value?.length > 10
            ) {
              this.checkDraftForm.controls.permissionSms.patchValue(1);
            } else {
              this.checkDraftForm.controls.permissionSms.patchValue(0);
            }
          } else {
            this.isPhoneNumberUpdating = true;
            this.checkDraftForm.controls.permissionPhone.patchValue('');
            this.checkDraftForm.controls.permissionSms.patchValue(0);
          }

          if (this.selectedPayee?.email) {
            this.checkDraftForm.controls.permissionEmail.patchValue(
              this.selectedPayee?.email
            );
            const validation = ValidationService.emailValidator(
              this.checkDraftForm.controls.permissionEmail
            );
            if (!validation) {
              this.checkDraftForm.controls.sendPermissionEmail.patchValue(true);
            } else {
              this.checkDraftForm.controls.sendPermissionEmail.patchValue(
                false
              );
            }
          } else {
            this.checkDraftForm.controls.permissionEmail.patchValue('');
            this.checkDraftForm.controls.sendPermissionEmail.patchValue(false);
          }
        }
      })
    );
  }

  /**
   * @description Validates and updates email permission based on email address.
   */
  getEmail() {
    this.EmailValidation = ValidationService.emailValidator(
      this.checkDraftForm.controls.permissionEmail
    );

    if (this.EmailValidation) {
      this.checkDraftForm.controls.sendPermissionEmail.patchValue(false);
    } else {
      this.checkDraftForm.controls.sendPermissionEmail.patchValue(true);
    }
  }

  /**
   * @description Validates and updates permissions based on the selected type.
   * @param type - The permission type ('E' for email, 'S' for SMS).
   */
  getCondition(type: string, event: Event) {
    event.preventDefault();
    if (type === 'E') {
      this.EmailValidation = ValidationService.emailValidator(
        this.checkDraftForm.controls.permissionEmail
      );
      if (
        this.checkDraftForm.controls.sendPermissionEmail.value &&
        this.EmailValidation
      ) {
        this.checkDraftForm.controls.sendPermissionEmail.patchValue(false);
      }
    } else if (type === 'S') {
      if (this.checkDraftForm.controls.permissionSms.value) {
        this.checkDraftForm.controls.permissionSms.patchValue(0);
      } else if (
        this.checkDraftForm.controls.permissionPhone.value?.length >= 10
      ) {
        this.checkDraftForm.controls.permissionSms.patchValue(1);
      }
    }
  }

  /**
   * @description Creates a new check draft and handles different cases.
   * @param data - The check draft data.
   * @param type - The type of check draft to create.
   */
  creatNewCheckDradt(data: INewCheckDraft, type: string) {
    this.isAction = true;
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.checkDraftService
        .createNewCheckDraft(data, headerOptions)
        .pipe(
          finalize(() => {
            this.isAction = false;
          }),
          catchError((err) => {
            if (err.error.errorCode === 102) {
              const datas = {
                title: 'Error',
                content:
                  "You don't have enough balance to send this SMS. Please refill and try again.",
                cancelMsg: 'Cancel',
                isCnacel: true,
                doneMsg: 'Refill Now'
              };
              const response = this.alertService.warningAlert(datas);
              response.afterClosed().subscribe((res) => {
                if (res) {
                  this.router.navigateByUrl('manage/refill-credit');
                }
              });
              return of({ success: false, data: undefined });
            }

            if (err.status === 422) {
              this.openWarningAlert(err.error.errorMsg);
            }
            if(err.status === 403){
              this.alertService.warningAlert({
                content: "You don't have permission to do this action."
              });
            }
            return of({ success: false, data: undefined });
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.isAction = false;
            this.successAlert('Check draft created');
            this.headerservice.setHeaderValueChanged(true);
            if (type === 'S') {
              this.router.navigateByUrl('manage/checkdraft/index');
            } else {
              this.printCheckDraft(res.data?.id as string);
            }
          }
        })
    );
  }

  /**
   * @description Prints a check draft and opens it in a new window.
   * @param id - The ID of the check draft to print.
   */
  printCheckDraft(id: string) {
    this.subscriptions.push(
      this.checkDraftService.getPrint(id).subscribe((res) => {
        if (res.success) {
          // const iframes = document.querySelectorAll('iframe');
          // for (let i = 0; i < iframes.length; i++) {
          //   if (iframes[i].id?.includes('print-iframe')) {
          //     iframes[i]?.parentNode?.removeChild(iframes[i]);
          //   }
          // }

          // var iframe = document.createElement('iframe');
          // iframe.id = 'new-check-draft-print-iframe';
          // iframe.srcdoc = res.data.printData;
          // iframe.style.visibility = 'hidden';
          // document.body.appendChild(iframe);
          window.open(res.data.url, 'blank');
          this.router.navigateByUrl('manage/checkdraft/index');
        }
      })
    );
  }

  /**
   * @description Displays a success alert message.
   * @param content - The content of the alert message.
   * @param timeout - The optional timeout duration.
   * @returns The alert dialog reference.
   */
  successAlert(content: string, timeout?: number) {
    const data = {
      title: 'Success',
      content,
      close: true,
      timeout
    };

    return this.alertService.successAlert(data);
  }

  /**
   * @description Retrieves bank account data for a payee.
   * @param id - The ID of the selected payee.
   */
  getPayeeBankAccounts(id: string) {
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(id).subscribe((res) => {
        if (res.success) {
          this.payeeBankData = res.data;

          if (this.payeeBankData.length === 0) {
            const alert = this.warningAlert(
              'Please add bank account for payee.'
            );
            alert.afterClosed().subscribe((response) => {
              if (response) {
                this.AddBankAccountToPayee();
                this.CreateCheckdraftBody();
              }
            });
          }

          this.payeeSelected = res.data.filter(
            (e) => e.defaultCDAccount === 1
          )[0];

          if (this.payeeSelected === undefined && res.data.length !== 0) {
            this.warningAlert('Please select a payee bank account as default');
            return;
            // let data={
            //   bankId:id,
            //   payeeId:this.payeeId
            // }
            // this.setDefaultDDBankAcc(data);
          }
          this.checkDraftForm.controls.payeeCheckId.setValue(
            this.payeeSelected?.id
          );

          if (this.payeeSelected) {
            this.getPayeeSingleBankAccount(id, this.payeeSelected.id);
          }
        }
      })
    );
  }

  /**
   * @description Opens a calculator dialog for amount input.
   */
  openCalculator(): void {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: {addAmountButton : true, outputDigitsCount : 10}
    });

    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.checkDraftForm.controls.amount.setValue(calculatedValue);
      }
    });
  }

  /**
   * @description Retrieves detailed information about a selected bank account.
   * @param id - The ID of the selected payee.
   * @param bankId - The ID of the selected bank account.
   */
  getPayeeSingleBankAccount(id: string, bankId: string) {
    this.subscriptions.push(
      this.payeeService.getPayeeSingleBankData(id, bankId).subscribe((res) => {
        if (res.success) {
          this.selectedPayeeBank = res.data as IPayeeSingleBankData;
        }
      })
    );
  }

  /**
   * @description Retrieves summary data for the selected payee.
   * @param id - The ID of the selected payee.
   */
  getPayeeSummery(id: string) {
    this.subscriptions.push(
      this.checkDraftService.lastTransactions(id).subscribe((res) => {
        if (res.success) {
          this.payeeSummery = res.data.payeeSummary;
          this.lastTransaction = res.data.lastTenTransaction;
        }
      })
    );
  }

  /**
   * @description Updates the selected payee bank account.
   * @param id - The ID of the selected bank account.
   */
  getSelectedPayeeBank(id: string) {
    if (id !== undefined) {
      const data = {
        bankId: id,
        payeeId: this.payeeId
      };
      this.checkDraftForm.controls.payeeCheckId.setValue(id);
      this.getPayeeSingleBankAccount(this.payeeId, id);
      this.setDefaultDDBankAcc(data);
    } else {
      this.selectedPayeeBank = undefined;
      this.checkDraftForm.controls.payeeCheckId.setValue('');
    }
  }

  /**
   * @description Opens the payee editing dialog.
   */
  editPayee() {
    this.subscriptions.push(
      this.payeeModalService.openEditPayee(this.payeeId,undefined,{ edit: true, id: this.payeeId }).subscribe((payeeModal) => {
        if (payeeModal) {
          this.subscriptions.push(
            payeeModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                if (result?.success) {
                  this.sharedService.setNewPayeeCreatedData({
                    payeeId: result.id
                  });
                  this.selectedPayee = undefined;
                  this.selectedPayeeBank = undefined;
                  this.payeeSummery = undefined;
                  this.lastTransaction = undefined;
                  this.selectPayeeData(result.id);
                  this.getPayeeBankAccounts(result.id);
                  this.getPayeeSummery(result.id);
                  this.payeeId = result.id;
                  this.checkDraftForm.controls.payeeId.setValue(this.payeeId);
                }
              }
            })
          );
        }
      })
    );
  }

  /**
   * @description Sets a bank account as the default account for a payee.
   * @param data - The data containing the bank and payee IDs.
   */
  setDefaultDDBankAcc(data: { bankId: string; payeeId: string }) {
    this.subscriptions.push(
      this.checkDraftService.setDefaultCDBankAcc(data).subscribe()
    );
  }

  /**
   * @description Retrieves and updates the serial number for the check draft.
   */
  getSerialNumber() {
    this.subscriptions.push(
      this.checkDraftService.getSerialNumber().subscribe((res) => {
        this.checkDraftForm.controls.chequeSerialNumber.patchValue(
          res.data.new_serial_no
        );
      })
    );
  }

  /**
   * @description Handles the change event when a bank is selected.
   * @param env - The selected bank details.
   */
  onChangeBank(env: IBankDropdown) {
    if (env !== undefined) {
      // Not approved check draft
      if (
        this.AppStatus === 1 ||
        this.AppStatus === 2 ||
        this.AppStatus === 3
      ) {
        const approved = this.alertService.warningAlert({
          content:
            'You are not approved for check draft. This check draft will be voided, Are you sure you want to continue?',
          doneMsg: 'Yes',
          isCancel: true,
          cancelMsg: 'Not Now'
        });
        approved.afterClosed().subscribe((res) => {
          if (!res) {
            this.checkDraftForm.controls.bankaccountId.setValue('');
            this.sharedService.setNewBankCreatedData(null);
          }
        });
      }

      // Not verified bank account
      if (env.verified === 0 && this.AppStatus === 0) {
        const close = this.alertService.warningAlert({
          content:
            'This bank account is not verified.  This check draft will be voided, Are you sure you want to continue?',
          doneMsg: 'Yes',
          isCancel: true,
          cancelMsg: 'Not Now'
        });
        close.afterClosed().subscribe((res) => {
          if (res) {
            this.checkDraftForm.controls.bankaccountId.setValue(env.id);
          } else {
            this.checkDraftForm.controls.bankaccountId.setValue('');
            this.sharedService.setNewBankCreatedData();
          }
        });
      } else {
        this.checkDraftForm.controls.bankaccountId.setValue(env.id);
      }
    } else {
      this.checkDraftForm.controls.bankaccountId.setValue('');
    }
  }

  /**
   * @description Handles the change event when a category is selected.
   * @param env - The selected category details.
   */
  onChangeCategory(env: ICategoryDropdown) {
    if (env) {
      this.checkDraftForm.controls.categoryId.setValue(env.id);
    } else {
      this.checkDraftForm.controls.categoryId.setValue('');
    }
  }

  /**
   * @description Displays a warning alert with the provided message.
   * @param msg - The content of the warning message.
   * @returns The alert dialog reference.
   */
  warningAlert(msg: string) {
    const data = {
      title: 'Error',
      content: msg,
      doneMsg: 'Add',
      isCancel: true
    };
    return this.alertService.warningAlert(data);
  }

  /**
   * @description Handles the onSaveRemittance event.
   */
  onSaveRemittance() {
    this.isRemittence = false;
  }

  /**
   * @description Validates keyboard input for amount input with decimal.
   * @param event - The keyboard event.
   * @returns True if the input is valid, false otherwise.
   */
  amountOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      // for '.'
      return true;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Validates keyboard input for amount input without decimal.
   * @param event - The keyboard event.
   * @returns True if the input is valid, false otherwise.
   */
  amountOnlyWithouDot(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      // for '.'
      return false;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Navigates to the import check draft process.
   */
  importCheckDraft(): void {
    this.router.navigate(['/manage/checkdraft/import/step1']);
  }

  getAccountType(accountType: string) {
    if(accountType === accountType.toUpperCase()) return accountType;
    return this.titleCase.transform(accountType.replace(/([A-Z])/g, ' $1'));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
