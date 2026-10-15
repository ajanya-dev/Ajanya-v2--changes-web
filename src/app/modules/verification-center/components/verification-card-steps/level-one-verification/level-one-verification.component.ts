import { Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import {
  faCheck,
  faAngleRight,
  IconDefinition
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import {
  faBank,
  faMoneyCheckDollarPen,
  faEnvelope
} from '@fortawesome/pro-regular-svg-icons';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { verificationData } from '../../../data/verification-center.data';
import { VerificationCenterCardsValue } from '../../../model/verification-center.model';

type Steps = 'verification' | 'connect-bank' | 'create-check';

/**
 * Component for Level One Verification in the verification process.
 */
@Component({
  selector: 'app-level-one-verification',
  standalone: true,
  imports: [FontAwesomeModule, NgClass, CommonBackButtonV35Component],
  templateUrl: './level-one-verification.component.html',
  styleUrls: ['./level-one-verification.component.scss']
})
export class LevelOneVerificationComponent implements OnInit, OnChanges {
  /** Input property for the verification status. */
  @Input() verificationStatus: IGettingStartedAPI;

  /** Input property for the card type, required for the component. */
  @Input() cardType!: VerificationCenterCardsValue;

  /** Details for the verification data based on card type. */
  details!: (typeof verificationData)[VerificationCenterCardsValue];

  /** FontAwesome icons used in the component. */
  faCheck = faCheck;
  faEnvelope = faEnvelope;
  faAngle = faAngleRight;
  faBank = faBank;
  faMoneyCheckDollarPen = faMoneyCheckDollarPen;

  /** Steps in the verification process. */
  steps: Array<{
    id: Steps;
    title: string;
    icon: IconDefinition;
    isCompleted: boolean;
  }> = [
    {
      id: 'verification',
      title: 'Verify Your Email & Phone Number',
      icon: faEnvelope,
      isCompleted: false
    },
    {
      id: 'connect-bank',
      title: 'Link Your Bank Account',
      icon: faBank,
      isCompleted: false
    },
    {
      id: 'create-check',
      title: 'Create Your First Check',
      icon: faMoneyCheckDollarPen,
      isCompleted: false
    }
  ];

  /** The current step in the verification process. */
  currentStep: Steps = 'verification';

  /** Router service for navigation. */
  private router = inject(Router);

  readonly COMPLETE_STEPS = {
    VERIFICATION: 'verification' as Steps,
    CONNECT_BANK_ACC: 'connect-bank' as Steps,
    MAKE_PAYMENT: 'create-check' as Steps
  };

  ngOnInit(): void {
    this.details = verificationData[this.cardType];
    this.checkCurrentSteps();
  }

  ngOnChanges(): void {
    this.checkCurrentSteps();
  }

  private checkCurrentSteps(): void {
    const { verification, bankAccount } = this.verificationStatus;

    if (!verification) {
      this.setCurrentStep(this.COMPLETE_STEPS.VERIFICATION);
      return;
    }

    if (bankAccount === 0) {
      this.setStepsAndCurrentStep(
        [this.COMPLETE_STEPS.VERIFICATION],
        this.COMPLETE_STEPS.CONNECT_BANK_ACC
      );
      return;
    }

    this.setStepsAndCurrentStep(
      [this.COMPLETE_STEPS.VERIFICATION, this.COMPLETE_STEPS.CONNECT_BANK_ACC],
      this.COMPLETE_STEPS.MAKE_PAYMENT
    );
  }

  /**
   * Selects a step in the verification process and navigates to the corresponding route.
   * @param step The step to select.
   * @param isCompleted Indicates if the step is completed.
   */
  selectStep(step: Steps, isCompleted: boolean): void {
    if (isCompleted) {
      return;
    }

    this.setCurrentStep(step);

    switch (step) {
      case this.COMPLETE_STEPS.VERIFICATION:
        this.router.navigateByUrl('manage/users/verify-email-phone');
        break;
      case this.COMPLETE_STEPS.CONNECT_BANK_ACC:
        this.router.navigate(['/manage/users/add-bank-account'], {
          queryParams: { returnUrl: '/manage/verification/steps' }
        });
        break;
      case this.COMPLETE_STEPS.MAKE_PAYMENT:
        this.router.navigateByUrl('manage/home');
        break;
      default:
        break;
    }
  }

  /**
   * Sets the current step.
   * @param step The step to be set as current.
   */
  private setCurrentStep(step: Steps): void {
    this.currentStep = step;
  }

  /**
   * Sets the completed steps and updates the current step.
   * @param completedSteps An array of step IDs to be marked as completed.
   * @param currentStep The step to be set as current.
   */
  private setStepsAndCurrentStep(
    completedSteps: Steps[],
    currentStep: Steps
  ): void {
    this.setStepsCompleted(completedSteps);
    this.setCurrentStep(currentStep);
  }

  /**
   * Marks steps as completed.
   * @param stepIds The IDs of the steps to mark as completed.
   */
  private setStepsCompleted(stepIds: Steps[]): void {
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
}
