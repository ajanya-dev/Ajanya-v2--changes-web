import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DatePipe, NgClass } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IChequeDetails,
  IHamaspikCheckImport
} from 'src/app/modules/check/model/check';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FormsModule } from '@angular/forms';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * @description Component Class for step 2 of EQ multiple check Import, Here User can map all the necessary colunms to right fileds and sending it to backend
 * @class
 */
@Component({
  standalone: true,
  selector: 'app-ent-import-checks-step2',
  templateUrl: './ent-import-checks-step2.component.html',
  styleUrls: ['./ent-import-checks-step2.component.scss'],
  imports: [FormsModule, NgClass,
    CommonBackButtonV35Component,
    CommonButtonV35Component
  ]
})
export class EntImportChecksStep2Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private datePipe = inject(DatePipe);

  subscriptions: Subscription[] = [];
  submitting = false;
  savingTemplate = false;

  data: IHamaspikCheckImport;
  headerOptions: { key: string; value: string }[] = [];
  headerColumns: { selectedIndex: string }[] = [];
  templateName: string;
  showSaveTemplate = false;
  disableMapping: Record<string, unknown> = {};
  checkData: Record<keyof IChequeDetails, string | Record<string, string>>[] =
    [];

  columnKeys: string[] = [];

  ngOnInit(): void {
    this.getAllData();
  }

  getAllData() {
    if (!history.state?.res) {
      return;
    }

    this.data = history.state.res;

    this.checkData = this.data.chequeData;
    this.setColumnKeys();

    this.templateName = history.state.templateName;
    this.headerOptions = this.makeHeader(this.data.header[0]);

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

      Object.keys(row).forEach((index) => {
        if (typeof row[index as keyof IChequeDetails] === 'object') {
          this.checkData[i][index as keyof IChequeDetails] =
            this.datePipe.transform(
              (row[index as keyof IChequeDetails] as Record<string, string>)
                ?.date,
              'shortDate'
            ) ?? '';
        } else {
          this.checkData[i][index as keyof IChequeDetails] =
            row[index as keyof IChequeDetails];
        }
      });
    }
  }

  /**
   * @description Creating Header data from headers we get from api (data from api accepted as parameter)
   * @param data : object
   * @returns formatted headers
   */
  makeHeader(data: Record<string, string>) {
    const headers: { key: string; value: string }[] = [];
    Object.keys(data).forEach((k) => {
      headers.push({ key: k, value: data[k] });
    });
    return headers;
  }

  /**
   * @description Used for change mapping of each field should be called when user select a header for a column
   */
  mappingChange() {
    this.disableMapping = {};
    this.headerColumns.forEach((item) => {
      if (item.selectedIndex) {
        this.disableMapping[item.selectedIndex] = !isNaN(Number(item.selectedIndex));
      }
    });
  }

  /**
   * @description Submitting Form
   */
  submit() {
    const requiredAny = ['0', '23', '24'];
    let payeeNameSelected = false;
    const mapping = this.headerColumns.map((row) => {
      if (requiredAny.includes(row.selectedIndex)) {
        payeeNameSelected = true;
      }
      return row.selectedIndex;
    });

    if (!payeeNameSelected) {
      this.alertService.failedAlert({ content: 'Please select payee name' });
      return;
    }

    const body = { mapping, uploadFromImport: 'yes' as 'yes' | 'no' };
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .hamaspikImportEqStep3(body)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.router.navigate(['manage/cheque/hamaspik-import/step3'], {});
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
        .saveNewHamaspikTemplate(body)
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
