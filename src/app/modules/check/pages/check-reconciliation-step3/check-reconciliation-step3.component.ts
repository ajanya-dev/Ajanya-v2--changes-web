import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IReconciliationCheckStep3Rows } from '../../model/check';

@Component({
  selector: 'app-check-reconciliation-step3',
  standalone: true,
  imports: [CommonButtonV35Component, FormsModule, RouterLink],
  templateUrl: './check-reconciliation-step3.component.html',
  styleUrl: './check-reconciliation-step3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckReconciliationStep3Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  checkData = signal<IReconciliationCheckStep3Rows[]>([]);
  pageType = 'payments';
  destroy$ = new Subject();
  isLoading = signal(false);
  isSubmit = signal(false);
  ngOnInit(): void {
    this.getCheckData();
    this.getUrlParams();
  }

  getUrlParams(){
    this.activatedRoute.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe((data) => {
      this.pageType = data.page;
    });
  }

  getCheckData() {
    this.isLoading.set(true);
    this.checkService
      .checkReconciliationStep4()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          const updatedData = res.data.rows.map((item) => ({
            ...item,
            selected: true
          }));
          this.checkData.set(updatedData);
        }
      });
  }

  toggleSelect(val: boolean) {
    const updatedData = this.checkData().map((item) => ({
      ...item,
      selected: val
    }));
    this.checkData.set(updatedData);
  }

  processNow() {
    const entry = this.checkData()
      .filter((e) => e.selected)
      .map((e) => e.id);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1' });
      return;
    }
    const body = { entry };
    this.isSubmit.set(true);
    this.checkService
      .checkReconciliationStep5(body)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.message });
          if(this.pageType === 'payments'){
            this.router.navigate(['manage/payments-table/index']);
          }else{
            this.router.navigate(['manage/payments-table/check']);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
