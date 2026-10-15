import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';

export type TRecurringForm = {
  months?: FormControl<string | null>;
  startDate: FormControl<string | null>;
  endSelect: FormControl<string | null>;
  frequency: FormControl<string| Date | null>;
};

@Component({
  selector: 'app-edit-recurring-modale-v3',
  templateUrl: './edit-recurring-modale-v3.component.html',
  styleUrls: ['./edit-recurring-modale-v3.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    MatRadioButton,
    CommonButtonV35Component,
    FaIconComponent,
    CommonInputFieldComponent
  ]
})
export class EditRecurringModaleV3Component implements OnInit, OnDestroy {
  private datePipe = inject(DatePipe);
  private dialogData: Record<string, string> = inject(MAT_DIALOG_DATA);
  private matDialogRef = inject(MatDialogRef<EditRecurringModaleV3Component>);

  subscriptions: Subscription[] = [];
  utils = Utils;
  recurringForm: FormGroup<TRecurringForm>;
  minDate: Date|string ;
  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;

  frequencyOptions = [
    { value: '3', label: 'Monthly' },
    { value: '2', label: 'Biweekly' },
    { value: '1', label: 'Weekly' },
  ];

  ngOnInit(): void {
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate = this.datePipe.transform(
      this.minDate,
      'yyyy-MM-dd'
    ) as string;
    this.initForm();
    this.setFormData();
    this.observeEndSelect();
  }

  /**
   * - Setting existing value if there is any in the parent form ( Request Payement Form )  from parent component
   */
  setFormData() {
    if (this.dialogData) {
      this.recurringForm.controls.months?.setValue(this.dialogData.months);
      this.recurringForm.controls.endSelect.setValue(
        this.dialogData.endSelect
      );
      if(this.dialogData.startDate){
        this.recurringForm.controls.startDate.setValue(
          this.dialogData.startDate
        );
      }
      if(this.dialogData.frequency){
        this.recurringForm.controls.frequency.setValue(
          this.dialogData.frequency
        );
      }

      if (this.dialogData.endSelect === '2'){
        this.recurringForm.controls.months?.enable();
      }else{
        this.recurringForm.controls.months?.disable();
      }
    }
  }

  setMinDate() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const ddd = String(futureDate.getDate()).padStart(2, '0');
    const mmm = String(futureDate.getMonth()).padStart(2, '0');
    const yyyyy = futureDate.getFullYear();

    this.minDate = this.datePipe.transform(
      new Date(yyyyy, Number(mmm), Number(ddd)),
      'yyyy-MM-dd'
    ) as string;

    this.recurringForm.controls.startDate.setValue(this.minDate);
  }

  /** Used for observing endSelect form field in recurringForm
   * - so we can change other values those depends on its value accordingly
   */
  observeEndSelect() {
    this.subscriptions.push(
      this.recurringForm.controls.endSelect.valueChanges.subscribe((val) => {
        if (this.recurringForm.controls.months)
          if (val === '2') {
            this.recurringForm.controls.months.setValue('2');
            this.recurringForm.controls.months.setValidators([
              Validators.required,
              Validators.min(2)
            ]);
            this.recurringForm.controls.months.updateValueAndValidity();
            this.recurringForm.controls.months.enable();
          } else {
            this.recurringForm.controls.months.setValue('');
            this.recurringForm.controls.months.clearValidators();
            this.recurringForm.controls.months.updateValueAndValidity();
            this.recurringForm.controls.months.disable();
          }
      })
    );
  }

  initForm() {
    this.recurringForm = new FormGroup<TRecurringForm>({
      endSelect: new FormControl('1'),
      startDate: new FormControl(this.minDate as string, Validators.required),
      months: new FormControl(''),
      frequency: new FormControl('3'),
    });
  }

  submit() {
    this.recurringForm.markAllAsTouched();
    if (this.recurringForm.invalid) return;

    if (this.recurringForm.controls.endSelect.value === '1') {
      this.recurringForm.removeControl('months');
    }
    this.matDialogRef.close(this.recurringForm.value);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}