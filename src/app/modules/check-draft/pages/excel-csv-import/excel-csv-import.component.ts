import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'dexie';
import { finalize } from 'rxjs/operators';
import { IBankAccounts } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

export interface IGetForms {
  bankAccount: string;
  excelFile: File;
  includeHeader: string;
}

interface IImportFormGroup {
  excelFile: FormControl<File | null>;
  includeHeader: FormControl<string | null>;
  bankAccount: FormControl<string | null>;
}

/**
 * @description Represents the ExcelCsvImportComponent responsible for importing
 * check drafts from Excel or CSV files.
 */
@Component({
  selector: 'app-excel-csv-import',
  templateUrl: './excel-csv-import.component.html',
  styleUrls: ['./excel-csv-import.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DropDownBankComponent,
    ControlMessageComponent,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    BankAcDropdownV3Component,
    FontAwesomeModule,
    NgSelectModule
  ]
})
export class ExcelCsvImportComponent implements OnInit, OnDestroy {
  private checkDraftService = inject(CheckDraftService);
  private router = inject(Router);

  faAngleRight = faAngleRight;
  faCircleInfo = faCircleInfo;
  fileName: string;
  importForm: FormGroup<IImportFormGroup>;
  sampleFileUrl: string;
  subscriptions: Subscription[] = [];
  loading = false;
  selectedBank = new FormControl();
  selectedBankId: string;
  isSampleFileLoading = signal(false);

  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);

  ngOnInit(): void {
    this.initImportForm();
    this.getTemplates();
    this.getSelectedBank();
  }

  /** @description Initializes the import form with default values and validators. */
  initImportForm() {
    this.importForm = new FormGroup<IImportFormGroup>({
      excelFile: new FormControl(null, [Validators.required]),
      includeHeader: new FormControl('no'),
      bankAccount: new FormControl('', [Validators.required])
    });
  }

  /**
   * @description Handles the change event of the bank dropdown.
   * @param env The selected bank account.
   */
  bankDropDownChange(env: IBankAccounts) {
    if (env?.verified === 0) {
      const close = this.alertService.warningAlert({
        content:
          'This bank account is not verified. The imported check draft using this bank account will be voided, Are you sure you want to continue?',
        doneMsg: 'Yes',
        isCancel: true,
        cancelMsg: 'Not Now'
      });
      close.afterClosed().subscribe((res) => {
        if (res) {
          this.importForm.controls.bankAccount.setValue(env?.id);
        } else {
          this.importForm.controls.bankAccount.setValue('');
          this.sharedService.setNewBankCreatedData();
        }
      });
    } else {
      this.importForm.controls.bankAccount.setValue(env?.id);
    }
  }

  /**
   * @description Handles the file upload event.
   * @param files The array of uploaded files.
   */
  uploadEvent(files: File): void {
    if (files && files?.name) {
      this.fileName = files?.name;
      this.importForm.controls.excelFile.setValue(files);
    } else {
      this.importForm.controls.excelFile.setValue(null);
      this.importForm.controls.excelFile.markAsTouched();
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
   * @description Fetches the available templates for import.
   */
  getTemplates() {
    this.isSampleFileLoading.set(true);
    this.subscriptions.push(
      this.checkDraftService.getTemplates()
      .pipe(
        finalize(() => {
          this.isSampleFileLoading.set(false);
        })
      )
      .subscribe((data) => {
        if (data?.success) {
          this.sampleFileUrl = data?.data?.sampleFileUrl;
        }
      })
    );
  }

  /**
   * @description Triggers the file input element's click event.
   */
  choose() {
    document.getElementById('file_select')?.click();
  }

  /**
   * @description Constructs the form data from the import form values.
   * @param formDatas The import form values.
   * @returns The constructed FormData object.
   */
  getFormData(data: IGetForms) {
    const body: IGetForms = {
      excelFile: data.excelFile,
      includeHeader: data.includeHeader,
      bankAccount: data.bankAccount
    };

    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  }

  /** @description Submits the import form data for importing check drafts. */
  submit(): void {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) {
      return;
    }
    const formData = this.getFormData(this.importForm.value as IGetForms);
    this.loading = true;
    this.subscriptions.push(
      this.checkDraftService
        .importCheckDraftStep2(formData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((data) => {
          this.router.navigate(['manage/checkdraft/import/step2'], {
            state: { res: JSON.stringify(data?.data) }
          });
        })
    );
  }

  /**
   * handles download button click event
   */
  downloadClick() {
    window.location.href = this.sampleFileUrl;
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
