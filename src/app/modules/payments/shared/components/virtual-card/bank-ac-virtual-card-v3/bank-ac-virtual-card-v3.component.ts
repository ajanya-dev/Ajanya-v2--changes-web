import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  OnChanges,
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
import { debounceTime, finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown, IRemittanceDetails } from 'src/app/models/bank';
import { IBankAccount } from 'src/app/modules/business-tools/plexe/model/plexe';
import {
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData
} from 'src/app/modules/payee/payee-v2/model/payee';
import { NewBankAccountModalComponent } from 'src/app/shared/bank-modal/modals/new-bank-account-modal/new-bank-account-modal.component';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  IPaymentBody,
  IPaymentConfig,
  ISavePaymentBody,
  IUpdatePaymentBody,
  TPaymentProcessingContext
} from 'src/app/modules/payments/model/payments';
import { DatePipe, NgClass } from '@angular/common';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute } from '@angular/router';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { BankAcDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';

/**
 * @description This component handles the bank to virtual card payment functionality.
 */
@Component({
  selector: 'app-bank-ac-virtual-card-v3',
  templateUrl: './bank-ac-virtual-card-v3.component.html',
  styleUrls: ['./bank-ac-virtual-card-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    V35ControlMessageComponent,
    BankAcDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    CategoryDropdownV3Component,
    MatTooltip,
    MatBadge,
    CommonButtonV35Component,
    WhiteLabelPipe,
    // IndustryTypesDropdownComponent
  ]
})
export class BankAcVirtualCardV3Component
  implements OnInit, OnDestroy, OnChanges
{
  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Input() selectedAccount: IBankAccount | undefined = undefined;
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() calculateFee = new EventEmitter();
  @Input() changedInfo: IPayeeEditedData | undefined;
  selectedPayeeDetails: IPayeeDropdown;
  @Input() paymentConfig: IPaymentConfig;

  private psbService = inject(PsbService);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private sharedService = inject(SharedService);
  private paymentsService = inject(PaymentsService);
  private checkService = inject(CheckService);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  public payeeDataService = inject(PayeeDataV35Service);
  private validationService = inject(ValidationService);

  dateToday: string | null = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  paymentForm: FormGroup;
  loading = false;
  subscriptions: Subscription[] = [];
  utils = Utils;
  paymentProcessingContext: string;
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
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.paymentForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email
        );
      }
    }
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



  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.paymentForm = new FormGroup({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(0.01)
      ]),
      payee: new FormControl(null, [Validators.required]),
      bankAc: new FormControl(null, [Validators.required]),
      memo: new FormControl('', [Validators.required]),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      category: new FormControl(null),
      invoiceNumber: new FormControl(''),
      payeeIdNumber: new FormControl(''),
      // industryType: new FormControl(null, Validators.required),
    });
    if (this.selectedAccount !== undefined) {
      this.paymentForm.controls.bankAc.setValue(this.selectedAccount);
    }
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
            paymentSource: 'bank',
            paymentMethod: 'card'
          });
        })
    );
    this.setCommonFormValues();
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
    this.subscriptions.push(
      this.paymentForm.valueChanges.subscribe((formValueChanges) => {
        this.paymentConfig.paymentFormValue = {
          ...this.paymentConfig.paymentFormValue,
          ...formValueChanges
        };
      })
    );
    if (this.paymentConfig.paymentFormValue) {
      this.paymentForm.patchValue({ ...this.paymentConfig.paymentFormValue });
    }

    if(this.paymentConfig.mode === 'CLONE'){
      this.paymentForm.controls.invoiceNumber.setValue(null);    
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
      this.paymentForm.controls.payeeIdNumber.setValue(event.payeeIdNumber);
      if (fromTemplate === false) {
        this.paymentForm.controls.payee.setValue(event);
      }
      if (event.email) {
        this.paymentForm.controls.payeeEmail.setValue(event?.email);
      } else {
        this.paymentForm.controls.payeeEmail.setValue(null);
      }
      this.selectedPayeeDetails = event;
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
      // this.paymentForm.controls.industryType.setValue(event?.merchantCategory);

      const payeeData = this.paymentForm.controls?.payee?.value;
      this.paymentsService.checkAndHandleMissingAddress(payeeData);
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayee() {
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeIdNumber.reset();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.paymentForm.controls.industryType.setValue(null);
  }

  bankSelect(event: IBankDropdown) {
    const lastValue = this.paymentForm.controls.bankAc.value;
    if (event && lastValue !== event) {
      this.paymentsService.checkBankCanACH(event);
      this.paymentForm.controls.bankAc.setValue(event);
    }
  }

  clearBankAccount() {
    this.paymentForm.controls.bankAc.reset();
    this.paymentForm.controls.bankAc.markAllAsTouched();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false
    });
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

  openBankAccModal(): void {
    const dialogRef = this.dialog.open(NewBankAccountModalComponent, {
      maxWidth: '510px',
      width: '93%',
      disableClose: true
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          this.paymentForm.controls.bankAc.setValue(res);
          // this.newAddedBank = {id: res.res.id, name: res.res.bankAccountNickName, label: res.res.bankAccountNickName};
          this.sharedService.setNewBankCreatedData({ bankAccountId: res.id });
          // this.bankAccount.setValue(res.id);
          // this.payment_data.data.bankAccount = res?.data;
          // this.emitData.next(this.payment_data);
        }
      })
    );
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
   * @description  Submits the payment based on the provided payment processing context.
   * @param paymentProcessingContext -The payment processing context determines the action to be taken.
   *
   */
  submitPayment(paymentProcessingContext: TPaymentProcessingContext) {
    this.paymentProcessingContext = paymentProcessingContext;
    this.removeTrailingSpacesInForm();
    if (this.paymentForm.invalid || this.paymentForm.value?.amount < 10) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const payeeData = this.paymentForm.controls?.payee?.value;
    const isAddressMissing = this.paymentsService.checkAndHandleMissingAddress(payeeData);
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
      paymentDueDate: this.dateToday as string,
      referenceNo: paymentFormBody.invoiceNumber,
      sourceId: paymentFormBody.bankAc?.id,
      sourceType: 'bankaccount',
      commentIds,
      attachmentIds,
      items: this.paymentsService.remittanceData?.remitance,
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      payeeIdNumber: paymentFormBody.payeeIdNumber,
      payeeEmail: paymentFormBody.payeeEmail
    };
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.paymentsService.savePayment(sendingData).subscribe(
        (res) => {
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

  /**
   * @description Updates the payment information.
   * @param payAfterUpdate -Flag indicating whether to initiate the payment after updating.
   */
  updatePayment(payAfterUpdate?: boolean) {
    if (
      this.paymentForm.value.bankAc &&
      !this.paymentsService.checkBankCanACH(this.paymentForm.value.bankAc)
    )
      return;
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
        paymentDueDate: this.dateToday as string,
        referenceNo: paymentFormBody.invoiceNumber,
        sourceId: paymentFormBody.bankAc?.id,
        sourceType: 'bankaccount',
        commentIds,
        attachmentIds,
        items: this.paymentsService.remittanceData?.remitance,
        payeeIdNumber: paymentFormBody.payeeIdNumber,
        payeeEmail: paymentFormBody.payeeEmail
      };
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
        payee_bank_account_id: this.paymentForm.value.payeeBankAc?.encrypted_id,
        payee_email: this.paymentForm.value.payeeEmail ?? undefined
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

  /**
   * @description Completes the transaction by initiating the payment.
   */
  completeTransaction() {
    this.removeTrailingSpacesInForm();
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    if (
      this.paymentForm.value.bankAc &&
      !this.paymentsService.checkBankCanACH(this.paymentForm.value.bankAc)
    ) {
      return;
    }
    const paymentFormBody = this.paymentForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });
    const body: IPaymentBody = {
      type: 'bankaccount',
      bankaccountId: paymentFormBody.bankAc?.id,
      amount: paymentFormBody.amount,
      payees: [
        {
          id: paymentFormBody.payee?.id,
          amount: paymentFormBody.amount,
          email: paymentFormBody.payeeEmail,
          memo: paymentFormBody.memo,
          payeeIdNumber: paymentFormBody.payeeIdNumber,
          invoiceNumber: paymentFormBody.invoiceNumber
        }
      ],
      mode: '7',
      commentIds,
      attachmentIds,
      items: this.paymentsService.remittanceData?.remitance,
      remittanceType: this.paymentsService.remittanceData?.remittanceType
    };
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
          next:() => {
            this.success.emit();
            this.billService.billId.set(undefined);
          },
          error: () => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
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
  }

  addBankEvent(event: IBankDropdown) {
    this.paymentsService.checkBankCanACH(event);
    this.paymentForm.controls.bankAc.setValue(event);
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  // selectionChange(event: number){
  //   this.paymentForm.controls.industryType.setValue(event);
  // }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.paymentsService.remittanceData = undefined;
    this.paymentsService.hasAmount.update(() => false);
  }
}
