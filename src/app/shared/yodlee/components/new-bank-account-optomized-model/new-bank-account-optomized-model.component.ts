import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  signal,
  inject
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { HttpErrorResponse } from '@angular/common/http';
import { WireRoutingnumberAddComponent } from '../../../bank-modal/modals/wire-routingnumber-add/wire-routingnumber-add.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { NgClass, NgIf } from '@angular/common';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Moengage } from 'src/app/data/data/moengage';

/**
 * @description Modal component for new bank account (Optimized).
 */
interface INewBankOptimizeddialogData {
  wireRoutingNumberRequired?: number;
}

@Component({
  selector: 'app-new-bank-account-optomized-model',
  templateUrl: './new-bank-account-optomized-model.component.html',
  styleUrls: ['./new-bank-account-optomized-model.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    MatDialogClose,
    ControlMessageComponent,
    NgxMaskDirective,
    MatTooltip,
    MatDialogActions
  ]
})
export class NewBankAccountOptomizedModelComponent
  implements OnInit, OnDestroy
{
  bankForm!: UntypedFormGroup;
  loading = false;
  subscriptions: Subscription[] = [];
  isShowAddressSections: boolean;
  customPattern = { 0: { pattern: new RegExp('\\d'), symbol: 'X' } };
  @Input() isComponent: boolean;
  @Output() success = new EventEmitter();

  utils = Utils;
  wireRoutingNumber: string | number | undefined;
  private formStarted = false;

  // Bank setup tracking
  bankSetupInitiatedTime = performance.now();
  stepsCompleted = signal(0);
  selectedBankName = signal<string | null>(null);
  isBankSetupCancelled = signal<boolean>(false);
  isFirstBankAttempt = signal<boolean>(false);
  bankCountBefore = signal<number>(0);

  private postHogService = inject(PostHogService);


  constructor(
    private fb: UntypedFormBuilder,
    private _googleAddressService: GoogleAddressService,
    private _bankAccService: BankAccountsService,
    private alertService: AlertService,
    @Optional()
    public dialogRef: MatDialogRef<NewBankAccountOptomizedModelComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    private dialogData: INewBankOptimizeddialogData,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.bankSetupInitiatedTime = performance.now();
    this.getBankData();
    this.initFormGroup();
    // this.trackBankInitiation();
    this._googleAddressService.resetGoogleAutocompleteAPI();

    // Track when user starts interacting with the form
    this.bankForm.valueChanges.subscribe(() => {
      if (!this.formStarted) {
        this.formStarted = true;
        // this.stepsCompleted.set(1); // User started filling form
      }
    });
  }

  /**
   * @description Initializes bank form.
   */
  initFormGroup() {
    this.bankForm = this.fb.group({
      bankRoutingNumber: new UntypedFormControl('', [
        Validators.required,
        ValidationService.routingNumberValidator
      ]),
      bankAccountNumber: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(5)
      ]),
      confirmAccountNumber: new UntypedFormControl('', [
        Validators.required,
        ValidationService.isMatchingValidator(
          'bankAccountNumber',
          'Account number does not match'
        )
      ]),
      bankAccountName: new UntypedFormControl('', [
        Validators.required,
        ValidationService.personNameValidator,
        Validators.minLength(5)
      ]),
      bankAccountNickName: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankAccountAddressLine1: new UntypedFormControl('', [
        Validators.required
      ]),
      bankAccountAddressLine2: new UntypedFormControl('', []),
      bankAccountCity: new UntypedFormControl('', [Validators.required]),
      bankAccountState: new UntypedFormControl('', [Validators.required]),
      bankAccountZip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.zipValidator
      ]),
      bankAccountType: new UntypedFormControl(''),

      bankName: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankAddress1: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankCity: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankState: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankZip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.zipValidator,
        ValidationService.noWhitespaceValidator
      ]),
      bankStartingCheckNumber: new UntypedFormControl(''),
      bankFractionalNumber: new UntypedFormControl('', []),
      country: 'USA'
    });
  }

  /**
   * @description Getter method for getting bank form controls.
   */
  get getControl() {
    return this.bankForm.controls;
  }

  /**
   * @description Creates an object with bank form values and returns it.
   * @returns bank form body object.
   */
  createBankAccountBody() {
    return {
      bankRoutingNumber: this.getFormValue('bankRoutingNumber'),
      bankAccountNumber: this.getFormValue('bankAccountNumber'),
      bankAccountName: this.getFormValue('bankAccountName'),
      bankAccountNickName: this.getFormValue('bankAccountNickName'),
      bankAccountAddressLine1: this.getFormValue('bankAccountAddressLine1'),
      bankAccountAddressLine2: this.getFormValue('bankAccountAddressLine2'),
      bankAccountCity: this.getFormValue('bankAccountCity'),
      bankAccountState: this.getFormValue('bankAccountState'),
      bankAccountZip: this.getFormValue('bankAccountZip'),
      bankAccountType: this.getFormValue('bankAccountType'),
      bankName: this.getFormValue('bankName'),
      bankAddress1: this.getFormValue('bankAddress1'),
      bankCity: this.getFormValue('bankCity'),
      bankState: this.getFormValue('bankState'),
      bankZip: this.getFormValue('bankZip'),
      checkSerialNumber: this.getFormValue('bankStartingCheckNumber'),
      bankIdentity: this.getFormValue('bankFractionalNumber'),
      allowDuplicate: this.getFormValue('allowDuplicate'),
      wireRoutingNumberRequired: this.dialogData?.wireRoutingNumberRequired,
      wireRoutingNumber: this.wireRoutingNumber
    };
  }

  /**
   * @description Method to get form values.
   * @param name - bank form field name.
   * @returns - value of the field with given name.
   */
  getFormValue(name: string) {
    return this.bankForm.get(name)?.value;
  }

  /**
   * @description Looks up routing number, gets bank details and updates bank form with it.
   * @param event - keyup event.
   */
  lookupRoutingNumber(event: Event) {
    if (event.target === null) return;
    const rout_no = (event.target as HTMLInputElement).value;

    if (rout_no.length >= 9) {
      this.subscriptions.push(
        this._bankAccService.getroutingNumber(rout_no).subscribe((res) => {
          const bank_details = res.data;
          
          // Track bank name for abandonment
          this.selectedBankName.set(bank_details.name);

          this.bankForm.patchValue({
            bankName: bank_details.name?.trim(),
            bankAddress1: bank_details.address?.trim(),
            bankCity: bank_details.city?.trim(),
            bankState: bank_details.state?.trim(),
            bankZip: bank_details.zip?.toString()
          });
        })
      );
    } else {
      this.bankForm.patchValue({
        bankName: '',
        bankAddress1: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
    }
  }

  /**
   * @description -Event handler for when the input field gains focus.
   * Modifies the custom pattern to remove symbols during input.
   */
  onFocus() {
    this.customPattern = { 0: { pattern: new RegExp('\\d'), symbol: '' } };
  }

  /**
   * @description -Event handler for when the input field loses focus.
   * Modifies the custom pattern to mask digits with 'X' symbols during input.
   */
  onBlur() {
    this.customPattern = { 0: { pattern: new RegExp('\\d'), symbol: 'X' } };
  }

  /**
   * @description Method to submit form and create new bank account.
   */
  submit() {
    this.bankForm.markAllAsTouched();

    if (this.bankForm.valid) {
      this.loading = true;
      this.subscriptions.push(
        this._bankAccService.AddBank(this.createBankAccountBody()).subscribe(
          (res) => {
            if (res) {
              const id = res.data.id;
              this.loading = false;
              if (res.success) {
                // Mark as successfully completed to prevent abandonment tracking
                this.isBankSetupCancelled.set(true);
                // this.stepsCompleted.set(3); // Completed successfully

                if (this.isComponent) {
                  this.success.emit({
                    success: true,
                    id: id,
                    check_no: this.getFormValue('bankStartingCheckNumber'),
                    bankAcData: res.data
                  });
                }
                this.dialogRef?.close({
                  success: true,
                  id: id,
                  check_no: this.getFormValue('bankStartingCheckNumber'),
                  bankAcData: res.data
                });
                this.onSuccessAlert();
              }
            }
          },
          (err: HttpErrorResponse) => {
            this.loading = false;
            // Track error for abandonment
            // this.stepsCompleted.set(2); // Error occurred during submission
            
            if (err.error.errorCode == 987) {
              const data = {
                title: 'The Bank Account already exist.',
                content: 'Would You Like To Add It Again',
                width: '370px',
                doneMsg: 'Yes',
                cancelMsg: 'No'
              };
              const response = this.alertService.confirmAlert(data);
              response.afterClosed().subscribe((result) => {
                if (result) {
                  this.bankForm.addControl(
                    'allowDuplicate',
                    this.fb.control('1')
                  );
                  this.submit();
                }
              });
            }
            if (err.error?.errorCode === 55) {
              this.matDialog
                .open(WireRoutingnumberAddComponent, {
                  maxWidth: '510px',
                  width: '93%',
                  disableClose: true
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res.wireRoutingNumber) {
                    this.wireRoutingNumber = res.wireRoutingNumber;
                    this.submit();
                  } else {
                    this.wireRoutingNumber = undefined;
                  }
                });
            }
          }
        )
      );
    }
  }

  /**
   * @description Shows alert dialog upon successful bank account creation.
   */
  onSuccessAlert() {
    const data = {
      close: true,
      timeout: 2000,
      title: 'Success!',
      content: 'Bank Account Added.'
    };
    this.alertService.successAlert(data);
  }

  /**
   * @description Returns false if backtick is given as input. Otherwise returns true.
   * @param event - keypress event.
   * @returns boolean
   */
  disbleBacktick(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode == 192) {
      return false;
    }
    return true;
  }

  trackBankInitiation(): void {
    this.postHogService.trackBankSetupInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      bank_add_method: 'manual',
      is_first_bank_attempt: this.isFirstBankAttempt(), // You can implement proper logic here
      bank_count_before: this.bankCountBefore() // You can implement proper logic here
    });
  }

  triggerBankSetupAbandoned(): void {
    const duration = performance.now() - this.bankSetupInitiatedTime;
    this.postHogService.trackBankSetupAbandoned({
      ...this.postHogService.customerPayloadFromStorage(),
      setup_duration_seconds: Math.round(duration / 1000),
      exit_reason: 'user_exit',
      bank_selected: this.selectedBankName(),
      steps_completed: this.stepsCompleted(),
      error_code: null,
      bank_selected_type: this.getBankSelectedType(this.selectedBankName()),
      bank_add_method: 'manual'
    });
  }

  getBankSelectedType(bankName: string | null): string | null {
    if(!bankName) {
      return null;
    }

    if(Moengage.creditUnionPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'credit_union';
    }
    if(Moengage.majorPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'major';
    }
    return 'regional';
  }

  /**
   * @description Loads Google Address API.
   * @param address - address input HTML element.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.bankForm.patchValue({
          bankAccountAddressLine1: res.address,
          bankAccountCity: res.city,
          bankAccountState: res.state,
          bankAccountZip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Loads google address API for bank address.
   * @param address - address input HTML element.
   * @param addressInstance - instance of address.
   */
  loadBankGoogleAddress(address: HTMLInputElement, addressInstance: number) {
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      addressInstance: addressInstance
    });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.bankForm.patchValue({
          bankAddress1: res.address,
          bankCity: res.city,
          bankState: res.state,
          bankZip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Returns false if backtick is given as input.
   * @param event - keypress event.
   * @returns boolean
   */
  backtickDesble(evt: { which: number; keyCode: number }): boolean {
    const charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode == 96) {
      return false;
    } else {
      return true;
    }
  }

  getBankData(){
    this.subscriptions.push(
      this._bankAccService.getBankAccounts(1, '').subscribe({
      next: (res) => {
        if(res.success){
          const isFirstBankAttempt = this.isFirstBankAttemptChecker(res?.totalCount || 0, res?.data?.[0]?.fullAccountNumber || '');
          this.isFirstBankAttempt.set(isFirstBankAttempt);
          this.bankCountBefore.set(res?.totalCount || 0);
          this.trackBankInitiation();
        }
      }
    }));
  }

  isFirstBankAttemptChecker(totalCount: number, bankAccountNumber: string | number): boolean {
    if(totalCount === 0) return true;
    if(totalCount === 1 && (bankAccountNumber).toString() === '1111111111') return true;
    return false;
  }

  ngOnDestroy() {
    // Track abandonment if setup was not successfully completed
    if (!this.isBankSetupCancelled()) {
      this.triggerBankSetupAbandoned();
    }
    
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
