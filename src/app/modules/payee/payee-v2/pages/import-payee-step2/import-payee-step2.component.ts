import { Router } from '@angular/router';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { Subscription, finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IDisableUserOptionEvent, IPayeeImportStep2, IPayeeImportStepTwoRowData } from '../../model/payee';

@Component({
  selector: 'app-import-payee-step2',
  templateUrl: './import-payee-step2.component.html',
  styleUrls: ['./import-payee-step2.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    FormsModule,
    NgIf,
    CommonBackButtonV35Component,
    CommonButtonV35Component
  ]
})
export class ImportPayeeStep2Component implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);
  private router = inject(Router);

  data: IPayeeImportStep2;
  headerOptions: { [key: string]: string }[] = [];
  headerColumns: { selectedIndex: string }[] = [];
  templateName = ' ';
  subscriptions: Subscription[] = [];
  excelArrayData: { key: number; value: string[] }[] = [];
  isLoading = false;

  ngOnInit(): void {
    if (!history.state?.res) {
      this.router.navigate(['manage/payee/payee_data_import/step1']);
      return;
    }

    this.data = JSON.parse(history.state.res);
    this.loadData();
  }

  loadData() {
    let i = 0;
    this.data?.rows?.forEach(
      (k2:IPayeeImportStepTwoRowData, index2: number) => {
        const data = this.data.rows;
        const k: string[] = Object.keys(k2);
        const k3: string[] = Object.values(k2);

        k.forEach((key: string, index3: number) => {
          if (key === '') {
            if (k3[index3] === '') {
              i += 1;
              const updatedRow: IPayeeImportStepTwoRowData = { ...k2 };
              delete updatedRow[key];
              data[index2] = updatedRow;
            }
          }
        });
        if (this.data.rows.length !== i) {
          this.excelArrayData.push({ key: index2, value: k3 });
        } else {
          this.excelArrayData = [];
          data.forEach(
            (ele:IPayeeImportStepTwoRowData, idx: number) => {
              const s3: string[] = Object.values(ele);
              this.excelArrayData.push({ key: idx, value: s3 });
            }
          );
        }
      }
    );

    this.headerOptions = this.makeHeader(this.data.header);
    for (let j = 0; j < 15; j += 1) {
      this.headerColumns.push({ selectedIndex: '' });
    }
  }

  makeHeader(data: { [key: string]: string }[]): { [key: string]: string }[] {
    const headers: { key: string; value: string }[] = [];
    data.forEach((k) => {
      if (k.displayName !== 'Match') {
        headers.push({ key: k.value, value: k.displayName });
      }
    });
    return headers;
  }

  submit() {
    const requiredAny1 = ['0'];
    let payeeNameSelected = false;
    const mapping = this.headerColumns.map((row: { selectedIndex: string }) => {
      if (requiredAny1.includes(row.selectedIndex)) {
        payeeNameSelected = true;
      }
      return row.selectedIndex;
    });

    if (!payeeNameSelected) {
      this.alertService.warningAlert({
        content:
          'Please at least select payee name . This file cannot be processed'
      });
      return;
    }
    let errorFlg = false;
    let errorlineNo = -1;
    this.data?.rows?.forEach((l: IPayeeImportStepTwoRowData, _index: number) => {
      if (l.name?.length > 100) {
        errorFlg = true;
        errorlineNo = _index + 1;
      }
    });
    if (errorFlg) {
      this.alertService.warningAlert({
        content: `Payee name on line ${errorlineNo} exceeds 100 characters. This file cannot be processed`
      });
      return;
    }
    this.isLoading = true;
    const body = { mapping, uploadFromImport: 'yes' };
    this.subscriptions.push(
      this.payeeService
        .multiImportStep3(body)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            // check for duplicate entries
            const noOfpayees = res?.data?.dupilcatedPayees?.length;
            if (noOfpayees > 0) {
              let msg = '';
              if (res?.data?.message !== '') {
                msg = `${res?.data?.message}. `;
              }
              const data = {
                title: 'Warning!',
                content: `${msg}Duplicate Payee Found:${res?.data?.dupilcatedPayees[0]}. This payee cannot be added at this time`,
                close: true,
                timeout: 3000
              };
              this.alertService.warningAlert(data);
            } else if (res?.data?.message !== '') {
              const data = {
                title: 'Success!',
                content: res?.data?.message,
                close: true,
                timeout: 3000
              };
              this.alertService.successAlert(data);
            }
            this.router.navigateByUrl('/manage/payees');
          } else {
            this.onError(res);
          }
        })
    );
  }

  onError(err: { errMsg: string }) {
    this.alertService.failedAlert({ content: err.errMsg });
  }

  disableUsedOption(event: IDisableUserOptionEvent) {
    const disabledList: number[] = [];
    if (event?.target?.value !== -1) {
      const allSelects: NodeListOf<HTMLSelectElement> =
        document.querySelectorAll('select');
      for (let i = 0; i < allSelects.length; i += 1) {
        if (allSelects[i].selectedIndex !== -1) {
          if (
            disabledList.findIndex((x) => x === allSelects[i].selectedIndex) ===
            -1
          ) {
            disabledList.push(allSelects[i].selectedIndex);
          }
        }
      }
      for (let i = 0; i < allSelects.length; i += 1) {
        for (let j = 0; j < allSelects[i].options.length; j += 1) {
          if (disabledList.findIndex((x) => x === j) !== -1) {
            allSelects[i].options[j].disabled = true;
          } else {
            allSelects[i].options[j].disabled = false;
          }
        }
      }
    }
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param index
   * @returns
   */
  trackByIndex(index: number) {
    return index;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
