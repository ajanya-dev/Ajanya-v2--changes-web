import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

/**
 * @description Component Class for step 3 of EQ multiple check Import, Here User Getting Mapped and organized data from backend and verifying and sending request to create check
 * @class
 */
@Component({
  selector: 'app-mulit-import-eq-step3',
  templateUrl: './mulit-import-eq-step3.component.html',
  styleUrls: ['./mulit-import-eq-step3.component.scss'],
  standalone: true,
  imports: [NgClass, NgFor, FormsModule, CommonButtonV35Component]
})
export class MulitImportEqStep3Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);
  public alertService = inject(AlertService);

  subscriptions: Subscription[] = [];
  submitting = false;
  loading = false;

  data: Record<string, string | boolean | number>[] = [];
  columnKeys: string[] = [];
  headers: string[] = [];

  ngOnInit(): void {
    this.getData();
  }

  /**
   * @description Getting Data of the uploaded file in Step 1 from backend
   */
  getData() {
    this.loading = true;
    this.subscriptions.push(
      this.checkService
        .multiImportEqStep4()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.data = res.data?.rows ?? [];
            this.data.forEach((e) => {
              e.selected = true;
            });
            this.headers = this.setHeaders(res.data.header);
            this.columnKeys = this.setColumnKeys(res.data.header);
          }
        })
    );
  }

  /**
   * @description Creating Headers from Headers Data from Api Response
   * @param data
   * @returns headers
   */
  setHeaders(data: Record<string, string>): string[] {
    return Object.values(data);
  }

  /**
   * @description Creating Column Keys for each Column from Headers Data from Api Response
   * @param data : object
   * @returns headers
   */
  setColumnKeys(data: Record<string, string>) {
    const columns: string[] = [];
    Object.keys(data).forEach((header) => {
      if (Object.prototype.hasOwnProperty.call(data, header)) {
        columns.push(header);
      }
    });
    return columns;
  }

  /**
   * @description Toggles Selections of all rows in the table
   * @param val : boolean
   */
  toggleSelect(val: boolean) {
    this.data.forEach((e) => {
      e.selected = val;
    });
  }

  /**
   * @description Submitting Data
   */
  submit() {
    const entry = this.data
      .filter((e) => e.selected)
      .map((e) => e.id as string);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }
    const body = { entry };
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .multiImportEqStep5(body)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: data.message,
              close: true,
              timeout: 2000
            });
            this.router.navigate(['manage/cheque/checkrecords']);
          }
        })
    );
  }

  /**
   * @description Going Back to Step 1 if user clck on Cancel Button
   */
  goToStep1() {
    this.router.navigate(['manage/cheque/multiimporteq/step1']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
