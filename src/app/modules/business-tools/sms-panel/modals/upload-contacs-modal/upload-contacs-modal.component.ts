import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  IExtractedContactData,
  IExtractedContactHeader,
  IExtractedContactRowData,
  IImportedContactData
} from '../../model/sms-panel';
import { NgIf, NgFor, NgStyle } from '@angular/common';

@Component({
  selector: 'app-upload-contacs-modal',
  templateUrl: './upload-contacs-modal.component.html',
  styleUrls: ['./upload-contacs-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgIf, NgFor, FormsModule, NgStyle]
})
export class UploadContacsModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  fileName = 'Upload Document';
  files: File[] = [];
  templateFile =
    'https://api-staging.api.ocw.sebipay.com/cdn/download/sample_multi_data_file.xlsx';

  data: IExtractedContactData;
  headerOptions: { key: string | number; value: string }[] = [];
  headerColumns: { selectedIndex: string | number }[] = [];
  templateName = ' ';
  excelArrayData: {
    key: number;
    rowValue: { value: string | number; invalid: boolean }[];
  }[] = [];
  GroupId: string;
  disableMapping: { [x: string]: boolean };
  isMatchOn: boolean;
  matchItem: { selectedIndex: string | number };
  contactForm: UntypedFormGroup;
  colCount = 9;
  constructor(
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA)
    public dialoguData: { files: File[]; groupId: string },
    private matdialogRef: MatDialogRef<UploadContacsModalComponent>,
    private businessToolsService: BusinessToolsService
  ) {}

  ngOnInit(): void {
    if (this.dialoguData.files && this.dialoguData.groupId) {
      this.files = this.dialoguData.files;
      this.uploadFileToFormat(this.dialoguData.groupId);
    }
    this.contactForm = new UntypedFormGroup({
      name: new UntypedFormControl('', Validators.required),
      email: new UntypedFormControl('', [ValidationService.emailValidator]),
      phone: new UntypedFormControl('', [
        Validators.required,
        ValidationService.phoneNumberValidator
      ]),
      zip: new UntypedFormControl('', [ValidationService.zipValidator])
    });
  }

  /**
   * @description Set data from response.
   */
  SetData(response: IExtractedContactData) {
    this.data = response;
    this.data?.rows?.forEach(
      (k2: IExtractedContactRowData, _index2: number) => {
        const k3: { value: string | number; invalid: boolean }[] = [];
        Object.values(k2).forEach((element) => {
          k3.push({ value: element, invalid: false });
        });
        this.excelArrayData.push({ key: _index2, rowValue: k3 });
      }
    );
    this.data.header[0].value = 'match';
    this.headerOptions = this.makeHeader(this.data.header);

    for (let i = 0; i < this.colCount; i++) {
      this.headerColumns.push({ selectedIndex: '' });
    }
    this.mappingChange();
  }

  /**
   * @description Upload file.
   */
  uploadFileToFormat(GroupId: string): void {
    if (this.files && this.files.length > 0) {
      this.fileName = this.files[0]?.name;
      const formData = this.getFormData(this.files[0], GroupId);
      this.subscriptions.push(
        this.businessToolsService
          .importContactsStep1(formData)
          .subscribe((res) => {
            if (res.success) {
              this.SetData(res.data);
              this.GroupId = GroupId;
            }
          })
      );
    } else {
      this.onError({
        errMsg: 'Please click on browse and select a valid file'
      });
    }
  }

  /**
   * @description Creates form data.
   */
  getFormData(fileData: File, GroupId: string) {
    const body = {
      template: 'templateFile',
      excelFile: fileData,
      includeHeader: true,
      groupId: GroupId
    };

    const formData = new FormData();
    for (const k in body) {
      formData.append(k, (body as any)[k]);
    }
    return formData;
  }

  /**
   * @description Creates header.
   */
  makeHeader(
    data: IExtractedContactHeader[]
  ): { key: string | number; value: string }[] {
    const headers: { key: string | number; value: string }[] = [];
    data.forEach((element: IExtractedContactHeader) => {
      headers.push({ key: element.value, value: element.displayName });
    });
    return headers;
  }

  /**
   * @description Submit data and import contacts.
   */
  submit() {
    let countInvalid = 0;
    const requiredAny1 = ['1'];
    let payeeNameSelected = false;
    const mapping = this.headerColumns.map((row) => {
      if (requiredAny1.includes(row.selectedIndex as string)) {
        payeeNameSelected = true;
      }
      return row.selectedIndex;
    });
    if (!payeeNameSelected) {
      this.alertService.warningAlert({
        content:
          'Please at least select phone number and name. This file cannot be processed'
      });
      return;
    }
    const body = { mapping, groupId: this.GroupId };
    countInvalid = this.markInvalidRows(mapping);
    if (countInvalid) {
      const dRef = this.alertService.confirmAlert({
        content:
          'Invalid data found on ' +
          countInvalid +
          ' rows . Are you sure you want to continue?'
      });
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          this.importContacts(body);
        }
      });
    } else {
      this.importContacts(body);
    }
  }

  /**
   * @description Get the remaining characters.
   */
  markInvalidRows(mapping: (string | number)[]) {
    let countInvalid = 0;
    this.excelArrayData.forEach((dataRow, index) => {
      const dataobj = {
        name: '',
        email: '',
        phone: '',
        zip: ''
      };
      mapping.forEach((headerIndex: string | number, j: number) => {
        if (j < dataRow.rowValue.length) {
          if (headerIndex == 0) {
            dataobj.name = dataRow.rowValue[j].value as string;
            this.contactForm.controls.name.setValue(dataobj.name);
            this.contactForm.controls.name.updateValueAndValidity();
            dataRow.rowValue[j].invalid =
              this.contactForm.controls.name.invalid;
          } else if (headerIndex == 1) {
            dataobj.phone = dataRow.rowValue[j].value as string;
            this.contactForm.controls.phone.setValue(dataobj.phone);
            this.contactForm.controls.phone.updateValueAndValidity();
            dataRow.rowValue[j].invalid =
              this.contactForm.controls.phone.invalid;
          } else if (headerIndex == 2) {
            dataobj.email = dataRow.rowValue[j].value as string;
            this.contactForm.controls.email.setValue(dataobj.email);
            this.contactForm.controls.email.updateValueAndValidity();
            dataRow.rowValue[j].invalid =
              this.contactForm.controls.email.invalid;
          } else if (headerIndex == 8) {
            dataobj.zip = dataRow.rowValue[j].value as string;
            this.contactForm.controls.zip.setValue(dataobj.zip);
            this.contactForm.controls.zip.updateValueAndValidity();
            dataRow.rowValue[j].invalid = this.contactForm.controls.zip.invalid;
          }
        }
      });
      this.contactForm.setValue(dataobj);
      this.contactForm.updateValueAndValidity();
      if (this.contactForm.invalid) {
        dataRow.rowValue[index].invalid = true;
        countInvalid += 1;
      }
    });
    return countInvalid;
  }

  /**
   * @description Import contacts from step 2.
   */
  importContacts(body: { mapping: (string | number)[]; groupId: string }) {
    this.subscriptions.push(
      this.businessToolsService.importContactsStep2(body).subscribe((res) => {
        if (res?.success && res?.message) {
          if (res.message.importedContactCount) {
            const data = {
              title: 'Success!',
              content:
                res.message.importedContactCount +
                ' Contacts Imported.' +
                res.message.duplicateCount
                  ? res.message.duplicateCount + ' Duplicate Contacts Found'
                  : '',
              close: true,
              timeout: 3000
            };
            this.alertService.successAlert(data);
          } else {
            const data = {
              title: 'Import Failed!',
              content: res.message.duplicateCount
                ? res.message.duplicateCount + ' Duplicate Contacts Found'
                : '',
              close: true,
              timeout: 3000
            };
            this.alertService.warningAlert(data);
          }
          this.matdialogRef.close(true);
        } else {
          this.onError(res);
        }
      })
    );
  }

  /**
   * @description failed alert.
   */
  onError(err: {
    errMsg?: string;
    success?: boolean;
    message?: IImportedContactData;
  }) {
    this.alertService.failedAlert({ content: err.errMsg });
  }

  /**
   * @description matching selected item.
   */
  beforeMappingChange(item: { selectedIndex: string | number }) {
    if (this.isMatchOn) {
      this.matchItem.selectedIndex = item.selectedIndex;
      this.isMatchOn = false;
    }
  }

  /**
   * @description mapping selected item.
   */
  mappingChange() {
    this.disableMapping = {};
    this.headerColumns.forEach((item) => {
      if (item.selectedIndex) {
        this.disableMapping[item.selectedIndex] = !isNaN(
          item.selectedIndex as number
        )
          ? true
          : false;
        if (item.selectedIndex == 'match') {
          this.matchOn(item);
        }
      }
    });
  }

  /**
   * @description Set match item.
   */
  matchOn(item: { selectedIndex: string | number }) {
    this.isMatchOn = true;
    this.matchItem = item;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
