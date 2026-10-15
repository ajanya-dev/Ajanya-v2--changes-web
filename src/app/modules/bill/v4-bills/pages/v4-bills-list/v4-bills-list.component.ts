import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { V4ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/v4-thirdparty-imports/v4-thirdparty-import-main-modal/v4-thirdparty-import-main-modal.component';
import { V4AddBillComponent } from '../../modals/v4-add-bill/v4-add-bill.component';
import { V4BillsHeaderComponent } from '../../components/v4-bills-header/v4-bills-header.component';
import { InvoiceBillStateService } from '../../../services/invoice-bill-state.service';

@Component({
  selector: 'app-v4-bills-list',
  standalone: true,
  imports: [RouterModule, V4BillsHeaderComponent],
  templateUrl: './v4-bills-list.component.html',
  styleUrls: ['./v4-bills-list.component.scss']
})
export class V4BillsListComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private invoiceBillStateService = inject(InvoiceBillStateService);

  onNewPayment(): void {
    const dialogRef = this.dialog.open(V4AddBillComponent, {
      ...V4AddBillComponent.dialogConfig,
      data: { mode: 'new' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.router.navigate(['detailed'], { relativeTo: this.route });
        this.invoiceBillStateService.triggerBillSaved();
      }
    });
  }

  onVendorCredit(): void {
    this.router.navigate(['/v4/manage/vendor-credits']);
  }

  onImportBills(): void {
    this.dialog.open(V4ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: { type: 'bills' },
      panelClass: 'paddingless-modal-rounded'
    });
  }
}
