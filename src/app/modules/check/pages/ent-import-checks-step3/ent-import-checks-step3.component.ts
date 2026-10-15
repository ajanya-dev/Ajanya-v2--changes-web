import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IImportCheckData } from '../../model/check';

/**
 * @description Component Class for step 3 of EQ multiple check Import, Here User Getting Mapped and organized data from backend and verifying and sending request to create check
 * @class
 */
@Component({
  selector: 'app-ent-import-checks-step3',
  templateUrl: './ent-import-checks-step3.component.html',
  styleUrls: ['./ent-import-checks-step3.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, NgClass, CommonButtonV35Component]
})
export class EntImportChecksStep3Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);
  public alertService = inject(AlertService);

  subscriptions: Subscription[] = [];
  submitting = false;
  loading = false;

  data: IImportCheckData[];
  importData: IImportCheckData;

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
        .hamaspikImportEqStep4()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.data = res.data;
            this.data.forEach((e) => {
              e.selected = true;
            });
            this.importData = this.data[0];
          }
        })
    );
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
        .hamaspikImportEqStep5(body)
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
    this.router.navigate(['manage/cheque/hamaspik-import/step1']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
