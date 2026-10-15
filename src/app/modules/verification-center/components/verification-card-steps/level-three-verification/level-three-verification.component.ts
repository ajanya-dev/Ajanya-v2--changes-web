/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Component,
  inject,
  Input,
  input,
  OnChanges,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  faAngleRight,
  faCheck,
  faDollar,
  IconDefinition
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { MatDialog } from '@angular/material/dialog';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { IBankData, IBankDropdown } from 'src/app/models/bank';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { ConfirmMicroDepositModalComponent } from 'src/app/modules/bank/bank-v2/modals/confirm-micro-deposit-modal/confirm-micro-deposit-modal.component';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import {
  faBank,
  faBriefcase,
  faEnvelope,
} from '@fortawesome/pro-regular-svg-icons';
import { environment } from 'src/environments/environment';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { verificationData } from '../../../data/verification-center.data';
import { VerificationCenterCardsValue } from '../../../model/verification-center.model';

type Steps =
  | 'verification'
  | 'personal-verification'
  | 'business-verification'
  | 'connect-verify-bank-acc'
  | 'make-payment';

@Component({
  selector: 'app-level-three-verification',
  standalone: true,
  imports: [
    FontAwesomeModule,
    NgClass,
    BankAcDropdownV3Component,
    CommonButtonV35Component,
    ReactiveFormsModule,
    CommonBackButtonV35Component
  ],
  templateUrl: './level-three-verification.component.html',
  styleUrl: './level-three-verification.component.scss'
})
export class LevelThreeVerificationComponent
  implements OnInit, OnChanges, OnDestroy
{
  cardType = input.required<VerificationCenterCardsValue>();
  @Input() verificationStatus: IGettingStartedAPI;
  private alertService = inject(AlertService);

  private personaHelperService = inject(PersonaHelperService);
  private bankAccountsService = inject(BankAccountsService);
  private dialog = inject(MatDialog);
  public bankDataService = inject(BankDataV35Service);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);

  subscriptions: Subscription[] = [];
  bankAccounts: IBankDropdown[] = [];

  details: (typeof verificationData)[VerificationCenterCardsValue];
  faCheck = faCheck;
  faEnvelope = faEnvelope;
  faAngle = faAngleRight;
  faBank = faBank;
  faBriefcase = faBriefcase;
  faDollar = faDollar;
  loading = false;
  clicked = false;

  currentStep: Steps = 'verification';
  selectedBank = new FormControl();

  showDropDown = false;
  bankAcData: IBankData;

  steps: {
    id: Steps;
    title: string;
    icon: IconDefinition;
    isCompleted: boolean;
  }[] = [
    {
      id: 'verification',
      title: 'Verify Email and Phone Number here',
      icon: faEnvelope,
      isCompleted: false
    },
    // {
    //   id: 'personal-verification',
    //   title: 'Personal Verification',
    //   icon: faFaceViewfinder,
    //   isCompleted: false
    // },
    {
      id: 'business-verification',
      title: 'Business Verification',
      icon: faBriefcase,
      isCompleted: false
    },
    {
      id: 'connect-verify-bank-acc',
      title: 'Connect & Verify Bank Account',
      icon: faBank,
      isCompleted: false
    },
    {
      id: 'make-payment',
      title: 'Make Payment',
      icon: faDollar,
      isCompleted: false
    }
  ];

  readonly COMPLETED_STEPS = {
    VERIFICATION: 'verification',
    PERSONAL_VERIFICATION: 'personal-verification',
    BUSINESS_VERIFICATION: 'business-verification',
    CONNECT_VERIFY_BANK_ACC: 'connect-verify-bank-acc',
    MAKE_PAYMENT: 'make-payment'
  };

  ngOnInit(): void {
    this.details = verificationData[this.cardType()];
    this.geBankSelectionChange();
  }

  ngOnChanges(): void {
    const { verification, kybStatus, bankAccount, payment } =
      this.verificationStatus;

    if (!verification) {
      this.setCurrentStep(this.COMPLETED_STEPS.VERIFICATION as Steps);
      return;
    }

    // if (kycStatus === null) {
    //   this.setStepsAndCurrentStep(
    //     [this.COMPLETED_STEPS.VERIFICATION],
    //     this.COMPLETED_STEPS.PERSONAL_VERIFICATION as Steps
    //   );
    //   return;
    // }

    if (kybStatus === null || kybStatus === 0) {
      this.setStepsAndCurrentStep(
        [
          this.COMPLETED_STEPS.VERIFICATION,
          this.COMPLETED_STEPS.PERSONAL_VERIFICATION
        ],
        this.COMPLETED_STEPS.BUSINESS_VERIFICATION as Steps
      );
      return;
    }

    if (bankAccount === 0 || bankAccount === 1) {
      if (bankAccount === 1) {
        this.updateStepTitle(
          this.COMPLETED_STEPS.CONNECT_VERIFY_BANK_ACC,
          'Verify Bank Account'
        );
      }
      this.setStepsAndCurrentStep(
        [
          this.COMPLETED_STEPS.VERIFICATION,
          this.COMPLETED_STEPS.PERSONAL_VERIFICATION,
          this.COMPLETED_STEPS.BUSINESS_VERIFICATION
        ],
        this.COMPLETED_STEPS.CONNECT_VERIFY_BANK_ACC as Steps
      );
      return;
    }
    this.setStepsCompleted([
      this.COMPLETED_STEPS.VERIFICATION,
      this.COMPLETED_STEPS.PERSONAL_VERIFICATION,
      this.COMPLETED_STEPS.BUSINESS_VERIFICATION,
      this.COMPLETED_STEPS.CONNECT_VERIFY_BANK_ACC
    ]);
    this.currentStep = 'make-payment';

    if (payment !== 0) {
      this.setStepsAndCurrentStep(
        [
          this.COMPLETED_STEPS.VERIFICATION,
          this.COMPLETED_STEPS.PERSONAL_VERIFICATION,
          this.COMPLETED_STEPS.BUSINESS_VERIFICATION,
          this.COMPLETED_STEPS.CONNECT_VERIFY_BANK_ACC
        ],
        this.COMPLETED_STEPS.MAKE_PAYMENT as Steps
      );
    }
  }

  /**
   * Sets the current step.
   * @param step The step to be set as current.
   */
  setCurrentStep(step: Steps): void {
    this.currentStep = step;
  }

  /**
   * Sets the completed steps and updates the current step.
   * @param completedSteps An array of step IDs to be marked as completed.
   * @param currentStep The step to be set as current.
   */
  private setStepsAndCurrentStep(
    completedSteps: string[],
    currentStep: Steps
  ): void {
    this.setStepsCompleted(completedSteps);
    this.currentStep = currentStep;
  }

  /**
   * Updates the title of a step.
   * @param stepId The ID of the step to update.
   * @param title The new title for the step.
   */
  private updateStepTitle(stepId: string, title: string): void {
    const step = this.steps.find((item) => item.id === stepId);
    if (step) {
      step.title = title;
    }
  }

  /**
   * Selects a step and performs the necessary actions.
   * @param step The step to be selected.
   * @param isCompleted Whether the step is completed.
   */
  selectStep(step: Steps, isCompleted: boolean): void {
    if (isCompleted) {
      return;
    }
    this.currentStep = step;

    switch (step) {
      case 'verification':
        this.router.navigateByUrl('manage/users/verify-email-phone');
        break;
      case 'personal-verification':
        this.handlePersonalVerification();
        break;
      case 'business-verification':
        this.handleBusinessVerification();
        break;
      case 'connect-verify-bank-acc':
        this.handleConnectVerifyBankAccount();
        break;
      case 'make-payment':
        this.router.navigateByUrl('/manage/payments/main/pay/bankaccount/ach');
        break;
      default:
        break;
    }
  }

  /**
   * Handles the personal verification step.
   */
  private handlePersonalVerification(): void {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyc', CVSourceType.getting_started_v3)
        .subscribe((res) => {
          if (res?.data?.inquiry_type === 'kyc') {
            this.setStepsAndCurrentStep(
              [
                this.COMPLETED_STEPS.VERIFICATION,
                this.COMPLETED_STEPS.PERSONAL_VERIFICATION
              ],
              this.COMPLETED_STEPS.BUSINESS_VERIFICATION as Steps
            );
          } else if (res?.data?.inquiry_type === 'kyb') {
            this.setStepsAndCurrentStep(
              [
                this.COMPLETED_STEPS.VERIFICATION,
                this.COMPLETED_STEPS.PERSONAL_VERIFICATION,
                this.COMPLETED_STEPS.BUSINESS_VERIFICATION
              ],
              this.COMPLETED_STEPS.CONNECT_VERIFY_BANK_ACC as Steps
            );
          }
        });
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
    }
  }

  /**
   * Handles the business verification step.
   */
  private handleBusinessVerification(): void {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyb', CVSourceType.add_new_business)
        .subscribe((res) => {
          if (res?.data?.inquiry_id) {
            this.setStepsAndCurrentStep(
              [
                this.COMPLETED_STEPS.VERIFICATION,
                this.COMPLETED_STEPS.PERSONAL_VERIFICATION,
                this.COMPLETED_STEPS.BUSINESS_VERIFICATION
              ],
              this.COMPLETED_STEPS.CONNECT_VERIFY_BANK_ACC as Steps
            );
          }
        });
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=7');
    }
  }

  /**
   * Handles the connect and verify bank account step.
   */
  private handleConnectVerifyBankAccount(): void {
    if (this.verificationStatus.bankAccount === 0) {
      this.router.navigate(['/manage/users/add-bank-account'], {
        queryParams: { returnUrl: '/manage/verification/steps' }
      });
    } else if (this.verificationStatus?.bankAccount === 1) {
      this.getBankAccounts();
      this.steps.find((item) => item.id === 'connect-verify-bank-acc')!.title =
        'Loading...';
    }
  }

  /**
   * Fetches bank accounts and updates the state accordingly.
   */
  getBankAccounts(): void {
    this.loading = true;
    this.subscriptions.push(
      this.bankAccountsService
        .getBankAccounts(1, '')
        .pipe(
          finalize(() => {
            this.loading = false;
            this.steps.find(
              (stepItem) => stepItem.id === 'connect-verify-bank-acc'
            )!.title =
              this.verificationStatus?.bankAccount === 0
                ? 'Connect & Verify Bank Account'
                : 'Verify Bank Account';
          })
        )
        .subscribe({
          next: (res) => {
            this.bankAccounts = res.data;
            if (this.bankAccounts.length > 0) {
              this.showDropDown = true;
            }
            this.clicked = true;
          }
        })
    );
  }

  /**
   * @description Opens @component 'YodleeParentModalComponent' for bank verify instantly
   */
  verifyInstantly(bankAcData: IBankData | undefined) {
    const data = {
      mode: 'verify_now',
      verifyNowAccountData: bankAcData as IBankData
    };
    const dialog = this.dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data,
      panelClass: 'yodlee-modal-new'
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.localStorageService.updateNestedData(
          'gettingStartedData',
          'bankAccount',
          2
        );
        this.currentStep = 'make-payment';
      }
    });
  }

  /**
   * Subscribes to bank selection changes.
   */
  geBankSelectionChange() {
    this.subscriptions.push(
      this.selectedBank.valueChanges.subscribe((res) => {
        this.bankAcData = res;
        this.bankAcData = {
          ...this.bankAcData,
          encrypted_bankacc_id: res.id,
          verified_by: res.verifiedBy,
          mark_as_verified: res.verified,
          ach_application_status: res.achApplicationStatus
        };
        this.checkStatus();
      })
    );
  }

  /**
   * Marks steps as completed.
   * @param stepIds An array of step IDs to be marked as completed.
   */
  setStepsCompleted(stepIds: string[]): void {
    stepIds.forEach((stepId) => {
      const step = this.steps.find((el) => el.id === stepId);
      if (step) {
        step.isCompleted = true;
      }
    });
  }

  verifyNow(): void {
    const dialog = this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: this.bankAcData,
      disableClose: true
    });
    dialog.afterClosed().subscribe((res) => {
      /**
       * @description Checking if the status from response is true, and proceeding to all other operations if its true. else it refreshes the whole page for nothing
       */
      if (res.success) {
        this.bankAcData.verified_by = 4;
        this.accountStatus = 'Pending';
        this.statusName = 'Pending';
      }
    });
  }

  /**
   * @description Emits @param encrypted_bankacc_id  through verifyAccount output variable and opens verify bank modal
   * @param encrypted_bankacc_id
   */
  openBankVerifyModal(accStatus: string) {
    if (accStatus === 'Verify Bank Account') {
      if (this.bankAcData.bank_account_country === 'Canada') {
        this.alertService.warningAlert({
          content: 'Verification for Canadian bank accounts is not permitted.'
        });
        return;
      }
      this.verifyNow();
    }

    if (accStatus === 'Confirm MD') {
      this.microDeposit();
    }

    if (accStatus === 'Pending') {
      this.alertService.infoAlert({ content: 'Your application is pending.' });
    }

    if (accStatus === 'Verify Instantly' && this.statusName === 'Rejected') {
      this.verifyInstantly(this.bankAcData);
    }

    if (accStatus === 'Re-Apply' && this.statusName === 'Rejected') {
      this.verifyNow();
    }
  }

  accountStatus = '';
  statusName = '';

  checkStatus(): void {
    if (
      !this.bankAcData.verified_by &&
      (this.bankAcData.mark_as_verified === 0 ||
        !this.bankAcData.mark_as_verified)
    ) {
      this.accountStatus = 'Verify Bank Account';
    } else if (
      this.bankAcData.mark_as_verified === 1 &&
      this.bankAcData.ach_application_status !== 1
    ) {
      this.accountStatus = 'Vefified';
    } else if (
      this.bankAcData.verified_by === 3 &&
      this.bankAcData.ach_application_status !== 1
    ) {
      this.accountStatus = 'Confirm MD';
    } else if (
      this.bankAcData.verified_by === 4 &&
      this.bankAcData.ach_application_status !== 1
    ) {
      this.accountStatus = 'Pending';
      this.statusName = 'Pending';
    } else if (
      this.bankAcData.verified_by === 5 &&
      this.bankAcData.ach_application_status !== 1
    ) {
      this.accountStatus = 'Approved';
    } else if (this.bankAcData.ach_application_status === 1) {
      this.accountStatus = 'ACH';
    } else if (
      (this.bankAcData.verified_by === 6 ||
        this.bankAcData.verified_by === 10) &&
      this.bankAcData.ach_application_status !== 1
    ) {
      this.statusName = 'Rejected';
      if (this.bankAcData.verified_by === 6) {
        this.accountStatus = 'Verify Instantly';
      } else {
        this.accountStatus = 'Re-Apply';
      }
    } else if (
      this.bankAcData.verified_by === 12 &&
      this.bankAcData.ach_application_status !== 1
    ) {
      this.accountStatus = 'Failed';
    }

    if (this.accountStatus === 'Vefified') {
      this.currentStep = 'make-payment';
    }
  }

  /**
   * @description Emits @param val through confirmMicroDeposit output variable for micro deposit
   * @param val @type IBankData Bank details
   */
  microDeposit() {
    const dialog = this.dialog.open(ConfirmMicroDepositModalComponent, {
      maxWidth: '750px',
      width: '500px',
      data: this.bankAcData
    });
    dialog.afterClosed().subscribe((res) => {
      if(res){
        this.bankAcData = {
          ...this.bankAcData,
          mark_as_verified: 1
        };
        this.accountStatus = 'Vefified';
        this.showDropDown = false;
        this.localStorageService.updateNestedData(
          'gettingStartedData',
          'bankAccount',
          2
        );
        this.currentStep = 'make-payment';
        this.setStepsAndCurrentStep(
          [
            this.COMPLETED_STEPS.VERIFICATION,
            this.COMPLETED_STEPS.PERSONAL_VERIFICATION,
            this.COMPLETED_STEPS.BUSINESS_VERIFICATION,
            this.COMPLETED_STEPS.CONNECT_VERIFY_BANK_ACC
          ],
          this.COMPLETED_STEPS.MAKE_PAYMENT as Steps
          
        );
      }
    });
  }

  clearEvent(): void {
    this.statusName = '';
    this.accountStatus = '';
    this.bankAcData = {} as never;
  }

  /**
   * Returning to the verification center page.
   */
  prevStep(): void {
    this.router.navigate(['/manage/verification/index']);
  }

  /**
   * Cleans up subscriptions on component destruction.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el.unsubscribe();
    });
  }
}
