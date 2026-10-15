import { Component, inject, signal } from '@angular/core';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import {
  faArrowDownToLine,
  faXmark,
  faAngleRight,
  faArrowLeft,
  faPencil,
  faCircleCheck,
  faCheck,
  faCircleInfo
} from '@fortawesome/pro-solid-svg-icons';
import { NgSelectModule } from '@ng-select/ng-select';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { finalize, take } from 'rxjs';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IImportedBanksUpdates } from 'src/app/models/bank';
import { CommonModule } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

type StepOneData = { step: 1 };
type StepTwoData = {
  step: 2;
  info: { header: string[]; rows: (string | number)[][] };
};
type StepThreeData = { step: 3; data: IImportedBanksUpdates[] };

type Steps = StepOneData | StepTwoData | StepThreeData;

@Component({
  selector: 'app-updated-imported-banks-modal',
  standalone: true,
  imports: [
    V35ControlMessageComponent,
    CommonUploadButtonV35Component,
    NgSelectModule,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    CommonButtonV35Component,
    CommonModule,
    MatTooltip
  ],
  templateUrl: './updated-imported-banks-modal.component.html',
  styleUrl: './updated-imported-banks-modal.component.scss'
})
export class UpdatedImportedBanksModalComponent {
  private bankAccountsService = inject(BankAccountsService);
  private diaogRef = inject(MatDialogRef<UpdatedImportedBanksModalComponent>);
  private alertService = inject(AlertService);

  fileDownloading = signal(false);
  submitting = signal(false);
  step = signal<Steps>({ step: 1 });

  disableMap = signal<Record<string, number | undefined>>({});

  fts = ['.xls', '.xlsx', '.xlsm', '.xlsb'];
  selectedHeader: ({ opt: string; optIn: number } | '')[] = [];
  selectedHeaderValues: (number | '')[] = [];
  editingRow: number | null = null;
  editingField: string | null = null;
  editValue: string | number = '';
  form = new FormGroup({
    file: new FormControl<null | File>(null, [Validators.required])
  });

  faArrowDownToLine = faArrowDownToLine;
  faAngleRight = faAngleRight;
  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  faCircleCheck = faCircleCheck;
  faPencil = faPencil;
  faCheck = faCheck;
  faCircleInfo = faCircleInfo;
  originalData: IImportedBanksUpdates | null = null;

  onFileUpload(file: File) {
    this.form.controls.file.setValue(file);
  }

  downloadSample() {
    this.fileDownloading.set(true);
    this.bankAccountsService
      .updateImportedBanksSampleFile()
      .pipe(
        finalize(() => {
          this.fileDownloading.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        // eslint-disable-next-line no-restricted-globals
        location.href = res.data.sampleFileUrl;
      });
  }

  onSelectHeader(value: { opt: string; optIn: number } | '', colIn: number) {
    this.disableMap.update((val) => {
      const exKey = Object.entries(val).find(([_k, v]) => v === colIn)?.[0];

      const obj: Record<string, number | undefined> = { ...val };

      if (exKey) {
        obj[exKey] = undefined;
      }

      if (typeof value === 'string') return obj;

      obj[value.optIn] = colIn;

      return obj;
    });

    this.selectedHeaderValues[colIn] =
      typeof value === 'string' ? '' : value.optIn;
  }

  submit() {
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const payload = new FormData();
    payload.append('excelFile[]', this.form.value.file as File);

    this.submitting.set(true);
    this.bankAccountsService
      .updateImportedBanksStep1(payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),

        take(1)
      )
      .subscribe((res) => {
        if (!res.success) return;
        const info = {
          header: res.data.header.filter((el) => el !== ''),
          rows: res.data.rows
        };

        info.header.forEach((_el, i: number) => {
          this.disableMap.update((val) => ({
            ...val,
            [i]: undefined
          }));
        });

        this.selectedHeader.length = info.header.length;
        this.selectedHeaderValues.length = info.header.length;

        this.selectedHeaderValues.fill('');
        this.selectedHeader.fill('');

        this.step.set({ step: 2, info });
        this.updateDialogWidth();
      });
  }

  back() {
    const step = this.step();

    if (step.step > 1) {
      this.step.update((val) => ({
        ...val,
        step: (val.step - 1) as 1
      }));

      this.updateDialogWidth();
    }
  }

  /** Update dialog width based on step */
  private updateDialogWidth(): void {
    const width = this.step().step === 1 ? '700px' : '1150px';
    this.diaogRef.updateSize(width, 'auto');
  }

  submitStep2() {
    if (!this.selectedHeaderValues.includes(0)) {
      const data = {
        content: 'Please select a Name'
      };
      this.alertService.infoAlert(data);
      return;
    }
    if (!this.selectedHeaderValues.includes(1)) {
      const data = {
        content: 'Please select a Bank Account Number'
      };
      this.alertService.infoAlert(data);
      return;
    }
    if (!this.selectedHeaderValues.includes(4)) {
      const data = {
        content: 'Please select a Routing Number'
      };
      this.alertService.infoAlert(data);
      return;
    }
    if (!this.selectedHeaderValues.includes(5)) {
      const data = {
        content: 'Please select a address'
      };
      this.alertService.infoAlert(data);
      return;
    }
    if (!this.selectedHeaderValues.includes(7)) {
      const data = {
        content: 'Please select a city'
      };
      this.alertService.infoAlert(data);
      return;
    }
    if (!this.selectedHeaderValues.includes(8)) {
      const data = {
        content: 'Please select a state'
      };
      this.alertService.infoAlert(data);
      return;
    }
    if (!this.selectedHeaderValues.includes(9)) {
      const data = {
        content: 'Please select a zip'
      };
      this.alertService.infoAlert(data);
      return;
    }

    const payload = {
      mapping: this.selectedHeaderValues.reduce(
        (acc, value, index) => {
          if (value !== '') {
            acc[value] = index;
          }
          return acc;
        },
        {} as (number | '')[]
      )
    };
    this.submitting.set(true);
    this.bankAccountsService
      .updateImportedBanksStep2(payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.step.set({ step: 3, data: res.data });
        }
      });
  }

  hasErrors(item: IImportedBanksUpdates, field: string): boolean {
    return item.errors && item.errors[field] && item.errors[field].length > 0;
  }

  getErrorMessages(item: IImportedBanksUpdates, field: string): string {
    if (this.hasErrors(item, field)) {
      return item.errors?.[field].join(', ');
    }
    return '';
  }

  startEditing(index: number, field: string, value: string | number) {
    this.editingRow = index;
    this.editingField = field;
    this.editValue = value;
  }

  toggleEdit(index: number) {
    if (this.editingRow === index) {
      this.cancelEdit();
    } else {
      this.editingRow = index;
      // Store original data for cancel
      this.originalData = { ...(this.step() as StepThreeData).data[index] };
    }
  }

  saveEdit(data: IImportedBanksUpdates) {
    if (this.editingRow !== null) {
      const stepData = this.step() as StepThreeData;
      stepData.data[this.editingRow] = { ...data };
      if (stepData.data[this.editingRow].errors) {
        stepData.data[this.editingRow].errors = {};
      }

      // Update the step signal with the new data
      this.step.set(stepData);
    }

    this.editingRow = null;
    this.originalData = null;
  }

  cancelEdit() {
    if (this.originalData && this.editingRow !== null) {
      // Restore original data
      const stepData = this.step() as StepThreeData;
      stepData.data[this.editingRow] = { ...this.originalData };
      this.step.set(stepData);
    }
    this.editingRow = null;
    this.originalData = null;
  }

  // Add this method to the component class
  showEditOptions(index: number, item: IImportedBanksUpdates) {
    // Create a map of fields with errors
    const fieldsWithErrors: string[] = [];
    if (item.errors) {
      Object.keys(item.errors).forEach((field) => {
        if (item.errors[field] && item.errors[field].length > 0) {
          fieldsWithErrors.push(field);
        }
      });
    }

    if (fieldsWithErrors.length === 1) {
      // If only one field has errors, directly edit that field
      const field = fieldsWithErrors[0];
      this.startEditing(
        index,
        field,
        item[field as keyof Omit<IImportedBanksUpdates, 'errors'>]
      );
    } else if (fieldsWithErrors.length > 1) {
      const field = fieldsWithErrors[0];
      this.startEditing(
        index,
        field,
        item[field as keyof Omit<IImportedBanksUpdates, 'errors'>]
      );
    }
  }

  submitStep3() {
    const stepData = (this.step() as StepThreeData).data;

    const payload = {
      data: stepData as IImportedBanksUpdates[]
    };

    this.submitting.set(true);
    this.bankAccountsService
      .updateImportedBanksStep3(payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          if (this.checkErrors(res.data)) {
            this.alertService.infoAlert({ content: 'Please fix all errors.' });
            this.step.set({ step: 3, data: res.data });
          } else {
            this.submitting.set(true);
            this.importBanks(res.data);
          }
        }
      });
  }

  checkErrors(data: IImportedBanksUpdates[]) {
    return data.some((item) => Object.keys(item.errors || {}).length > 0);
  }

  importBanks(data: IImportedBanksUpdates[]) {
    const payload = {
      data: data as IImportedBanksUpdates[]
    };

    this.bankAccountsService
      .updateImportedBanksStep4(payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Banks updated successfully'
          });
          this.diaogRef.close(true);
        }
      });
  }
}
