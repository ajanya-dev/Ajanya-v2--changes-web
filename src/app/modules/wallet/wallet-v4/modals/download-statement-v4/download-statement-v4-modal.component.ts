import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IWalletData } from 'src/app/models/wallet';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, X, Download, LoaderCircle } from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';

@Component({
  selector: 'app-download-statement-v4-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogModule,
    MatDialogClose,
    MatTooltip,
    FormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    CommonTabV4Component
  ],
  templateUrl: './download-statement-v4-modal.component.html',
  styleUrls: ['./download-statement-v4-modal.component.scss']
})
export class DownloadStatementV4ModalComponent {
  readonly XIcon = X;
  readonly DownloadIcon = Download;
  readonly LoaderCircleIcon = LoaderCircle;

  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<DownloadStatementV4ModalComponent>);
  private destroyRef = inject(DestroyRef);

  wallet: IWalletData = inject(MAT_DIALOG_DATA);

  periods = [
    { key: 1, name: 'Last Month', description: 'Recent transactions' },
    { key: 2, name: 'Last 3 Months', description: 'Quarterly transactions' },
    { key: 3, name: 'Last 6 Months', description: 'Semi-annual Transactions' },
    { key: 6, name: 'Last Year', description: 'Annual Summary Transactions' },
    {
      key: 4,
      name: 'All Time Transactions',
      description: 'Complete Transaction History'
    },
    { key: 5, name: 'Custom Range', description: 'Choose specific date range' }
  ];

  formatTabs: ITabItem[] = [
    { label: 'PDF', value: 'pdf' },
    { label: 'EXCEL', value: 'xlsx' },
    { label: 'CSV', value: 'csv' }
  ];

  selectedFormat = 'pdf';
  selectedPeriod = 0;
  customDate = { start: '', end: '' };
  loading = signal<{ key: number; version: 1 | 2 } | null>(null);

  isLoading(key: number, version: 1 | 2): boolean {
    const l = this.loading();
    return l?.key === key && l?.version === version;
  }

  canDownloadPeriod(key: number): boolean {
    if (key === 5) {
      return !!(this.customDate.start && this.customDate.end);
    }
    return true;
  }

  selectPeriod(key: number): void {
    this.selectedPeriod = this.selectedPeriod === key ? 0 : key;
  }

  onDownload(periodKey: number, version: 1 | 2): void {
    if (!this.canDownloadPeriod(periodKey) || !this.wallet?.uuId) return;

    const body: Record<string, string | number> = {
      dateType: periodKey,
      type: this.selectedFormat,
      purpose: 1,
      statementVersion: version
    };
    if (periodKey === 5) {
      body.fromDate = this.customDate.start;
      body.toDate = this.customDate.end;
    }

    this.loading.set({ key: periodKey, version });
    this.walletService
      .downloadStatement(this.wallet.uuId as string, body)
      .pipe(
        finalize(() => this.loading.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.data?.emailed) {
            this.dialogRef.close();
            this.alertService.successAlert({
              title: 'Success!',
              content: res.data?.message,
              close: false,
              doneMsg: 'OK'
            });
            return;
          }
          if (res.data?.url) {
            this.dialogRef.close();
            const urlLoaded = window.open(res?.data?.url);
            if (!urlLoaded) {
              window.open(res.data?.url);
            }
          }
        }
      });
  }

  onStartDateChange(value: string) {
    this.customDate.start = value;
    this.customDate.end = '';
  }
}
