import { DatePipe, NgFor, NgIf, NgClass } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IMultipleCheckImportEqStep2 } from 'src/app/modules/check/model/check';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FormsModule } from '@angular/forms';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * @description Component Class for step 2 of EQ multiple check Import, Here User can map all the necessary colunms to right fileds and sending it to backend
 * @class
 */
@Component({
  selector: 'app-mulit-import-eq-step2',
  templateUrl: './mulit-import-eq-step2.component.html',
  styleUrls: ['./mulit-import-eq-step2.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    FormsModule,
    NgIf,
    NgClass,
    CommonButtonV35Component,
    CommonBackButtonV35Component
  ]
})
export class MulitImportEqStep2Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private datePipe = inject(DatePipe);

  subscriptions: Subscription[] = [];
  submitting = false;
  savingTemplate = false;

  data: IMultipleCheckImportEqStep2;
  headerOptions: { key: string; value: string }[] = [];
  headerColumns: { selectedIndex: string }[] = [];
  templateName: string;
  showSaveTemplate = false;
  disableMapping: Record<string, unknown> = {};
  checkData: IMultipleCheckImportEqStep2['checksData'] = [];
  columnKeys: string[] = [];

  ngOnInit(): void {
    if (!history.state?.res) {
      return;
    }

    this.data = history.state.res;

    this.checkData = this.data.checksData;
    this.setColumnKeys();

    this.templateName = history.state.templateName;
    this.headerOptions = this.makeHeader(this.data.header);

    this.formatCheckDate();

    for (let i = 0; i < this.columnKeys.length; i += 1) {
      this.headerColumns.push({ selectedIndex: this.data?.template[i] ?? '' });
    }
    this.mappingChange();
  }

  /**
   * @description Creates keys for each columns of the table and stores in columnKeys Global variable
   */
  setColumnKeys() {
    if (this.checkData?.length) {
      Object.keys(this.checkData[0]).forEach((item) => {
        this.columnKeys.push(item);
      });
    }
  }

  /**
   * @description  The date field can be a date object, in the data for the table. so we have to format it to readable.
   */
  formatCheckDate() {
    for (let i = 0; i < this.checkData?.length; i += 1) {
      const row = this.checkData[i];
      Object.entries(row).forEach(([index, value]) => {
        if (typeof value === 'object' && value !== null) {
          this.checkData[i][index] =
            this.datePipe.transform(
              (value as Record<string, string>)?.date,
              'shortDate'
            ) ?? '';
        } else {
          this.checkData[i][index] = value;
        }
      });
    }
  }

  /**
   * @description Creating Header data from headers we get from api (data from api accepted as parameter)
   * @param data : object
   * @returns formatted headers
   */
  makeHeader(data: Record<string, string>): { key: string; value: string }[] {
    return Object.entries(data).map(([key, value]) => ({ key, value }));
  }

  /**
   * @description Used for change mapping of each field should be called when user select a header for a column
   */
  mappingChange() {
    this.disableMapping = {};
    this.headerColumns.forEach((item) => {
      if (item.selectedIndex) {
        this.disableMapping[item.selectedIndex] = true;
      }
    });
  }

  /**
   * @description Submitting Form
   */
  submit() {
    const requiredAll = [
      { value: '0', state: false },
      { value: '25', state: false }
    ];
    const mapping = this.headerColumns.map((row) => {
      requiredAll.forEach((el) => {
        if (el.value === row.selectedIndex) {
          el.state = true;
        }
      });
      return row.selectedIndex;
    });

    let alertContent;
    const selectedRequired = requiredAll.every((el) => {
      if (!el.state) {
        alertContent =
          el.value === '0'
            ? 'Please select payee name'
            : 'Please select bank account';
      }

      return el.state === true;
    });

    if (!selectedRequired) {
      this.alertService.failedAlert({ content: alertContent });
      return;
    }

    const body = { mapping, uploadFromImport: 'yes' as 'yes' | 'no' };
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .multiImportEqStep3(body)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.router.navigate(['manage/cheque/multi_import_eq/step3'], {});
          }
        })
    );
  }

  /**
   * @description toggles data of showSaveTemplate Variable, called when clicking save template button
   */
  toggleShowTemp() {
    this.showSaveTemplate = !this.showSaveTemplate;
  }

  /**
   * @description Saving teplatedate in the backend with mapping with corresponding api
   * @param name : HTMLInputElement
   * @returns
   */
  saveTemplate(name: HTMLInputElement) {
    if (!name.value) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please enter template name'
      });
      return;
    }

    const template = this.headerColumns.map((row) =>
      row.selectedIndex ? row.selectedIndex : ''
    );

    const body = { template, nick_name: name.value };

    this.savingTemplate = true;
    this.subscriptions.push(
      this.checkService
        .saveNewEqTemplate(body)
        .pipe(
          finalize(() => {
            this.savingTemplate = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.showSaveTemplate = false;
            this.alertService.successAlert({
              title: 'Success',
              content: 'Template saved !',
              close: true,
              timeout: 2500
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
