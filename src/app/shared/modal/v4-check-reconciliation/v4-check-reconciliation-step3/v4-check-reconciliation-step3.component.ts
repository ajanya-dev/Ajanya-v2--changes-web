import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronLeft, Table } from 'lucide-angular';
import { finalize } from 'rxjs';
import { IReconciliationCheckStep3Rows } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-check-reconciliation-step3',
  standalone: true,
  templateUrl: './v4-check-reconciliation-step3.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4CheckReconciliationStep3Component implements OnInit {
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly ChevronLeftIcon = ChevronLeft;
  readonly TableIcon = Table;

  onSuccess = output<string>();
  onBack = output<void>();

  checkData = signal<IReconciliationCheckStep3Rows[]>([]);
  isLoading = signal(false);
  isSubmit = signal(false);

  ngOnInit(): void {
    this.getCheckData();
  }

  private getCheckData(): void {
    this.isLoading.set(true);
    this.checkService
      .checkReconciliationStep4()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.checkData.set(res.data.rows.map((item) => ({ ...item, selected: true })));
        }
      });
  }

  toggleSelect(val: boolean): void {
    this.checkData.set(this.checkData().map((item) => ({ ...item, selected: val })));
  }

  processNow(): void {
    const entry = this.checkData().filter((e) => e.selected).map((e) => e.id);
    if (!entry.length) {
      this.alertService.warningAlert({ content: 'Select at least 1 check to process.' });
      return;
    }

    this.isSubmit.set(true);
    this.checkService
      .checkReconciliationStep5({ entry })
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.onSuccess.emit(res.message);
        }
      });
  }
}
