import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IMultipleCheckImportEqStep1 } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgFor, NgClass } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { faAngleRight, faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

interface IImportFormGroup {
  excelFile: FormControl<File | null>;
  template: FormControl<string | null>;
  includeHeader: FormControl<string | null>;
  bankAccount: FormControl<string | null>;
}

interface IFormBody {
  template: string;
  excelFile: File;
  includeHeader: string;
  bankAccount: string;
}

/**
 * @description Component Class for step 1 of EQ multiple check Import Getting Templates and Sending File to backend and getting its response
 * @class
 */
@Component({
  selector: 'app-ent-import-checks',
  templateUrl: './ent-import-checks.component.html',
  styleUrls: ['./ent-import-checks.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BankAcDropdownV3Component,
    ControlMessageComponent,
    NgFor,
    NgClass,
    CommonButtonV35Component,
    CommonBackButtonV35Component,
    FontAwesomeModule,
    CommonUploadButtonV35Component,
    NgSelectModule
  ]
})
export class EntImportChecksComponent implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);

  faAngleRight = faAngleRight;
  faCircleInfo = faCircleInfo;
  subscriptions: Subscription[] = [];
  submitting = false;
  fileName = '';
  importForm: FormGroup<IImportFormGroup>;
  templates: IMultipleCheckImportEqStep1['template'] = [];
  sampleFileUrl: string;
  loading = false;
  selectedBank = new FormControl();
  selectedBankId: string;
  isSampleFileLoading = signal(false);

  ngOnInit(): void {
    this.initImportForm();
    this.getTemplates();
    this.getSelectedBank();
  }

  /**
   * @description Form Initialization
   */
  initImportForm() {
    this.importForm = new FormGroup<IImportFormGroup>({
      excelFile: new FormControl(null, [Validators.required]),
      template: new FormControl('NOTEMPLATE'),
      includeHeader: new FormControl('no'),
      bankAccount: new FormControl('')
    });
  }

  /**
   * @description being called after user choose a file
   * @param files : File
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
   * @description Get EQ Templates from api
   */
  getTemplates() {
    this.loading = true;
    this.subscriptions.push(
      this.checkService
        .gethamaspikTemplates()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((data) => {
          if (data.success) {
            this.templates = data.data?.template;
            this.sampleFileUrl = data.data?.sampleFileUrl;
          }
        })
    );
  }

  /**
   * @description Creates a form data from a given object
   * @param data
   * @returns
   */
  getFormData(data: IFormBody) {
    const body: IFormBody = {
      template: data.template,
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

  /**
   * @description Submitting Form
   */
  submit() {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) {
      return;
    }
    const formData = this.getFormData(this.importForm.value as IFormBody);
    let template = '';
    if (this.importForm.controls.template.value) {
      this.templates.forEach((ele) => {
        if (ele.id === this.importForm.controls.template.value) {
          const { templateName } = ele;
          template = templateName;
        }
      });
    } else if (this.importForm.controls.template.value === '') {
      template = 'Default template';
    }

    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .hamaspikImportEqStep2(formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          const res = data?.data;
          this.router.navigate(['manage/cheque/hamaspik-import/step2'], {
            state: { res, template }
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
