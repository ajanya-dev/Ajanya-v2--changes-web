import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { Subscription, finalize } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleRight } from '@fortawesome/pro-solid-svg-icons';
import { Router } from '@angular/router';
import { V35ControlMessageComponent } from "../../../../shared/v3/control-message-v35/control-message-v35.component";
import { AlertService } from '../../../../shared/service/alert/alert.service';

interface IImportForm {
  bankAccount: FormControl<string | null>;
  file: FormControl<File | null>;
}


@Component({
  selector: 'app-salesforce-import-check',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BankAcDropdownV3Component,
    CommonUploadButtonV35Component,
    CommonButtonV35Component,
    FontAwesomeModule,
    V35ControlMessageComponent
  ],
  templateUrl: './salesforce-import-check.component.html',
  styleUrl: './salesforce-import-check.component.scss'
})
export class SalesforceImportCheckComponent implements OnInit, OnDestroy  {
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  public fb = inject(FormBuilder);

  subscriptions: Subscription[] = [];
  sampleFileUrl: string;
  loading = false;
  submitting = false;
  selectedBank = new FormControl();
  faAngleRight = faAngleRight;
  importForm: FormGroup<IImportForm> = this.fb.group({
    bankAccount: ['', [Validators.required]],
    file: [null, [Validators.required]]
  }) as FormGroup<IImportForm>;

  ngOnInit(): void {
    this.getSelectedBank();
    this.getSampleFile();
  }

  /**
   * @description Get sample file url.
   */
  getSampleFile(): void {
    this.loading = true;
    this.subscriptions.push(
      this.checkService.getSalesForceSampleFile()
      .pipe(finalize(() => {this.loading = false;}))
      .subscribe((res) => {
        if (res.success) {
          this.sampleFileUrl = res.data.sampleFileUrl;
        }
      })
    );
  }

  /**
   * Method to get selected bank from dropdown
   */
  getSelectedBank() {
    this.subscriptions.push(
      this.selectedBank.valueChanges.subscribe((res) => {
        if (res) {
          if (!res.id) {
            return;
          }
          this.importForm.controls.bankAccount.setValue(res?.id);
          this.importForm.controls.bankAccount.markAllAsTouched();
        }
      })
    );
  }

  /**
   * @description Handles the event when a file is picked.
   * @param files The File object representing the picked file 
   */
  filePicked(files: File) {
    if (files && files?.name) {
      this.importForm.controls.file.setValue(files);
    } else {
      this.importForm.controls.file.setValue(null);
      this.importForm.controls.file.markAsTouched();
    }
  }

  /**
   * clear bank selection
   */
  onRemoveBank() {
    this.importForm.controls.bankAccount.setValue(null);
    this.importForm.controls.bankAccount.markAllAsTouched();
  }

  /**
   * @description Import checks from uploaded excel file.
   * @param {boolean}isProceedAnyWay Indicates whether to proceed anyway even if there are errors. (Optional)
   */
  importChecks(isProceedAnyWay?: boolean): void {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) {
      return;
    }
    const formValue = this.importForm.value;
    const formData = new FormData();
    const proceedForCheckNumber = isProceedAnyWay ? 1 : 0;
    formData.append('bankAccount', formValue.bankAccount as string);
    formData.append('file', formValue.file as File);
    formData.append('proceedForCheckNumber', String(proceedForCheckNumber));
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .importSalesForceChecks(formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Checks imported successfully.',
                close: true,
                timeout: 2000
              });
              this.router.navigate(['manage/cheque/checkrecords']);
            }
          },
          error: (err) => {
            if (err.error.errorCode === 190) {
              this.proceedModal(err.error.errorMsg);
            }
          }
        })
    );
  }

  /**
   * @description Displays a modal to confirm proceeding despite errors.
   * @param {string}err The error message.
   */
  proceedModal(err: string) {
    const warn = this.openConfirmAlert('Do you want to proceed anyway?', err);
    warn.afterClosed().subscribe((res) => {
      if (res) {
        this.importChecks(true);
      }
    });
  }

  /**
   * @description Opens a confirmation alert.
   * @param content content The content of the confirmation.
   * @param title title The title of the confirmation. (Optional)
   * @returns The confirmation alert.
   */
  openConfirmAlert(content: string, title?: string) {
    const data = {
      title: title || 'Confirm',
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  /**
   * handles download button click event
   */
  downloadClick() {
    window.location.href = this.sampleFileUrl;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
