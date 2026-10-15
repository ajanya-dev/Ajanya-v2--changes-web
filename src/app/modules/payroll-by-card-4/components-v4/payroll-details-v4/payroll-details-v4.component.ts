import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild
} from '@angular/core';
import {
  Subscription,
  catchError,
  finalize,
  firstValueFrom,
  take,
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
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { LucideAngularModule } from 'lucide-angular';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PaymentData } from 'src/app/modules/payments/shared/components/payments-main-v35/payments-data-v35';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Store } from '@ngrx/store';
import { selectCards } from 'src/app/modules/store/cards/cards.selectors';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { environment } from 'src/environments/environment';
import { OpenAddCardV4Service } from 'src/app/shared/service/open-add-card/open-add-card-v4.service';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { AddBankMethodChoiceModalComponent } from 'src/app/modules/bank/bank-v4/v4-modals/add-bank-method-choice-modal/add-bank-method-choice-modal.component';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { MaintenanceAlertModalV4Component } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-alert-modal-v4.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { InfoTooltipV4Directive } from 'src/app/shared/V4/info-tooltip-v4/info-tooltip-v4.directive';
import { IInfoTooltipV4Content } from 'src/app/shared/V4/info-tooltip-v4/info-tooltip-v4.model';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { ConfirmMicroDepositModalV4Component } from 'src/app/modules/user/user-v4/modals/confirm-micro-deposit-modal-v4/confirm-micro-deposit-modal-v4.component';
import { WireRoutingUpdateModalV4Component } from '../../modal/wire-routing-update-modal-v4/wire-routing-update-modal-v4.component';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { BankAcDropdownV4Component } from '../../../../shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CardsDropdownV4Component } from '../../../../shared/components/v4/dropdowns/cards-dropdown-v4/cards-dropdown-v4.component';
import { PayrollTransactionsTableV4Component } from '../../components/payroll-transactions-table-v4/payroll-transactions-table-v4.component';
import { PayrollDataTableV4Component } from '../../components/payroll-data-table-v4/payroll-data-table-v4.component';
import { PayrollStatementVerificationV4Component } from '../../components/payroll-statement-verification-v4/payroll-statement-verification-v4.component';
import { ProcessMethodeModalV4Component } from '../../components/process-methode-modal-v4/process-methode-modal-v4.component';
import { AddPayrollModalV4Component } from '../../components/add-payroll-modal-v4/add-payroll-modal-v4.component';
// import { WireRoutingUpdateModalV4Component } from '../../modal/wire-routing-update-modal-v4/wire-routing-update-modal-v4.component';

interface IpaymentMethod {
  name: string;
  icon: string;
  value: number;
  id: string;
  description: string;
  disabled?: boolean;
  tooltip?: string;
}

@Component({
  selector: 'app-payroll-details-v4',
  templateUrl: './payroll-details-v4.component.html',
  styleUrls: ['./payroll-details-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    FormsModule,
    LucideAngularModule,
    MatTooltip,
    CardsDropdownV4Component,
    NgSelectModule,
    V4CommonDropDownSelectorComponent,
    PayrollTransactionsTableV4Component,
    PayrollDataTableV4Component,
    NgOptimizedImage,
    CommonTabV4Component,
    InfoTooltipV4Directive
  ]
})
export class PayrollDetailsV4Component implements OnInit, OnDestroy {
  private payrollService = inject(PayrollService);
  private bankService = inject(BankAccountsService);
  private cyberSourceService = inject(CybersourceService);
  private dialog = inject(MatDialog);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private router = inject(Router);
  private scriptService = inject(ScriptService);
  public alertService = inject(V4AlertService);
  private dataTableService = inject(V3DataTableService);
  private paymentsService = inject(PaymentsService);
  private store = inject(Store);
  private gettingStartedService = inject(GettingStartedService);
  private personaHelperService = inject(PersonaHelperService);
  private headerService = inject(HeaderService);
  protected openAddCardService = inject(OpenAddCardV4Service);
  private activatedRoute = inject(ActivatedRoute);
  private bankModalService = inject(BankModalService);
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);
  private customDoubleSideModalService = inject(CustomDoubleSideModalService);
  private userProfileService = inject(UserProfileService);

  bankDropDown = viewChild(BankAcDropdownV4Component);
  cardDropDown = viewChild<CardsDropdownV4Component>('cardDropDown');
  tooltip = viewChild<MatTooltip>('tooltip');

  readonly creditCardTooltip: IInfoTooltipV4Content = {
    bullets: [
      'Choose your saved credit card.',
      "Select 'Add New Card' to add different card."
    ]
  };

  readonly paymentMethodTooltip: IInfoTooltipV4Content = {
    title: 'How funds reach your bank',
    description:
      "We deposit into the account and your provider draws from — it doesn't pay employees directly.",
    rows: [
      { label: 'ACH', value: '1-3 business days.' },
      { label: 'Wire', value: 'Same day' },
      { label: 'RTP', value: 'Coming soon' }
    ],
    note: {
      icon: 'clock',
      lines: [
        'Must settle before your provider withdraws. Payday under 3 days? Use Wire.'
      ]
    }
  };

  paymentOptions: IpaymentMethod[] = [
    {
      name: 'WIRE',
      icon: 'globe',
      value: 6,
      id: 'wire',
      description: '0-1 business day.'
    },
    {
      name: 'ACH',
      icon: 'bank',
      value: 1,
      id: 'ach',
      description: '4-6 business days.'
    },
    {
      name: 'Real Time Instant Payment (RTP)',
      icon: 'circle-dollar',
      value: 12,
      id: 'rtp',
      description: 'Instant settlement.',
      disabled: true,
      tooltip: 'Real-time payments are coming soon'
    }
  ];

  paymentMethodDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Payment Method',
    displayField: 'name',
    outputField: 'stringValue',
    iconField: 'iconProp',
    displaySubField: 'description',
    subTextPosition: 'below',
    tooltipField: 'tooltip',
    commons: {
      iconColor: {
        background: 'v4-badge-info-bg-color' as any,
        text: 'v4-primary-brand-color' as any
      }
    },
    style: {
      size: 0
    }
  };

  paymentMethodListData = this.paymentOptions.map((opt) => ({
    ...opt,
    stringValue: String(opt.value),
    iconProp: ['fas', opt.icon] as [string, string]
  }));

  isAccountDetails = true;
  activePayrollTab = 'details';
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
  selectedPaymentMethod: null | string = null;
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
  isGenerate = false;
  generatedKey: string | undefined;
  extensionMode = 'get';
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
    this.listenAddNewCard();
  }

  getGatewayType() {
    this.payrollService.gatewayTypeChanged
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((gatewayType) => {
        this.gatewayType = gatewayType;
      });
    this.clearSelectedCard();
  }

  /**
   * @description Selects the duplicate card broadcast by the trans-limit 824
   * fail flow (confirm-payroll modal) so the user does not re-add it manually.
   */
  getDuplicateCard() {
    this.payrollService.showDuplicateCard
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((card) => {
        if (card) {
          this.cardDropDown()?.populateDuplicateCard(card);
        }
      });
  }

  /**
   * @description Opens the add-card flow requested by the confirm-payroll modal
   * after a gateway verification prompt: prefilled verify flow when an existing
   * card is provided, plain add-card constrained to the broadcast gateway type
   * otherwise. `gatewayTypeChanged` always fires first, so `gatewayType` is set.
   */
  listenAddNewCard() {
    this.payrollService.addNewCard
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((card) => {
        if (card?.cardId && this.gatewayType !== undefined) {
          this.cardDropDown()?.addCardWithPrefill(card, this.gatewayType);
        } else {
          this.cardDropDown()?.addNewCard(this.gatewayType, true);
        }
      });
  }

  clearSelectedCard() {
    this.payrollService.resetPayrollDetails
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe(() => {
        this.selectedCard = undefined;
        this.payrollService.selectedCardId = undefined;
        this.cardDropDown()?.clearSelection();
        if (!this.gatewayType) {
          this.getCards();
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
    if (this.selectedApp?.id !== payrollData.id) {
      // The transfer mode on hand belongs to the previous company. Clear it so
      // the payroll table waits for this company's settings instead of
      // refreshing against the previous company's payload.
      this.paymentMethodChanged.set(undefined);
    }
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
              this.selectedPaymentMethod = String(res.data.transferMode);
              this.payrollService.selectedPaymentMethod.next(
                res.data.transferMode
              );
              this.paymentMethodChanged.set(Number(res.data.transferMode));
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
      transferMode: Number(this.selectedPaymentMethod) || 0
    };
  }

  /**
   * @description -Sets payroll settings based on the provided event or component properties.
   * @param event - Optional parameter representing an event.
   */
  setPayrollSettings(event?: IBankDropdown) {
    if (this.selectedPaymentMethod)
      this.payrollService.selectedPaymentMethod.next(
        Number(this.selectedPaymentMethod)
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
              warningRef.afterClosed().subscribe(() => {});
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
                WireRoutingUpdateModalV4Component,
                {
                  maxWidth: '550px',
                  width: '93%',
                  data: { bankAc: this.selectedBankItem },
                  disableClose: true,
                  panelClass: 'paddingless-modal-rounded'
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
    this.paymentMethodChanged.set(Number(this.selectedPaymentMethod));
  }

  onPaymentMethodDropdownChange(value: string) {
    this.selectedPaymentMethod = value;
    this.changePaymentMethod(Number(value));
    this.onPaymentTypeChange();
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
      (prev, curr) =>
        String(curr.value) === this.selectedPaymentMethod ? curr : prev,
      this.paymentOptions[0]
    );
    this.payrollService.isSelectedPaymentDisabled = false;
    if (this.payrollService.disableMethods.includes(currPaymentMethod.id)) {
      this.selectedPaymentMethod = null;
      setTimeout(() => {
        this.selectedPaymentMethod = '1'; // ach
        this.payrollService.selectedPaymentMethod.next(
          Number(this.selectedPaymentMethod)
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
      this.payrollService.selectedBank = undefined;
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
        PayrollStatementVerificationV4Component,
        {
          width: '500px',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
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
    const dialog = this.dialog.open(ConfirmMicroDepositModalV4Component, {
      maxWidth: '750px',
      width: '500px',
      data: { bankAccountId: this.selectedBankItem?.id },
      panelClass: 'paddingless-modal-rounded'
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
                .open(WireRoutingUpdateModalV4Component, {
                  maxWidth: '510px',
                  width: '93%',
                  disableClose: true,
                  data: { bankAc }
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res?.wireRoutingNumber) {
                    this.setPayrollSettings();
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
        this.payrollService.selectedCardId = this.selectedCard;
      }
    } else {
      this.selectedCard = undefined;
      this.payrollService.selectedCardId = undefined;
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
      this.verifyBankAccount(event.id, event);
    } else {
      this.openBankVerifyModal(
        this.selectedBankItem?.id,
        this.selectedBankItem
      );
    }
  }

  verifyBankAccount(bankAcId: string, bank?: IBankDropdown): void {
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
        this.openBankVerifyModal(bankAcId, bank);
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

  openBankVerifyModal(bankId: string, bank?: IBankDropdown) {
    const loadedBank =
      bank ?? this.bankAccounts?.find((item) => item.id === bankId);

    const ref = this.dialog.open(BankVerificationModalV4Component, {
      panelClass: 'paddingless-modal-rounded',
      width: '448px',
      maxWidth: '95vw',
      data: {
        bankId,
        bankDetails: loadedBank
          ? { verifiedBy: loadedBank.verifiedBy, country: loadedBank.country }
          : undefined
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

  /**
   * @description Opens modal dialog for adding new bank account. Emits `newBankAccountAdded` event, on success.
   */
  addNewBankAccount() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBankV4Modal().subscribe((bankModal) => {
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
      this.dialog.open(MaintenanceAlertModalV4Component, {
        panelClass: 'paddingless-modal-rounded',
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

    this.dialog.open(AddPayrollModalV4Component, {
      maxWidth: '520px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        appId: this.selectedApp.id
      },
      disableClose: true
    });
  }

  /**
   * Checks email/phone verification status before proceeding.
   * Calls the API directly to get the latest verification status.
   * If not verified, prompts the user to verify first.
   * If already verified, opens the Persona KYC/KYB verification modal.
   */
  getUserData(): void {
    this.subscriptions.push(
      this.userProfileService.checkEmailAndPhoneVerified().subscribe((res) => {
        const { data } = res as {
          data: { email_verified: number; phone_verified: number };
        };
        if (data.email_verified === 0 || data.phone_verified === 0) {
          const ref = this.alertService.warningAlert({
            content:
              this.verificationMessageService.getVerificationMessage(data),
            doneMsg: 'Verify Now',
            isCancel: true,
            cancelMsg: 'Not Now'
          });
          ref.afterClosed().subscribe((result) => {
            if (result) {
              this.router.navigate(['/v4/manage/verification/index'], {
                queryParams: { returnUrl: '/v4/manage/payroll-card/index' }
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
    const dialogRef = this.dialog.open(ProcessMethodeModalV4Component, {
      maxWidth: '363px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
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
   * @description Refreshes all dropdowns after a card is mapped to a business.
   */
  onCardMapped() {
    this.getBankAccounts();
    this.getCards();
    this.getSettings(true);
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
        this.router.navigate(['/v4/manage/verification/index'], {
          queryParams: {
            returnUrl: 'manage/payroll-card/index'
          }
        });
      }
    });
  }

  /**
   * @description To add new bank account.
   * Listens to headerService.refreshDynamicHeader (triggered by both Plaid and Manual
   * flows after bank is added) to refresh the bank list and auto-select the new bank.
   */
  addbankAc() {
    const previousCount = this.bankAccounts.length;
    this.customDoubleSideModalService.open(AddBankMethodChoiceModalComponent, {
      width: '480px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
    // Listen for the header refresh signal that fires after bank is added
    this.subscriptions.push(
      this.headerService.refreshDynamicHeader.pipe(take(1)).subscribe(() => {
        this.subscriptions.push(
          this.bankService.getBankAccounts(1, undefined).subscribe((res) => {
            if (res?.success) {
              this.bankAccounts = res.data;
              this.hasBank = !!this.bankAccounts.length;
              // Auto-select the newly added bank
              if (this.bankAccounts.length > previousCount) {
                const newBank = this.bankAccounts[this.bankAccounts.length - 1];
                setTimeout(() => {
                  this.bankDropDown()?.setItemWithId?.(newBank.id);
                }, 300);
              }
            }
          })
        );
      })
    );
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
          const tip = this.tooltip();
          if (tip) {
            tip.message = 'Copied!';
            tip.show();
            setTimeout(() => {
              tip.message = 'Copy Key';
              tip.hide();
            }, 2000);
          }
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
    if (
      this.selectedBankId !== bank?.id &&
      this.selectedPaymentMethod === '12'
    ) {
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
