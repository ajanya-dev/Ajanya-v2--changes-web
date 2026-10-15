import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  FormBuilder
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import {
  IPayeeDropdown,
  IShowPayeeDetails,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { AddEmailPayeeModalComponent } from 'src/app/shared/modal/process-modal/add-email-payee-modal/add-email-payee-modal.component';
import { RecurringModalComponent } from 'src/app/shared/modal/process-modal/recurring-modal/recurring-modal.component';
import { ScheduleModalComponent } from 'src/app/shared/modal/process-modal/schedule-modal/schedule-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { IBankDropdown } from 'src/app/models/bank';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  faCogs,
  faCalendar,
  faSyncAlt,
  faEdit
} from '@fortawesome/pro-solid-svg-icons';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { NgClass, TitleCasePipe } from '@angular/common';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { ContactSupportModalComponent } from 'src/app/shared/modal/contact-support-modal/contact-support-modal.component';
import { AddPayeeBankAccountComponent } from '../../../../shared/modal/process-modal/add-payee-bank-account/add-payee-bank-account.component';
import { RecurringService } from '../../services/recurring.service';
import { INumberOnlyEvent } from '../../../invoices/model/invoice';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

@Component({
  selector: 'app-manual-ach',
  templateUrl: './manual-ach.component.html',
  styleUrls: ['./manual-ach.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PayeeDropdownV3Component,
    BankAcDropdownV3Component,
    CommonButtonV35Component,
    CommonBackButtonV35Component,
    NgClass,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    TitleCasePipe
  ]
})
export class ManualAchComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private formBuilder = inject(FormBuilder);
  private requestPaymentsService = inject(RequestPaymentsService);
  private router = inject(Router);
  private recurringService = inject(RecurringService);
  private sharedService = inject(SharedService);
  private bankModalService = inject(BankModalService);
  private payeeModalService = inject(PayeeModalService);
  private paymentsService = inject(PaymentsService);
  manualAch: FormGroup;

  subscriptions: Subscription[] = [];
  page = 1;
  payeeList: IPayeeDropdown[] = [];
  selectedPayee: IViewPayee;
  searchTerm: string;
  bankList: IBankDropdown[] = [];
  bpage = 1;
  Amount: string;
  selectedId: string;
  selectedPayeeeId = '';
  selectedBank = new FormControl();
  selectedBankId: string;
  payee = new FormControl();
  selectedPayeeId: string;
  isProceedLoading = false;
  isScheduleLoading = false;
  isRecurringLoading = false;
  utils = Utils;
  isPayeeDataLoading = signal(false);

  faCogs = faCogs;
  faCalendar = faCalendar;
  faSyncAlt = faSyncAlt;
  faEdit = faEdit;

  ngOnInit(): void {
    this.initForm();
    this.geBankSelectionChange();
    this.gePayeeSelectionChange();
  }

  /**
   * @description Initializes the form for manual ACH.
   */
  initForm() {
    this.manualAch = this.formBuilder.group({
      amount: ['', Validators.required],
      memo: ['', [Validators.required, Validators.maxLength(150)]],
      isRecurringValue: [''],
      payerAccountNumber: [''],
      payerRoutingNumber: [''],
      payerAccountType: [''],
      payerId: ['', Validators.required],
      payerEmail: [''],
      senderBankAccountId: ['', Validators.required],
      recurring: [''],
      isSameDay: [false]
    });
  }

  /**
   *
   * @description Proceed with manual ACH creation by checking if input fields are valid.
   * If the form is invalid, the function will return without performing the action.
   */
  proceedNow(): void {
    this.manualAch.markAllAsTouched();
    if (this.manualAch.invalid) {
      return;
    }

    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }

    this.manualAch.controls.recurring.setValue('');

    if (
      this.selectedPayee.email == null ||
      this.selectedPayee.email === undefined ||
      this.selectedPayee.email === ''
    ) {
      this.failWaring();
      return;
    }
    if (
      this.selectedPayee.accountNumber === '' ||
      this.selectedPayee.accountType === '' ||
      this.selectedPayee.routingNumber === ''
    ) {
      this.AddPayeeMissing();
      return;
    }
    this.manualAch.controls.isRecurringValue.setValue(0);
    this.doAction();
    this.isProceedLoading = true;
  }

  /**
   * @description Create a manual ACH payment based on the form inputs.
   * The function sends the form values to the server to create the payment.
   * If the payment creation is successful, it navigates to the received checks  page and sets the toggle value in the recurring service to 2.
   *
   */
  doAction() {
    const body = this.manualAch.value;
    body.isSameDay = body.isSameDay ? 1 : 0;

    this.subscriptions.push(
      this.requestPaymentsService
        .createManualAch(body)
        .pipe(
          finalize(() => {
            this.isProceedLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.router.navigate(['manage/receivedchecks/index']);
            this.recurringService.setToggle(2);
          }
        })
    );
  }

  /**
   * @description Open the AddPayeeBankAccountComponent dialog to prompt the user to add missing bank account information for the selected payee.
   */
  AddPayeeMissing(): void {
    const dialogRef = this.dialog.open(AddPayeeBankAccountComponent, {
      width: '600px',
      data: {...this.selectedPayee, isPayer: true}
      // data: {name: this.name, animal: this.animal},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectPayeeData(this.selectedPayee.id);
      }
    });
  }

  /**
   *
   * @description Open the ScheduleModalComponent dialog to prompt the user to schedule the manual ACH payment.
   * If the user completes the dialog and selects a schedule date, it triggers the creation of the manual ACH payment.
   */
  shedule(): void {
    this.manualAch.markAllAsTouched();
    if (this.manualAch.invalid) {
      return;
    }

    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }

    const dialogRef = this.dialog.open(ScheduleModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const recurring = {
          schedule_date: result
        };
        this.manualAch.controls.recurring.setValue(recurring);

        if (
          this.selectedPayee.email == null ||
          this.selectedPayee.email === undefined ||
          this.selectedPayee.email === ''
        ) {
          this.failWaring();
          return;
        }
        if (
          this.selectedPayee.accountNumber === '' ||
          this.selectedPayee.accountType === '' ||
          this.selectedPayee.routingNumber === ''
        ) {
          this.AddPayeeMissing();
          return;
        }

        this.isScheduleLoading = true;
        this.manualAch.controls.isRecurringValue.setValue(2);
        this.subscriptions.push(
          this.requestPaymentsService
            .createManualAch(this.manualAch.value)
            .pipe(
              finalize(() => {
                this.isScheduleLoading = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.router.navigate(['manage/receivedchecks/recurring'], {
                  queryParams: { ach: 1 }
                });
                this.recurringService.setToggle(2);
              }
            })
        );
      }
    });
  }

  /**
   * @description Open the RecurringModalComponent dialog to prompt the user for recurring payment details.
   * If the user completes the dialog and provides recurring payment information, it triggers the creation of the manual ACH payment.
   *
   */
  recurring(): void {
    this.manualAch.markAllAsTouched();
    if (this.manualAch.invalid) {
      return;
    }

    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }

    const dialogRef = this.dialog.open(RecurringModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.manualAch.controls.recurring.setValue(result);

        if (
          this.selectedPayee.email === null ||
          this.selectedPayee.email === undefined ||
          this.selectedPayee.email === ''
        ) {
          this.failWaring();
          return;
        }
        if (
          this.selectedPayee.accountNumber === '' ||
          this.selectedPayee.accountType === '' ||
          this.selectedPayee.routingNumber === ''
        ) {
          this.AddPayeeMissing();
          return;
        }
        this.isRecurringLoading = true;
        this.manualAch.controls.isRecurringValue.setValue(1);
        this.subscriptions.push(
          this.requestPaymentsService
            .createManualAch(this.manualAch.value)
            .pipe(
              finalize(() => {
                this.isRecurringLoading = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.router.navigate(['manage/receivedchecks/recurring'], {
                  queryParams: { ach: 1 }
                });
                this.recurringService.setToggle(2);
              }
            })
        );
      }
    });
  }

  /**
   * @description Open the NewBankAccountModalComponent dialog to add a new bank account.
   * If a new bank account is successfully created, it updates the created bank account data
   * and triggers related actions based on the eligibility of the bank account for Manual ACH.
   */
  addNewBankAccount() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBank().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.sharedService.setNewBankCreatedData({
                  bankAccountId: result.id
                });
                const data = {
                  title: 'Alert!',
                  content: 'This bank account not eligible for Manual ACH',
                  doneMsg: 'Apply For ACH',
                  cancelMsg: 'No,cancel!',
                  isCancel: true
                };
                const modal = this.alertService.warningAlert(data);
                modal.afterClosed().subscribe((res) => {
                  if (res) {
                    this.achVerificationRequiredAlert();
                  } else {
                    this.manualAch.controls.senderBankAccountId.reset();
                    this.selectedBank.reset();
                  }
                });
              }
            })
          );
        }
      })
    );
  }

  /**
   * @description Sets the selected payee based on the provided environment.
   * If the environment is not undefined, it assigns the ID of the selected payee and fetches the payee data.
   * @param env -The environment object containing the ID of the selected payee.
   */
  getSelectedPayee(env: { name: string; id: string }) {
    if (env !== undefined && env?.name !== 'Payee Name') {
      this.selectedPayeeeId = env.id;
      this.selectPayeeData(env.id);
    } else {
      this.selectedPayeeeId = '';

      this.selectedPayee = {} as IViewPayee;
    }
  }

  /**
   * @description Fetches the payee data based on the provided ID and assigns it to the selectedPayee property.
   * f any of the payee's account details is missing, it invokes the AddPayeeMissing() method.
   * @param id -The ID of the payee.
   */
  selectPayeeData(id: string) {
    this.isPayeeDataLoading.set(true);
    this.subscriptions.push(
      this.payeeService
        .showPayee(id)
        .pipe(
          finalize(() => {
            this.isPayeeDataLoading.set(false);
          })
        )
        .subscribe((res) => {
          this.selectedPayee = res.data;
          this.syncPayeeDropdown(res.data);

          this.manualAch.controls.payerId.setValue(this.selectedPayee.id);
          if (
            this.selectedPayee.email == null ||
            this.selectedPayee.email === undefined ||
            this.selectedPayee.email === ''
          ) {
            this.failWaring();
            return;
          }
          this.manualAch.controls.payerId.setValue(this.selectedPayee.id);
          this.manualAch.controls.payerEmail.setValue(this.selectedPayee.email);
          this.selectedPayee.hiddenAccountNum = this.getHiddenNum(
            this.selectedPayee.accountNumber
          );

          if (
            this.selectedPayee.accountNumber === '' ||
            this.selectedPayee.accountNumber == null ||
            this.selectedPayee.accountType === '' ||
            this.selectedPayee.accountType == null ||
            this.selectedPayee.routingNumber === '' ||
            this.selectedPayee.routingNumber == null
          ) {
            this.AddPayeeMissing();
          } else {
            this.manualAch.controls.payerAccountNumber.setValue(
              this.selectedPayee.accountNumber
            );
            this.manualAch.controls.payerRoutingNumber.setValue(
              this.selectedPayee.routingNumber
            );
            this.manualAch.controls.payerAccountType.setValue(
              this.selectedPayee.accountType
            );
          }
        })
    );
  }

  /**
   * @description Pushes the refetched record back into the payee dropdown so an
   * edit made from this page is not left stale behind the selected value.
   */
  private syncPayeeDropdown(data: IShowPayeeDetails): void {
    if (this.payee.value?.id !== data.id) return;
    this.payee.setValue({ ...this.payee.value, ...data }, { emitEvent: false });
  }

  /**
   * @description Takes a string representing a number and returns a hidden version of the number, where all but the last four digits are replaced with asterisks.
   * @param num -The number to be hidden.
   * @returns The hidden number with asterisks replacing all but the last four digits.
   */
  getHiddenNum(num: string): string {
    const numArr = num.split('');
    for (let i = 0; i < num?.length; i += 1) {
      if (num.length - i > 4) {
        numArr[i] = '*';
      } else {
        numArr[i] = num[i];
      }
    }
    return numArr.join('');
  }

  /**
   * @description Sets the selected bank account and performs additional checks to determine eligibility for Manual ACH.
   * If the bank account is eligible, it sets the selected bank account ID in the form.
   * @param env -The selected bank account information.
   */
  getSelectedBank(env: { id: string; mAch: number ; achApplicationStatus:number}) {
    // 1. If ACH is NOT active, prompt to activate ACH
    if (env?.achApplicationStatus !== 1) {
      const data = {
        title: 'Alert!',
        content: 'ACH is not activated for this bank account.',
        doneMsg: 'Apply For ACH',
        cancelMsg: 'No, cancel!',
        isCancel: true
      };
      const modal = this.alertService.warningAlert(data);
      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.achVerificationRequiredAlert();
        } else {
          this.manualAch.controls.senderBankAccountId.reset();
          this.selectedBank.reset();
          this.manualAch.controls.senderBankAccountId.markAsTouched();
        }
      });
      return;
    }

    // 2. If ACH is active but Manual ACH is NOT active, contact support
    if (env?.mAch !== 1) {
      const action = this.alertService.warningAlert({
        content: 'This bank account is not eligible for Manual ACH. Please contact customer support.',
        doneMsg: 'Contact Now',
        isCancel: true,
        cancelMsg: 'Not Now'
      });
      action.afterClosed().subscribe((res) => {
        if (res) {
          this.dialog.open(ContactSupportModalComponent, {
            width: '400px',
            disableClose: true
          });
        }
      });
      return;
    }

    // 3. If both ACH and Manual ACH are active, proceed
    this.manualAch.controls.senderBankAccountId.setValue(env.id);
  }

  achVerificationRequiredAlert(): void {
    const alert = this.alertService.warningAlert({
      content:
        'Some of your bank accounts are not approved for ACH, please apply to proceed.',
      doneMsg: 'See My Banks',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/bank-accounts/index']);
      }
    });
  }

  getAmount(value: number) {
    if (value < 0) {
      this.Amount = '';
    }
  }

  failWaring() {
    const data = {
      title: 'Error',
      content: 'Please add Email Address to Selected Client',
      doneMsg: 'OK'
    };

    const response = this.alertService.failedAlert(data);
    response.afterClosed().subscribe((res) => {
      if (res) {
        this.AddEmailToPayee(this.selectedPayee);
      }
    });
  }

  warningAlert(content: string) {
    const data = {
      title: 'Error',
      content,
      doneMsg: 'OK',
      isCancel: false
    };
    return this.alertService.warningAlert(data);
  }

  AddEmailToPayee(data: IViewPayee) {
    const dialogRef = this.dialog.open(AddEmailPayeeModalComponent, {
      width: '550px',
      disableClose: true,
      data
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.selectPayeeData(this.selectedPayee.id);
      }
    });
  }

  /**
   * Method to get selected bank from dropdown
   */
  geBankSelectionChange() {
    this.subscriptions.push(
      this.selectedBank.valueChanges.subscribe((res) => {
        if (res) {
          if (res?.id === this.selectedBankId) {
            return;
          }
          this.selectedBankId = res.id;
          this.getSelectedBank(res);
        }
      })
    );
  }

  /**
   * Method to get selected payee from dropdown
   */
  gePayeeSelectionChange() {
    this.subscriptions.push(
      this.payee.valueChanges.subscribe((res) => {
        if (res && res?.id && res.id !== undefined) {
          if (res?.id === this.selectedPayeeId) {
            return;
          }
          this.selectedPayeeId = res.id;
          this.getSelectedPayee(res);
        }
      })
    );
  }

  onRemoveBank() {
    this.manualAch.controls.senderBankAccountId.reset();
    this.selectedBank.reset();
    this.selectedBankId = '';
    this.manualAch.controls.senderBankAccountId.markAsTouched();
  }

  onClearPayee() {
    this.manualAch.controls.payerId.reset();
    this.payee.reset();
    this.selectedPayeeId = '';
    this.manualAch.controls.payerId.markAsTouched();
    this.selectedPayee = {} as IViewPayee;
  }

  getAccountType(accountType: string) {
    switch (accountType) {
      case 'CHECKING':
        return 'Checking';
      case 'SAVINGS':
        return 'Savings';
      case 'BUSINESS':
        return 'Business';
      case 'INDIVIDUAL':
        return 'Individual';
      case 'personalChecking':
        return 'Personal Checking';
      case 'businessChecking':
        return 'Business Checking';
      case 'personalSavings':
        return 'Personal Savings';
      case 'businessSavings':
        return 'Business Savings';
      default:
        return accountType;
    }
  }

  editPayee() {
    this.subscriptions.push(
      this.payeeModalService.openEditPayee(
        this.selectedPayee.id, 
        undefined, 
        { edit: true, id: this.selectedPayee.id,page: undefined, entityLabel: 'Payer' })
        .subscribe((modalRef) => {
          if(modalRef){
            this.subscriptions.push(
              modalRef.afterClosed().subscribe((res) => {
                if (res?.success) {
                  this.selectPayeeData(res.id);
                } 
              })
            );
          }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }

  /**
   * @description Validates the input to allow only numeric values and decimal point (.) for amount input.
   * @param event -The keyboard event.
   * @returns rue if the input is valid, false otherwise.
   */
  amountOnly(event: INumberOnlyEvent): boolean {
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
}
