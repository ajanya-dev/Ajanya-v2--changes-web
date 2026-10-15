import {
  Component,
  OnInit,
  inject,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  input,
  Renderer2,
  signal,
  ViewChild
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
import { debounceTime, finalize, take } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import {
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData
} from 'src/app/modules/payee/payee-v2/model/payee';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  ICardPaymentReqDocRes,
  IEnablePaymentsMethods,
  IPaymentBody,
  IPaymentConfig,
  ISavePaymentBody,
  IUpdatePaymentBody,
  TPaymentProcessingContext,
  ThreeDSPayload
} from 'src/app/modules/payments/model/payments';
import { DatePipe, NgClass } from '@angular/common';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { IRemittanceDetails } from 'src/app/models/bank';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { environment } from 'src/environments/environment';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CardPaymentService } from 'src/app/shared/service/card-payment/card-payment.service';
import {
  ThreeDSComplete,
  ThreeDsInstance
} from 'src/app/modules/cards/components/v35/models/cards-ocw-v35.interface';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CardsDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { CardTransactionDocsPreviewModalComponent } from '../../../modal/card-transaction-docs-preview-modal/card-transaction-docs-preview-modal.component';

/**
 * @description This component handles the card to virtual card payment functionality.
 */
@Component({
  selector: 'app-cards-virtual-card-v3',
  templateUrl: './cards-virtual-card-v3.component.html',
  styleUrls: ['./cards-virtual-card-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    V35ControlMessageComponent,
    CardsDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    CategoryDropdownV3Component,
    MatTooltip,
    MatBadge,
    CommonButtonV35Component,
    // IndustryTypesDropdownComponent
  ]
})
export class CardsVirtualCardV3Component implements OnInit, OnDestroy, OnChanges {
  private cyberSourceService = inject(CybersourceService);
  dialog = inject(MatDialog);
  alertService = inject(AlertService);
  paymentsService = inject(PaymentsService);
  private datePipe = inject(DatePipe);
  private sharedService = inject(SharedService);
  private checkService = inject(CheckService);
  private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  private commonService = inject(CommonOnInitService);
  private clickTrackingService = inject(ClickTrackingService);
  public payeeDataService = inject(PayeeDataV35Service);
  private cardPaymentService = inject(CardPaymentService);
  private renderer = inject(Renderer2);
  private headerService = inject(HeaderService);
  private validationService = inject(ValidationService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);

  @Input() paymentConfig: IPaymentConfig;
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() isCurrentPaymentDisabled: false | string = false;

  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() calculateFee = new EventEmitter();
  @Output() openPersona = new EventEmitter<boolean>(false);
  @Output() verifyEmail = new EventEmitter<boolean>(false);
  @Output() newPaymentClick = new EventEmitter<void>();

  userVerified = input<boolean>(false);
  kycStatus = input<number | undefined>(undefined);

  selectedPayeeDetails: IPayeeDropdown;
  showDropDown = false;
  dropDownSearchInput = '';
  subscriptions: Subscription[] = [];
  paymentForm: FormGroup;
  loading: boolean;
  transactionId: string;
  serviceFee: string;
  utils = Utils;
  paymentProcessingContext: string;
  dateToday: string = this.datePipe.transform(
    new Date(),
    'yyyy-MM-dd'
  ) as string;

  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  remitances: IRemittanceDetails[] | undefined;
  remitanceTotal: number;
  newRemittanceFormat: boolean;
  insertFromRemittance = false;
  attachmentCount: number;
  commentsCount: number;
  readonly paymentMode = '7';
  encId: string;
  hasRemitance: boolean;
  remittanceGrandTotal: number;
  remittanceType: number;
  paymentLimitData: IEnablePaymentsMethods;
  getDisablePaymentsInProgress: boolean = false;
  amountInputDisabled = false;
  faHistory = faClockRotateLeft;
  proccessed = false;
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);

  threeDSInstance: ThreeDsInstance | null = null;
  uploadedDocs: ICardPaymentReqDocRes;
  sessionKey: string;
  emailSessionKey: string;
  phoneSessionKey: string;
  signatureUrl: string;
  gatewayType: number | undefined;

  @ViewChild(CardsDropdownV3Component)
  cardsDropdownV3Component: CardsDropdownV3Component;

  ngOnInit(): void {
    this.paymentsService.payeeDetails = undefined;
    this.initForm();
    this.getCount();
    this.isBillPayment();
    this.paymentsService.currentPaymentMehtod.set('CC_VIRTUALCARD');
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle paymentConfig changes for amount, memo, and other form values
    if (changes?.paymentConfig && this.paymentConfig?.paymentFormValue) {
      const formValue = this.paymentConfig.paymentFormValue;
      
      // Update amount if it exists in paymentConfig
      if (formValue.amount !== undefined && this.paymentForm?.controls?.amount) {
        this.paymentForm.controls.amount.setValue(formValue.amount);
      }
      
      // Update memo if it exists in paymentConfig
      if (formValue.memo !== undefined && this.paymentForm?.controls?.memo) {
        this.paymentForm.controls.memo.setValue(formValue.memo);
      }
      
      // Update payee if it exists in paymentConfig
      if (formValue.payee && this.paymentForm?.controls?.payee) {
        this.paymentForm.controls.payee.setValue(formValue.payee);
      }
      
      // Update payee email if it exists in paymentConfig
      if (formValue.payeeEmail !== undefined && this.paymentForm?.controls?.payeeEmail) {
        this.paymentForm.controls.payeeEmail.setValue(formValue.payeeEmail);
      }
    }
  }

  isBillPayment() {
    const billId = this.activatedRoute.snapshot.queryParamMap.get('billId');
    if (billId) {
      this.amountInputDisabled = true;
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.paymentForm = new FormGroup({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(0.01),
        Validators.maxLength(9)
      ]),
      payee: new FormControl(null, [Validators.required]),
      card: new FormControl(null, [Validators.required]),
      memo: new FormControl('', [Validators.required]),
      invoiceNumber: new FormControl(null, [Validators.required]),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      category: new FormControl(null),
      payeeIdNumber: new FormControl(''),
      // industryType: new FormControl(null, Validators.required)
    });
    this.subscriptions.push(
      this.paymentForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id);
        }
      }),
      this.paymentForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );
    this.subscriptions.push(
      this.paymentForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          this.calculateFee.emit({
            amount,
            mode: Number(this.paymentMode),
            fee1Label: 'Pass-through processing fee',
            fee2Label: 'Virtual Card'
          });
          // Call decide-gateway API when amount changes
          this.paymentsService.fetchGatewayType(amount, (gatewayType) => {
            this.gatewayType = gatewayType;
          });
          if(!amount || amount === 0) {
            this.gatewayType = undefined;
          }
          // Call decide-gateway-by-trans-limit API (only runs when
          // creditCardGatewaySwitchingStatus === 3; guard is inside the service).
          this.paymentsService.checkTransLimitForCard({
            amount: Number(this.paymentForm.controls.amount.value),
            card: this.paymentForm.controls.card.value,
            cardControl: this.paymentForm.controls.card as FormControl<IExistingCreditCards | null>,
            dropdown: this.cardsDropdownV3Component as CardsDropdownV3Component,
            subscriptions: this.subscriptions
          });
        })
    );
    this.subscriptions.push(
      this.paymentForm.controls.card.valueChanges.subscribe((card) => {
        this.paymentsService.checkTransLimitForCard({
          amount: Number(this.paymentForm.controls.amount.value),
          card,
          cardControl: this.paymentForm.controls.card as FormControl<IExistingCreditCards | null>,
          dropdown: this.cardsDropdownV3Component as CardsDropdownV3Component,
          subscriptions: this.subscriptions
        });
      })
    );
    this.setCommonFormValues();
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.
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
            this.paymentForm.controls.payeeIdNumber.setValue(
              res.payee_information.payee_id_number
            );
            this.paymentForm.controls.payeeEmail.setValue(
              res.payee_information.payee_email
            );
            // this.paymentForm.controls.industryType.setValue(
            //   res.payee_information.merchant_category
            // );
          }
        })
    );
  }

  getPayeeCategory(payeeId: string) {
    this.subscriptions.push(
      this.checkService.getPayeeCategory(payeeId).subscribe((res) => {
        if (res.data.id) {
          this.paymentForm.controls.category.setValue(res?.data);
          this.categoryId.set(res?.data?.id);
          if (this.categorySetWithIdFunction) {
            this.categorySetWithIdFunction(res?.data?.id);
          }
        } else {
          this.paymentForm.controls.category.setValue(null);
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



  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.paymentForm.valueChanges.subscribe((formValueChanges) => {
      this.paymentConfig.paymentFormValue = {
        ...this.paymentConfig.paymentFormValue,
        ...formValueChanges
      };
    });
    if (this.paymentConfig.paymentFormValue) {
      this.paymentForm.patchValue({ ...this.paymentConfig.paymentFormValue });
    }

    if (this.paymentConfig.mode === 'CLONE') {
      this.paymentForm.controls.invoiceNumber.setValue(null);
    }
  }

  /**
   * @description This function is triggered when a card is selected from the dropdown.
   * @param item -The selected card details from the card dropdown component.
   */
  cardSelect(event: IExistingCreditCards) {
    this.paymentForm.controls.card.setValue(event);
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayeeSelect() {
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payeeIdNumber.reset();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.paymentForm.controls.industryType.setValue(null);
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
   * @description Open modal for adding comments and gives the added data when its closed
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
    const amount = Number(this.paymentForm.controls.amount.value);
    const remitanceData = this.paymentsService.createRemitanceData(
      amount,
      this.insertFromRemittance
    );
    this.subscriptions.push(
      this.paymentsService
        .openAddRemitanceModal(remitanceData)
        .subscribe((res) => {
          if (res) {
            this.paymentsService.getRemitanceValue(res, this.paymentForm);
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
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param payee -The selected payee details from the payee dropdown.
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
        this.paymentForm.controls.payee.setValue(event);
      }
      if (event.email) {
        this.paymentForm.controls.payeeEmail.setValue(event?.email);
      } else {
        this.paymentForm.controls.payeeEmail.setValue(null);
      }

      // this.paymentForm.controls.industryType.setValue(event?.merchantCategory);

      this.paymentForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });

      const payeeData = this.paymentForm.controls?.payee?.value;
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    }
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
    if (this.paymentForm.invalid || this.paymentForm.value?.amount < 10) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const payeeData = this.paymentForm.controls?.payee?.value;
    const isAddressMissing =
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    if (isAddressMissing) {
      return;
    }

    if (
      this.paymentForm.value.bankAc &&
      !this.paymentsService.checkBankCanACH(this.paymentForm.value.bankAc)
    ) {
      return;
    }
    if (this.getDisablePaymentsInProgress) {
      return;
    }
    if (!this.validateUserStatus()) {
      return;
    }
    if (this.isCurrentPaymentDisabled) {
      this.commonService.contactAlert(this.isCurrentPaymentDisabled);
      return;
    }
    this.getDisablePaymentsInProgress = true;
    this.subscriptions.push(
      this.paymentsService.getDisablePayments().subscribe((res) => {
        this.getDisablePaymentsInProgress = false;
        this.paymentLimitData = res.data;
        switch (paymentProcessingContext) {
          case 'pay':
            this.managePayment('COMPLETE-TRANSACTION');
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
      })
    );
  }

  /**
   * @description Function for managing payments with card. where ever we create a payment with card, we call this function first,
   * currently there are two places we make a payment.
   * 1. Direct payment.
   * 2. Payment after updateing saved payment.
   * From this function, firstly we checking if there is any documents required to make a payment with this card.
   * if required, we opens a modal and collects all the required documents and submits from the modal. and gets the response from the modal,
   * and with the response, we completes the payment.
   * if not required, we simply make the payment normally. without documents details.
   * @param shouldGoTo - This is for as mentioned, there are two places we make a payment. so we have calling this function from two places.
   * and in both two places we are calling two different apis. so we have to know from where the function got called. this param used to know that.
   */
  async managePayment(
    shouldGoTo: 'COMPLETE-TRANSACTION' | 'COMPLETE-TRANSACTION-WITH-ZIL'
  ) {
    const card = this.paymentForm.controls.card.value;
    const amount = this.paymentForm.controls.amount.value;
    const invoiceNumber = this.paymentForm.controls.invoiceNumber.value;
    const mode = this.paymentMode;
    const paymentLimit = this.paymentLimitData?.paymentLimit?.virtualCardSend;
    if (parseFloat(amount) > parseFloat(paymentLimit)) {
      this.alertService
        .failedAlert({
          content: `Maximum send limit for virtual card is $${paymentLimit} reached. Please contact customer support.`,
          cancelMsg: 'Not Now',
          isCancel: true,
          isOk: true,
          doneMsg: 'Contact Now'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.dynamicWhiteLabelService.goToLiveChat();
          }
        });
      this.loading = false;
      this.paymentsService.isPaymentProcessingSubject.next(false);
      return;
    }

    if (!card || !amount) return;

    const headerData = this.headerService._headerData.getValue();
    let threeDSRes: undefined | ThreeDSComplete;

    if (headerData && headerData.allow_three_ds_testing === 1) {
      this.loading = true;
      const res = await this.cardPaymentService.validateCardWith3ds(
        card,
        amount,
        headerData.nmi_gatewayjs_checkout_key,
        this.renderer,
        (instance) => {
          this.threeDSInstance = instance;
        },
        () => {
          this.cardPaymentService.hasThreeDsChallenge.set(true);
        }
      );
      this.loading = false;
      this.cardPaymentService.hasThreeDsChallenge.set(false);

      if (res.instance) {
        res.instance.unmount();
        this.threeDSInstance = null;
      }

      if (!res.success) {
        this.alertService.failedAlert({
          content:
            res.message || 'Something went wrong while verifying your card'
        });
        return;
      }

      threeDSRes = res.data ?? undefined;
    }

    const body = {
      cardId: card?.cardId ?? '',
      amount: amount ?? '',
      paymentType: 'rail'
    };
    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber: this.paymentConfig?.paymentFormValue?.card?.cardMasked,
      bankName: this.paymentConfig?.paymentFormValue?.card?.nickName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: 'Virtual Card',
      amount: Number(body.amount).toFixed(2),
      type: 'card'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading = true;
        this.paymentsService.isPaymentProcessingSubject.next(true);
        this.subscriptions.push(
          this.paymentsService
            .getRequiredDocumentsDetails(body)
            .pipe(
              finalize(() => {
                this.paymentsService.isPaymentProcessingSubject.next(false);
                this.loading = false;
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  const invoiceRequired =
                    res.data.required_docs.includes('invoice');
                  const cardRequired = res.data.required_docs.includes('card');
                  if (cardRequired || invoiceRequired) {
                    if (card) {
                      this.loading = false;
                      this.paymentsService.isPaymentProcessingSubject.next(
                        false
                      );
                      const dialogRef =
                        this.commonService.openVerifyCardInvoiceModal(
                          card,
                          amount,
                          mode,
                          invoiceNumber,
                          res.data.required_docs,
                          this.selectedPayeeDetails
                        );
                      this.subscriptions.push(
                        dialogRef.afterClosed().subscribe((data) => {
                          if (data?.success) {
                            this.uploadedDocs = data?.data;
                            this.signatureUrl = data?.authSign as string;
                            this.loading = true;
                            this.paymentsService.isPaymentProcessingSubject.next(
                              true
                            );
                            if (shouldGoTo === 'COMPLETE-TRANSACTION') {
                              this.completeTransaction(data?.data, threeDSRes);
                            } else {
                              this.completeTransactionUsingZilPaymentApi(
                                data?.data,
                                threeDSRes
                              );
                            }
                          } else if (data?.success === false) {
                            this.alertService.failedAlert({
                              content:
                                "Sorry.! Couldn't verify your documents, Please Verify all the documents to make a payment"
                            });
                          }
                        })
                      );
                    } else {
                      this.loading = false;
                      this.paymentsService.isPaymentProcessingSubject.next(
                        false
                      );
                    }
                  } else if (shouldGoTo === 'COMPLETE-TRANSACTION') {
                    this.completeTransaction(undefined, threeDSRes);
                  } else {
                    this.completeTransactionUsingZilPaymentApi(
                      undefined,
                      threeDSRes
                    );
                  }
                }
              },
              error: (err) => {
                if (err?.error?.errorCode === 442) {
                  this.alertService
                    .infoAlert({
                      content:
                        'You need to verify your business before making a payment',
                      isOk: true,
                      isCancel: true,
                      cancelMsg: 'Cancel',
                      doneMsg: 'Enable Now'
                    })
                    .afterClosed()
                    .subscribe((res) => {
                      if (res) {
                        // this.managePayment(shouldGoTo);
                        this.openKybModal(shouldGoTo);
                      }
                    });
                }
                this.loading = false;
                this.paymentsService.isPaymentProcessingSubject.next(false);
              }
            })
        );
      } else {
        this.loading = false;
        this.paymentsService.isPaymentProcessingSubject.next(false);
      }
    });
  }

  openKybModal(
    shouldGoTo: 'COMPLETE-TRANSACTION' | 'COMPLETE-TRANSACTION-WITH-ZIL'
  ) {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyb', CVSourceType.credit_card)
        .subscribe((res) => {
          if (res?.data?.inquiry_id) {
            this.managePayment(shouldGoTo);
          }
        });
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
    }
  }

  /**
   * @description Complete transaction function for card payment with old api.
   * @param documents - Optional parameter. its possible that is there might be documents details, and there might not be. so its optional.
   * if there is documents details, we simply pass it backend, else it will be undefined.
   */
  completeTransaction(
    documents?: ICardPaymentReqDocRes,
    threeDsData?: ThreeDSComplete,
    isAgree = 0
  ) {
    const paymentFormBody = this.paymentForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });

    let threeDSPayload: ThreeDSPayload | undefined = undefined;

    if (threeDsData) {
      threeDSPayload = {
        cavv: threeDsData.cavv,
        xid: threeDsData.xid,
        eci: threeDsData.eci,
        cardholder_auth: threeDsData.cardHolderAuth,
        three_ds_version: threeDsData.threeDsVersion,
        directory_server_id: threeDsData.directoryServerId,
        cardholder_info: threeDsData.cardHolderInfo
      };
    }

    const body: IPaymentBody = {
      amount: this.paymentForm.controls.amount.value,
      cardId: this.paymentForm.controls.card.value.cardId,
      payees: [
        {
          id: paymentFormBody.payee?.id,
          amount: paymentFormBody.amount,
          email: paymentFormBody.payeeEmail,
          memo: paymentFormBody.memo,
          category: paymentFormBody.category?.id ?? '',
          invoiceNumber: paymentFormBody.invoiceNumber,
          payeeIdNumber: paymentFormBody.payeeIdNumber,
          bills: []
        }
      ],
      mode: '7',
      documents,
      attachmentIds,
      commentIds,
      items: this.paymentsService.remittanceData?.remitance,
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      three_ds_data: threeDSPayload,
      session_key: this.sessionKey ?? '',
      otp_type: this.emailSessionKey ? 'phone' : 'email',
      email_otp_session_key: this.emailSessionKey ?? '',
      phone_otp_session_key: this.phoneSessionKey ?? '',
      document_preview_agree:isAgree
    };
    body.payees[0].bills = this.billService.billId() ?? [];
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.cyberSourceService
        .capturePayment(body)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
            this.cyberSourceService.replaceIdempotencyKey();
          })
        )
        .subscribe({
          next: (res) => {
            this.clickTrackingService
              .ccToastClickedPaymentDone(res.data?.payment_ids[0])
              ?.pipe(take(1))
              ?.subscribe();

            // this.scriptService.trackMatomoEvent(
            //   'Creditcard',
            //   'CreditcardUser',
            //   'CreditcardUser',
            //   this.localStorageService.getItem('userId')
            // );            
            this.success.emit();
            this.sessionKey = '';
            this.emailSessionKey = '';
            this.phoneSessionKey = '';
            this.billService.billId.set(undefined);
          },
          error: (err) => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);  
            this.paymentsService.afterGetingError(
              err?.error?.errorCode,
              err?.error?.errorMsg
            );
            if (err.error.errorCode === '808') {
              const dialog = this.dialog.open(CardTransactionDocsPreviewModalComponent, {
                maxWidth: '750px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: {...body, authSign: this.signatureUrl}
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.completeTransaction(this.uploadedDocs, undefined, 1);
                }
              });
            } else if (err.error.errorCode === '112') {
              this.sessionKey = err.error.session_key;
              const dialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: {...err.error,type:'card-transaction',mode:this.emailSessionKey ? 'phone': 'email'}
              });
              dialog.afterClosed().subscribe((result) => {
                if (result.success) {
                  if(this.emailSessionKey){
                    this.phoneSessionKey = result?.session_key ?? err.error.session_key;
                  }else{
                    this.emailSessionKey = result?.session_key ?? err.error.session_key;
                  }
                  this.completeTransaction(this.uploadedDocs);
                }
              });
            }
            if (err.error.errorCode === 816) {
              const alert = this.alertService.failedAlert({
                content: err.error.errorMsg,
                isOk: true,
                isCancel: false,
                doneMsg: 'Try Again'
              });
              alert.afterClosed().subscribe((res) => {
                if (res) {
                  this.headerService.setHeaderValueChanged(true);
                  this.newPaymentClick.emit();
                }
              });
            }
          }
        })
    );
  }

  /**
   * @description Saves the payment information without initiating the payment.
   */
  savePayment() {
    const paymentFormBody = this.paymentForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });
    const sendingData: ISavePaymentBody = {
      transferType: 'virtualCard',
      amount: Number(paymentFormBody.amount),
      category: paymentFormBody.category?.id,
      description: paymentFormBody.memo ?? '',
      payee: paymentFormBody.payee?.id,
      paymentDueDate: this.dateToday ?? undefined,
      referenceNo: paymentFormBody.invoiceNumber ?? undefined,
      sourceId: paymentFormBody.card?.cardId,
      sourceType: 'card',
      payeeIdNumber: paymentFormBody.payeeIdNumber,
      attachmentIds,
      commentIds,
      items: this.paymentsService.remittanceData?.remitance,
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      payeeEmail: paymentFormBody.payeeEmail
    };
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    if (paymentFormBody?.amount < 10.0) {
      this.alertService.failedAlert({
        title: 'Failed',
        content: 'Minimum transaction amount should be $10.00'
      });
      this.loading = false;
      this.paymentsService.isPaymentProcessingSubject.next(false);
    } else {
      this.subscriptions.push(
        this.paymentsService.savePayment(sendingData).subscribe(
          (res) => {
            // Track when the credit card promoting toast is clicked and the payment is done.
            this.clickTrackingService
              .ccToastClickedPaymentDone(res.data?.id)
              ?.pipe(take(1))
              ?.subscribe();

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
          () => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          }
        )
      );
    }
  }

  /**
   * @description Updates the payment information.
   * @param payAfterUpdate -Flag indicating whether to initiate the payment after updating.
   */
  updatePayment(payAfterUpdate?: boolean) {
    if (this.paymentConfig.paymentDetails?.id) {
      const paymentFormBody = this.paymentForm.value;
      const commentIds: string[] = [];
      const attachmentIds: string[] = [];
      this.createdExistingComments.map((el) =>
        commentIds.push(el.encrypted_id)
      );
      this.createdExistingAttachments.forEach((el) => {
        if (el.encrypted_id) {
          attachmentIds.push(el.encrypted_id);
        }
      });
      const sendingData: IUpdatePaymentBody = {
        transferType: 'virtualCard',
        amount: Number(paymentFormBody.amount),
        category: paymentFormBody.category?.id,
        description: paymentFormBody.memo ?? '',
        payee: paymentFormBody.payee?.id,
        paymentDueDate: this.dateToday ?? undefined,
        // referenceNo:
        sourceId: paymentFormBody.card?.cardId,
        sourceType: 'card',
        payeeIdNumber: paymentFormBody.payeeIdNumber,
        commentIds,
        attachmentIds,
        items: this.paymentsService.remittanceData?.remitance,
        payeeEmail: paymentFormBody.payeeEmail
      };
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      if (paymentFormBody?.amount < 10.0) {
        this.alertService.failedAlert({
          title: 'Failed',
          content: 'Minimum transaction amount should be $10.00'
        });
        this.loading = false;
        this.paymentsService.isPaymentProcessingSubject.next(false);
      } else {
        this.subscriptions.push(
          this.paymentsService
            .updatePayment(this.paymentConfig.paymentDetails?.id, sendingData)
            .subscribe({
              next: (res) => {
                if (res.success) {
                  if (payAfterUpdate) {
                    this.managePayment('COMPLETE-TRANSACTION-WITH-ZIL');
                  } else {
                    this.success.emit({
                      title: 'Your Payment has been Updated',
                      content:
                        'Your payment has been Updated. Please check the status in your records.'
                    });
                    this.loading = false;
                    this.paymentsService.isPaymentProcessingSubject.next(false);
                  }
                }
              },
              error: () => {
                this.loading = false;
                this.paymentsService.isPaymentProcessingSubject.next(false);
              }
            })
        );
      }
    }
  }

  /**
   * @description Complete transaction function for card payment with Zil payments api.
   * @param documents - Optional parameter. its possible that is there might be documents details, and there might not be. so its optional.
   * if there is documents details, we simply pass it backend, else it will be undefined.
   */
  completeTransactionUsingZilPaymentApi(
    documents?: ICardPaymentReqDocRes,
    threeDSRes?: ThreeDSComplete,
    isAgree = 0
  ) {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = {
        payee_bank_account_id: this.paymentForm.value.payeeBankAc?.encrypted_id,
        payee_email: this.paymentForm.value.payeeEmail ?? undefined,
        three_ds_data: threeDSRes,
        documents,
        otp_and_docs_preview_section_in_credit_card:1,
        otp_type:this.emailSessionKey ? 'phone': 'email',
        email_otp_session_key:this.emailSessionKey ?? '',
        phone_otp_session_key: this.phoneSessionKey ?? '',
        document_preview_agree:isAgree
      };
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .processCardPayment(
            this.paymentConfig.paymentDetails?.id,
            sendingData
          )
          .pipe(
            finalize(() => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              this.paymentsService.replaceIdempotencyKey();
            })
          )
          .subscribe(
            (res) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              this.scriptService.trackMatomoEvent(
                'Creditcard',
                'CreditcardUser',
                'CreditcardUser',
                this.localStorageService.getItem('userId')
              );
              if (res.success) {
                this.success.emit(true);
              }
            },
            (err) => {
              this.paymentsService.afterGetingError(
                err?.error?.errorCode,
                err?.error?.errorMsg
              );
              if (err.error.errorCode === '112') {
                this.sessionKey = err.error.session_key;
                const dialog = this.dialog.open(OtpModalComponent, {
                  maxWidth: '410px',
                  width: '100%',
                  disableClose: true,
                  autoFocus: false,
                  data: {...err.error,type:'card-transaction',mode:this.emailSessionKey ? 'phone': 'email'}
                });
                dialog.afterClosed().subscribe((result) => {
                  if (result.success) {
                    if(this.emailSessionKey){
                      this.phoneSessionKey = result?.session_key ?? err.error.session_key;
                    }else{
                      this.emailSessionKey = result?.session_key ?? err.error.session_key;
                    }
                    this.completeTransactionUsingZilPaymentApi(this.uploadedDocs);
                  }
                });
              }
              if (err.error.errorCode === '808') {
                const dialog = this.dialog.open(CardTransactionDocsPreviewModalComponent, {
                  maxWidth: '750px',
                  width: '100%',
                  disableClose: true,
                  autoFocus: false,
                  data: {...sendingData,authSign:this.signatureUrl,zil_payment_uuid:this.paymentConfig.paymentDetails?.id}
                });
                dialog.afterClosed().subscribe((result) => {
                  if (result) {
                    this.completeTransactionUsingZilPaymentApi(this.uploadedDocs,undefined,1);
                  }
                });
              }
              if (err.error.errorCode === 816) {
                const alert = this.alertService.failedAlert({
                  content: err.error.errorMsg,
                  isOk: true,
                  isCancel: false,
                  doneMsg: 'Try Again'
                });
                alert.afterClosed().subscribe((res) => {
                  if (res) {
                    this.headerService.setHeaderValueChanged(true);
                    this.newPaymentClick.emit();
                  }
                });
              }
            }
          )
      );
    }
  }

  catagoryDropDownChange(event: ICategoryDropdown): void {
    if (event === undefined) {
      this.paymentForm.controls.category.setValue(null);
    } else {
      this.paymentForm.controls.category.setValue(event);
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
          this.paymentForm.controls.category.setValue(res);
        }
      })
    );
  }

  removeTrailingSpacesInForm() {
    if (this.paymentForm.controls.memo.value) {
      this.paymentForm.controls.memo.setValue(
        this.paymentForm.controls.memo.value.trim()
      );
    }
    if (this.paymentForm.controls.invoiceNumber.value) {
      this.paymentForm.controls.invoiceNumber.setValue(
        this.paymentForm.controls.invoiceNumber.value.trim()
      );
    }
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  addCardEvent(event: IExistingCreditCards) {
    this.paymentForm.controls.card.setValue(event);
  }

  /**
   * Validates user status before proceeding with payment.
   * Checks for email verification and KYC status.
   *
   * @returns {boolean} True if all validations pass, false otherwise
   */
  validateUserStatus(): boolean {
    if (!this.userVerified()) {
      this.verifyEmail.emit(true);
      return false;
    }

    if (this.kycStatus() === null) {
      this.openPersona.emit(true);
      return false;
    }

    return true;
  }

  // selectionChange(event: number) {
  //   this.paymentForm.controls.industryType.setValue(event);
  // }

  ngOnDestroy(): void {
    this.threeDSInstance && this.threeDSInstance.unmount();
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.paymentsService.remittanceData = undefined;
    this.paymentsService.isPaymentProcessingSubject.next(false);
    this.paymentsService.hasAmount.update(() => false);
    this.paymentsService.currentPaymentMehtod.set(undefined);
  }
}
