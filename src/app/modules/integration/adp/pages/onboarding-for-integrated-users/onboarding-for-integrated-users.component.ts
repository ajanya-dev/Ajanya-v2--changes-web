import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { ScriptService } from 'src/app/core/services/script.service';
import { IWarningAlert } from 'src/app/models/alert';
import {
  IADPSetupRequest,
} from 'src/app/modules/integration/model/integration';
import { IUserVerification } from 'src/app/models/user';
import { ConfirmMicroDepositModalComponent } from 'src/app/modules/bank/bank-v2/modals/confirm-micro-deposit-modal/confirm-micro-deposit-modal.component';
import { CreateBankOptionsModalComponent } from 'src/app/modules/bank/bank-v2/modals/create-bank-options-modal/create-bank-options-modal.component';
import { VerifyEmailPhoneComponent } from 'src/app/modules/user/user-v2/pages/verify-email-phone/verify-email-phone.component';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { environment } from 'src/environments/environment';
import { AdpPayrollRefillMethodComponent } from '../../components/adp-payroll-refill-method/adp-payroll-refill-method.component';
import { EditBankAccountModalComponent } from 'src/app/modules/bank/bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { WireRoutingnumberAddComponent } from 'src/app/shared/bank-modal/modals/wire-routingnumber-add/wire-routingnumber-add.component';
import { IBankDropdown } from 'src/app/models/bank';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { MatTooltip } from '@angular/material/tooltip';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { NgIf, NgClass } from '@angular/common';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';

/**
 * Interface representing the state of the Getting Started process for ADP onboarding
 */
interface IGettingStartedADP {
  phoneVerification: IGettingStartedADPItem;
  creditCard: IGettingStartedADPItem;
  bankAc: IGettingStartedADPItem;
  verifyBankAc: IGettingStartedADPItem;
  payrollProcess: IGettingStartedADPItem;
}

/**
 * Interface representing an item in the Getting Started process for ADP onboarding
 */

interface IGettingStartedADPItem {
  status: 'start' | 'done' | 'pending' | 'confirmMicroDeposit';
  enable: boolean;
  hide: boolean;
}

@Component({
  selector: 'app-onboarding-for-integrated-users',
  templateUrl: './onboarding-for-integrated-users.component.html',
  styleUrls: ['./onboarding-for-integrated-users.component.scss'],
  standalone: true,
  imports: [NgIf, DemoVideoComponent, NgClass, MatTooltip]
})
export class OnboardingForIntegratedUsersComponent
  implements OnInit, OnDestroy
{
  private _dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private openAddCardService = inject(OpenAddCardService);
  private bankModalService = inject(BankModalService);

  environment = environment;
  onlyZilBank = false;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  page = 0;
  loadingSave: boolean;
  loading: boolean;
  companyId: string | undefined;
  automationMethod: number;
  presetAmount: string | number | undefined;
  selectedCardId: string | undefined;
  selectedBankAcId: string | undefined;

  companyList: string;
  firstName = '';
  companyName: string | null = '';
  dataLoadingState = 0;

  phoneAndEmailData: IUserVerification;
  isPhoneAndEmailDataVerified = false;

  gettingStartedState = 'Verify Your Email';
  gettingStartedProgress: number;
  isGettingStartedEnabled = false;
  clickEventSubscription: Subscription;

  disabledButton = true;
  isDarkMode: boolean;

  subscriptions: Subscription[] = [];
  enableAchButton = false;

  gettingStartedADP: IGettingStartedADP = {
    phoneVerification: {
      status: 'start',
      enable: true,
      hide: false
    },
    creditCard: {
      status: 'start',
      enable: false,
      hide: false
    },
    bankAc: {
      status: 'start',
      enable: false,
      hide: false
    },
    verifyBankAc: {
      status: 'start',
      enable: false,
      hide: true
    },
    payrollProcess: {
      status: 'start',
      enable: false,
      hide: false
    }
  };
  force: string | null;

  constructor(
    public gettingStartedService: GettingStartedService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _userProfileService: UserProfileService,
    private _themeService: ThemeService,
    private _headerService: HeaderService,
    private matDialogue: MatDialog,
    private alertService: AlertService,
    private adpService: AdpService,
    private _bankService: BankAccountsService,
    private scriptService: ScriptService,
    private _localStorageService: LocalStorageService,
  ) {
    this.getDarkModeStatus();
    this.force = this._route.snapshot.queryParamMap.get('force');
  }

  /**
   * Lifecycle hook: Called when the component is initialized.
   * Performs initial setup for the Getting Started process.
   */
  ngOnInit() {
    this.setupGettingStarted();
    this.getCompanyNmae();
    this.getFristName();
    this.scriptService.addADPZohoSrcipt();
  }

  /**
   * Setup the Getting Started process, including fetching data and determining the status of each step.
   */
  setupGettingStarted() {
    this.loading = true;

    this.subscriptions.push(
      forkJoin([
        this.adpService.listCompanies(),
        this.gettingStartedService.getGettingStartedDataApi()
      ]).subscribe(
        ([companyListResp, gettingStartedResp]) => {
          this.loading = false;

          if (companyListResp?.data?.length > 0) {
            if (companyListResp.data[0].isOnboarded == 1 && !this.force) {
              this._router.navigate(['/manage/thirdparty_app/adp/adp-view']);
            }
            this.companyId = companyListResp.data[0].id;
            this.selectedCardId = companyListResp.data[0].cardId;
            this.selectedBankAcId = companyListResp.data[0].bankAccountId;
            this.automationMethod = companyListResp.data[0].method;
            this.presetAmount =
              this.automationMethod == 2
                ? companyListResp.data[0].automateAmount
                : '';
          } else {
            this.alertService.warningAlert({
              content: 'No ADP Companies Connected'
            });
            return;
          }

          if (gettingStartedResp.data?.adp) {
            const adpGettingStartedData = gettingStartedResp.data?.adp;

            (this.gettingStartedADP.phoneVerification.status =
              adpGettingStartedData.isPhoneVerified == 1 ? 'done' : 'start'),
              (this.gettingStartedADP.creditCard = {
                status:
                  adpGettingStartedData.isCardAdded && this.selectedCardId
                    ? 'done'
                    : 'start',
                enable:
                  this.gettingStartedADP.phoneVerification.status == 'done',
                hide: false
              });

            this.gettingStartedADP.bankAc = {
              status: this.selectedBankAcId ? 'done' : 'start',
              enable: this.gettingStartedADP.phoneVerification.status == 'done',
              hide: false
            };

            let verifyBankAcStatus:
              | 'start'
              | 'done'
              | 'pending'
              | 'confirmMicroDeposit' = 'start';
            switch (adpGettingStartedData.verifyBankAcStatus) {
              case 1:
                verifyBankAcStatus = 'pending';
                break;
              case 2:
                verifyBankAcStatus = 'confirmMicroDeposit';
                break;
              case 3:
                verifyBankAcStatus = 'done';
                break;
            }

            this.gettingStartedADP.verifyBankAc = {
              status: verifyBankAcStatus,
              enable: this.gettingStartedADP.bankAc.status == 'done',
              hide: !(
                this.gettingStartedADP.bankAc.status === 'done' &&
                verifyBankAcStatus !== 'done'
              )
            };

            this.gettingStartedADP.payrollProcess = {
              status: this.automationMethod ? 'done' : 'start',
              enable:
                this.gettingStartedADP.phoneVerification.status == 'done' &&
                this.gettingStartedADP.creditCard.status == 'done' &&
                this.gettingStartedADP.verifyBankAc.status == 'done',
              hide: false
            };
          }
        },
        () => {
          this.loading = false;
          this.alertService.warningAlert({ content: 'Something Went Wrong' });
        }
      )
    );
    this._bankService.bancAcEvents.subscribe((res) => {
      if (res?.message == 'Bank Account Created') {
        if (res.bankAcs?.length > 0) {
          this.checkWireRoutingNumberAndSave(res.bankAcs[0]);
        }
      } else if (
        res?.message == 'MD Request' &&
        this.selectedBankAcId == res?.bankAcId
      ) {
        this.gettingStartedADP.verifyBankAc.status = 'confirmMicroDeposit';
        this.enableDisableBtns();
        this.saveSetup();
      } else if (
        res?.message == 'Bank Account Verified' &&
        this.selectedBankAcId == res?.bankAcId
      ) {
        this.gettingStartedADP.verifyBankAc.status = 'done';
        this.enableDisableBtns();
        this.saveSetup();
      } else if (res?.message == 'Add Bank Manually Clicked Yodlee') {
        this.openBankModal();
      }
    });
  }

  /**
   * Check wire routing number and save the bank account.
   * @param bankAc - The bank account details.
   * @param wireRoutingNumber - Optional wire routing number.
   */
  checkWireRoutingNumberAndSave(
    bankAc: IBankDropdown,
    wireRoutingNumber?: string
  ) {
    this.subscriptions.push(
      this._bankService
        .validateWireRoutingNumber({
          bankAccountId: bankAc.id,
          wireRoutingNumber: wireRoutingNumber
        })
        .subscribe(
          (res) => {
            if (res.success) {
              this.saveYodleeBank(bankAc.id);
            }
          },
          (err: HttpErrorResponse) => {
            if (err.error?.errorCode === 55) {
              this.matDialogue
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
        )
    );
  }

  /**
   * Save the Yodlee bank account.
   * @param bankAcId - The bank account ID.
   */
  saveYodleeBank(bankAcId: string) {
    this.selectedBankAcId = bankAcId;
    this.gettingStartedADP.verifyBankAc.status = 'done';
    this.gettingStartedADP.bankAc.status = 'done';
    this.saveSetup();
    this.enableDisableBtns();
  }

  /**
   * Enable or disable buttons based on the status of the Getting Started steps.
   */
  enableDisableBtns() {
    this.gettingStartedADP.creditCard.enable =
      this.gettingStartedADP.phoneVerification.status == 'done';
    this.gettingStartedADP.bankAc.enable =
      this.gettingStartedADP.phoneVerification.status == 'done';
    this.gettingStartedADP.verifyBankAc.enable =
      this.gettingStartedADP.bankAc.status == 'done';
    this.gettingStartedADP.payrollProcess.enable =
      this.gettingStartedADP.phoneVerification.status == 'done' &&
      this.gettingStartedADP.creditCard.status == 'done' &&
      this.gettingStartedADP.verifyBankAc.status == 'done';
  }

  /**
   * Get the dark mode status.
   */
  getDarkModeStatus() {
    if (this.isDarkMode === undefined) {
      this.isDarkMode = this._themeService.getInitialColourTheme();
    }
    this.clickEventSubscription = this._themeService
      .getThemeSwitch()
      .subscribe((res) => {
        this.isDarkMode = res;
      });
  }

  /**
   * Get the company name.
   */
  getCompanyNmae() {
    this.subscriptions.push(
      this._headerService.getHeaderLoaded().subscribe((res) => {
        if (res) {
          this.companyName = this._localStorageService.getItem('companyName');
        }
      })
    );
  }

  /**
   * Get the first name of the user.
   */
  getFristName() {
    if (!this._localStorageService.getItem('displayName')) {
      this.subscriptions.push(
        this._userProfileService.getPersonalInfo().subscribe((res) => {
          this.firstName = res.data.nickName
            ? res.data.nickName
            : res.data.name;
        })
      );
    } else {
      this.firstName = (
        this._localStorageService.getItem('displayName') || ''
      ).toUpperCase();
    }
  }

  /**
   * Open the live chat.
   */
  goToLiveChat(): void {
    this._dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * Open the modal for creating a bank account.
   */
  createBankAccountModal() {
    this.matDialogue.open(CreateBankOptionsModalComponent, {
      maxWidth: '550px',
      width: '100%',
      disableClose: true
    });
  }

  /**
   * Show a warning alert modal.
   * @param _data - Data for the warning alert.
   */
  warningAlert(_data?: IWarningAlert) {
    this.matDialogue.open(WarningAlertComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'ocw_alert_wrapper'
    });
  }

  /**
   * Initiate phone verification.
   */
  phoneVerification() {
    this.matDialogue
      .open(VerifyEmailPhoneComponent, {
        maxWidth: '600px',
        width: '93%',
        minHeight: '200px',
        panelClass: 'custom-dialog-container',
        data: {}
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.gettingStartedADP.phoneVerification.status = 'done';
          this.enableDisableBtns();
        }
      });
  }

  /**
   * Add a credit card.
   */
  addCard() {
    if(this.openAddCardService.isLoading()) return;
    const sub = this.openAddCardService
      .openAddCard().subscribe((cardModal) => {
        if(cardModal){
          cardModal
          .afterClosed()
          .subscribe((res) => {
            if (res && res.success) {
              this.alertService.successAlert({ content: res.data.message });
              this.selectedCardId = res.data.metaData.cardId;
              this.gettingStartedADP.creditCard.status = 'done';
              this.enableDisableBtns();
              this.saveSetup();
            }
          });
        }
      });

    this.subscriptions.push(sub);
  }

  /**
   * Add a new bank account.
   */
  onNewBank() {
    const dialogueRef = this.matDialogue.open(CreateBankOptionsModalComponent, {
      //open modal
      maxWidth: '550px',
      width: '100%',
      disableClose: true,
      data: { mode: 'adp' }
    });
    this.subscriptions.push(
      dialogueRef
        .afterClosed()
        .subscribe((res: { isAddManually: boolean } & boolean) => {
          if (res?.isAddManually) {
            this.openBankModal();
          }
        })
    );
  }

  /**
   * Open the bank account creation modal.
   */
  openBankModal() {
    if(this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBankOptimizedModal({ wireRoutingNumberRequired: 1 }).subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.gettingStartedADP.bankAc.status = 'done';
                this.gettingStartedADP.verifyBankAc.status = 'start';
                this.selectedBankAcId = result.id;
                this.saveSetup();
                this.enableDisableBtns();
                this.gettingStartedADP.verifyBankAc.hide = false;
              }
            })
          );
        }
      })
    );
  }

  /**
   * Get the bank account ID and save it.
   */
  getBankIdAndSave() {
    this.subscriptions.push(
      this._bankService.getBankAccounts(1).subscribe((res) => {
        if (res?.success) {
          this.selectedBankAcId = res.data[0].id;
          this.gettingStartedADP.verifyBankAc.status = 'done';
          this.gettingStartedADP.bankAc.status = 'done';
          this.saveSetup();
          this.enableDisableBtns();
        }
      })
    );
  }

  /**
   * Open the modal for editing the bank account.
   */
  editBankModal(): void {
    this.matDialogue.open(EditBankAccountModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: { id: this.selectedBankAcId }
    });
  }

  /**
   * Select the payroll refill method.
   */
  selectMethod() {
    const dialogRef = this.matDialogue.open(AdpPayrollRefillMethodComponent, {
      //open modal
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: {
        type: (() => {
          if (this.automationMethod) {
            switch (this.automationMethod) {
              case 1:
                return 'autoProcess';
              case 2:
                return 'partiallyCharge';
              case 3:
                return 'iDecide';
              default:
                return false;
            }
          }
          return false;
        })(),
        presetAmount: this.presetAmount
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.automationMethod = (() => {
          if (result.type) {
            switch (result.type) {
              case 'autoProcess':
                return 1;
              case 'partiallyCharge':
                return 2;
              case 'iDecide':
                return 3;
              default:
                return 0;
            }
          }
          return 0;
        })();
        this.presetAmount = result.presetAmount;
        this.gettingStartedADP.payrollProcess.status = 'done';
        this.enableDisableBtns();
        this.saveSetup(true);
      }
    });
  }

  /**
   * Verify the bank account.
   */
  verifyBankAc() {
    this.openVerifyModal(this.selectedBankAcId!);
  }

  /**
   * Change the bank account.
   */
  changeBankAc() {
    this.onNewBank();
  }

  /**
   * Open the bank account verification modal.
   * @param encrypted_bankacc_id - The encrypted bank account ID.
   */
  openVerifyModal(encrypted_bankacc_id: string) {
    this.matDialogue.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id },
      disableClose: true
    });
  }

  /**
   * Confirm microdeposits for bank account verification.
   */
  confirmMicroDeposit() {
    this.matDialogue
      .open(ConfirmMicroDepositModalComponent, {
        maxWidth: '750px',
        width: '500px',
        data: { encrypted_bankacc_id: this.selectedBankAcId }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.gettingStartedADP.verifyBankAc.status = 'done';
          this.enableDisableBtns();
          this.saveSetup();
        }
      });
  }

  /**
   * Save the ADP setup details.
   * @param saveAll - Indicates whether to save all setup details.
   */
  saveSetup(saveAll?: boolean) {
    this.loadingSave = true;
    const sendingData: IADPSetupRequest = {
      companyId: this.companyId,
      cardId:
        this.selectedCardId &&
        this.gettingStartedADP.creditCard.status == 'done'
          ? this.selectedCardId
          : undefined,
      bankaccountId:
        this.selectedBankAcId && this.gettingStartedADP.bankAc.status == 'done'
          ? this.selectedBankAcId
          : undefined,
      mode: '6',
      automate: this.automationMethod ? 1 : 0,
      automateType: this.automationMethod,
      automateAmount: this.automationMethod == 2 ? this.presetAmount : 0,
      isFromGettingStarted: saveAll ? undefined : true
    };

    this.subscriptions.push(
      this.adpService.setADPSetupDetails(sendingData).subscribe((res) => {
        this.loadingSave = false;
        if (res?.success) {
          if (saveAll) {
            this.alertService.successAlert({
              content: 'ADP Account setup saved successfully'
            });
            this._router.navigate(['/manage/thirdparty_app/adp/adp-view']);
          }
        }
      })
    );
  }

  /**
   * Handle the continue button click based on the current Getting Started step.
   */
  onContinueClicked() {
    if (this.gettingStartedADP.phoneVerification.status != 'done') {
      this.phoneVerification();
    } else if (this.gettingStartedADP.creditCard.status != 'done') {
      this.alertService
        .infoAlert({
          content: 'Please add your credit card to continue',
          close: false,
          isCancel: true,
          isOk: true,
          doneMsg: 'Add Card'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.addCard();
          }
        });
    } else if (this.gettingStartedADP.bankAc.status != 'done') {
      this.alertService
        .infoAlert({
          content: 'Please add your ADP-connected bank account to continue',
          close: false,
          isCancel: true,
          isOk: true,
          doneMsg: 'Add Bank Account'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.onNewBank();
          }
        });
    } else if (this.gettingStartedADP.verifyBankAc.status != 'done') {
      if (this.gettingStartedADP.verifyBankAc.status == 'start') {
        this.alertService
          .infoAlert({
            content: 'Please verify your bank account to continue',
            close: false,
            isCancel: true,
            isOk: true,
            doneMsg: 'Verify'
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.verifyBankAc();
            }
          });
      } else if (this.gettingStartedADP.verifyBankAc.status == 'pending') {
        this.alertService.infoAlert({
          content:
            'Your manual bank account verification request is pending. Please wait until we process two microdeposits to your given bank account',
          close: false,
          isOk: true
        });
      } else if (
        this.gettingStartedADP.verifyBankAc.status == 'confirmMicroDeposit'
      ) {
        this.alertService
          .infoAlert({
            content: 'Please confirm microdeposits to continue',
            close: false,
            isCancel: true,
            isOk: true,
            doneMsg: 'Confirm Microdeposit'
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.confirmMicroDeposit();
            }
          });
      }
    } else if (this.gettingStartedADP.payrollProcess.status != 'done') {
      this.selectMethod();
    } else {
      this._router.navigate(['/manage/thirdparty_app/adp/adp-view']);
    }
  }

  /**
   * Lifecycle hook: Called when the component is destroyed.
   * Unsubscribe from subscriptions and remove scripts.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.scriptService.removeScript(['zsiqchatADP']);
  }
}
