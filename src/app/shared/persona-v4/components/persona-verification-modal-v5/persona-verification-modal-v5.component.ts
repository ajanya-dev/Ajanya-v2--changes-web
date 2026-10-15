import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Channel } from 'pusher-js';
import { Subscription, finalize, map } from 'rxjs';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { PusherService } from 'src/app/core/services/pusher.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { AchService } from 'src/app/shared/service/ach/ach.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';
import {
  faXmark,
  faChevronRight,
  faChevronLeft,
  faCheck,
  faEye,
  faEyeSlash
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IPusherResponse,
  PersonaModalMode
} from '../../model/persona-kyc-kyb-pusher';
import {
  IFormationDocumentExample,
  IInquiryDetails,
  IKybMissingField
} from '../../model/persona-v4';
import { PersonaV4Service } from '../../service/persona-v4.service';
import { flattenFields } from './components/right-panel/field-map.util';
import {
  LeftPanelComponent,
  BtnClickType
} from './components/left-panel/left-panel.component';
import { RightPanelComponent } from './components/right-panel/right-panel.component';
import { mapPersonaPageToCategory } from './components/right-panel/page-to-category.util';
import {
  PreviewSection,
  buildPreviewSections
} from './components/right-panel/right-panel-sections.util';

declare let Persona: {
  Client: new (arg0: {
    templateId?: string;
    environment: string;
    inquiryId?: string;
    sessionToken?: string | null;
    parent?: HTMLElement;
    onReady: () => void;
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

interface ModalData {
  verificationType: 'kyc' | 'kyb' | 'kyc_kyb';
  sourceType?: CVSourceType;
  kycOnly: boolean;
  reVerificationId?: string;
  inquiryId?: string;
  mode?: PersonaModalMode;
  sessionToken?: string;
  missingFields?: IKybMissingField[];
}

@Component({
  selector: 'app-persona-verification-modal-v5',
  standalone: true,
  imports: [
    CommonModule,
    LeftPanelComponent,
    RightPanelComponent,
    FaIconComponent,
    MatTooltip
  ],
  templateUrl: './persona-verification-modal-v5.component.html',
  styleUrl: './persona-verification-modal-v5.component.scss'
})
export class PersonaVerificationModalV5Component implements OnInit, OnDestroy {
  // DI
  private personaV4Service = inject(PersonaV4Service);
  private renderer2 = inject(Renderer2);
  private document = inject<Document>(DOCUMENT);
  private gettingStartedService = inject(GettingStartedService);
  private achService = inject(AchService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);
  private postHogService = inject(PostHogService);
  private commonVerificationService = inject(CommonVerificationService);
  private dialogRef = inject(
    MatDialogRef<
      PersonaVerificationModalV5Component,
      { data: IPusherResponse } | undefined
    >
  );

  private data = inject<ModalData>(MAT_DIALOG_DATA);
  private router = inject(Router);

  private subscriptions: Subscription[] = [];
  private pusherChannels: Channel[] = [];

  // Modal inputs
  verificationType!: 'kyc' | 'kyb' | 'kyc_kyb';
  sourceType?: CVSourceType;
  kycOnly = false;
  reVerificationId?: string;
  providedInquiryId?: string;
  mode: PersonaModalMode = 'default';

  // State machine
  private dialogSizeReady = false;
  private currentStepValue:
    | 'checking-prior-kyc'
    | 'prior-kyc-prompt'
    | 'start-kyc'
    | 'check-kyb'
    | 'start-kyb'
    | 'reverify-intro'
    | 'kyb-completed'
    | 'could-not-verify'
    | 'kyc-rejected' = 'checking-prior-kyc';

  get currentStep(): typeof this.currentStepValue {
    return this.currentStepValue;
  }

  set currentStep(value: typeof this.currentStepValue) {
    this.currentStepValue = value;
    if (this.dialogSizeReady) this.syncPreviewSize();
  }

  isV4Enabled = signal(
    this.localStorageService.getItem('isV4LayoutEnabled') === 1
  );

  private get alert() {
    return this.isV4Enabled() ? this.v4AlertService : this.alertService;
  }

  // Persona config
  PERSONA_TEMPLATE_ID = environment.PERSONA_TEMPLATE_ID;
  PERSONA_ENVIRONMENT = environment.PERSONA_ENVIRONMENT;
  PUSHER_CHANNEL_NAME_PREFIX = 'persona-kyc-Kyb-completed-';
  PUSHER_CHANNEL_NAME_PREFIX_EDD = 'persona-kyc-kyb-edd-required-';
  PUSHER_EVENT_NAME_PREFIX = 'persona-kyc-kyb-completed-event';
  PUSHER_EVENT_NAME_PREFIX_EDD = 'persona-kyc-kyb-edd-event';

  // Inquiry / session
  inquiryId = '';
  sessionToken: string | null = null;
  userName = '';
  priorKycName = '';
  buttonText = 'Continue';

  // Loading flags
  fetchingInquiryId = false;
  personaLoading = false;
  waitingForPusherResponse = false;
  autoTriggerPersonaVerificationFunction = false;

  // Error state
  errorMssage = '';
  maximumAllowedAttempt = 0;
  isCompletedRetryCount = false;
  isKybVerificationPending = false;

  // Completion tracking
  isDonePesrsona = false;
  pusherResponse: { data: IPusherResponse } | undefined;
  personaPusherResponse: { data: IPusherResponse } | undefined;

  // EDD
  isWaitingForEddPusher = false;
  isEddFlowInProgress = false;
  isShowEddModal = false;

  // Signals exposed to children
  isFirstAttempt = signal(false);
  attemptNumber = signal(0);
  formDurationSeconds = signal(0);
  formStartTime = signal(performance.now());
  exitPage = signal('');
  failedEnquiryCount = signal(0);
  documentsSubmitted = signal(0);
  abandonedEventSent = signal(false);

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

  isBusinessVerificationInitiated = signal(false);
  isBusinessVerificationCompleted = signal(false);
  sampleFormationDocument = signal<string | undefined>(undefined);
  /** State-specific formation document guidance for this inquiry (OCW-23337). */
  formationDocumentExample = signal<IFormationDocumentExample | null>(null);

  inquiryDetails = signal<IInquiryDetails | undefined>(undefined);
  /** True while an inquiry-details fetch is in flight (incl. its debounce
   *  window), so the preview can shimmer instead of claiming "Not started yet". */
  detailsLoading = signal(false);
  /** Backend-computed fields the migrating user must still complete. */
  missingFields = signal<IKybMissingField[]>([]);
  activeCategory = signal<string | null>(null);
  pollStatus = signal<'idle' | 'live' | 'completed'>('idle');
  sdkEmbedded = signal(false);
  showPreview = signal(true);
  private readonly COMPACT_BREAKPOINT = 1175;
  isCompact = signal(false);

  faXmark = faXmark;
  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faCheck = faCheck;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  /** Step progress mirrored from the right preview, driving the left stepper. */
  previewSteps = computed<PreviewSection[]>(() =>
    buildPreviewSections(
      this.inquiryDetails(),
      this.activeCategory(),
      this.pollStatus() === 'completed'
    )
  );

  /**
   * The backend missing-fields list with `filled` recomputed live from the
   * current inquiry details, so items tick off as the user completes them.
   * Backend gives us "what's still required"; we resolve "what's done" ourselves.
   */
  missingFieldsView = computed<IKybMissingField[]>(() => {
    const list = this.missingFields();
    if (!list.length) return [];
    const raw =
      this.inquiryDetails()?.inquiry_details?.data?.attributes?.fields;
    const flat = raw ? flattenFields(raw) : {};
    return list.map((f) => ({
      ...f,
      filled: Object.prototype.hasOwnProperty.call(flat, f.key)
    }));
  });

  /** Count of still-outstanding fields — drives the intro copy and gating. */
  outstandingFieldCount = computed(
    () => this.missingFieldsView().filter((f) => !f.filled).length
  );

  /** 1-based number of the active step (for the "STEP n OF N" header). */
  currentStepNumber = computed(() => {
    const steps = this.previewSteps();
    const current = steps.find((s) => s.status === 'current');
    if (current) return current.number;
    return steps.some((s) => s.status === 'done') ? steps.length : 1;
  });

  // Debounced page-change fetch
  private pageChangeFetchTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild(LeftPanelComponent) leftPanel!: LeftPanelComponent;

  constructor() {
    this.verificationType = this.data.verificationType;
    this.sourceType = this.data.sourceType;
    this.kycOnly = this.data.kycOnly;
    this.reVerificationId = this.data.reVerificationId;
    this.providedInquiryId = this.data.inquiryId;
    this.mode = this.data.mode ?? 'default';
    this.sessionToken = this.data.sessionToken ?? null;
    this.missingFields.set(this.data.missingFields ?? []);
  }

  ngOnInit(): void {
    this.currentStep = 'checking-prior-kyc';
    const compact = window.innerWidth < this.COMPACT_BREAKPOINT;
    this.isCompact.set(compact);
    this.showPreview.set(!compact);
    if (this.providedInquiryId) {
      this.initWithExistingInquiry(this.providedInquiryId);
    } else {
      this.checkPriorKyc();
    }
    this.loadPersona();
    this.getUserName();
    this.dialogSizeReady = true;
    this.syncPreviewSize();
  }

  /**
   * Re-evaluate the layout when the window crosses the compact breakpoint.
   * On a transition we reset the panel toggle to that layout's default
   * (compact → form first, wide → side-by-side) and resize the dialog.
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    const compact = window.innerWidth < this.COMPACT_BREAKPOINT;
    if (compact === this.isCompact()) return;
    this.isCompact.set(compact);
    this.showPreview.set(!compact);
    if (this.dialogSizeReady) this.syncPreviewSize();
  }

  getUserName(): void {
    const v = this.localStorageService.getItem('username');
    this.userName = v ? v.replaceAll('"', '') : '';
  }

  private checkPriorKyc(): void {
    this.subscriptions.push(
      this.personaV4Service.checkPriorKyc().subscribe({
        next: (res) => {
          if (res?.success && res.data?.has_prior_kyc) {
            const d = res.data;
            this.priorKycName =
              d.full_name?.trim() ||
              `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim();
            this.currentStep = 'prior-kyc-prompt';
            return;
          }
          // has_prior_kyc=false or non-success response → proceed normally.
          this.getNewPersonaInquiryId();
        },
        error: () => {
          // Fail-open: network or HTTP error must not block verification.
          this.getNewPersonaInquiryId();
        }
      })
    );
  }

  /**
   * Initializes the modal against an inquiry the backend already created
   * (dynamic compliance re-verification, or enterprise onboarding). Skips the
   * prior-KYC check and the create call. The default flow resumes the inquiry
   * here to obtain its session token; enterprise receives the token from the
   * opener and skips the resume.
   */
  private initWithExistingInquiry(inquiryId: string): void {
    this.inquiryId = inquiryId;
    this.isFirstAttempt.set(false);
    // Show the re-verify intro (with the missing-fields checklist) when the
    // backend told us what's outstanding; otherwise fall back to the standard
    // business-verification intro so nothing regresses if the list is absent.
    this.currentStep = this.missingFields().length
      ? 'reverify-intro'
      : 'start-kyb';

    if (this.mode === 'enterprise' && this.sessionToken) {
      this.buttonText = 'Continue';
      this.fetchInquiryDetails();
      return;
    }

    this.buttonText = 'Please Wait';
    this.resumeInquiry(inquiryId);
  }

  /**
   * Resumes a pre-created Persona inquiry to obtain its session token and load
   * its current details. Runs on modal open so the session is ready by the time
   * the user presses Continue.
   */
  private resumeInquiry(inquiryId: string): void {
    this.fetchingInquiryId = true;
    // The details fetch is chained off this call, so the preview is already
    // "loading" from here — otherwise it would assert "Not started yet."
    // for the whole resume round-trip.
    this.detailsLoading.set(true);
    this.subscriptions.push(
      this.commonVerificationService
        .resumeEddVerification(inquiryId)
        .pipe(
          map((res) => (res?.success ? res.data?.data?.session_token : null)),
          finalize(() => {
            this.fetchingInquiryId = false;
          })
        )
        .subscribe({
          error: () => this.detailsLoading.set(false),
          next: (sessionToken) => {
            this.detailsLoading.set(false);
            if (!sessionToken) return;
            this.sessionToken = sessionToken;
            this.buttonText = 'Continue';
            // Re-raises detailsLoading for its own round-trip.
            this.fetchInquiryDetails();
          }
        })
    );
  }

  loadPersona(): void {
    // v5.5.0 required for inline SDK embedding via `parent:` option.
    // v4 ignores `parent:` and opens as a centered overlay.
    const existing = this.document.querySelector(
      'script[data-persona-sdk="v5"]'
    );
    if (existing) return;
    const script = this.renderer2.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.withpersona.com/dist/persona-v5.5.0.js';
    script.setAttribute('data-persona-sdk', 'v5');
    this.renderer2.appendChild(this.document.body, script);
  }

  getNewPersonaInquiryId(isTryAgain?: boolean, priorKyc?: 'apply'): void {
    this.isKybVerificationPending = false;
    this.fetchingInquiryId = true;
    // As with resume: the details fetch is chained off this call.
    this.detailsLoading.set(true);
    this.buttonText = this.autoTriggerPersonaVerificationFunction
      ? 'Loading'
      : 'Please Wait';

    this.subscriptions.push(
      this.personaV4Service
        .getInquiryIdNewPersona(
          'kyc_kyb',
          this.sourceType as CVSourceType,
          isTryAgain,
          this.reVerificationId,
          priorKyc
        )
        .pipe(finalize(() => (this.fetchingInquiryId = false)))
        .subscribe({
          next: (res) => {
            // Cleared here; the fetchInquiryDetails() below re-raises it.
            this.detailsLoading.set(false);
            if (!res.success) return;
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

            this.inquiryId = res.data.inquiryId;
            this.attemptNumber.set(res.data.attempt_number);
            this.fetchInquiryDetails();
            this.sessionToken = res.data.session_token;
            this.isFirstAttempt.set(!this.sessionToken?.trim());
            this.failedEnquiryCount.set(res.data.failed_inquiry_count);

            if (isTryAgain && this.currentStep === 'could-not-verify') {
              this.personaLoading = true;
              this.personalVerification(this.inquiryId);
              return;
            }

            this.currentStep = 'start-kyb';

            if (this.autoTriggerPersonaVerificationFunction) {
              this.personaLoading = true;
              this.personalVerification(this.inquiryId);
            } else {
              this.buttonText = 'Continue';
            }
          },
          error: (err: HttpErrorResponse) => {
            this.detailsLoading.set(false);
            const errorCode = err.error?.errorCode;
            if (errorCode === 100) {
              this.isKybVerificationPending = true;
              this.buttonText = 'Continue';
              this.alert.infoAlert({ content: err.error.errorMsg });
            } else if (errorCode === 225) {
              this.currentStep = 'kyc-rejected';
              this.errorMssage = err.error.errorMsg;
            } else if (errorCode === 106) {
              this.verifyEmailAndMobile(err.error.errorMsg);
            }
            // Don't strand the user on the `checking-prior-kyc` loader when
            // the inquiry call fails — the modal header has no close button
            // on that step. Drop them on the intro screen so they can retry
            // (`isKybVerificationPending` routes the click to a retry) or
            // close the dialog.
            if (this.currentStep === 'checking-prior-kyc') {
              this.currentStep = 'start-kyb';
              // this.currentStep =
              //   this.verificationType === 'kyc' ? 'start-kyc' : 'start-kyb';
              this.isKybVerificationPending = true;
              this.buttonText = 'Continue';
            }
          }
        })
    );
  }

  private verifyEmailAndMobile(msg: string): void {
    const ref = this.alert.warningAlert({
      content: msg,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    ref.afterClosed().subscribe((res: boolean | undefined) => {
      if (res) {
        this.dialogRef.close(undefined);
        this.router.navigate(['/manage/users/verify-email-phone']);
      }
    });
  }

  onBtnClick(type: BtnClickType): void {
    if (type === 'use-existing-kyc') {
      this.getNewPersonaInquiryId(false, 'apply');
      return;
    }

    if (type === 'start-fresh-kyc') {
      this.getNewPersonaInquiryId();
      return;
    }

    if (type === 'kyb-not-now' || type === 'close') {
      this.closePage();
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
      this.verificationType = 'kyb';
      this.fetchingInquiryId = true;
      this.autoTriggerPersonaVerificationFunction = true;
      this.getNewPersonaInquiryId();
      return;
    }

    this.personalVerification(this.inquiryId);
    this.buttonText = 'Loading';
    this.personaLoading = true;
  }

  personalVerification(inquiryId: string): void {
    const { sessionToken } = this;
    const parent = this.leftPanel?.personaEmbed?.nativeElement;
    if (!parent) return; // Should not happen after AfterViewInit.

    this.sdkEmbedded.set(true);

    const client = new Persona.Client({
      inquiryId,
      sessionToken,
      environment: `${this.PERSONA_ENVIRONMENT}`,
      parent,
      onReady: () => {
        this.formStartTime.set(performance.now());
        this.abandonedEventSent.set(false);
        this.initiatedEventSent.set(false);
        this.submittedEventSent.set(false);
        this.fetchInquiryDetails('onReady');
        this.pollStatus.set('live');
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
        client.open();
        this.personaLoading = false;
        this.buttonText = this.currentStep === 'check-kyb' ? 'Yes' : 'Continue';
        this.isDonePesrsona = false;
      },
      onComplete: (data) => {
        this.fetchInquiryDetails('onComplete', data);
        this.isDonePesrsona = true;
        this.sdkEmbedded.set(false);

        if (
          this.verificationType === 'kyc' &&
          data.status === 'completed' &&
          !this.kycOnly
        ) {
          this.currentStep = 'check-kyb';
          this.buttonText = 'Please Wait';
          this.personaVerify(data.inquiryId);
        } else if (
          this.verificationType === 'kyc' &&
          data.status === 'completed' &&
          this.kycOnly
        ) {
          this.currentStep = 'kyb-completed';
          this.personaVerify(data.inquiryId);
        }

        if (
          (this.verificationType === 'kyb' ||
            this.verificationType === 'kyc_kyb') &&
          data.status === 'completed'
        ) {
          this.currentStep = 'kyb-completed';
          if (this.mode === 'enterprise') {
            this.navigateBack({
              data: {
                inquiry_id: data.inquiryId,
                user_id: null,
                inquiry_type: null,
                edd_required: null
              }
            });
            return;
          }
          if (!this.waitingForPusherResponse) {
            this.setTimeOutFun(2000);
            this.gettingStartedService.getGettingStartedData();
          } else {
            this.setTimeOutFun(30000);
          }
        }
      },
      onEvent: (eventName, metadata) => {
        if (metadata?.name) this.exitPage.set(metadata?.name);
        if (eventName === 'page-change' && metadata) {
          const cat = mapPersonaPageToCategory(
            metadata?.name,
            metadata?.path,
            metadata?.nameDisplay
          );
          this.activeCategory.set(cat);
          this.debouncedFetchInquiryDetails();
        }
      },
      onCancel: () => {
        this.fetchInquiryDetails('onCancel');
        this.waitingForPusherResponse = false;
        this.sdkEmbedded.set(false);
      },
      onError: (err) => {
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

  personaVerify(inquiryId: string): void {
    this.subscriptions.push(
      this.achService.personaVerification(inquiryId).subscribe((res) => {
        if (res.success) return;
        const alert = this.alert.failedAlert({
          content: 'Verification process failed please try again.',
          isCancel: true,
          doneMsg: 'Try again'
        });
        alert.afterClosed().subscribe((response: boolean | undefined) => {
          if (response) this.personalVerification(inquiryId);
        });
      })
    );
  }

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
    const cb = (pusherResp: { data: IPusherResponse }) => {
      this.pusherResponse = pusherResp;
      if (!pusherResp) return;

      this.personaPusherResponse = pusherResp;
      this.waitingForPusherResponse = false;

      if (this.verificationType === 'kyc') {
        this.buttonText = 'Yes';
        if (this.kycOnly) this.onBtnClick('kyb-not-now');
      }

      if (
        this.verificationType === 'kyc_kyb' &&
        this.currentStep === 'kyb-completed' &&
        pusherResp.data.kyb_id
      ) {
        this.pollStatus.set('completed');
        this.gettingStartedService.getGettingStartedData();
        this.navigateBack(pusherResp);
        return;
      }

      if (this.pusherResponse.data.edd_required) this.isShowEddModal = true;

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
    };

    this.pusherChannels.push(
      this.pusherService.subscribePusher(channelName).bind(eventNamePrefix, cb)
    );
  }

  setTimeOutFun(seconds: number): void {
    const t = setTimeout(() => {
      if (
        !this.isWaitingForEddPusher ||
        (!this.waitingForPusherResponse &&
          !this.pusherResponse?.data.edd_required)
      ) {
        this.pollStatus.set('completed');
        this.gettingStartedService.getGettingStartedData();
        clearTimeout(t);
        // Read the latest pusher response at firing time — not a stale
        // snapshot from when the timeout was scheduled. Without this, the
        // dialog closes with `undefined` whenever Persona's onComplete
        // fires before the Pusher event arrives (the common case for KYB).
        const result =
          !this.personaPusherResponse ||
          !this.personaPusherResponse.data.inquiry_id
            ? undefined
            : this.personaPusherResponse;
        this.navigateBack(result);
      }
    }, seconds);
  }

  openSupport(): void {
    if (StaticWhiteLabelConditions.zohoSupportChat) {
      window.open(StaticWhiteLabelConditions.zohoSupportChat, '_blank');
    }
  }

  togglePreview(): void {
    this.showPreview.update((v) => !v);
    this.syncPreviewSize();
  }

  /** Back button (compact layout): return from the preview to the form. */
  showForm(): void {
    this.showPreview.set(false);
    this.syncPreviewSize();
  }

  /** Whether the right preview column is shown (never on the prior-KYC steps). */
  get isPriorKycStep(): boolean {
    return (
      this.currentStepValue === 'checking-prior-kyc' ||
      this.currentStepValue === 'prior-kyc-prompt'
    );
  }

  get showPreviewPanel(): boolean {
    return this.showPreview() && !this.isPriorKycStep;
  }

  /** Whether the left (form) column is visible. In the compact layout the form
   *  and preview swap, so the form hides while the preview is shown. In the
   *  wide layout the form is always visible. */
  get showLeftPanel(): boolean {
    return this.isCompact() ? !this.showPreviewPanel : true;
  }

  /** Widen the dialog when the preview is shown side-by-side; narrow otherwise.
   *  Height stays constant so only the width animates (no vertical jiggle). */
  private syncPreviewSize(): void {
    const height = 'min(720px, 92vh)';
    if (this.isCompact()) {
      // Single-panel layout: size to whichever panel is showing.
      const width = this.showPreviewPanel
        ? 'min(560px, 96vw)'
        : 'min(430px, 96vw)';
      this.dialogRef.updateSize(width, height);
    } else if (this.showPreviewPanel) {
      this.dialogRef.updateSize('min(940px, 96vw)', height);
    } else {
      this.dialogRef.updateSize('min(430px, 96vw)', height);
    }
  }

  closePage(): void {
    if (
      this.isBusinessVerificationInitiated() &&
      !this.isBusinessVerificationCompleted() &&
      !this.abandonedEventSent()
    ) {
      this.abandonedEventSent.set(true);
      this.triggerBusinessVerificationAbadoned();
    }

    const result =
      !this.personaPusherResponse || !this.personaPusherResponse.data.inquiry_id
        ? undefined
        : this.personaPusherResponse;

    this.navigateBack(result);
  }

  /** Closes the dialog and returns the verification result to the opener. */
  private navigateBack(result: { data: IPusherResponse } | undefined): void {
    this.dialogRef.close(result);
  }

  private fetchInquiryDetails(
    event?: string,
    data?: {
      inquiryId: string;
      status: string;
      fields: { [key: string]: { type: string; value: string } };
    }
  ): void {
    if (!this.inquiryId) return;
    this.detailsLoading.set(true);
    this.subscriptions.push(
      this.personaV4Service.getInquiryDetails(this.inquiryId).subscribe({
        error: () => this.detailsLoading.set(false),
        next: (res) => {
          this.detailsLoading.set(false);
          if (
            !res.success ||
            !res.data?.inquiry_details?.data?.attributes?.fields
          )
            return;
          this.inquiryDetails.set(res.data);
          this.documentsSubmitted.set(this.countSubmittedDocuments(res.data));
          this.sampleFormationDocument.set(res.data.sample_formation_doc);
          this.formationDocumentExample.set(
            res.data.formation_document_example ?? null
          );

          switch (event) {
            case 'onReady':
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
              this.closePage();
              break;
            case 'onComplete':
              this.isBusinessVerificationCompleted.set(true);
              if (data && !this.submittedEventSent()) {
                this.submittedEventSent.set(true);
                this.triggerBusinessVerificationCompleted(data);
              }
              if (data?.status === 'failed') this.closePage();
              break;
            default:
              break;
          }
        }
      })
    );
  }

  /**
   * Count Persona document-type fields (government_id, selfie, document, generic)
   * whose value is populated. The new inquiry-details response doesn't include a
   * pre-computed `documents_submitted`, so we derive it from the fields map.
   */
  private countSubmittedDocuments(details: IInquiryDetails): number {
    const fields = details?.inquiry_details?.data?.attributes?.fields;
    if (!fields) return 0;
    const DOC_TYPES = new Set([
      'government_id',
      'selfie',
      'document',
      'generic'
    ]);
    let count = 0;
    Object.keys(fields).forEach((k) => {
      const f = fields[k];
      if (!f || !DOC_TYPES.has(f.type)) return;
      if (f.value === null || f.value === undefined) return;
      count += 1;
    });
    return count;
  }

  private debouncedFetchInquiryDetails(): void {
    // Flag the load up front so the preview shimmers through the debounce
    // window too, rather than showing stale "Not started yet." for half a second.
    this.detailsLoading.set(true);
    if (this.pageChangeFetchTimer) clearTimeout(this.pageChangeFetchTimer);
    this.pageChangeFetchTimer = setTimeout(
      () => this.fetchInquiryDetails(),
      500
    );
  }

  private triggerBusinessVerificationInitiated(): void {
    // attempt_number is server-supplied and optional; the spec types it as an
    // integer, so fall back to the first attempt rather than sending undefined.
    const attemptNumber = this.attemptNumber() || 1;

    this.postHogService.trackBusinessVerificationInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      verification_type: this.verificationType,
      is_first_attempt: attemptNumber === 1,
      attempt_number: attemptNumber,
      persona_inquiry_id: this.inquiryId
    });
  }

  private triggerBusinessVerificationCompleted(data: {
    inquiryId: string;
    status: string;
    fields: { [key: string]: { type: string; value: string } };
  }): void {
    // Whole seconds: the spec types this as an integer, unlike the 2-decimal
    // value MoEngage sent. Timed from the Persona onReady that set formStartTime.
    const dur = Math.round((performance.now() - this.formStartTime()) / 1000);
    this.formDurationSeconds.set(dur);

    this.postHogService.trackBusinessVerificationSubmitted({
      ...this.postHogService.customerPayloadFromStorage(),
      verification_type: this.verificationType,
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
  private triggerBusinessVerificationAbadoned(
    exitReason: 'user_closed' | 'error' = 'user_closed'
  ): void {
    // Whole seconds, matching the submitted event. Timed from the Persona
    // onReady that set formStartTime.
    const dur = Math.round((performance.now() - this.formStartTime()) / 1000);
    this.formDurationSeconds.set(dur);

    const rawStep = this.exitPage();

    this.postHogService.trackBusinessVerificationAbandoned({
      ...this.postHogService.customerPayloadFromStorage(),
      verification_type: this.verificationType,
      // null when the widget errored before Persona returned an inquiry.
      persona_inquiry_id: this.inquiryId || null,
      form_duration_seconds: this.formDurationSeconds(),
      attempt_number: this.attemptNumber() || 1,
      exit_reason: exitReason,
      exit_page: this.EXIT_PAGE_MAP[rawStep] || 'unknown'
    });
  }

  ngOnDestroy(): void {
    if (
      this.isBusinessVerificationInitiated() &&
      !this.isBusinessVerificationCompleted() &&
      !this.abandonedEventSent()
    ) {
      this.abandonedEventSent.set(true);
      this.triggerBusinessVerificationAbadoned();
    }

    if (this.pageChangeFetchTimer) clearTimeout(this.pageChangeFetchTimer);
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.pusherService.unsubscribePusher(this.PUSHER_CHANNEL_NAME_PREFIX);
    this.pusherService.unsubscribePusher(this.PUSHER_CHANNEL_NAME_PREFIX_EDD);
  }
}
