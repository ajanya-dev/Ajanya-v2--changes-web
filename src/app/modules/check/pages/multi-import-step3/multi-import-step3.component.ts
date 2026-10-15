import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IImportCheckData } from 'src/app/modules/check/model/check';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-multi-import-step3',
  templateUrl: './multi-import-step3.component.html',
  styleUrls: ['./multi-import-step3.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, CommonButtonV35Component]
})
export class MultiImportStep3Component implements OnInit, OnDestroy {
  private bulkPaymentService = inject(V3BulkPaymentService);

  subscriptions: Subscription[] = [];
  submitting = false;
  processing: boolean = false;
  data: IImportCheckData[] = [];
  importData: IImportCheckData;
  source: string;
  constructor(
    private checkService: CheckService,
    private router: Router,
    public alertService: AlertService
  ) {}

  ngOnInit(): void {
    // eslint-disable-next-line no-restricted-globals
    this.source = history.state?.source ?? '';
    this.getData(this.source);
  }

  getData(source: string) {
    this.subscriptions.push(
      this.checkService.multiImportStep4(source === 'wallet' ? 'wallet-checks' : 'checks-import').subscribe((data) => {
        if (data?.success) {
          this.data = data?.data;
          this.data.forEach((e) => {
            e.selected = true;
          });
          this.importData = this.data[0];
        }
      })
    );
  }

  toggleSelect(val: boolean) {
    this.data.forEach((e) => {
      e.selected = val;
    });
  }

  submit() {
    const entry = this.data.filter((e) => e.selected).map((e) => e.id);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }
    const body = { entry };
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .multiImportStep5(body,this.source === 'wallet' ? 'wallet-checks' : 'checks-import')
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
            if (this.source === 'wallet') {
              this.router.navigate(['manage/payments-table/index']);
            }else{
              this.router.navigate(['manage/cheque/checkrecords']);
            }
          }
        })
    );
  }

  processNow() {
    const entry = this.data.filter((e) => e.selected).map((e) => e.id);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }
    const body = { entry };
    this.processing = true;
    this.subscriptions.push(
      this.checkService
        .multiImportStep5(body,this.source === 'wallet' ? 'wallet-checks' : 'checks-import')
        .pipe(
          finalize(() => {
            this.processing = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              title: 'Success',
              content:
                'Your payment has been saved. Please check the status in your records.',
              close: true,
              timeout: 2000
            });
            this.bulkPaymentService.initBulkPayment(res?.zilPaymentIds);
            history.replaceState(null, '', '/manage/payments-table');
            this.router.navigate(['/manage/bulk-payments'], {
              state: { data: { hideButton: true},source: this.source }
            });
          }
        })
    );
  }

  goToStep1() {
    this.router.navigate(['manage/cheque/multi_import/step1']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
