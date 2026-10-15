import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { faClock } from '@fortawesome/pro-solid-svg-icons';
import { DOCUMENT, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, Renderer2, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { finalize, take } from 'rxjs';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { environment } from 'src/environments/environment';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';

declare let Persona: {
  Client: new (arg0: {
    templateId?: string;
    environment: string;
    inquiryId?: string;
    sessionToken?: string | null;
    onLoad: () => void;
    onComplete: (data: {
      inquiryId: string;
      status: string;
      fields: { [key: string]: { type: string; value: string } };
    }) => void;
    onCancel: () => void;
    onError: (err: { status: number; code: string }) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) => any;
};

@Component({
  selector: 'app-payee-kyb-verification',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass,
    FaIconComponent,
    CommonButtonV35Component
  ],
  templateUrl: './payee-kyb-verification.component.html',
  styleUrl: './payee-kyb-verification.component.scss'
})
export class PayeeKybVerificationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private outsideService = inject(OutsideService);
  private renderer2 = inject(Renderer2);
  private document = inject(DOCUMENT);
  private localStorageService = inject(LocalStorageService);
  public authV3Service = inject(AuthV3Service);
  private destroyRef = inject(DestroyRef);
  private personaHelperService = inject(PersonaHelperService);
  private commonVerificationService = inject(CommonVerificationService);


  userId: string;
  isLoading = signal(false);
  showSuccess = signal(false);
  showCancel = signal(false);
  showError = signal(false);
  inquiryId: string;
  sessionToken: string | null;
  logoPath = 'assets/main/app_logo.svg';
  PERSONA_ENVIRONMENT = environment.PERSONA_ENVIRONMENT;
  faClock = faClock;

  mode = signal<'payee-mode' | 'enterprise'>('payee-mode');

  successMessage = computed(() =>
    this.mode() === 'enterprise'
      ? 'Your business verification has been submitted. We will send you a notification once it is reviewed and approved.'
      : "Once verified, the funds will be released to you or made available in your Zil Money wallet for access/withdrawal, depending on the payor's payment type. We will send you a notification once approved."
  );

  constructor() {
    this.loadPersona();
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params.id;
    const params = this.route.snapshot.queryParams;

    if (this.userId) {
      this.mode.set('payee-mode');
      this.getPersonaEnquiryId(this.userId);
      return;
    }

    if (params.token && params.inquiry_id) {
      this.mode.set('enterprise');
      // The link carries its own credentials; the interceptor reads them from here.
      this.localStorageService.appToken = params.token;
      this.localStorageService.setItem(
        'browser-token',
        params.externalToken ?? ''
      );
      this.inquiryId = params.inquiry_id;
      this.openKybPersonaVerificationModal(this.inquiryId);
      return;
    }

    this.showError.set(true);
  }

  /**
   * Reopens Persona after the applicant closed it without finishing. The enterprise
   * modal resumes the inquiry itself, so it just needs reopening.
   */
  retryVerification(): void {
    this.showCancel.set(false);
    if (this.mode() === 'enterprise') {
      this.openKybPersonaVerificationModal(this.inquiryId);
    } else {
      this.personalVerification(this.inquiryId);
    }
  }

  loadPersona(): void {
    const script = this.renderer2.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.withpersona.com/dist/persona-v4.11.0.js';
    this.renderer2.appendChild(this.document.body, script);
  }

  getPersonaEnquiryId(id: string) {
    this.isLoading.set(true);
    this.showCancel.set(false);
    this.outsideService
      .getPersonaEnquiryId(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        take(1)
      )
      .subscribe({
        next: ({ data }) => {
          if (data?.inquiryId) {
            this.inquiryId = data.inquiryId;
            this.sessionToken = data.session_token;
            this.personalVerification(this.inquiryId);
          }else{
            this.showError.set(true);
          }
        },
        error: () => {
          this.showError.set(true);
        }
      });
  }

  personalVerification(inquiryId: string): void {
    this.isLoading.set(true);
    const client = new Persona.Client({
      inquiryId,
      sessionToken: this.sessionToken,
      environment: this.PERSONA_ENVIRONMENT,
      onLoad: () => {
        client.open();
        this.isLoading.set(false);
      },
      onComplete: (data: {
        inquiryId: string;
        status: string;
        fields: { [key: string]: { type: string; value: string } };
      }) => {
        if (data.status === 'completed') {
          if (this.mode() === 'payee-mode') {
            this.savePersonaData(inquiryId);
          } else {
            this.showSuccess.set(true);
          }
        } else if (data.status === 'failed') {
          this.isLoading.set(false);
        }
      },
      onCancel: () => {
        this.showCancel.set(true);
      },
      onError: () => {}
    });
  }

  savePersonaData(inquiryId: string) {
    const payload = {
      inquiry_id: inquiryId,
      receiver_id: this.userId
    };
    this.isLoading.set(true);
    this.outsideService
      .savePersonaData(payload)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showSuccess.set(true);
          }
        },
        error: () => {}
      });
  }
 
  /**
   * Enterprise onboarding resumes the inquiry here first. A spent inquiry
   * ("already completed") lands on the error state without ever opening the
   * modal; on success the session token is handed to the modal so it does not
   * resume a second time.
   */
  private openKybPersonaVerificationModal(inquiryId: string): void {
    this.showCancel.set(false);
    this.showError.set(false);
    this.isLoading.set(true);
    this.commonVerificationService
      .resumeEnterpriseVerification(inquiryId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res?.success && res.data?.session_token) {
            this.openEnterpriseModal(inquiryId, res.data.session_token);
          } else {
            this.showError.set(true);
          }
        },
        error: () => this.showError.set(true)
      });
  }

  private openEnterpriseModal(inquiryId: string, sessionToken: string): void {
    this.personaHelperService
      .openModal(
        'kyc_kyb',
        CVSourceType.other,
        false,
        undefined,
        inquiryId,
        'enterprise',
        sessionToken
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.data?.inquiry_id) {
          this.showSuccess.set(true);
          this.saveEnterpriseOnboarding(res.data.inquiry_id);
        } else {
          this.showCancel.set(true);
        }
      });
  }

  /**
   * This is to mark the completion of the enterprise onboarding completion
   */
  saveEnterpriseOnboarding(inquiryId:string){
    this.commonVerificationService
      .completeEnterpriseVerification(inquiryId)
      .pipe(
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showSuccess.set(true);
          }
        },
        error: () => {}
      });
  }
}
