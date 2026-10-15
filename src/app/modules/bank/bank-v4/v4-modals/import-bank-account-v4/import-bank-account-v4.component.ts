import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import {
  LucideAngularModule,
  X,
  ChevronRight,
  CircleAlert,
  Download,
  ArrowLeft,
  Upload,
  CheckCircle2
} from 'lucide-angular';
import { IBankDatas } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ],
  selector: 'app-import-bank-account-v4',
  templateUrl: './import-bank-account-v4.component.html',
  styleUrls: ['./import-bank-account-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportBankAccountV4Component {
  readonly XIcon = X;
  readonly ChevronRightIcon = ChevronRight;
  readonly CircleAlertIcon = CircleAlert;
  readonly DownloadIcon = Download;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly UploadIcon = Upload;
  readonly CheckCircle2Icon = CheckCircle2;

  private dialogRef = inject(MatDialogRef<ImportBankAccountV4Component>);
  private bankAccService = inject(BankAccountsService);
  private bankDataService = inject(BankDataV35Service);
  private alertService = inject(V4AlertService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  currentStep = signal<1 | 2 | 3>(1);
  loading = signal(false);
  selectedFile = signal<File | null>(null);

  // Step 2 data
  fileHeaders = signal<string[]>([]);
  fileRows = signal<any[][]>([]);
  mappedFields = signal<boolean[]>([]);
  fieldMappings: string[] = [];
  columnMappings = signal<string[]>([]);
  displayRows = computed(() => this.fileRows().slice(0, 7));
  mappedFieldCount = computed(() => this.columnMappings().filter(v => v !== '').length);

  // Step 3 data
  importRecords = signal<IBankDatas[]>([]);
  selectedIds = signal<string[]>([]);

  readonly sampleFileUrl =
    'https://c.onlinecheckwriter.com/public/cdn/download/sample_bank_data.xlsx';

  readonly fieldLabels: string[] = [
    'Routing Number',
    'Account Number',
    'Account Name',
    'Nick Name',
    'Account Type',
    'Address',
    'Address Line 2',
    'City',
    'State',
    'Zip',
    'Phone',
    'Email',
    'Bank Name',
    'Bank Street Address',
    'Bank City',
    'Bank State',
    'Bank Zip',
    'Fractional Number'
  ];

  readonly requiredFieldIndices = [0, 1, 2, 3, 5, 7, 8, 9, 12];
  readonly fieldIndices = Array.from({ length: 18 }, (_, i) => i);
  headerIndices = computed(() => Array.from({ length: this.fileHeaders().length }, (_, i) => i));

  // --- Step 1 ---

  onFileSelected(file: File): void {
    if (file?.name) {
      this.selectedFile.set(file);
    } else {
      this.selectedFile.set(null);
    }
  }

  onFileInputChange(event: Event, input: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.onFileSelected(file);
    }
    input.value = '';
  }

  clearFile(input: HTMLInputElement): void {
    input.value = '';
    this.selectedFile.set(null);
  }

  uploadFile(): void {
    const file = this.selectedFile();
    if (!file?.name) {
      this.alertService.warningAlert({ content: 'Please select a file to upload.' });
      return;
    }

    const formData = new FormData();
    formData.append('excelFile[]', file, file.name);

    this.loading.set(true);
    this.bankAccService
      .uploadXlDocStep2(formData)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.fileHeaders.set(res.data.header || []);
            this.fileRows.set(res.data.rows || []);
            this.initFieldMappings(res.data.header?.length || 0);
            this.currentStep.set(2);
            this.dialogRef.updateSize('90vw', '');
          }
        },
        error: (err) => {
          if(err?.error?.permissionType){
            this.alertService.failedAlert({
              content:`You don't have permission to do this action`
            });
            return;
          }
          this.alertService.failedAlert({
            content: err?.error?.errorMsg || err?.error?.message || 'Failed to process file.'
          });
        }
      });
  }

  // --- Step 2 ---

  private initFieldMappings(headerCount: number): void {
    this.fieldMappings = new Array(18).fill('');
    this.mappedFields.set(new Array(headerCount).fill(false));
    this.columnMappings.set(new Array(headerCount).fill(''));
  }

  isOptionDisabled(fieldIdx: number, headerIdx: number): boolean {
    return this.mappedFields()[headerIdx] && this.fieldMappings[fieldIdx] !== '' + headerIdx;
  }

  onMappingChange(): void {
    const headers = this.fileHeaders();
    const used = new Array(headers.length).fill(false);

    for (let i = 0; i < 18; i++) {
      const val = this.fieldMappings[i];
      if (val !== '') {
        const idx = parseInt(val, 10);
        if (!isNaN(idx)) {
          used[idx] = true;
        }
      }
    }

    this.mappedFields.set(used);
  }

  onColumnMappingChange(headerIdx: number, fieldIdxStr: string): void {
    const cols = [...this.columnMappings()];
    const oldFieldIdx = cols[headerIdx];

    // Clear old field mapping
    if (oldFieldIdx !== '') {
      this.fieldMappings[parseInt(oldFieldIdx, 10)] = '';
    }

    // If another column already had this field, clear it
    if (fieldIdxStr !== '') {
      const existingColIdx = cols.findIndex((v, i) => i !== headerIdx && v === fieldIdxStr);
      if (existingColIdx >= 0) {
        cols[existingColIdx] = '';
      }
    }

    cols[headerIdx] = fieldIdxStr;
    this.columnMappings.set(cols);

    // Sync to fieldMappings
    if (fieldIdxStr !== '') {
      this.fieldMappings[parseInt(fieldIdxStr, 10)] = headerIdx.toString();
    }

    this.onMappingChange();
  }

  getAvailableFields(headerIdx: number): { idx: number; label: string; required: boolean }[] {
    const cols = this.columnMappings();
    const usedFieldIndices = new Set(
      cols
        .filter((v, i) => i !== headerIdx && v !== '')
        .map(v => parseInt(v, 10))
    );

    return this.fieldIndices
      .filter(idx => !usedFieldIndices.has(idx))
      .map(idx => ({
        idx,
        label: this.fieldLabels[idx],
        required: this.requiredFieldIndices.includes(idx)
      }));
  }

  submitMapping(): void {
    const cols = this.columnMappings();

    // Validate: check that all required field indices appear as values in columnMappings
    for (const reqIdx of this.requiredFieldIndices) {
      if (!cols.includes(reqIdx.toString())) {
        this.alertService.warningAlert({
          content: `Please select a ${this.fieldLabels[reqIdx].toLowerCase()}`
        });
        return;
      }
    }

    // Build mapping in column → field format (API expects mapping[column_index] = field_index)
    const mapping: Record<number, string> = {};
    for (let i = 0; i < 18; i++) {
      mapping[i] = i < cols.length ? cols[i] : '';
    }

    this.loading.set(true);
    this.bankAccService
      .uploadXlDocStep3({ waring: 0, mapping })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.loadStep3Data();
        },
        error: (err) => {
          this.alertService.failedAlert({
            content: err?.error?.errorMsg || err?.error?.message || 'Failed to submit mapping.'
          });
        }
      });
  }

  goBackToStep1(): void {
    this.currentStep.set(1);
    this.dialogRef.updateSize('600px', '');
  }

  // --- Step 3 ---

  private loadStep3Data(): void {
    this.loading.set(true);
    this.bankAccService
      .uploadXlDocStep4()
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.importRecords.set(res.data);
            const validIds = res.data
              .filter((r: IBankDatas) => r.validationError === null)
              .map((r: IBankDatas) => r.uuId);
            this.selectedIds.set(validIds);
            this.currentStep.set(3);
            this.changeDetectorRef.detectChanges();
          }
        },
        error: (err) => {
          this.alertService.failedAlert({
            content: err?.error?.errorMsg || err?.error?.message || 'Failed to load records.'
          });
        }
      });
  }

  onCheckboxChange(record: IBankDatas, checked: boolean): void {
    const current = this.selectedIds();
    if (checked) {
      this.selectedIds.set([...current, record.uuId]);
    } else {
      this.selectedIds.set(current.filter((id) => id !== record.uuId));
    }
  }

  isSelected(record: IBankDatas): boolean {
    return this.selectedIds().includes(record.uuId);
  }

  submitImport(allowDuplicate = false): void {
    const ids = this.selectedIds();
    if (!ids.length) {
      this.alertService.warningAlert({ content: 'Please select at least one record to import.' });
      return;
    }

    this.loading.set(true);
    this.bankAccService
      .uploadXlDocStep5({
        ids,
        ...(allowDuplicate ? { allowDuplicate: 1 } : {})
      })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Bank accounts imported successfully.' });
            this.bankDataService.setAccounts(undefined);
            this.bankDataService.setTotalBankAccountsCount();
            this.dialogRef.close(true);
          }
        },
        error: (err) => {
          if (err?.error?.errorCode === 701) {
            const confirmRef = this.alertService.confirmAlert({
              content: err?.error?.errorMsg || 'Duplicate accounts found. Do you want to allow duplicates?',
              doneMsg: 'Allow Duplicate'
            });
            confirmRef.afterClosed().subscribe((confirmed) => {
              if (confirmed) {
                this.submitImport(true);
              }
            });
          } else {
            this.alertService.failedAlert({
              content: err?.error?.errorMsg || err?.error?.message || 'Failed to import records.'
            });
          }
        }
      });
  }

  getAccountTypeLabel(type: number): string {
    if (type === 1) return 'CHECKING';
    if (type === 2) return 'SAVINGS';
    return '';
  }

  hasError(record: IBankDatas, errorKey: string): boolean {
    return !!(record.validationError?.error as any)?.[errorKey];
  }

  getError(record: IBankDatas, errorKey: string): string {
    const err = (record.validationError?.error as any)?.[errorKey];
    if (Array.isArray(err)) return err[0] || '';
    return err || '';
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
