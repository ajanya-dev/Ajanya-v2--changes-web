import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { Subject } from 'rxjs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';

/**
 * @description Modal component for recurring payments.
 */
@Component({
  selector: 'app-recurring-modal',
  templateUrl: './recurring-modal.component.html',
  styleUrls: ['./recurring-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    MatRadioButton,
    CommonButtonV35Component,
    FaIconComponent,
    CommonInputFieldComponent,
    V35ControlMessageComponent
  ]
})
export class RecurringModalComponent implements OnInit, OnDestroy {
  private datePipe = inject(DatePipe);
  private dialogRef = inject(MatDialogRef<RecurringModalComponent>);
  private formBuilder = inject(FormBuilder);

  minDate: Date | string;
  reccuringForm: FormGroup;
  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;
  destroy$ = new Subject();

  frequencyOptions = [
    { value: '3', label: 'Monthly' },
    { value: '6', label: 'Bimonthly' },
    { value: '7', label: 'Quarterly' },
    { value: '5', label: 'Biweekly' },
    { value: '2', label: 'Weekly' },
    { value: '1', label: 'Daily' }
  ];

  ngOnInit(): void {
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate = this.datePipe.transform(
      this.minDate,
      'yyyy-MM-dd'
    ) as string;
    this.initForm();
    this.getFormValueChanges();
  }

  getFormValueChanges() {
    this.reccuringForm.controls.end_select.valueChanges.subscribe((value) => {
      if (value === '1') {
        this.reccuringForm.controls.count.addValidators(Validators.required);
      } else {
        this.reccuringForm.controls.count.clearValidators();
      }
      this.reccuringForm.controls.count.updateValueAndValidity();
    });
  }

  /**
   * @description Initializes recurring form.
   */
  initForm() {
    this.reccuringForm = this.formBuilder.group({
      frequency: ['3', Validators.required],
      start_date: [this.minDate, Validators.required],
      end_select: '3',
      count: 1
    });
  }

  /**
   * @description Method for submitting the `recurringForm`.
   * Closes the dialog and the submitted value can be accessed by
   * subscribing to the observable returned by the `afterClosed()` method on dialogRef in parent.
   */
  submit() {
    this.reccuringForm.markAllAsTouched();
    if (this.reccuringForm.controls.start_date.value < this.minDate) {
      return;
    }

    if (this.reccuringForm.invalid) {
      return;
    }
    if (
      this.reccuringForm.controls.end_select.value === '1' &&
      this.reccuringForm.controls.count.value === ''
    ) {
      return;
    }
    if (this.reccuringForm.controls.end_select.value === '3') {
      this.reccuringForm.controls.count.setValue('');
    }
    this.dialogRef.close(this.reccuringForm.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
