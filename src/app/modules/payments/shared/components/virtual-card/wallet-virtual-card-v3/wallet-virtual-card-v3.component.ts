import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { debounceTime, finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import {
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IPaymentBody,
  IPaymentConfig,
  IUpdatePaymentBody,
  TPaymentProcessingContext
} from 'src/app/modules/payments/model/payments';
import { IRemittanceDetails } from 'src/app/models/bank';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IWalletData } from 'src/app/models/wallet';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { WalletDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

interface IWalletForm {
  amount: FormControl<string | null>;
  payee: FormControl<IPayeeDropdown | null>;
  wallet: FormControl<IWalletData | null>;
  memo: FormControl<string | null>;
  payeeEmail: FormControl<string | null>;
  category: FormControl<ICategoryDropdown | null>;
  invoiceNumber: FormControl<string | null>;
  payeeIdNumber: FormControl<string | undefined>;
  // industryType: FormControl<number | string | null>;
}

/**
 * @description This component handles the wallet to virtual card payment functionality.
 */
@Component({
  selector: 'app-wallet-virtual-card-v3',
  templateUrl: './wallet-virtual-card-v3.component.html',
  styleUrls: ['./wallet-virtual-card-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    V35ControlMessageComponent,
    WalletDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    CategoryDropdownV3Component,
    MatTooltip,
    MatBadge,
    CommonButtonV35Component,
    // IndustryTypesDropdownComponent
  ]
})
export class WalletVirtualCardV3Component
  implements OnInit, OnDestroy, OnChanges
{
  private psbService = inject(PsbService);
  private datePipe = inject(DatePipe);
  private paymentsService = inject(PaymentsService);
  private dialog = inject(MatDialog);
  private sharedService = inject(SharedService);
  private checkService = inject(CheckService);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  public payeeDataService = inject(PayeeDataV35Service);
  private router = inject(Router);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private validationService = inject(ValidationService);

  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() paymentConfig: IPaymentConfig;
  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Output() calculateFee = new EventEmitter();

  walletForm: FormGroup<IWalletForm>;
  loading: boolean;
  subscriptions: Subscription[] = [];
  utils = Utils;
  selectedPayeeDetails: IPayeeDropdown;
  paymentProcessingContext: string;
  dateToday = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  attachmentCount: number;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  commentsCount: number;
  remitances: IRemittanceDetails[] | undefined;
  remitanceTotal: number;
  newRemittanceFormat: boolean;
  insertFromRemittance = false;
  encId: string;
  hasRemitance: boolean;
  remittanceGrandTotal: number;
  remittanceType: number;
  amountInputDisabled = false;
  faHistory = faClockRotateLeft;
  proccessed = false;
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);

  ngOnInit(): void {
    this.paymentsService.payeeDetails = undefined;
    this.initForm();
    this.getCount();
    this.isBillPayment();
  }

  isBillPayment() {
    const billId = this.activatedRoute.snapshot.queryParamMap.get('billId');
    if (billId) {
      this.amountInputDisabled = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle paymentConfig changes for amount, memo, and other form values
    if (changes?.paymentConfig && this.paymentConfig?.paymentFormValue) {
      const formValue = this.paymentConfig.paymentFormValue;
      
      // Update amount if it exists in paymentConfig
      if (formValue.amount !== undefined && this.walletForm?.controls?.amount) {
        this.walletForm.controls.amount.setValue(formValue.amount);
      }
      
      // Update memo if it exists in paymentConfig
      if (formValue.memo !== undefined && this.walletForm?.controls?.memo) {
        this.walletForm.controls.memo.setValue(formValue.memo);
      }
      
      // Update payee if it exists in paymentConfig
      if (formValue.payee && this.walletForm?.controls?.payee) {
        this.walletForm.controls.payee.setValue(formValue.payee);
      }
      
      // Update payee email if it exists in paymentConfig
      if (formValue.payeeEmail !== undefined && this.walletForm?.controls?.payeeEmail) {
        this.walletForm.controls.payeeEmail.setValue(formValue.payeeEmail);
      }
    }

    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.walletForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email || ''
        );
      }
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.walletForm = new FormGroup<IWalletForm>({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(0.01)
      ]),
      payee: new FormControl(null, [Validators.required]),
      wallet: new FormControl(null, [Validators.required]),
      memo: new FormControl('', [Validators.required]),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      category: new FormControl(null),
      invoiceNumber: new FormControl(''),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]) as FormControl,
      // industryType: new FormControl(null, Validators.required)
    });

    this.subscriptions.push(
      this.walletForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id);
        }
      }),
      this.walletForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );
    this.subscriptions.push(
      this.walletForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          this.calculateFee.emit({
            amount,
            paymentSource: 'wallet',
            paymentMethod: 'card'
          });
        })
    );
    this.setCommonFormValues();
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.subscriptions.push(
      this.walletForm.valueChanges.subscribe((formValueChanges) => {
        this.paymentConfig.paymentFormValue = {
          ...this.paymentConfig.paymentFormValue,
          ...formValueChanges
        };
      })
    );
    if (this.paymentConfig.memo) {
      this.walletForm.controls.memo.setValue(this.paymentConfig.memo);
    }

    if (this.paymentConfig.paymentFormValue) {
      this.walletForm.patchValue({ ...this.paymentConfig.paymentFormValue });
    }

    if (this.paymentConfig.mode === 'CLONE') {
      this.walletForm.controls.invoiceNumber.setValue(null);
    }
  }

  /** Gettting payee Details
   * - Being Called when payee selected and setting necessary payee address details to the payment form
   * @param payeeId -Id of selected payee
   */
  getPayeeDetails(payeeId: string): void {
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId)
        .pipe(debounceTime(100))
        .subscribe((res) => {
          if (res) {
            if (this.changedInfo?.selectedPayeeDetails?.id) {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
                isMoreDetailsLoading: false
              });
            } else {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false
              });
            }
            this.getPayeeCategory(payeeId);
            this.walletForm.controls.payeeIdNumber.setValue(
              res.payee_information.payee_id_number
            );
            this.walletForm.controls.payeeEmail.setValue(
              res.payee_information.payee_email
            );
            // this.walletForm.controls.industryType.setValue(
            //   res.payee_information.merchant_category
            // );
          }
        })
    );
  }

  /**
   * @description -Retrieves and sets the counts of attachments and comments.
   */
  getCount() {
    if (this.paymentConfig.paymentDetails?.zilpaymentId) {
      this.encId = this.paymentConfig.paymentDetails?.zilpaymentId;
      this.subscriptions.push(
        this.sharedService
          .getAttachment('zil-payments', this.encId)
          .subscribe((res) => {
            this.attachmentCount = res.data.length;
          })
      );
      this.subscriptions.push(
        this.sharedService
          .getZilPaymentsComments(this.encId)
          .subscribe((res) => {
            this.commentsCount = res.data.length;
          })
      );
      this.subscriptions.push(
        this.sharedService
          .getZilPaymentsRemitance(this.encId)
          .subscribe((res) => {
            this.paymentsService.remittanceData = {
              remitance: res.data.items_by_array,
              remittanceType: res.data.type
            };
            this.hasRemitance = !!res.data.items_by_array;
          })
      );
    }
  }

  getPayeeCategory(payeeId: string) {
    this.subscriptions.push(
      this.checkService.getPayeeCategory(payeeId).subscribe((res) => {
        if (res.data.id) {
          this.walletForm.controls.category.setValue(res?.data);
          this.categoryId.set(res?.data?.id);
          if (this.categorySetWithIdFunction) {
            this.categorySetWithIdFunction(res?.data?.id);
          }
        } else {
          this.walletForm.controls.category.setValue(null);
        }
      })
    );
  }

  setDropDownAPIAndBindId(ev: IV3DropDownOnReady, id: string|undefined) {
    if (ev.setItemWithId) {
      this.categorySetWithIdFunction = ev.setItemWithId;
    }
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }



  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean) {
    if (this.proccessed) {
      this.proccessed = false;
      return;
    }
    this.proccessed = true;
    if (event?.id) {
      if (fromTemplate === false) {
        this.walletForm.controls.payee.setValue(event);
      }
      if (event.email) {
        this.walletForm.controls.payeeEmail.setValue(event?.email);
      } else {
        this.getPayeeDetails(event.id);
        this.walletForm.controls.payeeEmail.setValue(null);
      }
      this.walletForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
      this.selectedPayeeDetails = event;
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
      // this.walletForm.controls.industryType.setValue(
      //   event?.merchantCategory as number
      // );
      const payeeData = this.walletForm.controls?.payee?.value;
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    }
  }

  /**
   * @description Populate the dropdown by fetching the data using the id
   * @param ev
   * @param id
   */
  populateOnEdit(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayeeSelect() {
    this.walletForm.controls.payee.reset();
    this.walletForm.controls.payeeEmail.reset();
    this.walletForm.controls.payeeIdNumber.reset();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.walletForm.controls.industryType.setValue(null);
  }

  walletSelect(event: IWalletData) {
    this.walletForm.controls.wallet.setValue(event);
  }

  clearWallet() {
    this.walletForm.controls.wallet.reset();
  }
  /**
   * @description Open modal for adding attachment and gives the added data when its closed
   */

  openAddAttachment() {
    this.subscriptions.push(
      this.paymentsService
        .openAddAttachment(this.createdExistingAttachments, this.encId)
        .subscribe((attachments: IAttachmentItem[]) => {
          this.createdExistingAttachments = attachments;
          this.attachmentCount = attachments.length;
        })
    );
  }

  /**
   * @description Open modal for adding comment and gives the added data when its closed
   */

  openAddComment() {
    this.subscriptions.push(
      this.paymentsService
        .openAddComment(this.createdExistingComments, this.encId)
        .subscribe((comments: IComments[]) => {
          this.createdExistingComments = comments;
          this.commentsCount = comments.length;
        })
    );
  }

  /**
   * @description Open modal for adding remittance and gives the added data when its closed
   */
  openAddRemitance() {
    const amount = Number(this.walletForm.controls.amount.value);
    const remitanceData = this.paymentsService.createRemitanceData(
      amount,
      this.insertFromRemittance
    );
    this.subscriptions.push(
      this.paymentsService
        .openAddRemitanceModal(remitanceData)
        .subscribe((res) => {
          if (res) {
            this.paymentsService.getRemitanceValue(res, this.walletForm);
          } else {
            this.resetRemittanceData();
          }
          const allRemittances = res.data;
          this.hasRemitance = false;
          const formatedRemittances =
            this.paymentsService.checkRemittanceCount(allRemittances);
          this.hasRemitance = !!formatedRemittances.hasRemittance;
          if (allRemittances && this.paymentsService.remittanceData) {
            this.paymentsService.remittanceData.remitance =
              formatedRemittances.remittanceList;
            this.paymentsService.updateRemittanceData(
              formatedRemittances.remittanceList,
              this.hasRemitance,
              this.paymentConfig.mode,
              this.encId,
              res.remittanceType
            );
          }
        })
    );
  }

  /**
   * @description -Resets remittance-related data to its initial state.
   */
  resetRemittanceData() {
    this.newRemittanceFormat = true;
    this.remitanceTotal = 0.0;
  }

  /**
   * @description  Makes a payment using the selected payee details and payment form data.
   * complete the payment using the psb service.
   */
  completeTransaction() {
    if (this.isUserUnverified()) {
      this.goToVerify();
      return;
    }

    this.removeTrailingSpacesInForm();
    if (this.walletForm.invalid) {
      this.walletForm.markAllAsTouched();
      return;
    }
    const walletFormBody = this.walletForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });
    const body: IPaymentBody = {
      type: 'wallet',
      walletId: walletFormBody.wallet?.uuId,
      amount: walletFormBody.amount,
      payees: [
        {
          id: walletFormBody.payee?.id,
          amount: walletFormBody.amount,
          email: walletFormBody.payeeEmail,
          memo: walletFormBody.memo,
          payeeIdNumber: walletFormBody.payeeIdNumber,
          invoiceNumber: walletFormBody.invoiceNumber,
          bills: []
        }
      ],
      mode: '7',
      commentIds,
      attachmentIds,
      items: this.paymentsService.remittanceData?.remitance,
      remittanceType: this.paymentsService.remittanceData?.remittanceType
    };
    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber: this.paymentConfig?.paymentFormValue?.wallet.bankAccountNumber,
      bankName: this.paymentConfig?.paymentFormValue?.wallet.walletName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: 'Virtual Card',
      amount: Number(body.amount).toFixed(2),
      type: 'wallet'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        body.payees[0].bills = this.billService.billId() ?? [];
        this.loading = true;
        this.paymentsService.isPaymentProcessingSubject.next(true);
        this.subscriptions.push(
          this.psbService
            .completeTransaction(body)
            .pipe(
              finalize(() => {
                this.loading = false;
                this.paymentsService.isPaymentProcessingSubject.next(false);
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.success.emit();
                  this.billService.billId.set(undefined);
                }
              },
              error: (err) => {
                
                if (err?.error?.errorCode === 351) {
                  if (environment.isV4Persona) {
                    this.personaHelperService
                      .openModal('kyc', CVSourceType.other, true)
                      .subscribe((res) => {
                        if (res?.data?.inquiry_id) {
                          this.completeTransaction();
                        }
                      });
                  } else {
                    this.router.navigateByUrl(
                      '/manage/users/verify-user-id?type=8'
                    );
                  }
                }
              }
            })
        );
      }
    });
  }

  /**
   * @description  Submits the payment based on the provided payment processing context.
   * @param paymentProcessingContext -The payment processing context determines the action to be taken.
   *
   */
  submitPayment(paymentProcessingContext: TPaymentProcessingContext) {
    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    this.paymentProcessingContext = paymentProcessingContext;
    this.removeTrailingSpacesInForm();
    if (
      this.walletForm.invalid ||
      Number(this.walletForm.value?.amount as string) < 10
    ) {
      this.walletForm.markAllAsTouched();
      return;
    }

    const payeeData = this.walletForm.controls?.payee?.value;
    const isAddressMissing =
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    if (isAddressMissing) {
      return;
    }

    switch (paymentProcessingContext) {
      case 'pay':
        this.completeTransaction();
        break;
      case 'updateAndPay':
        this.updatePayment(true);
        break;
      case 'save':
        this.savePayment();
        break;
      case 'update':
        this.updatePayment();
        break;
      default:
        break;
    }
  }

  /**
   *
   *@description Creates and returns the form body
   * This function retrieves the necessary values from the payment form and formats them into the desired structure.
   * @returns -The save payment body
   */
  createSavePaymentBody(): IUpdatePaymentBody {
    const paymentFormBody = this.walletForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });
    return {
      transferType: 'virtualCard',
      amount: Number(paymentFormBody.amount),
      category: paymentFormBody.category?.id,
      description: paymentFormBody.memo ?? '',
      payee: paymentFormBody.payee?.id,
      paymentDueDate: this.dateToday ?? undefined,
      referenceNo: paymentFormBody.invoiceNumber as string,
      sourceId: paymentFormBody.wallet?.uuId,
      sourceType: 'wallet',
      commentIds,
      attachmentIds,
      items: this.paymentsService.remittanceData?.remitance,
      payeeIdNumber: paymentFormBody.payeeIdNumber,
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      payeeEmail: paymentFormBody.payeeEmail as string,
      bills: this.billService.billId() ?? []
    };
  }

  /**
   * @description Saves the payment information without initiating the payment.
   */
  savePayment() {
    if (this.isUserUnverified()) {
      this.goToVerify();
      return;
    }

    const sendingData = this.createSavePaymentBody();
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.paymentsService.savePayment(sendingData).subscribe({
        next: (res) => {
          this.loading = false;
          this.paymentsService.isPaymentProcessingSubject.next(false);
          if (res.success) {
            this.success.emit({
              title: 'Your Payment is Saved',
              content:
                'Your payment has been saved. Please check the status in your records.'
            });
          }
        },
        error: (err) => {
          this.loading = false;
          this.paymentsService.isPaymentProcessingSubject.next(false);
          if (err?.error?.errorCode === 441) {
            if (environment.isV4Persona) {
              this.personaHelperService
                .openModal('kyc', CVSourceType.other, true)
                .subscribe((res) => {
                  if (res?.data?.inquiry_id) {
                    this.savePayment();
                  }
                });
            } else {
              this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
            }
          }
        }
      })
    );
  }

  /**
   * @description Updates the payment information.
   * @param payAfterUpdate -Flag indicating whether to initiate the payment after updating.
   */
  updatePayment(payAfterUpdate?: boolean) {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = this.createSavePaymentBody();
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .updatePayment(this.paymentConfig.paymentDetails?.id, sendingData)
          .subscribe(
            (res) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              if (res.success) {
                if (payAfterUpdate) {
                  this.completeTransactionUsingZilPaymentApi();
                } else {
                  this.success.emit({
                    title: 'Your Payment has been Updated',
                    content:
                      'Your payment has been Updated. Please check the status in your records.'
                  });
                }
              }
            },
            () => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
            }
          )
      );
    }
  }

  /**
   * @description Completes the transaction using the Zil Payment API.
   */
  completeTransactionUsingZilPaymentApi() {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = {
        payee_email: this.walletForm.value.payeeEmail ?? undefined
      };
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .processPayment(this.paymentConfig.paymentDetails?.id, sendingData)
          .subscribe(
            (res) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              if (res.success) {
                this.success.emit(true);
              }
            },
            () => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
            }
          )
      );
    }
  }

  catagoryDropDownChange(event: ICategoryDropdown): void {
    if (event === undefined) {
      this.walletForm.controls.category.setValue(null);
    } else {
      this.walletForm.controls.category.setValue(event);
    }
  }

  openCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
          this.walletForm.controls.category.setValue(res);
        }
      })
    );
  }

  removeTrailingSpacesInForm() {
    if (this.walletForm.controls.memo.value) {
      this.walletForm.controls.memo.setValue(
        this.walletForm.controls.memo.value.trim()
      );
    }
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  isUserUnverified(): boolean {
    const gettingStartedData =
      this.localStorageService.getItem('gettingStartedData');
    return gettingStartedData?.verification === 0;
  }

  goToVerify() {
    this.router.navigate(['/manage/users/verify-email-phone'], {
      queryParams: {
        returnUrl: '/manage/payments/main/pay/wallet/virtual-card'
      }
    });
  }

  // selectionChange(event: number) {
  //   this.walletForm.controls.industryType.setValue(event);
  // }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.paymentsService.remittanceData = undefined;
    this.paymentsService.hasAmount.update(() => false);
  }
}
