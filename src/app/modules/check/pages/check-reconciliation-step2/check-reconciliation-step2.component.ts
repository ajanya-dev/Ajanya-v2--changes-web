/* eslint-disable no-restricted-globals */
import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-check-reconciliation-step2',
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    FormsModule,
    CommonButtonV35Component,
    NgClass,
    FaIconComponent
  ],
  templateUrl: './check-reconciliation-step2.component.html',
  styleUrl: './check-reconciliation-step2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckReconciliationStep2Component implements OnInit, OnDestroy {
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private checkService = inject(CheckService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  data: Params;
  headerOptions: { key: string; value: string }[] = [];
  headerColumns: { selectedIndex: string; error?: boolean }[] = [];
  checkData: { [key: string]: string }[] = [];
  disableMapping: Params = {};
  isSubmit = signal(false);
  destroy$ = new Subject();
  requiredFields = ['0', '1', '2'];
  pageType = 'payments';

  faCircleExclamation = faCircleExclamation;

  ngOnInit(): void {
    if (!history.state?.res) {
      return;
    }

    this.data = JSON.parse(history.state.res);

    this.formatCheckData();
    this.headerOptions = this.makeHeader(this.data.header[0]);

    for (let i = 0; i < 3; i += 1) {
      this.headerColumns.push({ selectedIndex: '', error: false });
    }

    this.getUrlParams();
  }

  getUrlParams(){
    this.activatedRoute.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe((data) => {
      this.pageType = data.page;
    });
  }

  formatCheckData() {
    for (let i = 0; i <= this.data?.chequeData?.length; i += 1) {
      if (this.data?.chequeData?.length <= i) {
        return;
      }

      const row = this.data?.chequeData[i];
      const obj: Params = {};

      Object.keys(row).forEach((key) => {
        if (typeof row[key] === 'object' && row[key]?.date) {
          obj[key] = this.datePipe.transform(row[key].date, 'shortDate');
        } else {
          obj[key] = row[key];
        }
      });
      this.checkData.push(obj);
    }
  }

  makeHeader(data: {
    [key: string]: string;
  }): { key: string; value: string }[] {
    const headers: { key: string; value: string }[] = [];
    Object.entries(data).forEach(([key, value]) => {
      headers.push({ key, value });
    });
    return headers;
  }

  mappingChange() {
    this.disableMapping = {};
    this.headerColumns.forEach((item) => {
      if (item.selectedIndex) {
        this.disableMapping[item.selectedIndex] = !isNaN(
          Number(item.selectedIndex)
        );
        // eslint-disable-next-line no-param-reassign
        item.error = false;
      }
    });
  }

  validateRequired() {
    this.headerColumns.forEach((column) => {
      // eslint-disable-next-line no-param-reassign
      column.error = column.selectedIndex === '';
    });
  }

  submit(isProceedAnyWay?: boolean) {
    this.validateRequired();
    if (this.headerColumns.some((item) => item.error)) {
      return;
    }
    const mapping = this.headerColumns.map(
      (row: { selectedIndex: string }) => row.selectedIndex
    );

    const body = {
      mapping,
      uploadFromImport: 'yes',
      proceedForCheckNumber: isProceedAnyWay ? 1 : 0
    };
    this.isSubmit.set(true);
    this.checkService
      .checkReconciliationStep3(body)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate(['manage/cheque/reconciliation/step3'],{queryParams: { page: this.pageType }});
          }
        },
        error: (err) => {
          if (err.error.errorCode === 190) {
            this.proceedModal(err.error.errorMsg);
          }
        }
      });
  }

  proceedModal(err: string) {
    const warn = this.openConfirmAlert('Do you want to proceed anyway?', err);
    warn.afterClosed().subscribe((res) => {
      if (res) {
        this.submit(true);
      }
    });
  }

  openConfirmAlert(content: string, title?: string) {
    const data = {
      title: title || 'Confirm',
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
