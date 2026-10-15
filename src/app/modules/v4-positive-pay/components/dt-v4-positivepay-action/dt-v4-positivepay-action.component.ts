import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  AgRendererComponent,
  ICellRendererAngularComp
} from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { IPositivepayData } from 'src/app/models/bank';
import { V4ExportModalComponent } from 'src/app/modules/v4-positive-pay/modals/v4-export-modal/v4-export-modal.component';
import { V4SetPositivePayModalComponent } from 'src/app/modules/v4-positive-pay/modals/v4-set-positive-pay-modal/v4-set-positive-pay-modal.component';
import { V4SettingsModalComponent } from 'src/app/modules/v4-positive-pay/modals/v4-settings-modal/v4-settings-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { finalize } from 'rxjs/operators';
import { V4PositivepayBankaccountsComponent } from '../../modals/v4-positivepay-bankaccounts/v4-positivepay-bankaccounts.component';

@Component({
  selector: 'app-dt-v4-file-download',
  template: `<a
    role="presentation"
    class="cursor-pointer text-[var(--v4-badge-info-text-color)]"
    (click)="download()"
    >Download File</a
  >`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DtV4FileDownloadComponent implements ICellRendererAngularComp {
  params: ICellRendererParams;
  link: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.link = this.params.data.download_link;
  }

  refresh(): boolean {
    return true;
  }

  download() {
    window.open(this.link);
  }
}

@Component({
  selector: 'app-dt-v4-positivepay-action',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    LucideAngularModule,
    MatTooltip
  ],
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        matTooltip="Actions"
        (click)="$event.stopPropagation()"
      >
        <lucide-icon name="ellipsis-vertical" [size]="16" class="v4-action-icon"></lucide-icon>
      </button>
    </div>

    <mat-menu #menu="matMenu" class="v4-action-menu">
      <div class="v4-menu-group-label">ACTIONS</div>
      <button mat-menu-item (click)="openViewLog()">
        <div class="v4-menu-item">
          <lucide-icon name="clock" [size]="16"></lucide-icon>
          <span>View Log</span>
        </div>
      </button>
      <button mat-menu-item (click)="openBankAccountsModal()">
        <div class="v4-menu-item">
          <lucide-icon name="landmark" [size]="16"></lucide-icon>
          <span>Set Bank Accounts</span>
        </div>
      </button>
      <div class="v4-menu-group-label">DOCUMENTS</div>
      <button mat-menu-item (click)="viewDownloadHistory()">
        <div class="v4-menu-item">
          <lucide-icon name="download" [size]="16"></lucide-icon>
          <span>View Download History</span>
        </div>
      </button>
    </mat-menu>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DtV4PositivePayActionComponent
  implements ICellRendererAngularComp, AgRendererComponent
{
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private alertService = inject(V4AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private positivePayService = inject(PositivePayService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  params: ICellRendererParams;
  loading = false;

  refresh(): boolean {
    return true;
  }

  agInit(params: ICellRendererParams) {
    this.params = params;
  }

  get rowData(): IPositivepayData {
    return this.params.data as IPositivepayData;
  }

  private checkEligibility(): boolean {
    if (!this.rowData?.is_verified) {
      this.alertService.warningAlert({
        title: 'Error',
        content:
          'You must have at least one verified bank account with this bank. Please visit the bank accounts list to verify your account.',
        isCancel: true
      });
      return false;
    }
    if (!this.rowData?.is_eligible) {
      const alert = this.alertService.warningAlert({
        title: 'Error',
        content:
          'This bank is not eligible for Positive Pay setup. For further details, please contact our support team.',
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now',
        isCancel: true
      });
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
      return false;
    }
    return true;
  }

  setPositivePay() {
    if (!this.checkEligibility()) return;
    const action = this.dialog.open(V4SetPositivePayModalComponent, {
      maxWidth: '600px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: this.rowData,
      panelClass: 'paddingless-modal-rounded'
    });
    action.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  export() {
    if (!this.rowData) return;
    this.dialog.open(V4ExportModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: this.rowData,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  settings() {
    if (!this.rowData) return;
    this.dialog.open(V4SettingsModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: this.rowData,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  runPositivePay() {
    if (!this.rowData) return;
    const action = this.alertService.confirmAlert({
      content: 'Are you sure you want to proceed?'
    });
    action
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.loading = true;
          this.positivePayService
            .uploadToBank(this.rowData.bank_routing_number)
            .pipe(
              finalize(() => {
                this.loading = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
              next: (resp) => {
                if (resp.success) {
                  this.alertService.successAlert({
                    content: 'Successfully Uploaded to Bank'
                  });
                }
              }
            });
        }
      });
  }

  openViewLog() {
    this.router.navigate([
      '/v4/manage/positivepay/logs',
      this.rowData.bank_routing_number
    ]);
  }

  openBankAccountsModal() {
    if (!this.checkEligibility()) return;
    this.dialog.open(V4PositivepayBankaccountsComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: this.rowData.bank_routing_number,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  viewDownloadHistory() {
    this.router.navigate([
      '/v4/manage/positivepay/download-history',
      this.rowData.bank_routing_number
    ]);
  }
}
