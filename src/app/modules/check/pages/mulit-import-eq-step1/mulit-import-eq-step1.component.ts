import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
import { faAngleRight, faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

interface IImportFormGroup {
  file: FormControl<File | null>;
  template: FormControl<string | null>;
  includeHeader: FormControl<string | null>;
}

interface IFormBody {
  template: string;
  file: File;
  includeHeader: string;
}

/**
 * @description Component Class for step 1 of EQ multiple check Import Getting Templates and Sending File to backend and getting its response
 * @class
 */
@Component({
  selector: 'app-mulit-import-eq-step1',
  templateUrl: './mulit-import-eq-step1.component.html',
  styleUrls: ['./mulit-import-eq-step1.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgFor,
    NgClass,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    NgSelectModule,
    FontAwesomeModule
  ]
})
export class MulitImportEqStep1Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);

  faCircleInfo = faCircleInfo;
  faAngleRight = faAngleRight;

  subscriptions: Subscription[] = [];
  submitting = false;
  fileName = '';
  importForm: FormGroup<IImportFormGroup>;
  templates: IMultipleCheckImportEqStep1['template'] = [];
  sampleFileUrl: string;
  loading = false;

  ngOnInit(): void {
    this.initImportForm();
    this.getTemplates();
  }

  /**
   * @description Form Initialization
   */
  initImportForm() {
    this.importForm = new FormGroup<IImportFormGroup>({
      file: new FormControl(null, [Validators.required]),
      template: new FormControl('NOTEMPLATE'),
      includeHeader: new FormControl('no')
    });
  }

  /**
   * @description being called after user choose a file
   * @param files : File
   */
  uploadEvent(files: File): void {
    if (files) {
      this.fileName = files?.name;
      this.importForm.controls.file.setValue(files);
    } else {
      this.fileName = '';
      this.importForm.controls.file.reset();
    }
  }

  /**
   * @description Get EQ Templates from api
   */
  getTemplates() {
    this.loading = true;
    this.subscriptions.push(
      this.checkService
        .getTemplatesEq()
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
      file: data.file,
      includeHeader: data.includeHeader
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
        .multiImportEqStep2(formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          const res = data?.data;
          this.router.navigate(['manage/cheque/multi_import_eq/step2'], {
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
