import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { TPaymentLinksCRUpdateData } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

export type AddCustomLinkDialogData<T extends 'C' | 'E'> = {
  id: string;
  shortUrl: string;
  mode: T;
  data: T extends 'E' ? TPaymentLinksCRUpdateData : undefined;
};

@Component({
  selector: 'app-add-custom-link-modal',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4DatePickerComponent
  ],
  host: { class: 'v4-mat-check-box' },
  templateUrl: './add-custom-link-modal.component.html',
  styleUrls: ['./add-custom-link-modal.component.scss'],
  providers: [DatePipe]
})
export class AddCustomLinkModalComponent implements OnInit {
  private datePipe = inject(DatePipe);
  private paymentLinkService = inject(PaymentLinkService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  public data = inject<AddCustomLinkDialogData<'E' | 'C'>>(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<AddCustomLinkModalComponent>);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  showRecurring = false;
  tomorrow?: string | null;
  errorMsg?: string;
  loading = signal(false);
  showNickNameError = signal(false);
  showSlugUrlError = signal(false);

  form = new FormGroup({
    amount: new FormControl('', Validators.required),
    nickname: new FormControl('', [Validators.required, Validators.maxLength(15)]),
    slugurl: new FormControl(''),
    isRecurring: new FormControl(false),
    months: new FormControl<number | null>(null),
    startDate: new FormControl<null | string>(null),
    link: new FormControl(''),
    is_single_use: new FormControl(false),
    linkType: new FormControl<'single_use' | 'recurring'>('single_use')
  });

  get isEditMode() {
    return this.data.mode === 'E';
  }

  get linkPreview() {
    const slug = this.form.value.slugurl || this.form.value.nickname || '';
    return `${this.staticWhiteLabelConditions.paymentShortLink}/${this.data.shortUrl}/${slug}`;
  }

  ngOnInit(): void {
    this.setTomorrowDate();
    this.handleEditMode();
    this.setupFormValueChanges();
  }

  private setTomorrowDate() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    this.tomorrow = this.datePipe.transform(futureDate, 'yyyy-MM-dd');
    this.form.patchValue({ startDate: this.tomorrow, link: this.data.id });
  }

  private handleEditMode() {
    if (this.data.mode === 'E' && this.data.data) {
      const linkType = this.data.data.isRecurring ? 'recurring' : (this.data.data.is_single_use ? 'single_use' : 'single_use');
      this.form.patchValue({
        ...this.data.data,
        link: this.data.id,
        is_single_use: !!this.data.data.is_single_use,
        linkType
      });
      if (this.data.data.startDate) {
        this.form.get('startDate')?.patchValue(this.formatDate(this.data.data.startDate));
      }
      if (this.data.data.isRecurring) {
        this.showRecurring = true;
      }
    }
  }

  private setupFormValueChanges() {
    this.form.get('linkType')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.form.get('is_single_use')?.setValue(val === 'single_use', { emitEvent: false });
        this.form.get('isRecurring')?.setValue(val === 'recurring', { emitEvent: false });
        this.handleRecurringChange(val === 'recurring');
      });

    this.form.get('nickname')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val) this.showNickNameError.set(false);
        // Sync slugurl from nickname so API receives the link slug (create flow)
        const slug = typeof val === 'string' ? val.trim() : '';
        this.form.controls.slugurl.setValue(slug, { emitEvent: false });
      });
  }

  /** Sync slugurl from nickname input (used for link path). */
  onNicknameInput(inputEl: HTMLInputElement) {
    const val = inputEl?.value?.trim() ?? '';
    this.form.controls.slugurl.setValue(val, { emitEvent: false });
  }

  private handleRecurringChange(val: boolean | null) {
    if (val === null) return;
    this.showRecurring = val;
    if (val) this.form.get('is_single_use')?.setValue(false);
    const monthsControl = this.form.get('months');
    const startDateControl = this.form.get('startDate');
    [monthsControl, startDateControl].forEach((control) => {
      control?.markAsUntouched();
      if (val) {
        control?.addValidators(Validators.required);
      } else {
        control?.setValue(null);
        control?.clearValidators();
      }
      control?.updateValueAndValidity();
    });
  }

  private formatDate(date: string): string {
    const d = new Date(date);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.form.controls.isRecurring.value) {
      if (new Date(this.form.controls.startDate.value ?? '') < new Date(this.tomorrow ?? '')) {
        this.alertService.warningAlert({ title: 'Alert!', content: 'Starting date should be a future date.', doneMsg: 'OK' });
        return;
      }
    }
    this.data.mode === 'E' ? this.update() : this.create();
  }

  private create() {
    const slugurl = this.form.value.slugurl?.trim() || this.form.value.nickname?.trim() || '';
    const { linkType, ...formValues } = this.form.value;
    const payload = {
      ...formValues,
      slugurl,
      isRecurring: this.form.value.isRecurring ? 1 : 0
    };
    this.loading.set(true);
    this.paymentLinkService.CreateCustomAdvanceLink(payload)
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close(true);
          }
        },
        error: (err: HttpErrorResponse) => this.handleError(err)
      });
  }

  private update() {
    const { amount, linkType, ...payload } = { ...this.form.value, isRecurring: this.form.value.isRecurring ? 1 : 0, editAmount: this.form.value.amount };
    this.loading.set(true);
    this.paymentLinkService.UpdateCustomAdvanceLink(payload, this.data?.data?.id ?? '')
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { if (res.success) this.dialogRef.close(true); },
        error: (err: HttpErrorResponse) => this.handleError(err)
      });
  }

  private handleError(err: HttpErrorResponse) {
    this.errorMsg = err.error.errorMsg;
    if (err.error.errorCode === 107) this.showNickNameError.set(true);
    else if (err.error.errorCode === 108) this.showSlugUrlError.set(true);
    else { this.showNickNameError.set(false); this.showSlugUrlError.set(false); }
  }
}
