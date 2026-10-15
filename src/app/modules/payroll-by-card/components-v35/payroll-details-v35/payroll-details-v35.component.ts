import { PayrollService } from 'src/app/modules/payroll-by-card/services/payroll.service';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import {
  Subscription,
  catchError,
  finalize,
  firstValueFrom,
  throwError
} from 'rxjs';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import {
  IBankAccountEditDetails,
  IBankCreateRes,
  IBankDropdown
} from 'src/app/models/bank';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { WireRoutingnumberAddComponent } from 'src/app/shared/bank-modal/modals/wire-routingnumber-add/wire-routingnumber-add.component';
import { EditBankAccountModalComponent } from 'src/app/modules/bank/bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { ConfirmMicroDepositModalComponent } from 'src/app/modules/bank/bank-v2/modals/confirm-micro-deposit-modal/confirm-micro-deposit-modal.component';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PaymentData } from 'src/app/modules/payments/shared/components/payments-main-v35/payments-data-v35';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Store } from '@ngrx/store';
import { selectCards } from 'src/app/modules/store/cards/cards.selectors';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { environment } from 'src/environments/environment';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import {
  faBank,
  faCircleDollar,
  faCircleInfo,
  faCopy,
  faEnvelope,
  faGlobe,
  faHeadset,
  faMessage,
  faSpinner
} from '@fortawesome/pro-solid-svg-icons';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { MaintenanceAlertModalComponent } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-alert-modal.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { BankAcDropdownV3Component } from '../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CardsDropdownV3Component } from '../../../../shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { PayrollTransactionsTableComponent } from '../../components/payroll-transactions-table/payroll-transactions-table.component';
import { PayrollDataTableComponent } from '../../components/payroll-data-table/payroll-data-table.component';
import { PayrollStatementVerificationComponent } from '../../components/payroll-statement-verification/payroll-statement-verification.component';
import { ProcessMethodeModalComponent } from '../../components/process-methode-modal/process-methode-modal.component';
import { AddPayrollModalComponent } from '../../components/add-payroll-modal/add-payroll-modal.component';
import { WireRoutingUpdateModalComponent } from '../../modal/wire-routing-update-modal/wire-routing-update-modal.component';

interface IpaymentMethod {
  name: string;
  icon: IconName;
  value: number;
  id: string;
}

@Component({
  selector: 'app-payroll-details-v35',
  templateUrl: './payroll-details-v35.component.html',
  styleUrls: ['./payroll-details-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV35Component,
    BankAcDropdownV3Component,
    FormsModule,
    FaIconComponent,
    MatTooltip,
    CardsDropdownV3Component,
    NgSelectModule,
    PayrollTransactionsTableComponent,
    PayrollDataTableComponent,
    NgOptimizedImage,
    DemoVideoComponent
  ]
})
export class PayrollDetailsV35Component implements OnInit, OnDestroy {
  private payrollService = inject(PayrollService);
  private bankService = inject(BankAccountsService);
  private cyberSourceService = inject(CybersourceService);
  private dialog = inject(MatDialog);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private router = inject(Router);
  private scriptService = inject(ScriptService);
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;
  public alertService = inject(AlertService);
  private dataTableService = inject(V3DataTableService);
  private paymentsService = inject(PaymentsService);
  private store = inject(Store);
  private gettingStartedService = inject(GettingStartedService);
  private personaHelperService = inject(PersonaHelperService);
  private headerService = inject(HeaderService);
  private userProfileService = inject(UserProfileService);
  private openAddCardService = inject(OpenAddCardService);
  private activatedRoute = inject(ActivatedRoute);
  private bankModalService = inject(BankModalService);
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);

  @ViewChild(BankAcDropdownV3Component) bankDropDown: BankAcDropdownV3Component;
  @ViewChild('cardDropDown') cardDropDown: CardsDropdownV3Component;
  @ViewChild('tooltip') tooltip: MatTooltip;

  paymentOptions: IpaymentMethod[] = [
    { name: 'WIRE', icon: 'globe', value: 6, id: 'wire' },
    { name: 'ACH', icon: 'bank', value: 1, id: 'ach' },
    { name: 'RTP', icon: 'circle-dollar', value: 12, id: 'rtp' }
  ];

  isAccountDetails = true;
  creditCardMaintenanceMessage = '';
  selectedApp: IPayrollApps;
  subscriptions: Subscription[] = [];
  tableReady: boolean;
  bankAccounts: IBankDropdown[] = [];
  cardData: IExistingCreditCards[] = [];
  hasBank: boolean;
  isBankLoaded = false;
  hasCreditCard: boolean;
  isCardsLoaded = false;
  selectedBankItem: IBankDropdown | undefined;
  selectedCard: IExistingCreditCards | undefined;
  accountRefill: number;
  presetAmount: number;
  isManual: boolean;
  isLoading = false;
  isSync: number;
  dropdownLoading: boolean;
  notVerified = false;
  payrollStatus: 0 | 1 | 2 = 2;
  selectedPaymentMethod: null | number = null;
  confirmMicroDeposit = false;
  verificationPending = false;
  bankVerfied = false;
  bankAc: IBankDropdown;
  failedVerification = false;
  rejectedVerificationWithVerifyInstantly = false;
  rejectedVerification = false;
  isPayrollNotVerified = signal<boolean>(false);
  isPayrollNotVerifiedBankId = signal<string>('');
  noSearchResult = false;
  enablePaymentMethods = PaymentData.enablePaymentMethods(
    'payroll_by_cards_page'
  );

  environment = environment;
  isSyncing: boolean;
  kycCompleted?: number;
  kybStatus?: number;
  isKycKybBypassed?: boolean;
  faArrowRight = faArrowRight;
  faSpinn = faSpinner;
  faCopy = faCopy;
  isGenerate = false;
  generatedKey: string | undefined;
  extensionMode = 'get';
  faCircleInfo = faCircleInfo;
  faBank = faBank;
  faGlobe = faGlobe;
  faEnvelope = faEnvelope;
  faMessage = faMessage;
  faHeadset = faHeadset;
  faDollar = faCircleDollar;
  showExtension = signal(false);
  paymentMethodChanged = signal<number | undefined>(undefined);
  selectedBankId: string;
  isRtpAllowed = signal(true);
  selectedMethodId = signal<number | undefined>(undefined);
  destroyRef$ = inject(DestroyRef);
  gatewayType: number | undefined;

  ngOnInit(): void {
    this.getUserKycStatus();
    this.getAvailablePayments();
    this.scriptService.addZohoSrcipt();
    this.getPayrollDetails();
    this.toggleAccountDetails(true);
    this.isSearchResult();
    this.getHeaderData();
    this.getRouterData();
    this.getGatewayType();
    this.getDuplicateCard();
  }

  getDuplicateCard() {
    this.payrollService.showDuplicateCard.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((card) => {
      if(card){
        this.cardDropDown?.populateDuplicateCard(card);
      }
    });
  }

  getGatewayType() {
    this.payrollService.gatewayTypeChanged.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((gatewayType) => {
      this.gatewayType = gatewayType;
      this.clearSelectedCard(gatewayType);
      this.addNewCard();
    });
  }

  clearSelectedCard(gatewayType: number | undefined) {
    this.payrollService.resetPayrollDetails.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe(() => {
      this.selectedCard = undefined;
      this.payrollService.selectedCardId = undefined;
      this.cardDropDown?.clearSelection();
      if (!gatewayType){
        this.getCards();
      }
    });
  }

  addNewCard() {
    this.payrollService.addNewCard.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((card) => {
      if (card?.cardId && this.gatewayType !== undefined) {
        this.cardDropDown?.addCardWithPrefill(card, this.gatewayType);
      } else {
        this.cardDropDown?.addNewCard(this.gatewayType, true);
      }
    });
  }

  getRouterData() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((res) => {
        if (res?.showExt) {
          this.showExtension.set(true);
        }
      })
    );
  }

  getUserKycStatus() {
    this.subscriptions.push(
      this.gettingStartedService.getGettingStarted().subscribe((response) => {
        if (response) {
          this.kycCompleted = response.kycStatus ?? undefined;
          this.kybStatus = response.kybStatus ?? undefined;
        }
      })
    );
  }

  getPayrollDetails() {
    this.subscriptions.push(
      this.payrollService.payrollAppId.subscribe((res) => {
        if (res) {
          this.setupPayrollData(res);
        }
      }),
      this.payrollService.payrollStatementApplicationSuccess.subscribe(
        (val) => {
          if (val) {
            this.payrollStatus = 1;
            this.setPayrollSettings();
          }
        }
      ),
      this.payrollService.checkPaymentMethodAllowedToUse.subscribe(
        (state: boolean) => {
          if (state) this.verifyPaymentAccess();
        }
      )
    );
  }

  /**
   * Method for getting user header data
   */
  getHeaderData() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const headerData = res as IHeaderData;
        this.creditCardMaintenanceMessage =
          headerData.cardPaymentMaintananceMessage || '';
        if (headerData.kybBypassedUser === 1) {
          this.isKycKybBypassed = true;
        }
      })
    );
  }

  /**
   * @description - Sets up payroll data and initializes relevant properties.
   * @param payrollData  - The payroll data to set up.
   */
  setupPayrollData(payrollData: IPayrollApps) {
    this.selectedApp = payrollData;
    this.payrollService.selectedApp = payrollData;
    this.isManual = !!payrollData.manual;
    this.tableReady = true;
    this.removeAlerts();
    this.getBankAccounts();
    this.getCards();
    this.getSettings(true);
    if (this.showExtension()) {
      this.getChromeExtensionKey('get');
    }
  }

  /**
   * @description Method to get available payments.
   */
  getAvailablePayments(): void {
    this.subscriptions.push(
      this.paymentsService.getDisablePayments().subscribe((res) => {
        if (res?.data) {
          const paymentMethodStatusArray = Object.entries(res.data);
          const enabledPaymentMethodsArray = Object.keys(
            this.enablePaymentMethods
          );
          paymentMethodStatusArray.forEach((item) => {
            const [paymentMethod, enabledStatus] = item;
            if (
              enabledStatus === 0 &&
              enabledPaymentMethodsArray.includes(paymentMethod)
            ) {
              this.payrollService.disableMethods.push(
                this.enablePaymentMethods[paymentMethod]
              );
            }
          });
        }
      })
    );
  }

  /**
   * @description -Fetches payroll settings, bank account details, and updates component properties accordingly.
   */
  getSettings(loading?: boolean) {
    this.isLoading = !!loading;
    if (this.selectedApp?.id) {
      this.subscriptions.push(
        this.payrollService
          .getPayrollSettings(this.selectedApp?.id, this.isManual ? 1 : 0)
          .pipe(
            finalize(() => {
              this.isLoading = false;
            }),
            catchError((err) => {
              this.dropdownLoading = false;
              return throwError(() => err);
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.store.select(selectCards).subscribe((response) => {
                this.cardData = response;
              });
              const bankId = res.data.bankAccountId;
              const cardId = res.data.creditCardId
                ? res.data.creditCardId
                : undefined;
              this.presetAmount = res.data.amount;
              this.selectedCard = this.cardData.find(
                (card) => card.cardId === cardId
              );
              this.payrollService.selectedCardId = this.selectedCard;
              this.accountRefill = res.data.processMethod;
              this.isSync = res.data.syncStatus;
              this.selectedPaymentMethod = res.data.transferMode;
              this.payrollService.selectedPaymentMethod.next(
                res.data.transferMode
              );
              this.verifyPaymentAccess(true);
              if (bankId) {
                this.isLoading = !!loading;
                this.removeAlerts();
                this.subscriptions.push(
                  this.bankService
                    .viewBankById(bankId)
                    .pipe(
                      finalize(() => {
                        this.isLoading = false;
                      }),
                      catchError((err) => {
                        this.dropdownLoading = false;
                        return throwError(() => err);
                      })
                    )
                    .subscribe((response) => {
                      this.dropdownLoading = false;
                      if (response.success) {
                        const bankBody: IBankDropdown = {
                          accountNumber: response.data.bankAccountNumber,
                          bankName: response.data.bankAccountName,
                          id: response.data.id,
                          nickName: response.data.bankAccountNickName
                        };
                        this.bankAccounts.push(bankBody);

                        this.selectedBankItem = this.convertIntoDropdownFormat(
                          response.data
                        );
                        this.payrollService.selectedBank = response.data;
                      }
                    })
                );
              } else {
                this.payrollService.selectedBank = undefined;
                this.selectedBankItem = undefined;
              }
            }
          })
      );
    }
  }

  /**
   * @description -Fetches bank accounts and updates component properties accordingly.
   */
  getBankAccounts() {
    this.subscriptions.push(
      this.bankService
        .getBankAccounts(1, undefined)
        .pipe(
          finalize(() => {
            this.isBankLoaded = true;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.bankAccounts = res.data;
            this.hasBank = !!this.bankAccounts.length;
          }
        })
    );
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description Method to open live chat
   */
  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * @description -Generates a payroll settings body based on the provided event and component properties.
   * @param event -Optional parameter representing an event.
   */
  generatePayrollSettingsBody(event?: IBankDropdown) {
    return {
      bankAccountId: event || this.selectedBankItem?.id || '',
      creditCardId: this.selectedCard?.cardId || '',
      processMethod: this.accountRefill === 0 ? 0 : (this.accountRefill ?? 2),
      manual: this.selectedApp.manual ? 1 : 0,
      amount: this.presetAmount || 0,
      syncStatus: this.isSync,
      transferMode: this.selectedPaymentMethod ?? 0
    };
  }

  /**
   * @description -Sets payroll settings based on the provided event or component properties.
   * @param event - Optional parameter representing an event.
   */
  setPayrollSettings(event?: IBankDropdown) {
    if (this.selectedPaymentMethod)
      this.payrollService.selectedPaymentMethod.next(
        this.selectedPaymentMethod
      );
    const payrollSettingsBody = this.generatePayrollSettingsBody(event);
    if (this.confirmMicroDeposit || this.verificationPending) {
      this.dropdownLoading = false;
      this.alertService.warningAlert({
        content: 'Bank account is not verified'
      });
      return;
    }
    this.subscriptions.push(
      this.payrollService
        .savePayrollSetttings(payrollSettingsBody, this.selectedApp.id)
        .pipe(
          catchError((err) => {
            this.dropdownLoading = false;
            if (err.error.errorCode === 555) {
              const warningRef = this.alertService.warningAlert({
                content: err.error.errorMsg
              });
              warningRef.afterClosed().subscribe((res) => {
                if (res) {
                  this.editBankModal();
                }
              });
            }
            return throwError(() => err);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (
              res?.update_wire_routing_number === 1 &&
              !this.payrollService.isWireRoutingSkipped()
            ) {
              const dialogRef = this.dialog.open(
                WireRoutingUpdateModalComponent,
                {
                  maxWidth: '550px',
                  width: '93%',
                  data: { bankAc: this.selectedBankItem },
                  disableClose: true
                }
              );
              dialogRef.afterClosed().subscribe((wireRoutingAdded) => {
                if (!wireRoutingAdded) {
                  this.payrollService.isWireRoutingSkipped.set(true);
                  this.payrollService.selectedPayrollBank.set(
                    this.selectedBankItem
                  );
                }
                if (res && this.isPayrollNotVerified()) {
                  this.openStatementVerification(
                    this.isPayrollNotVerifiedBankId(),
                    this.selectedApp.id ?? '',
                    this.selectedApp.manual
                  );
                  this.isPayrollNotVerified.set(false);
                }
                this.getSettings();
              });
            } else {
              this.payrollService.isWireRoutingSkipped.set(false);
              if (this.isPayrollNotVerified()) {
                this.openStatementVerification(
                  this.isPayrollNotVerifiedBankId(),
                  this.selectedApp.id ?? '',
                  this.selectedApp.manual
                );
                this.isPayrollNotVerified.set(false);
              }
              this.getSettings();
            }
          }
        })
    );
  }

  /**
   * Handles the payment type dropdown change event.
   * Verifies the selected payment type is allowed for the user.
   *
   * @param {IBankDropdown} event - The event containing the new selected value.
   * @returns {void}
   */
  onPaymentTypeChange(event?: IBankDropdown) {
    this.verifyPaymentAccess();
    if (this.payrollService.isSelectedPaymentDisabled) return;
    this.setPayrollSettings(event as IBankDropdown);
    this.paymentMethodChanged.set(this.selectedPaymentMethod as number);
  }

  changePaymentMethod(mothodId: number) {
    this.selectedMethodId.set(mothodId);
    this.isRtpAllowed.set(true);
    this.payrollService.selectedBank = {
      ...this.payrollService.selectedBank,
      isRtpAllowed: true
    } as IBankDropdown;
    if (mothodId === 12) {
      this.verifyRTPEligibility(
        String(this.payrollService.selectedBank?.routingNumber)
      );
    }
  }

  /**
   * Verifies whether the selected payment method is allowed for the current user.
   * If disabled, shows an alert unless explicitly disabled.
   *
   * @param {boolean} disableAlert - Indicates whether to disable the alert (default: false).
   * @returns {void}
   */
  verifyPaymentAccess(disableAlert: boolean = false) {
    const currPaymentMethod = this.paymentOptions.reduce(
      (prev, curr) => (curr.value === this.selectedPaymentMethod ? curr : prev),
      this.paymentOptions[0]
    );
    this.payrollService.isSelectedPaymentDisabled = false;
    if (this.payrollService.disableMethods.includes(currPaymentMethod.id)) {
      this.selectedPaymentMethod = null;
      setTimeout(() => {
        this.selectedPaymentMethod = 1; // ach
        this.payrollService.selectedPaymentMethod.next(
          this.selectedPaymentMethod
        );
      }, 600);
      if (disableAlert !== true) {
        const paymentMethod =
          currPaymentMethod.id === 'rtp' ? 'RTP' : currPaymentMethod.id;
        const data = {
          content: `The ${paymentMethod} transfer is disabled for this account. Please contact support team to activate it.`,
          isOk: true,
          isCancel: true,
          doneMsg: 'Contact Now',
          cancelMsg: 'Not Now'
        };
        const dialog = this.alertService.infoAlert(data);
        dialog.afterClosed().subscribe((res) => {
          if (res) {
            this.goToLiveChat();
          }
        });
      }
      this.payrollService.isSelectedPaymentDisabled = true;
    }
  }

  verifyInstantly() {
    this.dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data: { mode: 'verify_now', verifyNowAccountData: this.selectedBankItem },
      panelClass: 'yodlee-modal-new'
    });
  }

  /**
   * @description Opens a modal for editing bank account details.
   */
  editBankModal(): void {
    this.dialog.open(EditBankAccountModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: { id: this.selectedBankItem?.id }
    });
  }

  /**
   * @description - Handles the event when a bank account is selected or changed
   * @param event - - The event object containing the selected bank account.
   */
  set bankAccountChange(event: IBankDropdown) {
    if (this.selectedBankItem?.id === event?.id) return;
    this.selectedBankItem = event;
    this.payrollService.isWireRoutingSkipped.set(false);
    this.payrollStatus = this.selectedBankItem?.payrollVerified ?? 2;

    if (!event) {
      this.setPayrollSettings();
      return;
    }

    this.removeAlerts();

    const microDepositCondition =
      this.selectedBankItem.verifiedBy === 3 &&
      this.selectedBankItem.achApplicationStatus !== 1;
    const approvalPendingCondition =
      this.selectedBankItem.verifiedBy === 4 &&
      this.selectedBankItem.achApplicationStatus !== 1;
    const failedVerification =
      this.selectedBankItem?.verifiedBy === 12 &&
      this.selectedBankItem?.achApplicationStatus !== 1;
    const rejectedVerificationWithVerifyInstantly =
      this.selectedBankItem?.verifiedBy === 6 &&
      this.selectedBankItem?.achApplicationStatus !== 1;
    const rejectedVerification =
      this.selectedBankItem?.verifiedBy === 10 &&
      this.selectedBankItem?.achApplicationStatus !== 1;

    if (rejectedVerification) {
      this.rejectedVerification = true;
    } else if (rejectedVerificationWithVerifyInstantly) {
      this.rejectedVerificationWithVerifyInstantly = true;
    } else if (failedVerification) {
      this.failedVerification = true;
    } else if (approvalPendingCondition) {
      this.verificationPending = true;
    } else if (microDepositCondition) {
      this.confirmMicroDeposit = true;
    } else if (!this.selectedBankItem.verified) {
      this.notVerified = true;
      this.openBankVerify(event);
    } else if (this.selectedBankItem.verified) {
      this.bankVerfied = true;
      this.setPayrollSettings();

      if (this.selectedBankItem?.payrollVerified === 0) {
        this.isPayrollNotVerified.set(true);
        this.isPayrollNotVerifiedBankId.set(event.id);
      } else {
        this.isPayrollNotVerified.set(false);
      }
    }
    this.payrollService.selectedBank = this.selectedBankItem;
  }

  get bankAccountChange(): IBankDropdown | undefined {
    return this.selectedBankItem;
  }

  /**
   * Opening Statement Verifcation modal.
   * Should be opened for all accounts if the payrollVerified key is 0.
   * if the verification from the modal gets success, Setting the value here the component.
   */
  async openStatementVerification(
    bankAccountId: string,
    companyId: string,
    companyType: number
  ): Promise<void> {
    if (this.payrollStatus === 1) return;
    const data = {
      title: 'Error',
      content: 'The selected bank account is not payroll verified.',
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = await firstValueFrom(
      this.alertService.warningAlert(data).afterClosed()
    );
    if (res) {
      const dialgoRef = this.dialog.open(
        PayrollStatementVerificationComponent,
        {
          width: '500px',
          disableClose: true,
          data: {
            bankAccountId,
            companyId,
            companyType
          }
        }
      );

      dialgoRef.afterClosed().subscribe((val: { success: boolean }) => {
        if (val.success) {
          this.payrollStatus = 1;
          this.setPayrollSettings();
        }
      });
    }
  }

  removeAlerts() {
    this.payrollStatus = 2;
    this.notVerified = false;
    this.confirmMicroDeposit = false;
    this.verificationPending = false;
    this.failedVerification = false;
    this.rejectedVerificationWithVerifyInstantly = false;
    this.rejectedVerification = false;
  }

  /**
   * @description Micro deposit modal opens and after close it refresh the data table and fetch update latest changed data
   * @param val Selected bank details
   */
  microDeposit() {
    const dialog = this.dialog.open(ConfirmMicroDepositModalComponent, {
      maxWidth: '750px',
      width: '500px',
      data: { encrypted_bankacc_id: this.selectedBankItem?.id }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.confirmMicroDeposit = false;
        this.bankVerfied = true;
      }
    });
  }

  /**
   * @description Handles the event when a bank account input is cleared.
   */
  bankAccountCleared(): void {
    this.removeAlerts();
  }

  /**
   * @description -Checks the wire routing number for a bank account and performs actions based on the result.
   * @param bankAc - The bank account to check the wire routing number for.
   * @param wireRoutingNumber - The wire routing number to check (optional).
   */
  checkWireRoutingNumberAndSave(
    bankAc: IBankDropdown,
    wireRoutingNumber?: string
  ) {
    this.subscriptions.push(
      this.bankService
        .validateWireRoutingNumber({
          bankAccountId: bankAc.id,
          wireRoutingNumber
        })
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.setPayrollSettings();
            }
          },
          error: (err: HttpErrorResponse) => {
            this.dropdownLoading = false;
            if (err.error?.errorCode === 55) {
              this.dialog
                .open(WireRoutingnumberAddComponent, {
                  maxWidth: '510px',
                  width: '93%',
                  disableClose: true,
                  data: { bankAc }
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res.wireRoutingNumber) {
                    this.checkWireRoutingNumberAndSave(
                      bankAc,
                      res.wireRoutingNumber
                    );
                  }
                });
            }
          }
        })
    );
  }

  /**
   * @description - Handles the event when a Card is selected or changed
   * @param event - - The event object containing the selected Card details.
   */
  set cardChange(event: IExistingCreditCards) {
    if (event) {
      this.selectedCard = event;
      if (
        this.payrollService.selectedCardId?.cardId !== this.selectedCard.cardId
      ) {
        this.setPayrollSettings();
      }
      this.payrollService.selectedCardId = this.selectedCard;
    }
  }

  get cardChange(): IExistingCreditCards | undefined {
    return this.selectedCard;
  }

  /**
   * @description Opens a modal to verify bank account details.
   */
  openBankVerify(event?: IBankDropdown) {
    if (event) {
      this.verifyBankAccount(event.id);
    } else {
      this.openBankVerifyModal(this.selectedBankItem?.id);
    }
  }

  verifyBankAccount(bankAcId: string): void {
    const data = {
      title: 'Error',
      content: 'Please verify your bank account',
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = this.alertService.warningAlert(data);
    res.afterClosed().subscribe((alertRes) => {
      if (alertRes) {
        this.openBankVerifyModal(bankAcId);
      }
    });
  }
  /**
   * Opens a bank verification modal dialog to verify a bank account.
   *
   * @param {string} encrypted_bankacc_id - The encrypted identifier of the bank account.
   *
   * @description
   * This method opens a modal dialog to verify a bank account. The dialog may provide options
   * for instant verification or other actions based on the status of the selected bank account.
   *
   * @statusCodes
   * - verified_by 6: Rejected Requests
   * - verified_by 12: Confirm MD attempt Completed
   *
   * - achApplicationStatus:
   *   - 0: Pending
   *   - 1: Completed
   *   - 2: More document (GENERAL)
   *   - 3: Reject
   *   - 4: More document (VIP)
   *   - 5: Show all
   *   - 6: Ready to upload
   *   - 7: Partner approved
   *   - 8: Partner rejected
   */

  openBankVerifyModal(encrypted_bankacc_id: string) {
    const verifyInstantlyOnly =
      ((this.selectedBankItem as IBankDropdown).verifiedBy === 12 ||
        (this.selectedBankItem as IBankDropdown).verifiedBy === 6) &&
      (this.selectedBankItem as IBankDropdown).achApplicationStatus !== 1;
    if (verifyInstantlyOnly) {
      this.alertService.infoAlert({
        content:
          'Bank verification is temporarily unavailable. Please try again later.'
      });
    } else {
      const ref = this.dialog.open(BankVerifyModalComponent, {
        maxWidth: '500px',
        width: '95%',
        data: {
          encrypted_bankacc_id,
          openInstantVerificationOnly: verifyInstantlyOnly
        },
        disableClose: true
      });
      ref.afterClosed().subscribe((res) => {
        if (res) {
          if (res.success) {
            this.notVerified = false;
            this.verificationPending = true;
          } else {
            this.notVerified = true;
            this.verificationPending = false;
          }
        }
      });
    }
  }

  /**
   * @description Opens modal dialog for adding new bank account. Emits `newBankAccountAdded` event, on success.
   */
  addNewBankAccount() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankOptimizedModal()
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscriptions.push(
              bankModal.afterClosed().subscribe((result) => {
                if (result?.success) {
                  const bankDetails = this.convertIntoDropdownFormat(
                    result?.bankAcData as IBankCreateRes
                  );
                  this.bankAccounts.push(bankDetails);
                  this.selectedBankItem = bankDetails.id;
                }
              })
            );
          }
        })
    );
  }

  openAddPayrollModal() {
    if (this.localStorageService.getItem('isCreditCardPaymentEnabled') === 0) {
      this.dialog.open(MaintenanceAlertModalComponent, {
        panelClass: 'plaid-modal',
        width: 'fit-content',
        data: {
          content: this.creditCardMaintenanceMessage
        }
      });
      return;
    }

    if (this.kycCompleted === 3) {
      this.alertService.warningAlert({
        content: 'Your KYC verification has been rejected'
      });
      return;
    }

    this.dialog.open(AddPayrollModalComponent, {
      maxWidth: '450px',
      width: '93%',
      data: {
        appId: this.selectedApp.id
      },
      disableClose: true
    });
  }

  getUserData(): void {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (res.email_verified === 0 || res.phone_verified === 0) {
          const ref = this.alertService.warningAlert({
            content: this.verificationMessageService.getVerificationMessage(res),
            doneMsg: 'Verify Now',
            isCancel: true,
            cancelMsg: 'Not Now'
          });
          ref.afterClosed().subscribe((result) => {
            if (result) {
              this.router.navigate(['/manage/users/verify-email-phone'], {
                queryParams: { returnUrl: '/manage/payroll-card/index' }
              });
            }
          });
          return;
        }
        this.openPersonaVerificationModal();
      })
    );
  }

  openPersonaVerificationModal() {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal(
          this.kycCompleted === null || this.kycCompleted === undefined
            ? 'kyc'
            : 'kyb',
          CVSourceType.other
        )
        .subscribe((res) => {
          if (res?.data.inquiry_type === 'kyb') {
            this.router.navigateByUrl('/manage/home');
          }
        });
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
    }
  }

  /**
   * @description - Converts data from a bank account or bank create response into a dropdown format.
   * @param data -- The data to convert.
   * @returns -The data in the dropdown format.
   */
  convertIntoDropdownFormat(
    data: IBankCreateRes | IBankAccountEditDetails
  ): IBankDropdown {
    return {
      accountNumber: `xxxx${data.bankAccountNumber.slice(-4)}`,
      achApplicationStatus: 0,
      bankName: data.bankAccountName,
      cashAccount: 0,
      id: data.id,
      isItZil: 0,
      mAch: 0,
      name: '',
      nickName: data.bankAccountNickName,
      status: '',
      statusDescription: '',
      verified: data.bankAccountVerified ? 1 : 0,
      verifiedBy: '',
      payrollVerified: (data as IBankAccountEditDetails)?.payrollVerified ?? 0
    };
  }

  /**
   * @description -Opens a process method modal and updates payroll settings based on the modal result.
   *
   */
  openProcessMethodModal() {
    const dialogRef = this.dialog.open(ProcessMethodeModalComponent, {
      // open modal
      maxWidth: '363px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: {
        accountRefill: this.accountRefill,
        presetAmount: this.presetAmount
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.accountRefill = result.accountRefill;
      this.presetAmount = result.presetAmount;
      this.setPayrollSettings();
    });
  }

  /**
   * @description Gets the list of existing cards and sets the data into `this.cardList`.
   * Also sets the selected card.
   * @param selectedId - card ID of selected card.
   */
  getCards() {
    this.subscriptions.push(
      this.cyberSourceService
        .getExistingCards()
        .pipe(
          finalize(() => {
            this.isCardsLoaded = true;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.cardData = res.data;
            this.hasCreditCard = !!this.cardData.length;
          }
        })
    );
  }

  /**
   * @description Toggle tabs 'account' and 'info'
   */
  toggleAccountDetails(status: boolean) {
    this.isAccountDetails = status;
    if (status) this.getSettings(true);
  }

  /**
   * @description - Opens a modal to add a new credit card and processes the result.
   */
  addCard() {
    const verificationDetails =
      this.localStorageService.getItem('gettingStartedData');
    if (verificationDetails?.verification === 0) {
      this.verifyEmailAndMobile();
      return;
    }
    if (this.openAddCardService.isLoading()) return;
    const sub = this.openAddCardService.openAddCard().subscribe((cardModal) => {
      if (cardModal) {
        cardModal.afterClosed().subscribe((val) => {
          if (val && val.success) {
            this.getCards();
            this.alertService.successAlert({ content: val.data.message });
            this.selectedCard = val.data?.metaData;
          } else if (val?.cardCreated) {
            // Backed out of "Confirm Card": the card exists (unconfirmed).
            this.getCards();
          }
        });
      }
    });

    this.subscriptions.push(sub);
  }

  verifyEmailAndMobile() {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: 'manage/payroll-card/index'
          }
        });
      }
    });
  }

  /**
   * @description To add new bank account
   */
  addbankAc() {
    this.router.navigate([`/manage/users/add-bank-account`], {
      queryParams: { returnUrl: '/manage/payroll-card/index' }
    });
  }

  /**
   * @description -Initiates the synchronization of payroll data with the selected app.
   */
  syncData() {
    this.isSyncing = true;
    if (this.selectedApp.name.match(/gusto/gi) && this.selectedApp.companyId) {
      this.subscriptions.push(
        this.payrollService
          .importPayrollData(this.selectedApp.companyId ?? '')
          .pipe(
            finalize(() => {
              this.isSyncing = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.dataTableService.refreshV3DataTable();
              this.alertService.successAlert({ content: res.message });
            }
          })
      );
      return;
    }
    if (
      this.selectedApp.name.match(/zoho payroll/gi) &&
      this.selectedApp.bypassed === 1
    ) {
      this.subscriptions.push(
        this.payrollService
          .importZohoPayrollData(this.selectedApp.companyId ?? '')
          .pipe(
            finalize(() => {
              this.isSyncing = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.dataTableService.refreshV3DataTable();
              this.alertService.successAlert({ content: res.message });
            }
          })
      );
      return;
    }

    this.subscriptions.push(
      this.payrollService
        .syncPayrollData(this.selectedApp.id)
        .pipe(
          finalize(() => {
            this.isSyncing = false;
          })
        )
        .subscribe((res) => {
          if (res.message) {
            this.dataTableService.refreshV3DataTable();
            this.alertService.successAlert({ content: 'Synced successfully' });
            this.getSettings();
          }
        })
    );
  }

  /**
   * Method to get search result from payroll list.
   */
  isSearchResult() {
    this.subscriptions.push(
      this.payrollService.isNoSearchResult.subscribe((res) => {
        if (res === true) {
          this.noSearchResult = true;
        } else {
          this.noSearchResult = false;
        }
      })
    );
  }

  getChromeExtensionKey(mode: 'get' | 'generate') {
    this.isGenerate = true;
    this.extensionMode = mode;
    const payload = {
      companyId: this.selectedApp.id as string,
      manual: this.isManual ? 1 : 0
    };
    this.subscriptions.push(
      this.payrollService
        .chromeExtensionKey(payload, mode)
        .pipe(
          finalize(() => {
            this.isGenerate = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.generatedKey = res.data;
          }
        })
    );
  }

  copyKey(generatedKey: string) {
    if (generatedKey) {
      navigator.clipboard
        .writeText(generatedKey)
        .then(() => {
          this.tooltip.message = 'Copied!';
          this.tooltip.show();
          setTimeout(() => {
            this.tooltip.message = 'Copy Key';
            this.tooltip.hide();
          }, 2000);
        })
        .catch(() => {});
    }
  }

  changeBankAccount(bank: IBankDropdown) {
    if (!bank) return;
    this.isRtpAllowed.set(true);
    this.payrollService.selectedBank = {
      ...this.payrollService.selectedBank,
      isRtpAllowed: true
    } as IBankDropdown;
    if (this.selectedBankId !== bank?.id && this.selectedPaymentMethod === 12) {
      this.selectedBankId = bank?.id;
      this.verifyRTPEligibility(String(bank?.routingNumber));
    }
  }

  verifyRTPEligibility(routingNumber: string) {
    this.subscriptions.push(
      this.paymentsService.rtpStatusCheck(routingNumber).subscribe((res) => {
        if (res.success) {
          this.isRtpAllowed.set(res.data.is_rtp_allowed);
          this.payrollService.selectedBank = {
            ...this.payrollService.selectedBank,
            isRtpAllowed: res.data.is_rtp_allowed
          } as IBankDropdown;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.showExtension.set(false);
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
