import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-check-reconciliation-step1',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FaIconComponent,
    CommonUploadButtonV35Component,
    BankAcDropdownV3Component,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent
  ],
  templateUrl: './check-reconciliation-step1.component.html',
  styleUrl: './check-reconciliation-step1.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckReconciliationStep1Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  sampleFileUrl: string;
  selectedBank = new FormControl();
  fileName = '';
  destroy$ = new Subject();
  selectedBankId: string;
  pageType = 'payments';
  isSampleFileLoading = signal(false);
  isSubmit = signal(false);
  faAngleRight = faAngleRight;

  importForm = new FormGroup({
    bankAccount: new FormControl('', Validators.required),
    file: new FormControl<File | null>(null, Validators.required)
  });

  ngOnInit(): void {
    this.getSelectedBank();
    this.getSampleFile();
    this.getUrlParams();
  }

  getUrlParams(){
    this.activatedRoute.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe((data) => {
      this.pageType = data.page;
    });
  }

  getSampleFile() {
    this.isSampleFileLoading.set(true);
    this.checkService
      .getReconciliationSampleFile()
      .pipe(finalize(() => this.isSampleFileLoading.set(false)),takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.sampleFileUrl = res.data.sampleFileUrl;
        }
      });
  }

  getSelectedBank() {
    this.selectedBank.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          if (res?.id === this.selectedBankId) {
            return;
          }
          this.importForm.controls.bankAccount.setValue(res?.id);
          this.importForm.controls.bankAccount.markAllAsTouched();
          this.selectedBankId = res.id;
        }
      });
  }

  downloadClick() {
    window.location.href = this.sampleFileUrl;
  }

  onRemoveBank() {
    this.importForm.controls.bankAccount.setValue(null);
    this.importForm.controls.bankAccount.markAllAsTouched();
  }

  uploadEvent(files: File): void {
    if (files && files?.name) {
      this.fileName = files?.name;
      this.importForm.controls.file.setValue(files);
    } else {
      this.importForm.controls.file.setValue(null);
      this.importForm.controls.file.markAsTouched();
    }
  }

  submit() {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) {
      return;
    }
    const fromValue = this.importForm.value;
    const formData = new FormData();
    formData.append('bankAccount', fromValue.bankAccount as string);
    formData.append('excelFile', fromValue.file as File);
    this.isSubmit.set(true);
    this.checkService
      .importReconciliationFile(formData)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.router.navigate(['manage/cheque/reconciliation/step2'], {
            state: { res: JSON.stringify(res?.data) },queryParams: { page: this.pageType }
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
