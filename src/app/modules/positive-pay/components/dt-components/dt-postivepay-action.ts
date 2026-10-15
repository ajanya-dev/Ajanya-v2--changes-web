import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuildingColumns,
  faClockRotateLeft,
  faDownload,
  faEllipsisVertical
} from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { PositivepayBankaccountsComponent } from '../../pages/positivepay-bankaccounts/positivepay-bankaccounts.component';

@Component({
  selector: 'app-dt-postive-pay-action',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, FaIconComponent],
  template: `
    <div>
      <div>
        <button
          class="border-transparent border-l-8 border-r-8"
          [matMenuTriggerFor]="menu"
        >
          <fa-icon
            class="option-icon"
            [icon]="faEllipsis"
          ></fa-icon>
        </button>
      </div>
    </div>
    <mat-menu class="positivepay-dt-action-menu" #menu="matMenu">
      <button mat-menu-item (click)="openViewLogComponent()">
        <fa-icon [icon]="faClockRotateLeft"></fa-icon>
        <span class="pl-1">View Log</span>
      </button>
      <button (click)="openPotivePayBankAccountsModal()" mat-menu-item>
        <fa-icon [icon]="faBuildingColumn"></fa-icon>
        <span class="pl-1">Set Bank Accounts</span>
      </button>
      <button (click)="viewDownloadHistory()" mat-menu-item>
        <fa-icon [icon]="faDownload"></fa-icon>
        <span class="pl-1">View Download History</span>
      </button>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DtPostivePayActionComponent
  implements ICellRendererAngularComp, AgRendererComponent
{
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  public cellValue: string;
  params: ICellRendererParams;
  faClockRotateLeft = faClockRotateLeft;
  faBuildingColumn = faBuildingColumns;
  faDownload = faDownload;
  faEllipsis = faEllipsisVertical;

  refresh(): boolean {
    return true;
  }

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams) {
    this.params = params;
    this.cellValue = this.getValueToDisplay(params);
  }

  getValueToDisplay(params: ICellRendererParams) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  openViewLogComponent() {
    this.router.navigate([
      'manage/positivepay/logs',
      this.params.data.bank_routing_number
    ]);
  }

  /**
   * @description Open modal to set positive pay bank account.
   */
  openPotivePayBankAccountsModal() {
    if (!this.params.data?.is_verified) {
      const data = {
        title: 'Error',
        content:
          'You must have at least one verified bank account with this bank. Please visit the bank accounts list to verify your account.',
        isCancel: true
      };
      this.alertService.warningAlert(data);
      return;
    }
    if (!this.params.data?.is_eligible) {
      const data = {
        title: 'Error',
        content:
          'This bank is not eligible for Positive Pay setup. For further details, please contact our support team.',
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now',
        isCancel: true
      };
      const alert = this.alertService.warningAlert(data);
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
      return;
    }
    this.dialog.open(PositivepayBankaccountsComponent, {
      minWidth: '25%',
      maxWidth: '25%',
      disableClose: true,
      data: this.params.data.bank_routing_number,
      panelClass: 'positivepay-bankaccount-modal'
    });
  }

  viewDownloadHistory(): void {
    this.router.navigate([
      'manage/positivepay/download-history',
      this.params.data.bank_routing_number
    ]);
  }
}
