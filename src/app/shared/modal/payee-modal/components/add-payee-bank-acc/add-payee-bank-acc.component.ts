import { finalize } from 'rxjs/operators';
import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IPayeeBankData } from 'src/app/modules/payee/payee-v2/model/payee';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { AddBankDetailModalComponent } from '../../modal/add-bank-detail-modal/add-bank-detail-modal.component';
import { RequestPayeeModalComponent } from '../../modal/request-payee-modal/request-payee-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgFor, NgStyle } from '@angular/common';

/**
 * @description Modal component for adding payee bank account (in add payee modal).
 */
@Component({
  selector: 'app-add-payee-bank-acc',
  templateUrl: './add-payee-bank-acc.component.html',
  styleUrls: ['./add-payee-bank-acc.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    MatRadioGroup,
    MatRadioButton,
    NgStyle
  ]
})
export class AddPayeeBankAccComponent
  implements OnInit, OnChanges, AfterContentChecked, OnDestroy
{
  isRequestedBankInfo = false;
  subscriptions: Subscription[] = [];
  editMode = false;
  loading = false;
  // bankDataLoaded = false;

  @Input() payeeForm: UntypedFormGroup;
  @Input() payeeId: string;
  @Input() payeeType: string;
  @Input() bankGetData: IPayeeBankData[] = [];
  @Output() BankAccountData = new EventEmitter();

  constructor(
    public __dialog: MatDialog,
    private _alertService: AlertService,
    private fb: UntypedFormBuilder,
    private _payeeService: PayeeService,
    private changeRef: ChangeDetectorRef,
    private _localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    if (this.payeeId) {
      this.editMode = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const bankGetData: SimpleChange = changes.bankGetData;
    if (bankGetData?.currentValue) {
      this.bankGetData = bankGetData.currentValue;
      if (!this._localStorageService.getItem('tzgKv7RKdu')) {
        this.setBankData();
      }
      this._localStorageService.setItem('tzgKv7RKdu', '1'); //To prevent Mulitple API call
    }
  }

  ngAfterContentChecked(): void {
    this.changeRef.detectChanges();
  }

  /**
   * @description Sets bank data to `this.fBankData[]` for each item in `this.fBankData`.
   */
  setBankData() {
    setTimeout(() => {
      this._localStorageService.removeItem('tzgKv7RKdu');
    }, 1000);

    this.bankGetData?.forEach((e) => {
      this.fBankData.push(
        this.fb.group({
          id: e.id,
          accountNumber: e.accountNumber,
          routingNumber: e.routingNumber,
          accountType: e.accountType,
          bankName: e.bankName,
          default_dd_account: e.defaultDDAccount
        })
      );
    });
  }

  /**
   * @description Opens dialog for bank details.
   */
  bankDetailModalOpen(payeeType: string) {
    const dialogRef = this.__dialog.open(AddBankDetailModalComponent, {
      maxWidth: '370px',
      width: '93%',
      autoFocus: false,
      data: { editMode: false, data: payeeType }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res == undefined || res == false) return;
      const objData = JSON?.parse(res?.data);

      if (!res.editedData) {
        if (this.editMode) {
          this.addNewBankAccount(objData);
          return;
        }
        this.pushBankDataRow(objData);
      }
    });
  }

  /**
   * @description Getter method for getting form control of `bankData` of `payeeForm`.
   * @returns `bankData` form control.
   */
  get fBankData() {
    return <UntypedFormArray>this.payeeForm?.controls?.bankData;
  }

  /**
   * @description Updates `this.fBankData[]` with provided bank data.
   * @param dataArray - bank data.
   */
  pushBankDataRow(dataArray: IPayeeBankData): void {
    this.fBankData.push(
      this.fb.group({
        id: dataArray.id,
        accountNumber: dataArray.accountNumber,
        routingNumber: dataArray.routingNumber,
        accountType: dataArray.accountType,
        bankName: dataArray.bankName,
        default_dd_account: dataArray.id
      })
    );

    this.onChangeMarkAsDefaultAcc(this.fBankData.controls.length - 1);
  }

  /**
   * @description Method for adding new bank account. Creates the data payload with the provided data and submits it to `addPayeeBank` method of payee service.
   * @param dataArray - bank data.
   */
  addNewBankAccount(dataArray: IPayeeBankData) {
    const data = {
      payeeId: this.payeeId,
      bankName: dataArray.bankName,
      routingNumber: dataArray.routingNumber,
      accountNumber: dataArray.accountNumber,
      accountType: dataArray.accountType
    };

    this.loading = true;
    this.subscriptions.push(
      this._payeeService
        .addPayeeBank(data)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) this.pushBankDataRow(dataArray);
        })
    );
  }

  /**
   * @description Marks as default account on selection.
   * @param index - index
   */
  onChangeMarkAsDefaultAcc(index?: number) {
    setTimeout(() => {
      if (this.fBankData.controls.length == 1) {
        this.fBankData.controls[0].value.default_dd_account = '1';
      } else {
        this.fBankData.controls.forEach((e, i) => {
          if (i == index) e.value.default_dd_account = '1';
          if (i != index) e.value.default_dd_account = '0';
        });
      }
    }, 200);
  }

  /**
   * @description Marks as default button on selection.
   * Invokes `this.setCallDefaultBank(bankId)` to change default bank account in update mode.
   * @param bankId - bank ID.
   * @param index - index.
   */
  onActivateMarkAsDefaultBtn(bankId: string, index: number) {
    this.fBankData.controls.forEach((e, i) => {
      if (i != index) e.value.default_dd_account = '0';

      if (i == index) {
        if (e.value.id == '' || e.value.id == null || !this.editMode)
          //change default bank in update Mode
          return;
        else this.setCallDefaultBank(bankId);
      }
    });
  }

  /**
   * @description Changes default bank account.
   * @param bankId - bank ID.
   */
  setCallDefaultBank(bankId: string) {
    const data = { bankId: bankId, payeeId: this.payeeId };
    this.loading = true;
    setTimeout(() => {
      this.subscriptions.push(
        this._payeeService
          .setDefaultDDBankAcc(data)
          .pipe(finalize(() => (this.loading = false)))
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          .subscribe(() => {})
      );
    }, 500);
  }

  /**
   * @description If in `editMode` opens dialog for requesting with existing data and exits.
   * Otherwise, checks whether phone and email are valid or not and
   * emits `BankAccountData` event.
   * @param payeeEmailControl - `payeeEmail` form control.
   * @param payeeEmail - payee email.
   * @param payeePhoneControl - `payeePhone` form control.
   * @param payeePhone - payee phone.
   * @param event - optional - input change event.
   */
  requestPayBtn(
    payeeEmailControl: UntypedFormControl,
    payeeEmail: string,
    payeePhoneControl: UntypedFormControl,
    payeePhone: string,
    event?: { srcElement: { checked: boolean } }
  ) {
    const emailValidation =
      ValidationService.emailValidator(payeeEmailControl)!;
    const phoneValidation =
      ValidationService.phoneNumberValidator(payeePhoneControl)!;

    if (this.editMode) {
      this.openRequestPayeeModal();
      return;
    }

    if (payeeEmail == '' && payeePhone == '') {
      this.isRequestedBankInfo = false;
      if (event) {
        event.srcElement.checked = false;
      }
      this.openWarningAlert('Please enter email or phone number.');
      return;
    } else if (emailValidation.invalidEmailAddress) {
      this.isRequestedBankInfo = false;
      if (event) {
        event.srcElement.checked = false;
      }
      this.openWarningAlert('Invalid Email Address');
      return;
    } else if (phoneValidation.invalidPhoneNumber) {
      this.isRequestedBankInfo = false;
      if (event) {
        event.srcElement.checked = false;
      }
      this.openWarningAlert('Invalid Phone Number');
      return;
    }

    this.isRequestedBankInfo = !this.isRequestedBankInfo;
    this.BankAccountData.emit({ requested: this.isRequestedBankInfo });
  }

  /**
   * @description Method invoked when delete icon is clicked in template.
   * Invokes `this.onDeleteAction(i, bankId)`, to delete payee bank account.
   * @param i - index.
   * @param bankId - bank ID.
   */
  onBankModalDelete(i: number, bankId: string) {
    const alert = this.openConfirmAlert();
    alert.afterClosed().subscribe((res) => {
      if (res) this.onDeleteAction(i, bankId);
    });
  }

  /**
   * @description Method to delete payee bank account.
   * @param index - index.
   * @param bankId - bank ID.
   * @returns
   */
  onDeleteAction(index: number, bankId: string) {
    this.loading = true;

    if (this.editMode) {
      const selected = this.fBankData.controls.find((e, i) => {
        if (i == index) {
          return e.value.id;
        }
      });
      if (selected?.value?.id == '' || selected?.value?.id == null) {
        this.deleteTableRow(index);
        return;
      } //newely added bank in edit mode

      this.subscriptions.push(
        this._payeeService
          .deletePayeeBank(this.payeeId, bankId)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe((res) => {
            if (res?.success) this.deleteTableRow(index);
          })
      );
      return;
    }
    this.deleteTableRow(index); //Create
  }

  /**
   * @description Deletes selected row from table in template.
   * @param index - index.
   */
  deleteTableRow(index: number) {
    const removeitem = this.fBankData;
    removeitem.removeAt(index);
    this.loading = false;
  }

  /**
   * @description M<ethod invoked when edit icon is clicked in template.
   * Opens dialog for adding bank details.
   * Invokes `this.updateBankData(objData, itemIndex)` to update payee bank account.
   * @param itemIndex - index.
   */
  onBankModalEdit(itemIndex: number) {
    const selectedData = this.fBankData.controls.find((_e, i) => {
      return itemIndex == i;
    });

    const dialogRef = this.__dialog.open(AddBankDetailModalComponent, {
      maxWidth: '370px',
      width: '93%',
      autoFocus: false,
      data: { editMode: true, data: selectedData?.value }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result != undefined) {
        if (result.editedData) {
          const objData = JSON.parse(result.data);
          this.updateBankData(objData, itemIndex);
        }
      }
    });
  }

  /**
   * @description Method to update payee bank account.
   * @param objData - payee bank account data.
   * @param index - index.
   */
  updateBankData(objData: IPayeeBankData, index: number) {
    if (this.editMode) {
      //Edit new added bank in update
      if (objData.id == '' || objData.id == null) {
        this.onChangeMarkAsDefaultAcc(index);
        this.updateBankTableRow(index, objData);
        return;
      }

      const bankId = objData.id;
      const data = {
        payeeId: this.payeeId,
        bankName: objData.bankName,
        routingNumber: objData.routingNumber,
        accountNumber: objData.accountNumber,
        accountType: objData.accountType
      };
      this.loading = true;
      this.subscriptions.push(
        this._payeeService
          .updatePayeeBank(bankId, data)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe((res) => {
            if (res?.success) {
              this.updateBankTableRow(index, objData);
              this.onChangeMarkAsDefaultAcc(index);
            }
          })
      );
    } else {
      this.updateBankTableRow(index, objData);
      this.onChangeMarkAsDefaultAcc(index);
    }
  }

  /**
   * @description Updates the corresponding bank account details and table row in template.
   * @param index - index.
   * @param data - bank account data.
   */
  updateBankTableRow(index: number, data: IPayeeBankData) {
    this.fBankData.controls.forEach((e, i) => {
      if (i === index) {
        e.value.accountNumber = data.accountNumber;
        e.value.routingNumber = data.routingNumber;
        e.value.accountType = data.accountType;
        e.value.bankName = data.bankName;
        e.value.default_dd_account = data.defaultDDAccount;
      }
    });
    this.loading = false;
  }

  /**
   * @description Opens dialog for requesting payee to add ban account info.
   */
  openRequestPayeeModal() {
    const payeeEmail = this.payeeForm.value.payeeEmail;
    const payeePhone = this.payeeForm.value.payeePhone;
    const dialogRef = this.__dialog.open(RequestPayeeModalComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      data: {
        payeeType: this.payeeId,
        payeeEmail: payeeEmail,
        payeePhone: payeePhone
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((r) => {
      if (r?.success) {
        this.isRequestedBankInfo = !this.isRequestedBankInfo;
        this.BankAccountData.emit({ requested: this.isRequestedBankInfo });
      }
    });
  }

  /**
   * @description Opens warning alert dialog.
   * @param content - content for warning alert.
   * @returns warning alert.
   */
  openWarningAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.warningAlert(data);
  }

  /**
   * @description Opens confirmation alert dialog.
   * @param content - content for confirmation alert.
   * @returns confirmation alert.
   */
  openConfirmAlert() {
    const data = {
      content: 'Are you sure you want to delete this bank account?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete!'
    };
    return this._alertService.confirmAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
