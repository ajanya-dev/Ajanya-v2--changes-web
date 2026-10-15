import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';

import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { IBankDropdown } from 'src/app/models/bank';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  ICheckdraftData,
  IImportStep2,
  IImportStep4
} from 'src/app/modules/v4-check-draft/model/v4-Checkdraft';

interface IImportFormGroup {
  excelFile: FormControl<File | null>;
  includeHeader: FormControl<string>;
  bankAccount: FormControl<string>;
}

@Component({
  selector: 'app-v4-import-checkdraft-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatCheckboxModule,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './v4-import-checkdraft-modal.component.html',
  styleUrls: ['./v4-import-checkdraft-modal.component.scss'],
  providers: [DatePipe]
})
export class V4ImportCheckdraftModalComponent implements OnInit, OnDestroy {
  readonly XIcon = X;

  private dialogRef = inject(MatDialogRef<V4ImportCheckdraftModalComponent>);
  private checkDraftService = inject(CheckDraftService);
  private alertService = inject(V4AlertService);
  private datePipe = inject(DatePipe);

  private subscriptions: Subscription[] = [];

  // Step tracking: 1 = upload, 2 = mapping, 3 = review
  currentStep = signal(1);

  // ========== STEP 1: Upload ==========
  importForm: FormGroup<IImportFormGroup>;
  selectedBankControl = new FormControl<IBankDropdown | null>(null);
  selectedBankId = '';
  fileName = '';
  sampleFileUrl = '';
  isSampleFileLoading = signal(false);
  step1Loading = signal(false);

  includeHeaderConfig: Iv4ngSelectConfig = {
    placeholder: 'Select',
    displayField: 'label',
    outputField: 'value'
  };

  includeHeaderOptions = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Yes' }
  ];

  // ========== STEP 2: Mapping ==========
  importDatas: IImportStep2;
  headerOptions: { key: number; value: string }[] = [];
  mappingDropdownOptions: { value: string; label: string }[] = [];
  headerColumns: FormControl<string>[] = [];
  checkDraftData: (Omit<ICheckdraftData, 'date'> & { date: string })[] = [];
  disableMapping: { [key: string]: boolean } = {};
  step2Loading = signal(false);

  // ========== STEP 3: Review ==========
  step3Data: IImportStep4[] = [];
  step3Loading = signal(false);
  step3Submitting = signal(false);
  isAllSelected = false;
  columnsHead = [
    'DATE',
    'SL.NO.',
    'AMOUNT',
    'PAYEE NAME',
    'NICKNAME',
    'ADDRESS LINE 1',
    'ADDRESS LINE 2',
    'CITY',
    'STATE',
    'ZIP',
    'COUNTRY',
    'EMAIL',
    'PHONE',
    'INV#',
    'PAYEE COMPANY',
    'ACC#',
    'RT#',
    'ACCOUNT TYPE',
    'CATEGORY',
    'MEMO',
    'NOTE'
  ];

  ngOnInit(): void {
    this.initImportForm();
    this.getTemplates();
  }

  // ========================
  // STEP 1: Upload methods
  // ========================

  private initImportForm(): void {
    this.importForm = new FormGroup<IImportFormGroup>({
      excelFile: new FormControl(null, {
        nonNullable: false,
        validators: [Validators.required]
      }),
      includeHeader: new FormControl('no', { nonNullable: true }),
      bankAccount: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    });
  }

  private getTemplates(): void {
    this.isSampleFileLoading.set(true);
    this.subscriptions.push(
      this.checkDraftService
        .getTemplates()
        .pipe(finalize(() => this.isSampleFileLoading.set(false)))
        .subscribe((data) => {
          if (data?.success) {
            this.sampleFileUrl = data?.data?.sampleFileUrl;
          }
        })
    );
  }

  onBankChange(bank: IBankDropdown | null | undefined): void {
    if (!bank?.id) {
      this.importForm.controls.bankAccount.setValue('');
      this.importForm.controls.bankAccount.markAllAsTouched();
      return;
    }

    // Guard against duplicate selection
    if (bank.id === this.selectedBankId) return;
    this.selectedBankId = bank.id;

    // Warn if bank is not verified
    if (bank.verified === 0) {
      const ref = this.alertService.warningAlert({
        content:
          'This bank account is not verified. The imported check draft using this bank account will be voided, Are you sure you want to continue?',
        doneMsg: 'Yes',
        isCancel: true,
        cancelMsg: 'Not Now'
      });
      ref.afterClosed().subscribe((res) => {
        if (res) {
          this.importForm.controls.bankAccount.setValue(bank.id);
        } else {
          this.importForm.controls.bankAccount.setValue('');
          this.selectedBankId = '';
          this.selectedBankControl.setValue(null);
        }
      });
      return;
    }

    this.importForm.controls.bankAccount.setValue(bank.id);
  }

  onBankClear(): void {
    this.importForm.controls.bankAccount.setValue('');
    this.importForm.controls.bankAccount.markAllAsTouched();
    this.selectedBankId = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileName = file.name;
      this.importForm.controls.excelFile.setValue(file);
    } else {
      this.fileName = '';
      this.importForm.controls.excelFile.setValue(null);
      this.importForm.controls.excelFile.markAsTouched();
    }
  }

  downloadSampleFile(): void {
    if (this.sampleFileUrl) {
      window.open(this.sampleFileUrl, '_blank');
    }
  }

  submitStep1(): void {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) return;

    const body = new FormData();
    const formVal = this.importForm.getRawValue();
    if (formVal.excelFile) body.append('excelFile', formVal.excelFile);
    body.append('includeHeader', formVal.includeHeader);
    body.append('bankAccount', formVal.bankAccount);

    this.step1Loading.set(true);
    this.subscriptions.push(
      this.checkDraftService
        .importCheckDraftStep2(body)
        .pipe(finalize(() => this.step1Loading.set(false)))
        .subscribe((data) => {
          if (data?.success) {
            this.importDatas = data.data;
            this.prepareStep2();
            this.currentStep.set(2);
          }
        })
    );
  }

  // ========================
  // STEP 2: Mapping methods
  // ========================

  private prepareStep2(): void {
    this.headerOptions = this.makeHeader(this.importDatas.header[0]);
    this.mappingDropdownOptions = this.headerOptions.map((h) => ({
      value: String(h.key),
      label: h.value
    }));
    this.headerColumns = [];
    for (let i = 0; i < 22; i += 1) {
      const ctrl = new FormControl('', { nonNullable: true });
      this.subscriptions.push(
        ctrl.valueChanges.subscribe(() => this.mappingChange())
      );
      this.headerColumns.push(ctrl);
    }
    this.formatCheckDraftData();
    this.mappingChange();
  }

  private formatCheckDraftData(): void {
    this.checkDraftData = [];
    for (let i = 0; i <= 4; i += 1) {
      if (this.importDatas?.CheckdraftData?.length <= i) return;
      const row: ICheckdraftData = this.importDatas.CheckdraftData[i];
      this.checkDraftData.push({
        ...row,
        date: this.datePipe.transform(row.date.date, 'shortDate') as string
      });
    }
  }

  private makeHeader(headerData: string[]): { key: number; value: string }[] {
    const headers: { key: number; value: string }[] = [];
    Object.keys(headerData).forEach((k: string, index: number) => {
      headers.push({ key: index, value: headerData[index] });
    });
    return headers;
  }

  mappingChange(): void {
    this.disableMapping = {};
    this.headerColumns.forEach((ctrl) => {
      const val = ctrl.value;
      if (val) {
        this.disableMapping[val] = true;
      }
    });
  }

  submitStep2(): void {
    const mapping = this.headerColumns.map((ctrl) => ctrl.value);

    if (!mapping.includes('12')) {
      this.alertService.infoAlert({ content: 'Please select payee' });
      return;
    }
    if (!mapping.includes('2')) {
      this.alertService.infoAlert({ content: 'Please select amount' });
      return;
    }
    if (!mapping.includes('21')) {
      this.alertService.infoAlert({
        content: 'Please select payee bank account number'
      });
      return;
    }
    if (!mapping.includes('20')) {
      this.alertService.infoAlert({
        content: 'Please select payee bank routing number'
      });
      return;
    }

    this.step2Loading.set(true);
    const body = { mapping, uploadFromImport: 'yes' };
    this.subscriptions.push(
      this.checkDraftService
        .importCheckDraftStep3(body)
        .pipe(finalize(() => this.step2Loading.set(false)))
        .subscribe((response) => {
          if (response?.success) {
            this.loadStep3Data();
          }
        })
    );
  }

  // ========================
  // STEP 3: Review methods
  // ========================

  private loadStep3Data(): void {
    this.step3Loading.set(true);
    this.subscriptions.push(
      this.checkDraftService
        .importCheckDraftStep4()
        .pipe(finalize(() => this.step3Loading.set(false)))
        .subscribe((data) => {
          this.step3Data = data?.data ?? [];
          this.step3Data = this.step3Data.map((el) => ({
            ...el,
            selected: false
          }));
          this.currentStep.set(3);
        })
    );
  }

  toggleSelectAll(checked: boolean): void {
    this.step3Data = this.step3Data.map((el) => ({ ...el, selected: checked }));
    this.isAllSelected = checked;
  }

  selectItem(rowData: IImportStep4): void {
    const index = this.step3Data.findIndex((item) => item.id === rowData.id);
    if (index !== -1) {
      this.step3Data[index] = { ...rowData, selected: !rowData.selected };
    }
    this.isAllSelected = this.step3Data.every((item) => item.selected);
  }

  submitStep3(): void {
    const entry = this.step3Data.filter((el) => el.selected).map((el) => el.id);

    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }

    this.step3Submitting.set(true);
    this.subscriptions.push(
      this.checkDraftService
        .importCheckDraftStep5({ entry })
        .pipe(finalize(() => this.step3Submitting.set(false)))
        .subscribe((response) => {
          if (response?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Checks imported.',
              close: true,
              timeout: 2000
            });
            this.dialogRef.close({ success: true });
          }
        })
    );
  }

  // ========================
  // Navigation & Close
  // ========================

  goBack(): void {
    const step = this.currentStep();
    if (step > 1) {
      this.currentStep.set(step - 1);
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
