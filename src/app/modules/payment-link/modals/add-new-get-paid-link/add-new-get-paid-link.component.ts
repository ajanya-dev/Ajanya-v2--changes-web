import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { TPaymentLinksCRUpdateData } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { HttpErrorResponse } from '@angular/common/http';

export type AddOrEditCRLinkDialogData<T extends 'C' | 'E'> = {
  id: string;
  shortUrl: string;
  mode: T;
  data: T extends 'E' ? TPaymentLinksCRUpdateData : undefined;
};

@Component({
  selector: 'app-add-new-get-paid-link',
  templateUrl: './add-new-get-paid-link.component.html',
  styleUrls: ['./add-new-get-paid-link.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FaIconComponent
  ]
})
export class AddNewGetPaidLinkComponent implements OnInit, OnDestroy {
  private datePipe = inject(DatePipe);
  private paymentLinkService = inject(PaymentLinkService);
  private alertService = inject(AlertService);
  public data = inject<AddOrEditCRLinkDialogData<'E' | 'C'>>(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  showRecurring = false;
  destroy$ = new Subject<boolean>();
  tomorrow?: string | null;
  errorMsg?: string;
  loading = signal(false);
  showNickNameError = signal(false);
  showSlugUrlError = signal(false);
  faXmark = faXmark;
  faCricleExcamation = faCircleExclamation;
  addnewLinkForm = new FormGroup({
    amount: new FormControl('', Validators.required),
    nickname: new FormControl('', Validators.required),
    slugurl: new FormControl(''),
    isRecurring: new FormControl(false),
    months: new FormControl<number | null>(null),
    startDate: new FormControl<null | string>(null),
    link: new FormControl(''),
    is_single_use: new FormControl(false)
  });

  ngOnInit(): void {
    this.setTomorrowDate();
    this.handleEditMode();
  }

  setTomorrowDate(): void {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const tomorrow = new Date(
      futureDate.getFullYear(),
      futureDate.getMonth(),
      futureDate.getDate()
    );
    this.tomorrow = this.datePipe.transform(tomorrow, 'YYYY-MM-dd');
    this.initForm(this.tomorrow);
  }

  initForm(initialDate: string | null): void {
    this.addnewLinkForm.patchValue({
      startDate: initialDate,
      link: this.data.id
    });

    this.setupFormValueChanges();
  }

  setupFormValueChanges(): void {
    this.addnewLinkForm
      .get('is_single_use')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val) {
          this.addnewLinkForm.get('isRecurring')?.setValue(false);
        }
      });

    this.addnewLinkForm
      .get('isRecurring')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.handleRecurringChange(val));

    this.addnewLinkForm
      .get('nickname')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val) {
          this.showNickNameError.set(false);
        }
      });

    this.addnewLinkForm
      .get('slugurl')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val) {
          this.showSlugUrlError.set(false);
        }
      });
  }

  handleRecurringChange(val: boolean | null): void {
    if (val === null) return;
    this.showRecurring = val;
    if (val) {
      this.addnewLinkForm.get('is_single_use')?.setValue(false);
    }
    const monthsControl = this.addnewLinkForm.get('months');
    const startDateControl = this.addnewLinkForm.get('startDate');

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

  handleEditMode(): void {
    if (this.data.mode === 'E' && this.data.data) {
      this.addnewLinkForm.patchValue({
        ...this.data.data,
        link: this.data.id,
        is_single_use: !!this.data.data.is_single_use
      });

      if (this.data.data.startDate) {
        this.addnewLinkForm
          .get('startDate')
          ?.patchValue(this.formatDate(this.data.data.startDate));
      }
      if (this.data.data.isRecurring) {
        this.showRecurring = true;
      }
    }
  }

  addSlugUrl(event: HTMLInputElement) {
    this.addnewLinkForm.controls.slugurl.setValue(event.value);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return [year, month, day].join('-');
  }

  submit() {
    this.addnewLinkForm.markAllAsTouched();
    if (this.addnewLinkForm.invalid) return;

    if (this.addnewLinkForm.controls.isRecurring.value) {
      if (
        new Date(this.addnewLinkForm.controls.startDate.value ?? '') <
        new Date(this.tomorrow ?? '')
      ) {
        const data = {
          title: 'Alert!',
          content: 'Starting date should be a future date.',
          doneMsg: 'OK'
        };
        this.alertService.warningAlert(data);
        return;
      }
    }

    if (this.data.mode === 'E') {
      this.update();
      return;
    }
    this.create();
  }

  create() {
    const { value } = this.addnewLinkForm;

    const payload = {
      ...value,
      isRecurring: value.isRecurring ? 1 : 0
    };

    this.loading.set(true);
    this.paymentLinkService
      .CreateCustomAdvanceLink(payload)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close(true);
            this.showNickNameError.set(false);
            this.showSlugUrlError.set(false);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error.errorMsg;
          if (err.error.errorCode === 107) {
            this.showNickNameError.set(true);
          } else if (err.error.errorCode === 108) {
            this.showSlugUrlError.set(true);
          } else {
            this.showNickNameError.set(false);
            this.showSlugUrlError.set(false);
          }
        }
      });
  }

  update() {
    const { value } = this.addnewLinkForm;

    const { amount, ...payload } = {
      ...value,
      isRecurring: value.isRecurring ? 1 : 0,
      editAmount: value.amount
    };

    this.loading.set(true);
    this.paymentLinkService
      .UpdateCustomAdvanceLink(payload, this.data?.data?.id ?? '')
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close(true);
            this.showNickNameError.set(false);
            this.showSlugUrlError.set(false);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg = err.error.errorMsg;
          if (err.error.errorCode === 107) {
            this.showNickNameError.set(true);
          } else if (err.error.errorCode === 108) {
            this.showSlugUrlError.set(true);
          } else {
            this.showNickNameError.set(false);
            this.showSlugUrlError.set(false);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
