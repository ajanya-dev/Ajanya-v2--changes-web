import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormBuilder,
  Validators
} from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Handshake,
  CircleCheck,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-angular';
import { finalize, take } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IV4IntegrationApp } from '../../data/v4-integration-data';

export interface IFaqItem {
  id: number;
  app_name: string;
  question: string;
  answer: string;
  is_active: boolean;
}

type ModalStep = 'faq-selection' | 'requirements' | 'success';

@Component({
  selector: 'app-v4-coming-soon-request-modal',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    PhoneInputV4Component
  ],
  templateUrl: './v4-coming-soon-request-modal.component.html'
})
export class V4ComingSoonRequestModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4ComingSoonRequestModalComponent>);
  private subscriptionService = inject(SubscriptionService);
  private userProfileService = inject(UserProfileService);
  private data = inject<{ app: IV4IntegrationApp }>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  /** Synced from app-phone-input-v4 for country-aware digit length validation */
  currentCountryCode = '';
  currenCountryPhoneLength = {} as { min: number; max: number };

  readonly closeIcon = X;
  readonly handshakeIcon = Handshake;
  readonly circleCheckIcon = CircleCheck;
  readonly checkIcon = Check;
  readonly chevronDownIcon = ChevronDown;
  readonly chevronUpIcon = ChevronUp;

  app!: IV4IntegrationApp;
  currentStep = signal<ModalStep>('faq-selection');
  faqs = signal<IFaqItem[]>([]);
  selectedFaqIds = signal<Set<number>>(new Set());
  expandedFaqIds = signal<Set<number>>(new Set());
  loading = signal(false);
  loadingFaqs = signal(false);

  readonly minDate = new Date().toISOString().split('T')[0];

  requirementsForm: FormGroup<{
    contactName: FormControl<string | null>;
    contactEmail: FormControl<string | null>;
    contactPhone: FormControl<string | null>;
    additionalDetails: FormControl<string | null>;
    desiredDate: FormControl<string | null>;
  }>;

  ngOnInit(): void {
    this.app = this.data.app;
    this.requirementsForm = this.fb.group({
      contactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, ValidationService.emailValidator]],
      contactPhone: [
        '',
        [Validators.required, ValidationService.customMinLength(10)]
      ],
      additionalDetails: [''],
      desiredDate: ['', Validators.required]
    });
    this.loadFaqs();
    this.prefillContactFromProfile();
  }

  /**
   * Fills name, email, and phone from the signed-in user's profile (/user-profile).
   */
  private prefillContactFromProfile(): void {
    this.userProfileService
      .getPersonalInfo()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const d = res?.data;
        if (!d) {
          return;
        }
        this.requirementsForm.patchValue(
          {
            contactName: d.name || null,
            contactEmail: d.email?.trim() || null,
            contactPhone: d.phone?.trim() || null
          },
          { emitEvent: false }
        );
      });
  }

  /**
   * Updates phone validators when country / length changes from app-phone-input-v4.
   */
  countryChange(event: { length: { min: number; max: number }; code: string }): void {
    this.currentCountryCode = event.code;
    this.currenCountryPhoneLength = event.length;
    this.requirementsForm.controls.contactPhone.setValidators([
      Validators.required,
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.requirementsForm.controls.contactPhone.updateValueAndValidity();
  }

  countryCodeChange(event: { code: string; updateLocalStorage: boolean }): void {
    this.currentCountryCode = event.code;
  }

  loadFaqs(): void {
    this.loadingFaqs.set(true);
    this.subscriptionService
      .getAppFaqs(this.app.id)
      .pipe(
        finalize(() => this.loadingFaqs.set(false)),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.faqs.set(res.data.filter((faq) => faq.is_active));
        }
      });
  }

  toggleFaqSelection(faqId: number): void {
    const current = new Set(this.selectedFaqIds());
    if (current.has(faqId)) {
      current.delete(faqId);
    } else {
      current.add(faqId);
      // Auto-expand on select
      const expanded = new Set(this.expandedFaqIds());
      expanded.add(faqId);
      this.expandedFaqIds.set(expanded);
    }
    this.selectedFaqIds.set(current);
  }

  toggleFaqExpansion(faqId: number, event: Event): void {
    event.stopPropagation();
    const current = new Set(this.expandedFaqIds());
    if (current.has(faqId)) {
      current.delete(faqId);
    } else {
      current.add(faqId);
    }
    this.expandedFaqIds.set(current);
  }

  isFaqSelected(faqId: number): boolean {
    return this.selectedFaqIds().has(faqId);
  }

  isFaqExpanded(faqId: number): boolean {
    return this.expandedFaqIds().has(faqId);
  }

  getSelectedFaqs(): IFaqItem[] {
    return this.faqs().filter((faq) => this.selectedFaqIds().has(faq.id));
  }

  get selectedCount(): number {
    return this.selectedFaqIds().size;
  }

  goToRequirements(): void {
    this.currentStep.set('requirements');
  }

  goBackToFaqSelection(): void {
    this.currentStep.set('faq-selection');
  }

  onSubmit(): void {
    this.requirementsForm.markAllAsTouched();
    if (this.requirementsForm.valid) {
      const payload = {
        type: 2,
        app_name: this.app.id,
        name: this.requirementsForm.value.contactName,
        email: this.requirementsForm.value.contactEmail,
        phone: this.requirementsForm.value.contactPhone,
        note: this.requirementsForm.value.additionalDetails,
        feature_desired_date: this.requirementsForm.value.desiredDate,
        selected_faqs: [...this.selectedFaqIds()]
      };

      this.loading.set(true);
      this.subscriptionService
        .talkToSales(payload, false)
        .pipe(
          finalize(() => this.loading.set(false)),
          take(1),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.currentStep.set('success');
          }
        });
    }
  }

  onClose(): void {
    this.dialogRef.close({ success: this.currentStep() === 'success' });
  }

  onDone(): void {
    this.dialogRef.close({ success: true });
  }
}
