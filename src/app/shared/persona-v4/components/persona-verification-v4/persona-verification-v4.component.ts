import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
  signal
} from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, DOCUMENT, NgOptimizedImage } from '@angular/common';
import { environment } from 'src/environments/environment';
import { Channel } from 'pusher-js';
import { PusherService } from 'src/app/core/services/pusher.service';
import { AchService } from 'src/app/shared/service/ach/ach.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { PersonaV4Service } from '../../service/persona-v4.service';
import { IPusherResponse } from '../../model/persona-kyc-kyb-pusher';

declare let Persona: {
  Client: new (arg0: {
    templateId?: string;
    environment: string;
    inquiryId?: string;
    sessionToken?: string | null;
    onLoad: () => void;
    onEvent: (
      eventName: string,
      metadata: {
        inquiryId: string;
        sessionToken: string;
        metadata?: { pageHeight: number };
        name?: string;
        nameDisplay?: string;
        path: string;
      }
    ) => void;
    onComplete: (data: {
      inquiryId: string;
      status: string;
      fields: { [key: string]: { type: string; value: string } };
    }) => void;
    onCancel: (data: { inquiryId: string; sessionToken: string }) => void;
    onError: (err: { status: number; code: string }) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) => any;
};

/**
 * Angular component for handling Persona verification process (version 4).
 * This component integrates with Persona service for KYC (Know Your Customer) and KYB (Know Your Business) verifications.
 *
 * @remarks
 * This component relies on various services such as `PersonaV4Service`, `AchService`, `AlertService`, `PusherService`, `GettingStartedService`, and `LocalStorageService`.
 */
@Component({
  selector: 'app-persona-verification-v4',
  standalone: true,
  imports: [
    CommonModule,
    CommonButtonV35Component,
    FontAwesomeModule,
    MatDialogModule,
    NgOptimizedImage,
    MatTooltipModule
  ],
  templateUrl: './persona-verification-v4.component.html',
  styleUrl: './persona-verification-v4.component.scss'
})
export class PersonaVerificationV4Component implements OnInit, OnDestroy {
  /** Array to hold subscriptions */
  subscription: Subscription[] = [];

  /** Array to hold Pusher channels */
  pusherChannels: Channel[] = [];

  /** Holds the inquiry ID for Persona verification */
  inquiryId: string;

  /** Holds the session_token for Persona verification */
  sessionToken: string | null;

  /** Specifies the source type for common verification */
  sourceType: CVSourceType;

  /** Tracks the current step in the verification process */
  currentStep:
    | 'start-kyc'
    | 'check-kyb'
    | 'start-kyb'
    | 'kyb-completed'
    | 'could-not-verify'
    | 'kyc-rejected' = 'start-kyc';

  /** Template ID for Persona verification */
  PERSONA_TEMPLATE_ID = environment.PERSONA_TEMPLATE_ID;

  /** Environment for Persona verification */
  PERSONA_ENVIRONMENT = environment.PERSONA_ENVIRONMENT;

  /** Prefix for Pusher channel name */
  PUSHER_CHANNEL_NAME_PREFIX = 'persona-kyc-Kyb-completed-';

  PUSHER_CHANNEL_NAME_PREFIX_EDD = 'persona-kyc-kyb-edd-required-';

  /** Prefix for Pusher event name */
  PUSHER_EVENT_NAME_PREFIX = 'persona-kyc-kyb-completed-event';

  PUSHER_EVENT_NAME_PREFIX_EDD = 'persona-kyc-kyb-edd-event';

  /** Flag to indicate if waiting for Pusher response */
  waitingForPusherResponse = false;

  /** Flag to indicate if fetching inquiry ID */
  fetchingInquiryId = false;

  /** Flag to indicate if Persona is loading */
  personaLoading = false;

  /** Button text for UI */
  buttonText = 'Continue';

  /** Flag to indicate loading state */
  loading = false;

  /** Flag to automatically trigger Persona verification function */
  autoTriggerPersonaVerificationFunction = false;

  /** User name for display */
  userName: string;

  /** Flag to indicate if KYB verification is pending */
  isKybVerificationPending = false;

  /** Flag to indicate if Persona verification is done */
  isDonePesrsona = false;

  /** Response object from Pusher */
  pusherResponse: { data: IPusherResponse };

  /** flag for checking maximum retry attempts */
  isCompletedRetryCount = false;

  /** descriptive message that provides information about an error. */
  errorMssage: string;

  /** varliable to store allowed attempts (for try again option ) */
  maximumAllowedAttempt: number;

  personaPusherResponse: { data: IPusherResponse };

  /** Flag to track if waiting for EDD pusher response */
  isWaitingForEddPusher = false;

  /** Flag to track if EDD flow is in progress */
  isEddFlowInProgress = false;

  /** Flag to track if  there will be and EDD flow  */
  isShowEddModal = false;

  /** Flag to track if the first attempt is made */
  isFirstAttempt = signal(false);

  /** Variable to store the attempt number */
  attemptNumber = signal(0);

  /** Variable to store the form duration seconds */
  formDurationSeconds = signal(0);

  formStartTime = signal(performance.now());

  exitPage = signal('');
  exitReason = signal('');
  failedEnquiryCount = signal(0);
  documentsSubmitted = signal(0);
  abandonedEventSent = signal(false);

  isBusinessVerificationInitiated = signal(false);

  /** Persona step names mapped to the standardised exit_page values. */
  private readonly EXIT_PAGE_MAP: Record<string, string> = {
    personal_information: 'personal_info',
    document_upload: 'document_upload',
    selfie: 'selfie',
    review: 'review'
  };

  /** Fires the initiated event once per widget open, reset on each new open. */
  initiatedEventSent = signal(false);

  /** Fires the submitted event once per widget open, reset on each new open. */
  submittedEventSent = signal(false);
  isBusinessVerificationAbadoned = signal(false);
  isBusinessVerificationCompleted = signal(false);

  // Injected services
  private personaV4Service = inject(PersonaV4Service);
  private renderer2 = inject(Renderer2);
  private document = inject<Document>(DOCUMENT);
  private gettingStartedService = inject(GettingStartedService);
  private achService = inject(AchService);
  private alertService = inject(V4AlertService);
  private pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);
  private postHogService = inject(PostHogService);
  private dialogRef = inject(MatDialogRef<PersonaVerificationV4Component>);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  public injectedData: {
    verificationType: 'kyc' | 'kyb' | 'kyc_kyb';
    sourceType: CVSourceType;
    kycOnly: boolean;
    reVerificationId?: string;
  } = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.currentStep = 'start-kyb';
    this.getNewPersonaInquiryId();
    this.loadPersona();
    this.getUserName();
  }

  /**
   * Retrieves the username from local storage.
   */
  getUserName(): void {
    const usernameFromStorage = this.localStorageService.getItem('username');
    this.userName = usernameFromStorage
      ? usernameFromStorage.replaceAll('"', '')
      : '';
  }

  /**
   * Loads Persona script dynamically.
   */
  loadPersona(): void {
    const script = this.renderer2.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.withpersona.com/dist/persona-v4.11.0.js';
    this.renderer2.appendChild(this.document.body, script);
  }

  /**
   * Retrieves a new inquiry ID for Persona verification.
   */
  getNewPersonaInquiryId(isTryAgain?: boolean): void {
    this.isKybVerificationPending = false;
    this.fetchingInquiryId = true;
    if (this.autoTriggerPersonaVerificationFunction) {
      this.buttonText = 'Loading';
    } else {
      this.buttonText = 'Please Wait';
    }
    this.subscription.push(
      this.personaV4Service
        .getInquiryIdNewPersona(
          'kyc_kyb',
          this.injectedData.sourceType,
          isTryAgain,
          this.injectedData.reVerificationId
        )
        .pipe(
          finalize(() => {
            this.fetchingInquiryId = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.maximumAllowedAttempt = res.data.maximum_allowed_attempt;
              if (res.data.status === 'failed') {
                if (
                  res.data.failed_inquiry_count >=
                  res.data.maximum_allowed_attempt
                ) {
                  this.isCompletedRetryCount = true;
                }
                this.currentStep = 'could-not-verify';
                return;
              }

              this.inquiryId = res.data?.inquiryId;
              this.getSubmissionInfo();
              this.sessionToken = res.data?.session_token;
              this.isFirstAttempt.set(!this.sessionToken?.trim());
              this.failedEnquiryCount.set(res.data?.failed_inquiry_count);

              if (isTryAgain && this.currentStep === 'could-not-verify') {
                this.personaLoading = true;
                this.personalVerification(this.inquiryId);
                return;
              }

              // this.currentStep =
              //   this.injectedData.verificationType === 'kyc'
              //     ? 'start-kyc'
              //     : 'start-kyb';
              this.currentStep = 'start-kyb';

              if (this.autoTriggerPersonaVerificationFunction) {
                this.personaLoading = true;
                this.personalVerification(this.inquiryId);
              }

              if (!this.autoTriggerPersonaVerificationFunction) {
                this.buttonText = 'Continue';
              }
            }
          },
          error: (err: HttpErrorResponse) => {
            if (err.error.errorCode === 100) {
              this.isKybVerificationPending = true;
              this.buttonText = 'Continue';
              this.alertService.infoAlert({ content: err.error.errorMsg });
            } else if (err.error.errorCode === 225) {
              this.currentStep = 'kyc-rejected';
              this.errorMssage = err.error.errorMsg;
            } else if (err.error.errorCode === 106) {
              this.verifyEmailAndMobile(err.error.errorMsg);
            }
          }
        })
    );
  }

  /**
   * @description Method for navigating to email and phone verification page.
   * @param msg -Error message
   */
  verifyEmailAndMobile(msg: string) {
    const ref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.closeAll();
        this.router.navigate(['/v4/manage/verification/index'], {
          queryParams: { openVerificationModal: true }
        });
      }
    });
  }

  /**
   * Handles button click events.
   * @param type - Type of verification ('kyc' or 'kyb' or 'kyb-not-now')
   */
  btnClickEvent(
    type: 'kyc' | 'kyb' | 'kyb-not-now' | 'close' | 'try-again' | 'edd'
  ): void {
    if (type === 'kyb-not-now' || type === 'close') {
      this.closeModal();
      return;
    }

    if (type === 'try-again') {
      this.getNewPersonaInquiryId(true);
      return;
    }

    if (this.isKybVerificationPending) {
      this.getNewPersonaInquiryId();
      return;
    }

    if (type === 'kyb' && this.currentStep === 'check-kyb') {
      this.injectedData.verificationType = 'kyb';
      this.fetchingInquiryId = true;
      this.autoTriggerPersonaVerificationFunction = true;
      this.getNewPersonaInquiryId();
      return;
    }

    this.personalVerification(this.inquiryId);
    this.buttonText = 'Loading';
    this.personaLoading = true;
  }

  /**
   * Initiates the Persona verification process.
   * @param inquiryId - Inquiry ID for Persona verification
   */
  personalVerification(inquiryId: string) {
    const { sessionToken } = this;
    const client = new Persona.Client({
      inquiryId,
      sessionToken,
      environment: `${this.PERSONA_ENVIRONMENT}`,
      onLoad: () => {
        this.formStartTime.set(performance.now());
        this.abandonedEventSent.set(false);
        this.initiatedEventSent.set(false);
        this.submittedEventSent.set(false);
        this.getSubmissionInfo('onLoad');
        this.subscribePusher(
          this.inquiryId,
          this.PUSHER_CHANNEL_NAME_PREFIX_EDD,
          this.PUSHER_EVENT_NAME_PREFIX_EDD,
          true
        );
        this.subscribePusher(
          this.inquiryId,
          this.PUSHER_CHANNEL_NAME_PREFIX,
          this.PUSHER_EVENT_NAME_PREFIX
        );
        // this.subscribePusher('123',this.PUSHER_CHANNEL_NAME_PREFIX_EDD,this.PUSHER_EVENT_NAME_PREFIX_EDD,true);
        client.open();
        this.personaLoading = false;
        this.buttonText = this.currentStep === 'check-kyb' ? 'Yes' : 'Continue';
        this.updateModalBackdropClass('0');
        this.isDonePesrsona = false;
      },
      onComplete: (data: {
        inquiryId: string;
        status: string;
        fields: { [key: string]: { type: string; value: string } };
      }) => {
        this.updateModalBackdropClass('1');
        this.getSubmissionInfo('onComplete', data);
        this.isDonePesrsona = true;

        if (
          this.injectedData.verificationType === 'kyc' &&
          data.status === 'completed' &&
          !this.injectedData.kycOnly
        ) {
          this.currentStep = 'check-kyb';
          this.buttonText = 'Please Wait';
          this.personaVerify(data.inquiryId);
        } else if (
          this.injectedData.verificationType === 'kyc' &&
          data.status === 'completed' &&
          this.injectedData.kycOnly
        ) {
          this.currentStep = 'kyb-completed';
          this.personaVerify(data.inquiryId);
        }

        if (
          (this.injectedData.verificationType === 'kyb' ||
            this.injectedData.verificationType === 'kyc_kyb') &&
          data.status === 'completed'
        ) {
          this.currentStep = 'kyb-completed';

          if (!this.waitingForPusherResponse) {
            this.setTimeOutFun(2000, this.pusherResponse);
            this.gettingStartedService.getGettingStartedData(); // Get data if needed
          } else {
            this.setTimeOutFun(30000);
          }
        }
      },
      onEvent: (
        eventName: string,
        metadata: {
          inquiryId: string;
          sessionToken: string;
          metadata?: { pageHeight: number };
          name?: string;
          nameDisplay?: string;
          path: string;
        }
      ) => {
        if (metadata.name) this.exitPage.set(metadata.name);
      },
      onCancel: () => {
        this.getSubmissionInfo('onCancel');
        this.updateModalBackdropClass('1');
        this.waitingForPusherResponse = false;
      },
      onError: (err: { status: number; code: string }) => {
        // eslint-disable-next-line no-console
        console.error(err);
        if (
          this.isBusinessVerificationInitiated() &&
          !this.isBusinessVerificationCompleted() &&
          !this.abandonedEventSent()
        ) {
          this.abandonedEventSent.set(true);
          this.triggerBusinessVerificationAbadoned('error');
        }
      }
    });
  }

  /**
   * Performs Persona verification for KYC verification type.
   * @param inquiryId - Inquiry ID for Persona verification
   */
  personaVerify(inquiryId: string) {
    this.subscription.push(
      this.achService.personaVerification(inquiryId).subscribe((res) => {
        if (!res.success) {
          const alert = this.alertService.failedAlert({
            content: 'Verification process failed please try again.',
            isCancel: true,
            doneMsg: 'Try again'
          });
          alert.afterClosed().subscribe((response: boolean | undefined) => {
            if (response !== undefined && response) {
              this.personalVerification(inquiryId);
            }
          });
        }
      })
    );
  }

  /**
   * Subscribes to Pusher channel for real-time updates.
   * @param inquiryId - Inquiry ID for Persona verification
   * @param channelNamePrefix - Prefix for the pusher channel name
   * @param eventNamePrefix - Prefix for the pusher event name
   * @param isEdd - Flag to indicate if this is for EDD flow
   */
  subscribePusher(
    inquiryId: string,
    channelNamePrefix: string,
    eventNamePrefix: string,
    isEdd = false
  ): void {
    this.personaPusherResponse = {
      data: {
        inquiry_id: null,
        inquiry_type: null,
        user_id: null,
        kyb_id: null,
        edd_inquiry_id: null,
        edd_required: null
      }
    };
    this.waitingForPusherResponse = true;

    const channelName = channelNamePrefix + inquiryId;
    const eventName = eventNamePrefix;

    const pusherCallback = (pusherResp: { data: IPusherResponse }) => {
      this.pusherResponse = pusherResp;

      if (pusherResp) {
        this.personaPusherResponse = pusherResp;
        this.waitingForPusherResponse = false;

        if (this.injectedData.verificationType === 'kyc') {
          this.buttonText = 'Yes';

          if (this.injectedData.kycOnly) {
            this.btnClickEvent('kyb-not-now');
          }
        }

        // Handle kyc_kyb verification type - close modal when KYB verification is successful
        if (
          this.injectedData.verificationType === 'kyc_kyb' &&
          this.currentStep === 'kyb-completed' &&
          pusherResp.data.kyb_id
        ) {
          // KYB verification completed successfully, close the modal
          this.updateModalBackdropClass('1');
          this.dialogRef.close(pusherResp);
          this.gettingStartedService.getGettingStartedData();
          return;
        }

        if (this.pusherResponse.data.edd_required) {
          this.isShowEddModal = true;
        }

        // Handle EDD flow
        if (
          isEdd &&
          this.pusherResponse.data.edd_inquiry_id &&
          !this.isEddFlowInProgress
        ) {
          this.isWaitingForEddPusher = false;
          this.isEddFlowInProgress = true;
          this.personalVerification(this.pusherResponse.data.edd_inquiry_id);
          this.buttonText = 'Loading';
          this.personaLoading = true;
          return;
        }

        this.gettingStartedService.getGettingStartedData();
      }
    };

    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, pusherCallback)
    );
  }

  /**
   * Updates the backdrop opacity for modal.
   * @param opacity - Opacity value for the backdrop
   */
  updateModalBackdropClass(opacity: string): void {
    const backdropElement = document.querySelector(
      '.cdk-overlay-backdrop'
    ) as HTMLElement;
    backdropElement.style.opacity = opacity;
  }

  /**
   * Sets a timeout function to close a dialog after a specified number of seconds.
   */
  setTimeOutFun(
    seconds: number,
    pusherResponse?: { data: IPusherResponse }
  ): void {
    const timeout = setTimeout(() => {
      if (
        !this.isWaitingForEddPusher ||
        (!this.waitingForPusherResponse &&
          !this.pusherResponse.data.edd_required)
      ) {
        this.updateModalBackdropClass('1');
        this.dialogRef.close(pusherResponse);
        clearTimeout(timeout);
        this.gettingStartedService.getGettingStartedData();
      }
    }, seconds);
  }

  /**
   * @description Opens support window.
   */
  openSupport() {
    if (StaticWhiteLabelConditions.zohoSupportChat) {
      window.open(StaticWhiteLabelConditions.zohoSupportChat, '_blank');
    }
  }

  closeModal(): void {
    // Track abandonment only if verification was initiated but not completed
    if (
      this.isBusinessVerificationInitiated() &&
      !this.isBusinessVerificationCompleted() &&
      !this.abandonedEventSent()
    ) {
      this.abandonedEventSent.set(true);
      this.triggerBusinessVerificationAbadoned();
    }

    this.dialogRef.close(
      this.personaPusherResponse === undefined ||
        !this.personaPusherResponse.data.inquiry_id
        ? {
            success: false,
            verificationType: `${this.injectedData.verificationType}`
          }
        : this.personaPusherResponse
    );
  }

  triggerBusinessVerificationInitiated(): void {
    // attempt_number is server-supplied and optional; the spec types it as an
    // integer, so fall back to the first attempt rather than sending undefined.
    const attemptNumber = this.attemptNumber() || 1;

    this.postHogService.trackBusinessVerificationInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      verification_type: this.injectedData.verificationType,
      is_first_attempt: attemptNumber === 1,
      attempt_number: attemptNumber,
      persona_inquiry_id: this.inquiryId
    });
  }

  triggerBusinessVerificationCompleted(data: {
    inquiryId: string;
    status: string;
    fields: { [key: string]: { type: string; value: string } };
  }): void {
    // Whole seconds: the spec types this as an integer, unlike the 2-decimal
    // value MoEngage sent. Timed from the Persona onLoad that set formStartTime.
    const formDuration = Math.round(
      (performance.now() - this.formStartTime()) / 1000
    );
    this.formDurationSeconds.set(formDuration);

    // All three counters come from the server via optional chaining, so they can
    // be undefined; the spec types them as integers.
    this.postHogService.trackBusinessVerificationSubmitted({
      ...this.postHogService.customerPayloadFromStorage(),
      verification_type: this.injectedData.verificationType,
      persona_inquiry_id: this.inquiryId,
      persona_status: data.status,
      form_duration_seconds: this.formDurationSeconds(),
      attempt_number: this.attemptNumber() || 1,
      documents_submitted: this.documentsSubmitted() || 0,
      is_resubmission: !!this.failedEnquiryCount()
    });
  }

  /**
   * @param exitReason - Why the widget ended: the user closed it, or it errored.
   */
  triggerBusinessVerificationAbadoned(
    exitReason: 'user_closed' | 'error' = 'user_closed'
  ): void {
    // Whole seconds, matching the submitted event. Timed from the Persona
    // onLoad that set formStartTime.
    const formDuration = Math.round(
      (performance.now() - this.formStartTime()) / 1000
    );
    this.formDurationSeconds.set(formDuration);

    const rawStep = this.exitPage();

    this.postHogService.trackBusinessVerificationAbandoned({
      ...this.postHogService.customerPayloadFromStorage(),
      verification_type: this.injectedData.verificationType,
      // null when the widget errored before Persona returned an inquiry.
      persona_inquiry_id: this.inquiryId || null,
      form_duration_seconds: this.formDurationSeconds(),
      attempt_number: this.attemptNumber() || 1,
      exit_reason: exitReason,
      exit_page: this.EXIT_PAGE_MAP[rawStep] || 'unknown'
    });
  }

  getSubmissionInfo(
    event?: string,
    data?: {
      inquiryId: string;
      status: string;
      fields: { [key: string]: { type: string; value: string } };
    }
  ): void {
    this.subscription.push(
      this.personaV4Service
        .getSubmissionInfo(this.inquiryId)
        .subscribe((res) => {
          if (res.success) {
            this.documentsSubmitted.set(res.data?.documents_submitted);
            this.attemptNumber.set(res.data?.attempt_number);
            switch (event) {
              case 'onLoad':
                this.isBusinessVerificationInitiated.set(true);
                if (!this.initiatedEventSent()) {
                  this.initiatedEventSent.set(true);
                  this.triggerBusinessVerificationInitiated();
                }
                break;
              case 'onCancel':
                if (!this.abandonedEventSent()) {

                  this.abandonedEventSent.set(true);
                  this.triggerBusinessVerificationAbadoned();
                }
                this.closeModal();
                break;
              case 'onComplete':
                this.isBusinessVerificationCompleted.set(true);
                if (!this.submittedEventSent()) {
                  this.submittedEventSent.set(true);
                  this.triggerBusinessVerificationCompleted(
                    data as {
                      inquiryId: string;
                      status: string;
                      fields: {
                        [key: string]: { type: string; value: string };
                      };
                    }
                  );
                }
                if (data?.status === 'failed') {
                  this.closeModal();
                }
                break;
              default:
                break;
            }
          }
        })
    );
  }

  ngOnDestroy(): void {
    // Track abandonment only if verification was initiated but not completed
    if (
      this.isBusinessVerificationInitiated() &&
      !this.isBusinessVerificationCompleted() &&
      !this.abandonedEventSent()
    ) {
      this.abandonedEventSent.set(true);
      this.triggerBusinessVerificationAbadoned();
    }

    this.subscription.forEach((el) => {
      el.unsubscribe();
    });

    // Unsubscribe from both regular and EDD pusher channels
    this.pusherService.unsubscribePusher(this.PUSHER_CHANNEL_NAME_PREFIX);
    this.pusherService.unsubscribePusher(this.PUSHER_CHANNEL_NAME_PREFIX_EDD);
  }
}
