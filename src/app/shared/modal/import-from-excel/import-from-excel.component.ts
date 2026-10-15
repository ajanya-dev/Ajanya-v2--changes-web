import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import {
  faArrowDownToLine,
  faXmark,
  faAngleRight,
  faAngleDown,
  faArrowLeft,
  faBookOpen,
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
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { GroupPaymentsService } from 'src/app/modules/group-payments/services/group-payments.service';
import { finalize, Subject, take, takeUntil } from 'rxjs';
import {
  GroupPaymentExcelMapping,
  GroupPaymentExcelMappingHeader
} from 'src/app/modules/group-payments/models/group-payments.models';
import { DatePipe, NgClass } from '@angular/common';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { CheckService } from '../../service/check/check.service';
import { BankAcDropdownV3Component } from '../../components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { AlertService } from '../../service/alert/alert.service';
import {
  DataService,
  ImportFileFieldGroup
} from '../../../modules/v4-bulk-payment/services/data.service';

type StepOneData = { step: 1 };
type StepTwoData = {
  step: 2;
  info: Pick<GroupPaymentExcelMapping, 'header' | 'rows'>;
};
type StepThreeData = { step: 3 };

type Steps = StepOneData | StepTwoData | StepThreeData;

@Component({
  selector: 'app-import-from-excel',
  standalone: true,
  imports: [
    V35ControlMessageComponent,
    CommonUploadButtonV35Component,
    CommonButtonV35Component,
    NgSelectModule,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    DatePipe,
    BankAcDropdownV3Component,
    NgClass
  ],
  templateUrl: './import-from-excel.component.html',
  styleUrl: './import-from-excel.component.scss'
})
export class ImportFromExcelComponent implements OnInit,OnDestroy {
  private groupPaymentService = inject(GroupPaymentsService);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private diaogRef = inject(MatDialogRef);
  private datePipe = inject(DatePipe);
  private dataService = inject(DataService);
  public injectData = inject<string>(MAT_DIALOG_DATA);

  fileDownloading = signal(false);
  submitting = signal(false);
  step = signal<Steps>({ step: 1 });
  showPrepareGuide = signal(false);

  prepareGuide: ImportFileFieldGroup[] =
    this.dataService.getImportFileFieldGroups();

  disableMap = signal<Record<string, number | undefined>>({});

  fts:string[] = [];
  selectedHeader: (GroupPaymentExcelMappingHeader | '')[] = [];
  selectedHeaderValues: (number | '')[] = [];
  selectedBank = new FormControl();
  destroy$ = new Subject();
  form = new FormGroup({
    file: new FormControl<null | File>(null, [Validators.required]),
    includeHeader: new FormControl('no', [Validators.required]),
    bankAccount: new FormControl<null | string>(null)
  });

  faArrowDownToLine = faArrowDownToLine;
  faAngleRight = faAngleRight;
  faAngleDown = faAngleDown;
  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  faBookOpen = faBookOpen;
  faCircleInfo = faCircleInfo;

  /**
   * @description Expands or collapses the "How to prepare your file" section.
   */
  togglePrepareGuide(): void {
    this.showPrepareGuide.update((val) => !val);
  }

  ngOnInit(): void {
    if(this.injectData === 'beazley-ent'){
      this.fts = ['.lis'];
      this.getSelectedBank();
    }else{
      this.fts = ['.xls', '.xlsx', '.xlsm', '.xlsb'];
    }
  }

  onFileUpload(file: File) {
    this.form.controls.file.setValue(file);
  }

  downloadSample() {
    this.fileDownloading.set(true);
    if (this.injectData === 'beazley-ent') {
      this.getBeazlySampleFile();
      return;
    }
    this.groupPaymentService
      .getSampleExcel()
      .pipe(
        finalize(() => {
          this.fileDownloading.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        location.href = res.data.sampleFileUrl;
      });
  }

  onSelectHeader(
    value: { opt: GroupPaymentExcelMappingHeader; optIn: number } | '',
    colIn: number
  ) {
    this.disableMap.update((val) => {
      const exKey = Object.entries(val).find(([_k, v]) => {
        return v === colIn;
      })?.[0];

      const obj: Record<string, number | undefined> = { ...val };

      if (exKey) {
        obj[exKey] = undefined;
      }

      if (typeof value === 'string') return obj;

      obj[value.optIn] = colIn;

      return obj;
    });

    this.selectedHeaderValues[colIn] =
      typeof value === 'string' ? '' : value.opt.value;
  }

  submit() {
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    if (this.injectData === 'beazley-ent') {
      this.submitBeazleyFile();
      return;
    }

    const payload = new FormData();

    payload.append('excelFile', this.form.value.file as File);
    payload.append('includeHeader', this.form.value.includeHeader as string);

    this.submitting.set(true);
    this.groupPaymentService
      .getExcelExtractedData(payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),

        take(1)
      )
      .subscribe((res) => {
        if (!res.success) return;

        const info = {
          header: res.data.header.filter((el) => el.value !== ''),
          rows: res.data.rows.map((row) => ({
            ...row,
            Date:
              row['Date'] && typeof row['Date'] === 'object' && row['Date'].date
                ? (this.datePipe.transform(row['Date'].date) ?? '')
                : row['Date']
          }))
        };

        info.header.forEach((_el, i) => {
          this.disableMap.update((val) => ({
            ...val,
            [i]: undefined
          }));
        });

        this.selectedHeader.length = this.selectedHeaderValues.length =
          info.header.length;

        this.selectedHeaderValues.fill('');
        this.selectedHeader.fill('');

        this.step.set({ step: 2, info });
      });
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

  submitStep2() {
    const payload = {
      mapping: this.selectedHeaderValues,
      uploadFromImport: 'yes'
    };

    this.submitting.set(true);
    this.groupPaymentService
      .submitExcelMappedData(payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if (!res.success) return;

        this.diaogRef.close({ success: true, data: res.data.paymentData });
      });
  }

  getSelectedBank() {
    this.selectedBank.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          if (!res.id) {
            return;
          }
          this.form.controls.bankAccount.setValue(res?.id);
          this.form.controls.bankAccount.markAllAsTouched();
        }
      });
  }

  onRemoveBank() {
    this.form.controls.bankAccount.setValue(null);
    this.form.controls.bankAccount.markAllAsTouched();
  }

  getBeazlySampleFile() {
    this.checkService
      .getBeazleySampleFile()
      .pipe(
        finalize(() => {
          this.fileDownloading.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        location.href = res.data.sampleFileUrl;
      });
  }

  submitBeazleyFile() {
    const payload = new FormData();
    payload.append('file', this.form.value.file as File);
    payload.append('bankAccount', this.form.value.bankAccount as string);

    this.submitting.set(true);
    this.checkService
      .importBeazleyChecks(payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if(res.success){
          this.alertService.successAlert({content:'Checks imported successfully'});
          this.diaogRef.close({success:true});
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
