import { Component, inject, OnInit } from '@angular/core';
import {
  MatDialogClose,
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

interface PaymentModalData {
  invoice_id: string;
  payment_url: string;
  amount: number;
  invoice_number: string;
  due_date: string;
}

@Component({
  selector: 'app-subscription-renew-payment-modal',
  standalone: true,
  imports: [MatDialogClose, FaIconComponent, CommonModule],
  templateUrl: './subscription-renew-payment-modal.component.html',
  styleUrl: './subscription-renew-payment-modal.component.scss'
})
export class SubscriptionRenewPaymentModalComponent implements OnInit {
  injectedData = inject<PaymentModalData>(MAT_DIALOG_DATA);
  private sanitizer = inject(DomSanitizer);
  private dialogRef = inject(MatDialogRef<SubscriptionRenewPaymentModalComponent>);
  private v3DataTableService = inject(V3DataTableService);

  ngOnInit(): void {
    this.dialogRef.afterClosed().subscribe(() => {
      this.v3DataTableService.refreshV3DataTable();
    });
  }

  // Sanitized payment URL for iframe - computed once to avoid iframe reload on every change detection cycle
  safePaymentUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    this.injectedData.payment_url
  );

  faXmark = faXmark;
}
