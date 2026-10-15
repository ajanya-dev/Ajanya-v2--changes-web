import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';
import { Utils } from 'src/app/data/utils';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { HttpHeaders } from '@angular/common/http';
import { IApiResMesssage } from 'src/app/models/api';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4AlertService } from '../../../../shared/service/alert/v4-alert.service';
import { DynamicWhiteLabelService } from '../../../dynamic-white-label/service/dynamic-white-label.service';

interface IDialogData {
  from: 'create' | 'table';
  data: string | Record<string, unknown>;
}

@Component({
  selector: 'app-v4-set-recurring-modal',
  templateUrl: './v4-set-recurring-modal.component.html',
  styleUrls: ['./v4-set-recurring-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ]
})
export class V4SetRecurringModalComponent implements OnInit {
  readonly XIcon = X;

  private fb = inject(NonNullableFormBuilder);
  private datePipe = inject(DatePipe);
  public data: IDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<V4SetRecurringModalComponent>);
  private checkDraftService = inject(CheckDraftService);
  private alertService = inject(V4AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private destroyRef = inject(DestroyRef);

  recurringForm: ReturnType<typeof this.createForm>;
  minDate: string;
  afterOneWeek: string;
  isClick = false;
  isProcess = false;

  utils = Utils;

  frequencyOptions = [
    { value: '1', label: 'Weekly', description: 'Every week' },
    { value: '2', label: 'Bi-weekly', description: 'Every 2 weeks' },
    { value: '3', label: 'Monthly', description: 'Every month' },
    { value: '4', label: 'Quarterly', description: 'Every 3 months' },
    { value: '5', label: 'Annually', description: 'Every year' }
  ];

  ngOnInit(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = this.datePipe.transform(tomorrow, 'yyyy-MM-dd') as string;
    this.initForm();
  }

  private createForm() {
    return this.fb.group({
      frequency: ['1', Validators.required],
      startDate: [this.minDate, Validators.required],
      endSelect: ['1'],
      count: [{ value: '1', disabled: false }, Validators.max(999)],
      until: [{ value: '', disabled: true }]
    });
  }

  initForm() {
    this.recurringForm = this.createForm();
  }

  selectFrequency(value: string): void {
    this.recurringForm.controls.frequency.setValue(value);
  }

  selectEndOption(value: string): void {
    this.recurringForm.controls.endSelect.setValue(value);
    this.getPatch();
  }

  getPatch() {
    const startDate = new Date(this.recurringForm.controls.startDate.value);
    startDate.setDate(startDate.getDate() + 7);
    this.afterOneWeek = this.datePipe.transform(
      startDate,
      'yyyy-MM-dd'
    ) as string;

    if (this.recurringForm.controls.endSelect.value === '2') {
      this.recurringForm.controls.until.enable();
      this.recurringForm.controls.count.disable();

      this.recurringForm.controls.until.patchValue(this.afterOneWeek);
      this.recurringForm.controls.count.patchValue('');
    } else if (this.recurringForm.controls.endSelect.value === '1') {
      this.recurringForm.controls.count.enable();
      this.recurringForm.controls.count.patchValue('1');
      this.recurringForm.controls.until.disable();
      this.recurringForm.controls.until.patchValue('');
    } else {
      this.recurringForm.controls.count.disable();
      this.recurringForm.controls.count.patchValue('');
      this.recurringForm.controls.until.disable();
      this.recurringForm.controls.until.patchValue('');
    }
  }

  amountOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      return false;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  setRecurring() {
    if (this.recurringForm.controls.startDate.value < this.minDate) {
      return;
    }

    if (
      this.recurringForm.controls.endSelect.value === '1' &&
      this.recurringForm.controls.count.value === '' &&
      this.isClick
    ) {
      return;
    }
    if (this.recurringForm.controls.count.value === '0') {
      return;
    }
    if (
      this.recurringForm.controls.until.value < this.afterOneWeek &&
      this.recurringForm.controls.endSelect.value === '2'
    ) {
      return;
    }

    if (this.recurringForm.invalid) {
      return;
    }

    if (this.data.from === 'create') {
      this.createWithRecurring();
    } else {
      this.addRecurring();
    }
  }

  openWarningAlert(msg: string) {
    const data = {
      content: msg,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now',
      isOk: true,
      isCancel: true
    };
    const action = this.alertService.warningAlert(data);
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  createWithRecurring() {
    const obj = {
      ...(this.data.data as Record<string, unknown>),
      ...this.recurringForm.value
    };
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.isProcess = true;
    this.checkDraftService
      .createNewCheckDraftWithRecurring(obj, headerOptions)
      .pipe(
        catchError((err) => {
          if (err.status === 422) {
            this.openWarningAlert(err.error.errorMsg);
          }
          return of(false);
        }),
        finalize(() => {
          this.isProcess = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.dialogRef.close(true);
        }
      });
  }

  addRecurring() {
    const obj = {
      id: this.data.data,
      ...this.recurringForm.value
    };

    this.isProcess = true;
    this.checkDraftService
      .setRecurringToCheckDraft(obj)
      .pipe(
        finalize(() => {
          this.isProcess = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close(true);
        }
      });
  }
}
