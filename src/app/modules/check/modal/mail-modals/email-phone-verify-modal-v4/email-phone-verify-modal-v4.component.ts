import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { LucideAngularModule, X, CircleAlert } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { PaymentMethod } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';

interface IEmailPhoneVerifyModalData {
  ids: { ids: string[] };
  data: string;
}

@Component({
  selector: 'app-email-phone-verify-modal-v4',
  templateUrl: './email-phone-verify-modal-v4.component.html',
  styleUrls: ['./email-phone-verify-modal-v4.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatDialogClose, CommonButtonV4Component]
})
export class EmailPhoneVerifyModalV4Component implements OnInit {
  readonly XIcon = X;
  readonly CircleAlertIcon = CircleAlert;

  private dialogRef = inject(MatDialogRef<EmailPhoneVerifyModalV4Component>);
  private paymentsV4Service = inject(PaymentsV4Service);
  public data: IEmailPhoneVerifyModalData = inject(MAT_DIALOG_DATA);

  errorMsg: string;

  ngOnInit(): void {
    this.errorMsg = this.data.data;
  }

  verify(): void {
    this.paymentsV4Service.openSendModal({
      paymentMethod: PaymentMethod.Check
    });
    this.dialogRef.close();
  }
}
