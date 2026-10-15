import { DynamicWhiteLabelService } from './../../../dynamic-white-label/service/dynamic-white-label.service';
import { AlertService } from './../../../../shared/service/alert/alert.service';
import { DatePipe, NgIf, NgClass } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { HttpHeaders } from '@angular/common/http';
import { IApiResMesssage } from 'src/app/models/api';

interface IDialogData {
  from: 'create' | 'table';
  data: string | Record<string, unknown>;
}

/**
 * @description Component for setting recurring options in a modal dialog for check drafts.
 */
@Component({
  selector: 'app-set-recurring-modal',
  templateUrl: './set-recurring-modal.component.html',
  styleUrls: ['./set-recurring-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    NgIf,
    MatDialogActions,
    NgClass
  ]
})
export class SetRecurringModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  recurringForm: UntypedFormGroup;
  minDate: Date | string;
  afterOneWeek: Date | string;
  isClick = false;
  isProcess = false;

  utils = Utils;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private datePipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data: IDialogData,
    public dialogRef: MatDialogRef<SetRecurringModalComponent>,
    private checkDraftService: CheckDraftService,
    private alertService: AlertService,
    private dynamicWhiteLabelService: DynamicWhiteLabelService
  ) {}

  ngOnInit(): void {
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate = this.datePipe.transform(
      this.minDate,
      'yyyy-MM-dd'
    ) as string;
    this.initForm();
  }

  /**
   * @description Initializes the recurring form.
   */
  initForm() {
    this.recurringForm = this.formBuilder.group({
      frequency: ['1', Validators.required],
      startDate: [this.minDate, Validators.required],
      endSelect: '1',
      count: [{ value: '1', disabled: false }, Validators.max(999)],
      until: [{ value: '', disabled: true }]
    });
  }

  /**
   * @description Adjusts form values based on selected end option.
   */
  getPatch() {
    this.afterOneWeek = new Date(this.recurringForm.controls.startDate.value);
    this.afterOneWeek.setDate(this.afterOneWeek.getDate() + 7);
    this.afterOneWeek = this.datePipe.transform(
      this.afterOneWeek,
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

  /**
   * @description Validates and allows only valid amount input (numeric with decimals).
   * @param event - The keyboard event.
   * @returns `true` if the input is valid, `false` otherwise.
   */
  amountOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      // for '.'
      return false;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Sets recurring options for the check draft.
   */
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
    if (
      (this.recurringForm.controls.count.value == 0 ||
        this.recurringForm.controls.count.value === '0') &&
      this.recurringForm.controls.count.value != ''
    ) {
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

  /**
   * @description Creates a new check draft with recurring options.
   */
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
    this.subscriptions.push(
      this.checkDraftService
        .createNewCheckDraftWithRecurring(obj, headerOptions)
        .pipe(
          catchError((err) => {
            if (err.status === 422) {
              this.openWarningAlert(err.error.errorMsg);
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if ((res as IApiResMesssage).success) {
            this.dialogRef.close(true);
          } else {
            this.isProcess = false;
          }
        })
    );
  }

  /**
   * @description Adds recurring options to an existing check draft.
   */
  addRecurring() {
    const obj = {
      id: this.data.data,
      ...this.recurringForm.value
    };

    this.isProcess = true;
    this.subscriptions.push(
      this.checkDraftService.setRecurringToCheckDraft(obj).subscribe((res) => {
        if (res.success) {
          this.dialogRef.close(true);
          this.isProcess = false;
        } else {
          this.isProcess = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
