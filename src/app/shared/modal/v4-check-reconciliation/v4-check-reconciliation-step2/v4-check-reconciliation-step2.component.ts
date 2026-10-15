import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronLeft, CircleAlert, Table } from 'lucide-angular';
import { finalize } from 'rxjs';
import { IReconciliationData } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-check-reconciliation-step2',
  standalone: true,
  templateUrl: './v4-check-reconciliation-step2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NgClass,
    DatePipe,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4CheckReconciliationStep2Component implements OnInit {
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);

  readonly ChevronLeftIcon = ChevronLeft;
  readonly CircleAlertIcon = CircleAlert;
  readonly TableIcon = Table;

  data = input<IReconciliationData | null>(null);
  onSuccess = output<void>();
  onBack = output<void>();

  headerOptions: { key: string; value: string }[] = [];
  headerColumns: { selectedIndex: string; error?: boolean }[] = [];
  checkData: { [key: string]: string }[] = [];
  disableMapping: { [key: string]: boolean } = {};
  isSubmit = signal(false);

  ngOnInit(): void {
    const parsed = this.data();
    if (!parsed) return;

    this.headerOptions = this.makeHeader(parsed.header[0]);
    for (let i = 0; i < 3; i += 1) {
      this.headerColumns.push({ selectedIndex: '', error: false });
    }
    this.formatCheckData(parsed);
  }

  private makeHeader(data: string[]): { key: string; value: string }[] {
    return data.map((value, index) => ({ key: String(index), value }));
  }

  private formatCheckData(parsed: IReconciliationData): void {
    for (let i = 0; i < parsed.chequeData.length; i += 1) {
      const row = parsed.chequeData[i];
      const obj: { [key: string]: string } = {};
      Object.keys(row).forEach((key) => {
        const val = (row as any)[key];
        if (typeof val === 'object' && val?.date) {
          obj[key] = this.datePipe.transform(val.date, 'shortDate') ?? '';
        } else {
          obj[key] = val;
        }
      });
      this.checkData.push(obj);
    }
  }

  mappingChange(): void {
    this.disableMapping = {};
    this.headerColumns.forEach((item) => {
      if (item.selectedIndex) {
        this.disableMapping[item.selectedIndex] = !isNaN(Number(item.selectedIndex));
        item.error = false;
      }
    });
  }

  private validateRequired(): boolean {
    this.headerColumns.forEach((col) => {
      col.error = col.selectedIndex === '';
    });
    return !this.headerColumns.some((col) => col.error);
  }

  submit(isProceedAnyWay = false): void {
    if (!this.validateRequired()) return;

    const mapping = this.headerColumns.map((row) => row.selectedIndex);
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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.onSuccess.emit();
          }
        },
        error: (err) => {
          if (err?.error?.errorCode === 190) {
            this.proceedModal(err.error.errorMsg);
          }
        }
      });
  }

  private proceedModal(errorMsg: string): void {
    const ref = this.alertService.confirmAlert({
      title: errorMsg,
      content: 'Do you want to proceed anyway?',
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.submit(true);
      }
    });
  }
}
