import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatePipe, NgFor, NgIf, NgClass } from '@angular/common';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  ICheckdraftData,
  IImportStep2
} from 'src/app/modules/check-draft/model/Checkdraft';
import { FormsModule } from '@angular/forms';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

/**
 * @description Represents a component for the second step of importing check drafts.
 */
@Component({
  selector: 'app-import-step2',
  templateUrl: './import-step2.component.html',
  styleUrls: ['./import-step2.component.scss'],
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
export class ImportStep2Component implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  importDatas: IImportStep2;
  loading = false;
  headerOptions: { key: number; value: string }[] = [];
  headerColumns: { selectedIndex: string }[] = [];
  checkDraftData: (Omit<ICheckdraftData, 'date'> & { date: string })[] = [];
  templateName = '';
  disableMapping: { [key: number]: boolean } = {};
  private datePipe = inject(DatePipe);
  private checkDraftService = inject(CheckDraftService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.getRouteDatas();
    this.headerOptions = this.makeHeader(this.importDatas.header[0]);

    for (let i = 0; i < 22; i += 1) {
      this.headerColumns.push({ selectedIndex: '' });
    }
    this.mappingChange();
  }

  /**
   * @description Retrieves data from the route state and prepares header options and check draft data for display.
   */
  getRouteDatas(): void {
    try {
      this.importDatas = JSON?.parse(history.state.res);
      // eslint-disable-next-line no-empty
    } catch (err) {}
    this.headerOptions = this.makeHeader(this.importDatas.header[0]);
    this.formatCheckDraftData();
  }

  /**
   * @description Formats the date in the check draft data to a human-readable format.
   */
  formatCheckDraftData() {
    for (let i = 0; i <= 4; i += 1) {
      if (this.importDatas?.CheckdraftData?.length <= i) {
        return;
      }

      const row: ICheckdraftData = this.importDatas?.CheckdraftData[i];
      const obj = {
        ...row,
        date: this.datePipe.transform(row.date.date, 'shortDate') as string
      };

      this.checkDraftData.push(obj);
    }
  }

  /**
   * @description Generates header options from header data.
   * @param headerData - The header data for mapping.
   * @returns - The array of header options.
   */
  makeHeader(headerData: string[]) {
    const headers: { key: number; value: string }[] = [];
    Object.keys(headerData).forEach((k: string, index: number) => {
      headers.push({ key: index, value: headerData[index] });
    });
    return headers;
  }

  /**
   * @description Updates the mapping disable status based on selected mappings.
   */
  mappingChange() {
    this.disableMapping = {};
    this.headerColumns.forEach((item: { selectedIndex: string }) => {
      if (item.selectedIndex) {
        this.disableMapping[Number(item.selectedIndex)] = !Number.isNaN(
          Number(item.selectedIndex)
        );
      }
    });
  }

  /**
   * @description Submits the selected mappings for import and navigates to the next step.
   */
  submit(): void {
    const mapping = this.headerColumns.map((row) => row.selectedIndex);

    if (!mapping.includes('12')) {
      this.alertService.infoAlert({ content: 'Please select payee' });
      return;
    }
    if (!mapping.includes('2')) {
      this.alertService.infoAlert({ content: 'Please select amount' });
      return;
    }
    if (!mapping.includes('21')) {
      this.alertService.infoAlert({
        content: 'Please select payee bank account number'
      });
      return;
    }
    if (!mapping.includes('20')) {
      this.alertService.infoAlert({
        content: 'Please select payee bank routing number'
      });
      return;
    }

    this.loading = true;
    const body = { mapping, uploadFromImport: 'yes' };
    this.subscriptions.push(
      this.checkDraftService
        .importCheckDraftStep3(body)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((response) => {
          if (response?.success) {
            this.router.navigate(['manage/checkdraft/import/step3']);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
