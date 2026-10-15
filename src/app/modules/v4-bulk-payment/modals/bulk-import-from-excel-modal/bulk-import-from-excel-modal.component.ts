import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChildren
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subject, take } from 'rxjs';
import {
  LucideAngularModule,
  X,
  ArrowLeft,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CircleCheck,
  Trash2,
  BookOpen,
  ChevronDown,
  FileUp,
  Info,
  RotateCcw
} from 'lucide-angular';
import { GroupPaymentsService } from 'src/app/modules/group-payments/services/group-payments.service';
import {
  GroupPaymentExcelMapping,
  GroupPaymentExcelMappedData,
  GroupPaymentExcelMappingHeader
} from 'src/app/modules/group-payments/models/group-payments.models';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  DataService,
  ImportFileFieldGroup
} from '../../services/data.service';

/**
 * Row-count rejection from POST /imports/bulk-payments/step2. It carries an errorCode,
 * so `handle422` in v4-error-handling.interceptor.ts treats it as business logic and
 * leaves it to the component — nothing reaches the user unless we surface it here.
 */
const MAX_IMPORT_PAYMENTS_ERROR_CODE = 4221;

function toFileColumns(
  header: GroupPaymentExcelMappingHeader[]
): GroupPaymentExcelMappingHeader[] {
  return header[0]?.value === '' ? header.slice(1) : header;
}

type StepOneData = { step: 1 };
type StepTwoData = {
  step: 2;
  info: Pick<GroupPaymentExcelMapping, 'header' | 'rows'>;
};
type StepThreeData = { step: 3; data: GroupPaymentExcelMappedData[] };
type Steps = StepOneData | StepTwoData | StepThreeData;

@Component({
  selector: 'app-bulk-import-from-excel-modal',
  standalone: true,
  imports: [
    LucideAngularModule,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip
  ],
  templateUrl: './bulk-import-from-excel-modal.component.html',
  styleUrl: './bulk-import-from-excel-modal.component.scss'
})
export class BulkImportFromExcelModalComponent implements OnDestroy {
  private groupPaymentService = inject(GroupPaymentsService);
  private alertService = inject(V4AlertService);
  dialogRef = inject(MatDialogRef);
  private datePipe = inject(DatePipe);
  private dataService = inject(DataService);

  readonly XIcon = X;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly UploadIcon = Upload;
  readonly DownloadIcon = Download;
  readonly ChevronRightIcon = ChevronRight;
  readonly FileSpreadsheetIcon = FileSpreadsheet;
  readonly CircleCheckIcon = CircleCheck;
  readonly Trash2Icon = Trash2;
  readonly BookOpenIcon = BookOpen;
  readonly ChevronDownIcon = ChevronDown;
  readonly FileUpIcon = FileUp;
  readonly InfoIcon = Info;
  readonly RotateCcwIcon = RotateCcw;

  step = signal<Steps>({ step: 1 });
  showPrepareGuide = signal(false);
  prepareGuide: ImportFileFieldGroup[] =
    this.dataService.getImportFileFieldGroups();

  fileDownloading = signal(false);
  submitting = signal(false);
  isDragOver = false;

  columnField = signal<(number | '')[]>([]);

  includeHeaderOptions = [
    { label: 'No \u2014 data starts on the first row', value: 'no' },
    { label: 'Yes \u2014 first row is column headings', value: 'yes' }
  ];

  fts = ['.xls', '.xlsx', '.xlsm', '.xlsb', '.csv'];

  headerDropdownCells =
    viewChildren<ElementRef<HTMLElement>>('headerDropdownCell');

  truncatedHeaderLabels = signal<boolean[]>([]);

  private baseFieldOptions = computed(() => {
    const step = this.step();
    if (step.step !== 2) return [];
    return step.info.header
      .filter((col) => col.value !== '')
      .sort((a, b) => (a.value as number) - (b.value as number))
      .map((col) => ({
        label: col.displayName,
        value: String(col.value)
      }));
  });

  displayColumns = computed(() => {
    const step = this.step();
    if (step.step !== 2) return [];
    return step.info.header
      .map((col, index) => ({ col, index }))
      .filter(
        ({ col }) =>
          col.value !== '' &&
          step.info.rows.some((row) => col.displayName in row)
      );
  });

  columnOptions = computed(() => {
    const base = this.baseFieldOptions();
    const cols = this.columnField();
    const taken = new Set(cols.filter((f) => f !== '').map(String));
    return cols.map((own) =>
      base.map((opt) => ({
        ...opt,
        disabled: opt.value !== String(own) && taken.has(opt.value)
      }))
    );
  });

  /**
   * @description Expands or collapses the "How to prepare your file" section.
   */
  togglePrepareGuide(): void {
    this.showPrepareGuide.update((val) => !val);
  }

  /**
   * @description Formats a file size for display next to the selected file.
   * @param size File size in bytes.
   * @returns Rounded size with its unit, e.g. `24 KB`.
   */
  formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * @description The dropdown value for a column.
   * @param colIn Column index.
   * @returns The mapped field id as a string, or `null` when the column is unmapped.
   */
  dropdownValue(colIn: number): string | null {
    const field = this.columnField()[colIn];
    return field === '' || field === undefined ? null : String(field);
  }

  /**
   * @description Full label of the field mapped to a column, shown as a tooltip.
   * @param colIn Column index.
   */
  getSelectedHeaderLabel(colIn: number): string {
    const value = this.dropdownValue(colIn);
    if (value == null) return '';
    return (
      this.baseFieldOptions().find((option) => option.value === value)
        ?.label ?? ''
    );
  }

  /**
   * @description Enables the tooltip only for column labels that overflow the dropdown.
   */
  updateTruncatedHeaderLabels(): void {
    setTimeout(() => {
      const columns = this.displayColumns();
      const truncated = new Array<boolean>(this.columnField().length).fill(
        false
      );
      this.headerDropdownCells().forEach((cell, i) => {
        const entry = columns[i];
        if (!entry) return;
        const labels = cell.nativeElement.querySelectorAll<HTMLElement>(
          '.ng-value, .ng-value span.truncate'
        );
        truncated[entry.index] = Array.from(labels).some(
          (label) => label.scrollWidth > label.clientWidth
        );
      });
      this.truncatedHeaderLabels.set(truncated);
    });
  }

  /**
   * @description Maps a column to a payment field, or clears it when `value` is empty.
   * @param value Field id as a string, or `null`/`''` to clear.
   * @param colIn Column index being mapped.
   */
  onFieldChange(value: string | null, colIn: number): void {
    const field = value == null || value === '' ? '' : Number(value);

    this.columnField.update((cols) => {
      const next = [...cols];
      if (field !== '') {
        const previous = next.indexOf(field);
        if (previous !== -1) next[previous] = '';
      }
      next[colIn] = field;
      return next;
    });
    this.updateTruncatedHeaderLabels();
  }

  /**
   * @description Clears every column mapping so the user can map from scratch.
   */
  resetMapping(): void {
    this.columnField.update((cols) => cols.map(() => ''));
    this.updateTruncatedHeaderLabels();
  }

  hasMapping = computed(() => this.columnField().some((f) => f !== ''));

  destroy$ = new Subject();

  form = new FormGroup({
    file: new FormControl<null | File>(null, [Validators.required]),
    includeHeader: new FormControl('no', [Validators.required])
  });

  onFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const fileType = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!this.fts.includes(fileType)) {
      this.alertService.failedAlert({
        content: 'Unsupported file format. Please select a csv/xlsx file.'
      });
      input.value = '';
      return;
    }

    const maxSize = 10 * 1e6;
    if (file.size > maxSize) {
      this.alertService.failedAlert({
        content: 'File size should be less than 10MB.'
      });
      input.value = '';
      return;
    }

    this.form.controls.file.setValue(file);
  }

  removeFile() {
    this.form.controls.file.setValue(null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    const fileType = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!this.fts.includes(fileType)) {
      this.alertService.failedAlert({
        content: 'Unsupported file format. Please select a csv/xlsx file.'
      });
      return;
    }

    this.form.controls.file.setValue(file);
  }

  downloadSample() {
    this.fileDownloading.set(true);
    this.groupPaymentService
      .getSampleExcel()
      .pipe(
        finalize(() => this.fileDownloading.set(false)),
        take(1)
      )
      .subscribe((res) => {
        // eslint-disable-next-line no-restricted-globals
        location.href = res.data.sampleFileUrl;
      });
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const payload = new FormData();
    payload.append('excelFile', this.form.value.file as File);
    payload.append('includeHeader', this.form.value.includeHeader as string);

    this.submitting.set(true);
    this.groupPaymentService
      .getExcelExtractedData(payload)
      .pipe(
        finalize(() => this.submitting.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (!res.success) return;

          const header = toFileColumns(res.data.header);
          const info = {
            header,
            rows: res.data.rows.map((row) => ({
              ...row,
              Date:
                row.Date && typeof row.Date === 'object' && row.Date.date
                  ? (this.datePipe.transform(row.Date.date) ?? '')
                  : row.Date
            }))
          };

          const mapping = res.data.mapping ?? {};
          this.columnField.set(
            header.map((_col, i) =>
              mapping[i] != null ? Number(mapping[i]) : ''
            )
          );

          this.step.set({ step: 2, info });
          this.updateTruncatedHeaderLabels();
        },
        error: (err: HttpErrorResponse) => this.handleUploadError(err)
      });
  }

  /**
   * The upload step validates the row count server-side. Its rejection carries an
   * errorCode, so the interceptor skips it and the modal would otherwise just stop
   * spinning with no explanation.
   *
   * Only the row-count code is handled here: codes in the interceptor's global set
   * already raise their own dialog, and alerting again would stack two on top of
   * each other.
   */
  private handleUploadError(err: HttpErrorResponse): void {
    const { errorCode, errorMsg } = (err?.error ?? {}) as {
      errorCode?: number;
      errorMsg?: string;
    };

    if (Number(errorCode) !== MAX_IMPORT_PAYMENTS_ERROR_CODE) return;

    // A smaller file is the only way forward, so drop the rejected one and leave the
    // user on the upload step ready to pick another.
    this.removeFile();
    this.alertService.failedAlert({
      content: errorMsg || 'You can import a maximum of 300 payments at a time.'
    });
  }

  submitStep2() {
    const payload = {
      mapping: this.columnField(),
      uploadFromImport: 'yes'
    };

    this.submitting.set(true);
    this.groupPaymentService
      .submitExcelMappedData(payload)
      .pipe(
        finalize(() => this.submitting.set(false)),
        take(1)
      )
      .subscribe((res) => {
        if (!res.success) return;
        this.step.set({ step: 3, data: res.data.paymentData });
        setTimeout(() => this.closeWithSuccess(), 3000);
      });
  }

  closeWithSuccess() {
    const step = this.step();
    if (step.step === 3) {
      this.dialogRef.close({ success: true, data: step.data });
    }
  }

  back() {
    const step = this.step();
    if (step.step > 1) {
      this.step.update((val) => ({
        ...val,
        step: (val.step - 1) as 1
      }));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
