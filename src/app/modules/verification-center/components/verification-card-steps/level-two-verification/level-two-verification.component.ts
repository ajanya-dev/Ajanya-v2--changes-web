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
  IconDefinition
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { Router } from '@angular/router';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Subscription } from 'rxjs';
import {
  faBank,
  faCreditCard,
  faDollar,
  faEnvelope,
  faFaceViewfinder
} from '@fortawesome/pro-regular-svg-icons';
import { environment } from 'src/environments/environment';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { verificationData } from '../../../data/verification-center.data';
import { VerificationCenterCardsValue } from '../../../model/verification-center.model';

type Steps =
  | 'verification'
  | 'personal-verification'
  | 'card-details'
  | 'invoice-payment'
  | 'payment-methords'
  | 'completed'
  | 'connect-verify-bank-acc'
  | 'payroll-card';

@Component({
  selector: 'app-level-two-verification',
  standalone: true,
  imports: [FontAwesomeModule, NgClass, CommonBackButtonV35Component],
  templateUrl: './level-two-verification.component.html',
  styleUrl: './level-two-verification.component.scss'
})
export class LevelTwoVerificationComponent
  implements OnInit, OnChanges, OnDestroy
{
  cardType = input.required<VerificationCenterCardsValue>();
  @Input() verificationStatus: IGettingStartedAPI;
  private router = inject(Router);
  private personaHelperService = inject(PersonaHelperService);
  private openAddCardService = inject(OpenAddCardService);
  private localStorageService = inject(LocalStorageService);
  private alertService = inject(AlertService);

  details: (typeof verificationData)[VerificationCenterCardsValue];
  faCheck = faCheck;
  faEnvelope = faEnvelope;
  faAngle = faAngleRight;
  faBank = faBank;
  faCreditCard = faCreditCard;
  faDollar = faDollar;

  stepsCompleted = false;
  showDropDown: boolean;
  subscriptions: Subscription[] = [];
  currentStep: Steps = 'verification';

  ngOnInit(): void {
    this.details = verificationData[this.cardType()];
  }

  ngOnChanges(): void {
    if (!this.verificationStatus?.verification) {
      this.currentStep = 'verification';
      return;
    }
    if (this.verificationStatus?.kycStatus === null) {
      this.setStepsCompleted(['verification']);
      this.currentStep = 'personal-verification';
      return;
    }
    if (this.verificationStatus?.adp?.isCardAdded === 0) {
      this.setStepsCompleted(['verification', 'personal-verification']);
      this.currentStep = 'card-details';
      return;
    }

    this.setStepsCompleted([
      'verification',
      'personal-verification',
      'card-details'
    ]);
    this.currentStep = 'completed';
  }

  lengthArray: number[] = Array(50).fill(0);
  lengthArray2: number[] = Array(7).fill(0);
  steps: {
    id: Steps;
    title: string;
    icon?: IconDefinition;
    isCompleted?: boolean;
    isSplit?: boolean;
    subMenus?: {
      id?: string;
      title?: string;
      icon?: IconDefinition;
      isCompleted?: boolean;
    }[];
  }[] = [
    {
      id: 'verification',
      title: 'Verify Email and Phone Number here',
      icon: faEnvelope,
      isCompleted: false
    },
    {
      id: 'personal-verification',
      title: 'Personal Verification',
      icon: faFaceViewfinder,
      isCompleted: false
    },
    {
      id: 'card-details',
      title: 'Add Card Details',
      icon: faCreditCard,
      isCompleted: false
    },
    {
      isSplit: true,
      id: 'payment-methords',
      title: '',
      subMenus: [
        {
          id: 'invoice-payment',
          title: 'Invoice Payment',
          icon: faDollar,
          isCompleted: false
        },
        {
          id: 'payroll-card',
          title: 'Payroll By Credit Card',
          icon: faDollar,
          isCompleted: false
        }
      ]
    }
  ];

  selectStep(step: Steps, isCompleted: boolean | undefined): void {
    if (isCompleted) {
      return;
    }
    if (step !== 'invoice-payment' && step !== 'payroll-card') {
      this.currentStep = step;
    }

    if (step === 'verification') {
      this.router.navigateByUrl('manage/users/verify-email-phone');
    }

    if (step === 'personal-verification') {
      if (environment.isV4Persona) {
        this.personaHelperService
          .openModal('kyc', CVSourceType.getting_started_v3, true)
          .subscribe((res) => {
            if (
              res?.data?.inquiry_type === 'kyc' ||
              res?.data?.inquiry_type === 'kyb'
            ) {
              this.setStepsCompleted(['verification', 'personal-verification']);
              this.currentStep = 'card-details';
            }
          });
      } else {
        this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
      }
    }

    if (step === 'card-details') {
      if(this.openAddCardService.isLoading()) return;
      const sub = this.openAddCardService
        .openAddCard()
        .subscribe((cardModal) => {
          if (cardModal) {
            cardModal
            .afterClosed()
            .subscribe((res) => {
              if (res && res.success) {
                this.localStorageService.updateNestedData(
                  'gettingStartedData',
                  'adp.isCardAdded',
                  1
                );
                this.currentStep = 'completed';
                this.setStepsCompleted([
                  'verification',
                  'personal-verification',
                  'card-details'
                ]);
                this.alertService.successAlert({ content: res.data.message });
              }
            });
          }
        });
      this.subscriptions.push(sub);
    }

    if (step === 'invoice-payment') {
      this.router.navigateByUrl('/manage/payments/main/pay/card/ach');
    }

    if (step === 'payroll-card') {
      this.router.navigateByUrl('/manage/payroll-card/index');
    }
  }

  setStepsCompleted(stepIds: string[]): void {
    stepIds.forEach((stepId) => {
      const step = this.steps.find((el) => el.id === stepId);
      if (step) {
        step.isCompleted = true;
      }
    });
  }

  /**
   * Returning to the verification center page.
   */
  prevStep(): void {
    this.router.navigate(['/manage/verification/index']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
