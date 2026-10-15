import { Component, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { LucideAngularModule, PhoneIncoming, Ticket, X } from 'lucide-angular';
import { take } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4RequestIntegrationModalComponent } from 'src/app/modules/user-support/modals/v4-request-integration-modal/v4-request-integration-modal.component';
import { IV4IntegrationApp } from '../../data/v4-integration-data';
import { V4ComingSoonRequestModalComponent } from '../v4-coming-soon-request-modal/v4-coming-soon-request-modal.component';

interface IRequestOption {
  id: string;
  title: string;
  description: string;
  icon: object;
  accent: string;
}

@Component({
  selector: 'app-v4-integration-request-options-modal',
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose],
  templateUrl: './v4-integration-request-options-modal.component.html'
})
export class V4IntegrationRequestOptionsModalComponent {
  private dialog = inject(MatDialog);
  private v4AlertService = inject(V4AlertService);
  private matDialogRef = inject(MatDialogRef<V4IntegrationRequestOptionsModalComponent>);
  private data = inject<{ app: IV4IntegrationApp }>(MAT_DIALOG_DATA);

  readonly XIcon = X;

  requestOptions: IRequestOption[] = [
    {
      id: 'submit-ticket',
      title: 'Submit a Request',
      description: 'Tell us your requirements and we will log a ticket for our team.',
      icon: Ticket,
      accent: 'color: var(--v4-common-red-color)'
    },
    {
      id: 'call-back',
      title: 'Request a Callback',
      description: 'Share your requirements and we will call you back shortly.',
      icon: PhoneIncoming,
      accent: 'color: var(--v4-badge-accent-text-color)'
    }
  ];

  selectOption(option: IRequestOption): void {
    this.matDialogRef.close();
    switch (option.id) {
      case 'submit-ticket':
        this.openSubmitTicket();
        break;
      case 'call-back':
        this.openCallBack();
        break;
      default:
        break;
    }
  }

  private openSubmitTicket(): void {
    this.dialog.open(V4ComingSoonRequestModalComponent, {
      width: '580px',
      maxWidth: '95%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { app: this.data.app }
    });
  }

  private openCallBack(): void {
    this.dialog
      .open(V4RequestIntegrationModalComponent, {
        width: '600px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        autoFocus: false,
        data: { type: 'call-back', appName: this.data.app.title }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        if (res?.success) {
          this.v4AlertService.successAlert({
            content: `Thank you for requesting a callback. We'll be in touch with you shortly. Expect a call from us soon.`,
            timeout: 2000
          });
        }
      });
  }
}
