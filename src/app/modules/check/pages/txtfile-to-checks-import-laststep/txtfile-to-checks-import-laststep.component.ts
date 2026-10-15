import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IImportCheckData } from 'src/app/modules/check/model/check';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-txtfile-to-checks-import-laststep',
  templateUrl: './txtfile-to-checks-import-laststep.component.html',
  styleUrls: ['./txtfile-to-checks-import-laststep.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    NgClass,
    CommonBackButtonV35Component,
    CommonButtonV35Component
  ]
})
export class TxtfileToChecksImportLaststepComponent
  implements OnInit, OnDestroy
{
  private checkService = inject(CheckService);
  private router = inject(Router);
  public alertService = inject(AlertService);
  public activatedRoute = inject(ActivatedRoute);

  subscriptions: Subscription[] = [];
  submitting = false;

  importedCheckData: IImportCheckData[] = [];
  checkCount: number;
  totalCheckAmount: number;

  ngOnInit(): void {
    this.getData();
  }

  getData() {
    this.subscriptions.push(
      this.checkService.multiImportTxtToCheckGetLatest().subscribe((res) => {
        if (res?.success) {
          this.importedCheckData = res?.data.rows;
          this.importedCheckData.forEach((e) => {
            e.selected = true;
          });
          this.checkCount = res?.data.rowCount;
          this.totalCheckAmount = res?.data.totalAmount;
        }
      })
    );
  }

  toggleSelect(val: boolean) {
    this.importedCheckData.forEach((e) => {
      e.selected = val;
    });
  }

  submit() {
    const entry = this.importedCheckData
      .filter((e) => e.selected)
      .map((e) => e.id);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }
    const body = { entry };
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .multiImportTxtToCheckLastStep(body)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Checks imported.',
              close: true,
              timeout: 2000
            });
            this.router.navigate(['manage/cheque/checkrecords']);
          }
        })
    );
  }

  goToStep1() {
    this.router.navigate(['manage/cheque/multi_import/txt-to-check1']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
