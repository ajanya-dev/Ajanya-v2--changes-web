import { Component, inject, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

@Component({
  selector: 'app-subscription-warning-modal',
  templateUrl: './subscription-warning-modal.component.html',
  styleUrls: ['./subscription-warning-modal.component.scss'],
  standalone: true,
  imports: [MatDialogActions, MatDialogClose]
})
export class SubscriptionWarningModalComponent implements OnInit {
  private router = inject(Router)
  private paymentsService = inject(PaymentsService);
  private matdialogRef = inject(MatDialogRef);

  title = 'Error';
  content = 'You need to subscribe to any plans to use this feature.';

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { content: string },

    // private _dialogRef: MatDialogRef<SubscriptionWarningModalComponent>,
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.content = this.data.content;
    }
  }

  upgradeNow(): void {
    this.router.navigate(['/manage/subscription/plan']);
  }

  cancel(): void {
    this.matdialogRef.close();
    this.paymentsService.isPaymentProcessingSubject.next(false);
  }
}
