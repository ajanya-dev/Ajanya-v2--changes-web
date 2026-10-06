import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { finalize, merge } from 'rxjs';
import { BusinessVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/business-verification-modal-v4/business-verification-modal-v4.component';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IUserVerification } from 'src/app/models/user';
import { IApiRes } from 'src/app/models/api';
import {
  LucideAngularModule,
  Clock,
  CheckCircle2,
  ArrowRight,
  Check,
  MessageCircle
} from 'lucide-angular';
import { EmailPhoneVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/email-phone-verification-modal-v4/email-phone-verification-modal-v4.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { CurrentStepFocusComponent } from './components/current-step-focus/current-step-focus.component';
import { PaymentSourceModalV4Component } from './modals/payment-source-modal-v4/payment-source-modal-v4.component';
import { STEP_CONFIGS } from './data/verification-v4.data';
import {
  PaymentSourceResult,
  StepConfig
} from './models/verification-v4.model';
import { StepStatus } from './constants/verification-v4.constants';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { DynamicWhiteLabelService } from '../dynamic-white-label/service/dynamic-white-label.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-verification-center-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CurrentStepFocusComponent],
  templateUrl: './verification-center-v4.component.html',
  styleUrl: './verification-center-v4.component.scss'
})
export class VerificationCenterV4Component implements OnInit {
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly ArrowRight = ArrowRight;
  readonly Check = Check;
  readonly MessageCircle = MessageCircle;

  private gettingStartedService = inject(GettingStartedService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private userProfileService = inject(UserProfileService);
  private localStorageService = inject(LocalStorageService);
  private companyService = inject(CompanyManagementService);
  private bankAccountsService = inject(BankAccountsService);
  private router = inject(Router);
  private personaHelperService = inject(PersonaHelperService);
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private activatedRoute = inject(ActivatedRoute);

  loading = signal(true);
  gettingStartedDetails = signal<IGettingStartedAPI | null>(null);

  companyName = signal('');
  emailAddress = signal('');
  emailVerified = signal(false);
  phoneVerified = signal(false);
  readonly productName = environment.productName;
    

  /**
   * kybStatus from API:
   *   null or 0 = not submitted
   *   1 = submitted / under review
   *   2 = approved
   *   3 = rejected
   * bankAccount from API:
   *   0 = no bank, 1 = linked but unverified, 2 = verified
   * verification from API:
   *   0 = email/phone not verified, 1 = verified
   */

  private isKybDone = computed(() => {
    const status = this.gettingStartedDetails();
    return status?.kybStatus === 2;
  });

  isBusinessUnderReview = computed(() => {
    const status = this.gettingStartedDetails();
    return status?.kybStatus === 1;
  });

  currentStepConfig = computed<StepConfig | null>(() => {
    const status = this.gettingStartedDetails();
    if (!status) return STEP_CONFIGS[0];

    const step1Done = status.verification === 1;
    if (!step1Done) return STEP_CONFIGS[0]; // Account Setup (step 1)
    // When business is under review or done, move to bank verification
    if (!this.isKybDone() && !this.isBusinessUnderReview())
      return STEP_CONFIGS[1]; // Business verification (step 2)
    if (status.bankAccount !== 2) return STEP_CONFIGS[2]; // Bank verification (step 3)

    return null; // all complete
  });

  readonly allStepConfigs = STEP_CONFIGS;

  stepStatuses = computed<StepStatus[]>(() => {
    const status = this.gettingStartedDetails();
    if (!status) return ['pending', 'locked', 'locked'];

    const step1Done = status.verification === 1;
    const step2Done = this.isKybDone();
    const step2UnderReview = this.isBusinessUnderReview();
    const step3Done = status.bankAccount === 2;

    let step1Status: StepStatus = 'pending';
    if (step1Done) step1Status = 'completed';

    let step2Status: StepStatus = 'locked';
    if (step2Done) step2Status = 'completed';
    else if (step2UnderReview) step2Status = 'under-review';
    else if (step1Done) step2Status = 'pending';

    let step3Status: StepStatus = 'locked';
    if (step3Done) step3Status = 'completed';
    else if (step2Done || step2UnderReview) step3Status = 'pending';

    return [step1Status, step2Status, step3Status];
  });

  completedCount = computed(
    () => this.stepStatuses().filter((s) => s === 'completed').length
  );

  totalSteps = computed(() => this.allStepConfigs.length);

  remainingSteps = computed(() => this.totalSteps() - this.completedCount());

  /**
   * One segment per step: green once complete, amber while its review is
   * pending, neutral otherwise.
   */
  progressSegments = computed(() =>
    this.stepStatuses().map((s) => {
      if (s === 'completed') return 'bg-v4-primary-brand-color';
      if (s === 'under-review') return 'bg-v4-common-yellow-color';
      return 'bg-v4-badge-neutral-bg-color';
    })
  );

  /**
   * Surface the "add a payment source" shortcut when that step is actionable
   * and still pending. The source unlocks once business is approved OR under
   * review, so both count — but if the source is already added we hide it
   * (e.g. business under review + payment source done → nothing to prompt).
   */
  almostThere = computed(() => {
    const [step1, step2, step3] = this.stepStatuses();
    const sourceActionable =
      step2 === 'completed' || step2 === 'under-review';
    return (
      step1 === 'completed' && sourceActionable && step3 !== 'completed'
    );
  });

  allDone = computed(() => this.completedCount() === this.totalSteps());

  ngOnInit(): void {
    const openVerificationModal =
      this.activatedRoute.snapshot.queryParamMap.get(
        'openVerificationModal'
      ) === 'true';
    this.companyName.set(this.companyService.getActiveCompanyName() || '');
    this.emailAddress.set(this.localStorageService.getItem('email') ?? '');
    this.loadEmailPhoneVerification();
    this.getGettingStartedData(openVerificationModal);
    this.listenForBankVerificationUpdates();

    this.companyService
      .getCompanyChanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.companyName.set(this.companyService.getActiveCompanyName() || '');
      });
  }

  /**
   * getting-started only exposes a combined `verification` flag, so the
   * per-item email/phone state comes from the user profile endpoint.
   */
  private loadEmailPhoneVerification(): void {
    this.userProfileService
      .checkEmailAndPhoneVerified()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const res = response as IApiRes<IUserVerification>;
          if (!res?.success || !res.data) return;

          this.emailAddress.set(res.data.email || this.emailAddress());
          this.emailVerified.set(res.data.email_verified === 1);
          this.phoneVerified.set(res.data.phone_verified === 1);
        }
      });
  }

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  private listenForBankVerificationUpdates(): void {
    merge(
      this.bankAccountsService.bancAcEvents,
      this.gettingStartedService.updatedGettingStartedData$
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getGettingStartedData();
        this.store.dispatch(
          bankAccountsActions.loadBankAccounts({
            searchTerm: '',
            isReload: true
          })
        );
      });
  }

  onStepAction(stepKey: string): void {
    this.localStorageService.setItem('verificationStep', stepKey);

    switch (stepKey) {
      case 'account-setup':
        this.openEmailPhoneVerificationModal();
        break;
      case 'business-verification':
        this.openBusinessVerificationModal();
        break;
      case 'bank-verification':
        this.openPaymentSourceModal();
        break;
      default:
        break;
    }
  }

  /**
   * Step 3 asks which kind of source first, then hands off to the existing
   * bank-verification or add-card flow.
   *
   * Note: getting-started exposes no general "card added" flag (only the
   * ADP-specific `adp.isCardAdded`), so adding a card cannot currently mark
   * this step complete.
   */
  openPaymentSourceModal(): void {
    this.localStorageService.setItem('verificationStep', 'bank-verification');

    this.dialog
      .open<PaymentSourceModalV4Component, undefined, PaymentSourceResult>(
        PaymentSourceModalV4Component,
        {
          width: '500px',
          maxWidth: '95vw',
          panelClass: 'paddingless-modal-rounded',
          autoFocus: false
        }
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result) return;

        if (result.kind === 'bank') {
          this.openBankVerificationModal();
          return;
        }

        // The modal already opened the add-card dialog; just watch the outcome.
        result.cardModal
          ?.afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success) this.getGettingStartedData();
          });
      });
  }


  onContinueVerification(): void {
    const step = this.currentStepConfig();
    if (step) {
      this.onStepAction(step.key);
    }
  }

  private openEmailPhoneVerificationModal(): void {
    const dialogRef = this.dialog.open(EmailPhoneVerificationModalV4Component, {
      width: '550px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (
          result: { emailVerified: boolean; phoneVerified: boolean } | undefined
        ) => {
          // Refresh regardless: email-only progress still changes the card.
          this.loadEmailPhoneVerification();
          if (result?.emailVerified && result?.phoneVerified) {
            this.getGettingStartedData();
          }
        }
      );
  }

  private openBusinessVerificationModal(): void {
    const dialogRef = this.dialog.open(BusinessVerificationModalV4Component, {
      width: '448px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: { startVerification: boolean } | undefined) => {
        if (result?.startVerification) {
          setTimeout(() => {
            this.personaHelperService
              .openModal('kyc_kyb', CVSourceType.getting_started_v3)
              .subscribe((res) => {
                if (res?.data) {
                  this.gettingStartedService.updatedGettingStartedData = 2;
                }
              });
          }, 300);
        }
      });
  }

  private openBankVerificationModal(): void {
    this.dialog.open(BankVerificationModalV4Component, {
      width: '448px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });
  }

  onTryCheckNow(): void {
    this.router.navigate(['/v4/manage/payments/pay']);
  }

  private getGettingStartedData(openVerificationModal?: boolean): void {
    this.loading.set(true);
    this.gettingStartedService
      .getGettingStartedDataApi()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.gettingStartedDetails.set(res.data);
            this.localStorageService.setItem('gettingStartedData', res.data);
            if (openVerificationModal) {
              this.onContinueVerification();
            }
          }
        }
      });
  }
}
