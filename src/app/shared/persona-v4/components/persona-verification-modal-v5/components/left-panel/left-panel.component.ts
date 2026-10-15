import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  input,
  signal
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faCheck } from '@fortawesome/pro-solid-svg-icons';
import { IKybMissingField } from '../../../../model/persona-v4';

export type BtnClickType =
  | 'kyc'
  | 'kyb'
  | 'kyb-not-now'
  | 'close'
  | 'try-again'
  | 'edd'
  | 'use-existing-kyc'
  | 'start-fresh-kyc';

@Component({
  selector: 'app-persona-page-left-panel',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, MatTooltipModule,FaIconComponent],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.scss'
})
export class LeftPanelComponent {
  currentStep = input<
    | 'checking-prior-kyc'
    | 'prior-kyc-prompt'
    | 'start-kyc'
    | 'start-kyb'
    | 'reverify-intro'
    | 'check-kyb'
    | 'kyb-completed'
    | 'could-not-verify'
    | 'kyc-rejected'
  >('checking-prior-kyc');

  userName = input<string>('');
  priorKycName = input<string>('');
  /** Migration re-verify: fields the user must still complete, with live `filled` state. */
  missingFields = input<IKybMissingField[]>([]);
  buttonText = input<string>('Continue');
  fetchingInquiryId = input<boolean>(false);
  personaLoading = input<boolean>(false);
  waitingForPusherResponse = input<boolean>(false);
  maximumAllowedAttempt = input<number | undefined>(undefined);
  errorMssage = input<string>('');
  isCompletedRetryCount = input<boolean>(false);
  isEddFlowInProgress = input<boolean>(false);
  isShowEddModal = input<boolean>(false);
  /** Whether the Persona SDK iframe is currently embedded (hides the step UI when true). */
  sdkEmbedded = input<boolean>(false);

  faXmark = faXmark;
  faCheck = faCheck;

  @Output() btnClick = new EventEmitter<BtnClickType>();
  @Output() closeClick = new EventEmitter<void>();
  @Output() openSupportClick = new EventEmitter<void>();

  @ViewChild('personaEmbed', { static: true })
  personaEmbed!: ElementRef<HTMLDivElement>;

  passVerifications = signal(true);

  togglePassVerifications(): void {
    this.passVerifications.update((v) => !v);
  }
}
