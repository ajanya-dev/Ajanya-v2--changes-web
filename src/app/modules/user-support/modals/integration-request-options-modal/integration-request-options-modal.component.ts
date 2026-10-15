import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFileLines, faPhoneVolume, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { take } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationFaqRequirementsModalComponent } from '../integration-faq-requirements-modal/integration-faq-requirements-modal.component';
import { RequestIntegrationModalComponent } from '../request-integration-modal/request-integration-modal.component';

@Component({
  selector: 'app-integration-request-options-modal',
  standalone: true,
  imports: [FaIconComponent, MatDialogClose, NgClass],
  templateUrl: './integration-request-options-modal.component.html',
  styleUrl: './integration-request-options-modal.component.scss'
})
export class IntegrationRequestOptionsModalComponent {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private matDialogRef = inject(MatDialogRef<IntegrationRequestOptionsModalComponent>);
  private data: { requestedId: string; appName: string } = inject(MAT_DIALOG_DATA);

  faXmark = faXmark;
  selectedOption: string = '';

  requestOptions = [
    {
      label: 'Submit a Request',
      value: 'submit-ticket',
      icon: faFileLines,
      color: 'var(--common-red-color)',
      backgroundColor: 'var(--common-secondary-red-color)'
    },
    {
      label: 'Request a Callback',
      value: 'call-back',
      icon: faPhoneVolume,
      color: 'var(--common-violet-color)',
      backgroundColor: 'var(--common-secondary-violet-color)'
    }
  ];

  selectOption(option: string) {
    this.selectedOption = option;
    switch (option) {
      case 'submit-ticket':
        this.openSubmitTicket();
        break;
      case 'call-back':
        this.openCallBack();
        break;
      default:
        break;
    }
    this.matDialogRef.close();
  }

  openSubmitTicket() {
    this.dialog
      .open(IntegrationFaqRequirementsModalComponent, {
        disableClose: true,
        data: { requestedId: this.data.requestedId, appName: this.data.appName }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (result.success) {
          this.alertService.successAlert({
            content: 'Request submitted successfully. Our support team will contact you soon.',
            timeout: 2000
          });
        }
      });
  }

  openCallBack() {
    this.dialog
      .open(RequestIntegrationModalComponent, {
        width: '600px',
        minHeight: '850px',
        disableClose: true,
        autoFocus: false,
        data: { type: 'call-back', appName: this.data.appName }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: `Thank you for requesting a callback. We'll be in touch with you shortly. Expect a call from us soon.`,
            timeout: 2000
          });
        }
      });
  }
}
