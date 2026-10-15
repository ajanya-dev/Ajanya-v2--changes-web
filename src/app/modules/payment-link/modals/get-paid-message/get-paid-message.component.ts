import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { finalize, Subscription } from 'rxjs';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { TextEditorComponent } from '../../../../shared/components/text-editor/text-editor.component';

@Component({
  selector: 'app-get-paid-message',
  templateUrl: './get-paid-message.component.html',
  styleUrls: ['./get-paid-message.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    TextEditorComponent,
    FaIconComponent,
    CommonButtonV35Component
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GetPaidMessageComponent implements OnInit, OnDestroy {
  private paymentLinkService = inject(PaymentLinkService);
  private dialogRef = inject(MatDialogRef<GetPaidMessageComponent>);

  content = signal<string>('');
  newContent: string;
  subscriptions: Subscription[] = [];
  isSubmit = signal(false);
  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;

  ngOnInit(): void {
    this.getMessageStyles();
  }

  getMessageStyles() {
    this.subscriptions.push(
      this.paymentLinkService.getMessageStyle().subscribe((res) => {
        if (res.success) {
          this.content.set(res.data);
        }
      })
    );
  }

  setEmailMessage(event: string) {
    this.newContent = event;
  }

  save() {
    const data = {
      message: this.newContent
    };
    this.isSubmit.set(true);
    this.subscriptions.push(
      this.paymentLinkService
        .saveStyleMessage(data)
        .pipe(finalize(() => this.isSubmit.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
