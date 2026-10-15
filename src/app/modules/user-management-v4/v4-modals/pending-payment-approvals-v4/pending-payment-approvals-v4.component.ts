import { Component, inject } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { Eye, LucideAngularModule, X } from 'lucide-angular';
import { IZilPayment } from 'src/app/models/user';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { PendingPaymentApprovalsComponent } from 'src/app/modules/user-management/modals/pending-payment-approvals/pending-payment-approvals.component';
import { NumberedTablePaginationComponent } from 'src/app/shared/components/numbered-table-pagination/numbered-table-pagination.component';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

/**
 * V4 skin of {@link PendingPaymentApprovalsComponent}.
 * Markup only — all state and logic is inherited from the v3 component so both
 * versions stay behaviourally identical.
 */
@Component({
  selector: 'app-pending-payment-approvals-v4',
  templateUrl: './pending-payment-approvals-v4.component.html',
  standalone: true,
  imports: [
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    NumberedTablePaginationComponent
  ]
})
export class PendingPaymentApprovalsV4Component extends PendingPaymentApprovalsComponent {
  private detailPanelService = inject(V4DetailPanelService);

  readonly XIcon = X;
  readonly EyeIcon = Eye;

  viewPayment(data:IZilPayment){
    const selectedRowData = {
      uu_id:data?.uuId,
      amount:data?.amount,
      payee_name:data?.payee,
      reference_no:data?.referenceNo,
      transfer_id:data?.transferId,
      action:data?.id,
      created_at:data?.createdAt,
    } as unknown as ICommonTransactionTableData;
    this.detailPanelService.open(selectedRowData);
    this.close();
  }
}
