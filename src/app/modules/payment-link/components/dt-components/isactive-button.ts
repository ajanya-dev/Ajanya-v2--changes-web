import { Component, OnDestroy, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-is-active',
  template: `
      @if (status === 1) {
        <app-common-button-v35
          backGroundInput="var(--common-green-color)"
          type="list"
          customClasses="!h-[22px]"
          text="Active"
          (clickEvent)="doProcess('a')"
        ></app-common-button-v35>
      }
      @if (status === 0) {
        <app-common-button-v35
          backGroundInput="var(--common-red-color)"
          customClasses="!h-[22px]"
          type="list"
          text="Inactive"
          (clickEvent)="doProcess('i')"
        ></app-common-button-v35>
      }
  `,
  standalone: true,
  imports: [CommonButtonV35Component, FontAwesomeModule]
})
export class IsActiveComponent implements OnDestroy {
  private paymentLink = inject(PaymentLinkService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);
  
  params: ICellRendererParams;
  status: number;
  subscriptions: Subscription[] = [];
  id: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.status = this.params.data.is_active;
    this.id = this.params.data.enid;
  }

  doProcess(type: string) {
    let msg;
    if (type === 'i') {
      msg = 'to Activate the link?';
    } else {
      msg = 'to Deactivate the link?';
    }
    const data = {
      title: 'Alert',
      content: `Are you sure ${msg}`,
      doneMsg: 'Yes!',
      cancelMsg: 'No',
      isCancel: true
    };
    const response = this.alertService.warningAlert(data);
    response.afterClosed().subscribe((res) => {
      if (res) {
        if (type === 'i') {
          this.activatePaymentLink(this.id);
        } else {
          this.deActivatePaymentLink(this.id);
        }
      }
    });
  }

  activatePaymentLink(id: string) {
    this.subscriptions.push(
      this.paymentLink.activePaymentLink(id).subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.data });
          this.reloadTable();
        }
      })
    );
  }

  deActivatePaymentLink(id: string) {
    this.subscriptions.push(
      this.paymentLink.inactivePaymentLink(id).subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.data });
          this.reloadTable();
        }
      })
    );
  }

  reloadTable() {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
