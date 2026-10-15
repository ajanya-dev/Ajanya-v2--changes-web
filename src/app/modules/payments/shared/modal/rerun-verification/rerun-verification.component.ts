import { Component, DestroyRef, HostListener, inject, OnInit, Renderer2, signal } from '@angular/core';
import { CommonModule, DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { catchError, finalize, of, take } from 'rxjs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { environment } from 'src/environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, X, ShieldCheck, CheckCircle2 } from 'lucide-angular';

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
  selector: 'app-rerun-verification',
  standalone: true,
  imports: [CommonModule, MatDialogModule, NgOptimizedImage, CommonButtonV35Component, CommonButtonV4Component, A11yModule, LucideAngularModule],
  templateUrl: './rerun-verification.component.html',
  styleUrl: './rerun-verification.component.scss'
})
export class RerunVerificationComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<RerunVerificationComponent>);

  /**
   * Handles Escape key press to close the modal for accessibility.
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    event.preventDefault();
    this.onClose();
  }

  private localStorageService = inject(LocalStorageService);
  private personaHelperService = inject(PersonaHelperService);
  private headerService = inject(HeaderService);
  private commonVerificationService = inject(CommonVerificationService);
  private renderer2 = inject(Renderer2);
  private document = inject<Document>(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  public data: {
    mode?: 'kyb' | 'edd';
    sourceType?: CVSourceType;
    reVerificationId?: string;
    businessId: string;
    eddInquiryId?: string;
  } = inject(MAT_DIALOG_DATA);

  isV4 = false;
  readonly XIcon = X;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly CheckCircle2Icon = CheckCircle2;

  PERSONA_ENVIRONMENT = environment.PERSONA_ENVIRONMENT;
  sessionToken = '';

  loading = false;
  userName = '';
  businessName = '';
  isLoading = signal(false);
  isEddMode = false;

  eddRequiredDocuments = [
    'Financial Statements',
    'Bank Statement',
    'Business Executive Summary or Business Plan',
    'Key Executives Information'
  ];

  kybRequiredDocuments = [
    'Formation Document',
  ];

  get modeConfig() {
    return this.isEddMode ? {
      subtitle: 'Enhanced Due Diligence (EDD)',
      title: 'Enhanced Due Diligence Required',
      color: 'var(--v4-common-violet-color)',
      docs: this.eddRequiredDocuments,
    } : {
      subtitle: 'Business Re-Verification',
      title: 'Business Re-Verification Required',
      color: 'var(--v4-common-green-color)',
      docs: this.kybRequiredDocuments,
    };
  }

  ngOnInit(): void {
    this.isEddMode = this.data?.mode === 'edd';
    this.isV4 =
      this.localStorageService.getItem('isV4LayoutEnabled') === 1;
    this.getUserName();
    this.getBusinessName();
    if (this.isEddMode) {
      this.loadPersona();
    }
  }

  /**
   * Loads Persona script dynamically for EDD verification.
   */
  private loadPersona(): void {
    const script = this.renderer2.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.withpersona.com/dist/persona-v4.11.0.js';
    this.renderer2.appendChild(this.document.body, script);
  }

  /**
   * Resumes the EDD verification process using Persona.
   */
  private resumeEddVerification(): void {
    this.commonVerificationService.resumeEddVerification(this.data?.eddInquiryId || '').pipe(
    catchError(() => {
      this.loading = false;
      return of({ success: false, data: {data: { inquiry_id: '', session_token: '' } } });
    }),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe((res) => {
      if (res.success) {
        this.sessionToken = res.data.data.session_token;
        if(this.sessionToken) {
          this.startEddVerification(this.data?.eddInquiryId || '');
        }
      }
    });
  }

  /**
   * Retrieves the username from local storage for personalized greeting.
   */
  private getUserName(): void {
    const usernameFromStorage = this.localStorageService.getItem('username');
    this.userName = usernameFromStorage
      ? String(usernameFromStorage).replaceAll('"', '')
      : '';
  }

  /**
   * Retrieves the business name from the API.
   */
  private getBusinessName(): void {
    this.isLoading.set(true);
    this.commonVerificationService.getUserBusinessName(this.data?.businessId )
    .pipe(finalize(() => this.isLoading.set(false)),
    take(1)
  ) .subscribe((res) => {
      if (res.success) {
        this.businessName = res.data.businessName;
      }
    });
  }

  /**
   * Opens Persona verification modal to rerun KYB verification or EDD verification.
   */
  onVerifyNow(): void {
    this.loading = true;

    if (this.isEddMode && this.data?.eddInquiryId) {
      this.resumeEddVerification();
    } else {
      this.dialogRef.close({ action: 'verify' });

      this.personaHelperService
        .openModal(
          'kyc_kyb',
          this.data?.sourceType || CVSourceType.other,
          false,
          this.data?.reVerificationId
        )
        .subscribe((res) => {
          if (res?.data?.inquiry_id) {
            this.localStorageService.removeItem('rerunVerification');
            this.headerService.setRerunKybStatus(false);
          }
        });
    }
  }

  /**
   * Starts the EDD verification process using Persona.
   */
  private startEddVerification(eddInquiryId: string): void {
    const client = new Persona.Client({
      inquiryId: eddInquiryId,
      environment: this.PERSONA_ENVIRONMENT,
      sessionToken: this.sessionToken,
      onLoad: () => {
        this.updateModalBackdropClass('0');
        this.dialogRef.close({ action: 'verify' });
        client.open();
        this.loading = false;
      },
      onComplete: (data: {
        inquiryId: string;
        status: string;
        fields: { [key: string]: { type: string; value: string } };
      }) => {
        this.updateModalBackdropClass('1');
        if (data.status === 'completed') {
          this.localStorageService.removeItem('eddRequestData');
          this.headerService.setEddTriggerStatus(false);
          this.onEddVerificationComplete(data.inquiryId);
          this.dialogRef.close({ action: 'edd-completed', inquiryId: data.inquiryId });
        } else {
          this.dialogRef.close({ action: 'edd-incomplete', status: data.status });
        }
      },
      onCancel: () => {
        this.updateModalBackdropClass('1');
        this.loading = false;
        this.dialogRef.close({ action: 'edd-cancelled' });
      },
      onError: (err: { status: number; code: string }) => {
        this.updateModalBackdropClass('1');
        this.loading = false;
        this.dialogRef.close({ action: 'edd-error', error: err });
      }
    });
  }

  /**
   * Updates the EDD verification status in the database.
   */
  private onEddVerificationComplete(inquiryId: string): void {
    this.commonVerificationService.completeEddVerification(inquiryId).subscribe();
  }

  /**
   * Updates the backdrop opacity for modal.
   */
  private updateModalBackdropClass(opacity: string): void {
    const backdropElement = document.querySelector(
      '.cdk-overlay-backdrop'
    ) as HTMLElement;
    if (backdropElement) {
      backdropElement.style.opacity = opacity;
    }
  }

  /**
   * Closes the modal when user chooses to verify later.
   */
  onMaybeLater(): void {
    this.dialogRef.close({ action: 'later' });
  }

  /**
   * Closes the modal via the X button.
   */
  onClose(): void {
    this.dialogRef.close({ action: 'close' });
  }
}
