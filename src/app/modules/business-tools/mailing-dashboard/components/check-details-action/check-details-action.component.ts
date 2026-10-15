import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { faEllipsisVertical, faEye } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { BulkMailStatus } from '../../models/group-mailing.model';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { MatDialog } from '@angular/material/dialog';
import { CheckMailModalComponent } from 'src/app/modules/check/modal/mail-modals/check-mail-modal/check-mail-modal.component';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ICheckData,
  ICheckShipingTypes,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface IExtendedCellRenderer extends ICellRendererParams {
  batchId?: string;
  refreshSubject?: Subject<boolean>;
}
@Component({
  selector: 'app-check-details-action',
  template: `
    <div class="flex items-center gap-2">
      <fa-icon
        [icon]="faEye"
        (click)="viewCheck()"
        [title]="'View Check'"
        class="text-common-dark-blue-color cursor-pointer hover:opacity-80 transition-opacity"
      ></fa-icon>

      @if (isNew) {
        <fa-icon
          [icon]="faEllipsis"
          [matMenuTriggerFor]="menu"
          [title]="'Open Menu'"
          class="text-common-dark-blue-color cursor-pointer hover:opacity-80 transition-opacity"
        ></fa-icon>
      }
    </div>
    <mat-menu #menu="matMenu">
      <button mat-menu-item (click)="openCheckMailModal()">Mail Now</button>
    </mat-menu>
  `,
  standalone: true,
  imports: [FaIconComponent, MatMenuModule]
})
export class CheckDetailsActionComponent implements ICellRendererAngularComp {
  private router = inject(Router);
  private checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private checkdata: ICheckData = {};
  private shippingTypes: ICheckShipingTypes[] = [];
  private shippingCost: IShippingCostCalculation | null = null;
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  public params!: IExtendedCellRenderer;

  chequeId: string | null = null;
  batchId: string | null = null;
  uuid: string | null = null;
  faEye = faEye;
  faEllipsis = faEllipsisVertical;
  isNew = false;
  refreshSubject?: Subject<boolean>;

  agInit(params: IExtendedCellRenderer): void {
    this.params = params;
    this.chequeId = params.data?.id || null;
    this.uuid = params.data?.zil_payment_uuid || null;
    this.batchId = params?.batchId || null;
    this.isNew = params.data?.cheque_status == BulkMailStatus.NEW;
    this.refreshSubject = params.refreshSubject;
  }

  refresh(): boolean {
    return false;
  }

  viewCheck(): void {
    const checkId = this.chequeId;
    if (checkId) {
      const url = this.router.createUrlTree(['/manage/cheque/view', checkId], {
        queryParams: { uuid: this.uuid }
      });
      window.open(url.toString(), '_blank');
    }
  }

  openCheckMailModal() {
    if (!this.chequeId) {
      return;
    }

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
      shippingCost:
        this.checkService.ShippingCostCalculationGroup(shippingCostPayload)
    })
      .pipe(
        catchError((error) => {
          return of(null);
        }),
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

  private openModal() {
    const modalConfig = {
      maxWidth: '1200px',
      width: '100%',
      minHeight: '380px',
      disableClose: true,
      data: this.prepareModalData()
    };

    const dialogRef = this.dialog.open(CheckMailModalComponent, modalConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.refreshSubject?.next(true);
    });
  }

  private prepareModalData() {
    const baseData = {
      data: {
        chequedata: this.checkdata.chequedata,
        shipping: this.shippingTypes,
        paper: [] // Add paper types if needed
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
    };

    return baseData;
  }
}
