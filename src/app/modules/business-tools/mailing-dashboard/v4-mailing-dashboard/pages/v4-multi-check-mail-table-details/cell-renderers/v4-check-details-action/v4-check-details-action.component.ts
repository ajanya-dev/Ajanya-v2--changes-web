import { Component, DestroyRef, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { BulkMailStatus } from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CheckMailModalV4Component } from 'src/app/modules/check/modal/mail-modals/check-mail-modal-v4/check-mail-modal.component-v4';
import {
  ICheckData,
  ICheckShipingTypes,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

interface IExtendedCellRenderer extends ICellRendererParams {
  batchId?: string;
  refreshSubject?: Subject<boolean>;
}

@Component({
  selector: 'app-v4-check-details-action',
  standalone: true,
  imports: [LucideAngularModule, MatMenuModule, MatTooltipModule],
  template: `
    <div class="flex items-center gap-1 h-full">
      <!-- Three-dot menu - only for New status -->
      @if (isNew) {
        <div class="flex items-center justify-center">
          <button
            class="flex items-center justify-center text-v4-primary-brand-bold-color hover:opacity-80 transition-opacity"
            [matMenuTriggerFor]="menu"
            matTooltip="Actions"
            (click)="$event.stopPropagation()"
          >
            <lucide-icon name="ellipsis-vertical" [size]="14"></lucide-icon>
          </button>
        </div>

      }
      <!-- Eye Button - opens side panel -->
      <button
        class="action-icon-btn"
        (click)="eyeButtonClick(); $event.stopPropagation()"
        matTooltip="View Details"
      >
        <lucide-icon name="eye" [size]="16" class="v4-action-icon"></lucide-icon>
      </button>
    </div>

    <mat-menu #menu="matMenu" class="v4-action-menu">
      <div class="v4-menu-group-label">ACTIONS</div>
      <button mat-menu-item (click)="openCheckMailModal()">
        <div class="v4-menu-item">
          <lucide-icon name="mail" [size]="16"></lucide-icon>
          <span>Mail Now</span>
        </div>
      </button>
    </mat-menu>
  `
})
export class V4CheckDetailsActionComponent implements ICellRendererAngularComp {
  private checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);

  private checkdata: ICheckData = {};
  private shippingTypes: ICheckShipingTypes[] = [];
  private shippingCost: IShippingCostCalculation | null = null;

  params!: IExtendedCellRenderer;
  chequeId: string | null = null;
  batchId: string | null = null;
  isNew = false;
  refreshSubject?: Subject<boolean>;

  agInit(params: IExtendedCellRenderer): void {
    this.params = params;
    this.chequeId = params.data?.id || null;
    this.batchId = params?.batchId || null;
    this.isNew = params.data?.cheque_status == BulkMailStatus.NEW;
    this.refreshSubject = params.refreshSubject;
  }

  refresh(): boolean {
    return false;
  }

  eyeButtonClick(): void {
    const currentColumn = { ...this.params.data, index: this.params.node?.id };
    this.dataTableService.setDataFromActionViewComp(currentColumn, '');
  }

  openCheckMailModal(): void {
    if (!this.chequeId) return;

    const checkDetailsPayload = {
      ids: [this.chequeId],
      is_signature: 1 as 0 | 1
    };

    const shippingCostPayload = {
      mail_check_ids: [this.chequeId],
      all_check_ids: [this.chequeId],
      shipping_rate_warning: 0,
      sent_to_customer_address: 0,
      Single_mail_options: 3,
      custom_address_shipping_type: 1,
      [this.chequeId]: {
        check_paper: 1,
        file_hidden: [],
        informed_payee_email: 1,
        informed_payee_sms: 0,
        mail_type: null,
        payee_email: '',
        payee_phone: ''
      }
    };

    forkJoin({
      checkDetails: this.checkService.getChequeDetails(checkDetailsPayload),
      shippingTypes: this.checkService.getShippingType(),
      shippingCost: this.checkService.ShippingCostCalculationGroup(shippingCostPayload)
    })
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        if (
          result &&
          result.checkDetails?.success &&
          result.shippingTypes?.success &&
          result.shippingCost?.success
        ) {
          this.checkdata.chequedata = result.checkDetails.data;
          this.shippingTypes = result.shippingTypes.data;
          this.shippingCost = result.shippingCost.data;
          this.openModal();
        } else {
          this.alertService.warningAlert({
            content: 'These checks cannot be mailed'
          });
        }
      });
  }

  private openModal(): void {
    const dialogRef = this.dialog.open(CheckMailModalV4Component, {
      maxWidth: '1200px',
      width: '100%',
      minHeight: '380px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        data: {
          chequedata: this.checkdata.chequedata,
          shipping: this.shippingTypes,
          paper: []
        },
        ShippingCost: this.shippingCost,
        caldata: {
          mail_check_ids: [this.chequeId || ''],
          all_check_ids: [this.chequeId || ''],
          shipping_rate_warning: 0,
          sent_to_customer_address: 0,
          Single_mail_options: 3,
          custom_address_shipping_type: 1,
          [this.chequeId || '']: {
            check_paper: 1,
            file_hidden: [],
            informed_payee_email: 1,
            informed_payee_sms: 0,
            mail_type: null,
            payee_email: '',
            payee_phone: ''
          }
        },
        isDisableNavigation: true
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.refreshSubject?.next(true);
    });
  }
}
