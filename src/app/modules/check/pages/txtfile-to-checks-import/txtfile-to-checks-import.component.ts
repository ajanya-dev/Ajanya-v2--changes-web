import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormControl,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IBankDropdown } from 'src/app/models/bank';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonUploadButtonV35Component } from '../../../../shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { BankAcDropdownV3Component } from '../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

interface IFormBody {
  bankAccount: string;
  type: string;
  file: string;
}

@Component({
  selector: 'app-txtfile-to-checks-import',
  templateUrl: './txtfile-to-checks-import.component.html',
  styleUrls: ['./txtfile-to-checks-import.component.scss'],
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    BankAcDropdownV3Component,
    ControlMessageComponent,
    CommonUploadButtonV35Component,
    NgSelectModule,
    FaIconComponent
  ]
})
export class TxtfileToChecksImportComponent implements OnInit, OnDestroy {

  public fb = inject(UntypedFormBuilder);
  private checkService = inject(CheckService);
  private router = inject(Router);

  subscriptions: Subscription[] = [];
  submitting = false;
  fileName = '';
  importForm: UntypedFormGroup;
  sampleFileUrl: string;
  selectedBank = new FormControl();
  selectedBankId = '';

  ngOnInit(): void {
    this.initImportForm();
    this.getSelectedBank();
  }

  initImportForm() {
    this.importForm = this.fb.group({
      bankAccount: ['', [Validators.required]],
      file: [null, [Validators.required]],
      type: ['1']
    });
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

  bankDropDownChange(e: IBankDropdown) {
    this.importForm.controls.bankAccount.setValue(e?.id);
  }

  goToJobsReport() {
    this.router.navigate(['/manage/more/custom-jobs-report']);
  }

  getFormData(data: IFormBody) {
    const formData = new FormData();
    formData.append('bankAccount', data.bankAccount);
    formData.append('type', data.type);
    formData.append('file', data.file);
    return formData;
  }

  /**
   * Method to get selected bank from dropdown
   */
  getSelectedBank() {
    this.subscriptions.push(
      this.selectedBank.valueChanges.subscribe((res) => {
        if (res) {
          if (res?.id === this.selectedBankId) {
            return;
          }
          this.importForm.controls.bankAccount.setValue(res?.id);
          this.importForm.controls.bankAccount.markAllAsTouched();
          this.selectedBankId = res.id;
        }
      })
    );
  }

  /**
   * clear bank selection
   */
  onRemoveBank() {
    this.importForm.controls.bankAccount.setValue(null);
    this.importForm.controls.bankAccount.markAllAsTouched();
  }

  submit() {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) {
      return;
    }
    const formData = this.getFormData(this.importForm.value);
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .multiImportTxtToCheckstep1(formData)
        .pipe(finalize(() => {this.submitting = false;}))
        .subscribe(() => {
          this.router.navigate(['manage/cheque/multi_import/txt-to-check2']);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
