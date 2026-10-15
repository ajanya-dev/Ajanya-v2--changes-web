import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  Validators,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormBuilder
} from '@angular/forms';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import {
  faXmark,
  faChevronDown,
  faChevronUp,
  faCalendar,
  faCircleCheck,
  faHandshakeSimple,
  faCheck
} from '@fortawesome/pro-regular-svg-icons';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { finalize, take } from 'rxjs';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';

export interface IFaqItem {
  id: number;
  app_name: string;
  question: string;
  answer: string;
  is_active: boolean;
}

type ModalStep = 'faq-selection' | 'requirements' | 'success';

@Component({
  selector: 'app-integration-faq-requirements-modal',
  standalone: true,
  imports: [
    NgClass,
    NgOptimizedImage,
    FaIconComponent,
    CommonButtonV35Component,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    NewPhoneInputComponent,
    CommonInputFieldComponent
  ],
  templateUrl: './integration-faq-requirements-modal.component.html',
  styleUrl: './integration-faq-requirements-modal.component.scss'
})
export class IntegrationFaqRequirementsModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<IntegrationFaqRequirementsModalComponent>);
  private subscriptionService = inject(SubscriptionService);
  private userProfileService = inject(UserProfileService);
  private data = inject(MAT_DIALOG_DATA);

  // Icons
  faXmark = faXmark;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faCalendar = faCalendar;
  faCircleCheck = faCircleCheck;
  faHandshakeSimple = faHandshakeSimple;
  faCheck = faCheck;

  // State
  currentStep = signal<ModalStep>('faq-selection');
  appName = signal<string>('');
  requestedId = signal<string>('');
  faqs = signal<IFaqItem[]>([]);
  selectedFaqIds = signal<Set<number>>(new Set());
  expandedFaqIds = signal<Set<number>>(new Set());
  loading = signal<boolean>(false);
  loadingFaqs = signal<boolean>(false);

  /** Synced from app-new-phone-input for country-aware digit length validation */
  currentCountryCode = '';
  currenCountryPhoneLength = {} as { min: number; max: number };

  minDate = new Date().toISOString().split('T')[0];

  requirementsForm: FormGroup<{
    contactName: FormControl<string | null>;
    contactEmail: FormControl<string | null>;
    contactPhone: FormControl<string | null>;
    additionalDetails: FormControl<string | null>;
    desiredDate: FormControl<string | null>;
  }>;

  ngOnInit(): void {
    if (this.data?.requestedId) {
      this.appName.set(this.data.appName);
      this.requestedId.set(this.data.requestedId);
      this.loadFaqs();
    }
    this.initForm();
    this.prefillContactFromProfile();
  }

  /**
   * Fills name, email, and phone from the signed-in user's profile (/user-profile).
   */
  private prefillContactFromProfile(): void {
    this.userProfileService
      .getPersonalInfo()
      .pipe(take(1))
      .subscribe((res) => {
        const d = res?.data;
        if (!d) {
          return;
        }
        const phone = d.phone?.trim() || null;
        this.requirementsForm.patchValue(
          {
            contactName: d.name || null,
            contactEmail: d.email?.trim() || null,
            contactPhone: phone
          },
          { emitEvent: false }
        );
      });
  }

  /**
   * @description Handles changes to the country code selection
   * @param event An object containing information about the selected country code.
   */
  countryCodeChange(event: { code: string; updateLocalStorage: boolean }) {
    this.currentCountryCode = event.code;
  }

  initForm(): void {
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
  }

  /**
   * Updates phone validators when country / length changes from app-new-phone-input.
   * Ignores dropdown open/close-only events (no length).
   */
  countryChange(event: {
    isOpen: boolean;
    length?: { min: number; max: number };
    code?: string;
  }): void {
    if (event.length?.min != null && event.code) {
      this.currentCountryCode = event.code;
      this.currenCountryPhoneLength = event.length;
      this.requirementsForm.controls.contactPhone.setValidators([
        Validators.required,
        ValidationService.customMinLength(event.length.min)
      ]);
      this.requirementsForm.controls.contactPhone.updateValueAndValidity();
    }
  }

  loadFaqs(): void {
    this.loadingFaqs.set(true);
    this.subscriptionService
      .getAppFaqs(this.requestedId())
      .pipe(
        finalize(() => this.loadingFaqs.set(false)),
        take(1)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.faqs.set(res.data.filter((faq) => faq.is_active));
        }
      });
  }

  toggleFaqSelection(faqId: number): void {
    const currentSelected = new Set(this.selectedFaqIds());
    if (currentSelected.has(faqId)) {
      currentSelected.delete(faqId);
    } else {
      currentSelected.add(faqId);
    }
    this.selectedFaqIds.set(currentSelected);

    // Auto-expand when selected
    if (currentSelected.has(faqId)) {
      this.expandFaq(faqId);
    }
  }

  toggleFaqExpansion(faqId: number): void {
    const currentExpanded = new Set(this.expandedFaqIds());
    if (currentExpanded.has(faqId)) {
      currentExpanded.delete(faqId);
    } else {
      currentExpanded.add(faqId);
    }
    this.expandedFaqIds.set(currentExpanded);
  }

  expandFaq(faqId: number): void {
    const currentExpanded = new Set(this.expandedFaqIds());
    currentExpanded.add(faqId);
    this.expandedFaqIds.set(currentExpanded);
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
      this.submitRequest();
    }
  }

  submitRequest(): void {
    const payload = {
      type: 2,
      app_name: this.data?.requestedId || this.appName(),
      name: this.requirementsForm.value.contactName,
      email: this.requirementsForm.value.contactEmail,
      phone: this.requirementsForm.value.contactPhone,
      note: this.requirementsForm.value.additionalDetails ,
      feature_desired_date: this.requirementsForm.value.desiredDate,
      selected_faqs: [...this.selectedFaqIds()]
    };

    this.loading.set(true);
    this.subscriptionService
      .talkToSales(payload, false)
      .pipe(
        finalize(() => this.loading.set(false)),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.currentStep.set('success');
        }
      });
  }

  onClose(): void {
    this.dialogRef.close({ success: this.currentStep() === 'success' });
  }

  onDone(): void {
    this.dialogRef.close({ success: true });
  }
}
