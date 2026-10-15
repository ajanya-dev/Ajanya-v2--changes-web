import { NgClass } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faMessage,
  faEnvelope,
  faPhone,
  faPhoneVolume,
  faFileLines,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { take } from 'rxjs';
import { AddQuestionModalComponent } from 'src/app/modules/user-support/modals/add-question-modal/add-question-modal.component';
import { RequestIntegrationModalComponent } from 'src/app/modules/user-support/modals/request-integration-modal/request-integration-modal.component';
import { AlertService } from '../../service/alert/alert.service';
import { CommonCallMeComponent } from '../../v3/common-call-me/common-call-me.component';

@Component({
  selector: 'app-contact-support-modal',
  standalone: true,
  imports: [FaIconComponent, MatDialogClose, NgClass],
  templateUrl: './contact-support-modal.component.html',
  styleUrl: './contact-support-modal.component.scss'
})
export class ContactSupportModalComponent implements OnInit {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private matDialogRef = inject(MatDialogRef<ContactSupportModalComponent>);
  private data = inject(MAT_DIALOG_DATA);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  type = signal<string>('');
  selectedOption: string = '';
  faXmark = faXmark;

  contactOptions = [
    {
      label: 'Live Chat',
      value: 'live-chat',
      icon: faMessage,
      color: 'var(--common-blue-color)',
      backgroundColor: 'var(--common-secondary-blue-color)'
    },
    {
      label: 'Email',
      value: 'email',
      icon: faEnvelope,
      color: 'var(--common-green-color)',
      backgroundColor: 'var(--common-secondary-green-color)'
    },
    {
      label: 'Call Now',
      value: 'call',
      icon: faPhone,
      color: 'var(--common-yellow-color)',
      backgroundColor: 'var(--common-secondary-yellow-color)'
    },
    {
      label: 'Call Back',
      value: 'call-back',
      icon: faPhoneVolume,
      color: 'var(--common-violet-color)',
      backgroundColor: 'var(--common-secondary-violet-color)'
    },
    {
      label: 'Submit Ticket',
      value: 'submit-ticket',
      icon: faFileLines,
      color: 'var(--common-red-color)',
      backgroundColor: 'var(--common-secondary-red-color)'
    }
  ];

  ngOnInit(): void {
    if (this.data?.type) {
      this.type.set(this.data?.type as string);
    }
  }

  selectOption(option: string) {
    this.selectedOption = option;
    switch (option) {
      case 'live-chat':
        this.openLiveChat();
        break;
      case 'email':
        this.openEmail();
        break;
      case 'call':
        this.openCall();
        break;
      case 'call-back':
        this.openCallBack();
        break;
      case 'submit-ticket':
        this.openSubmitTicket();
        break;
      default:
        break;
    }
    this.matDialogRef.close();
  }

  openLiveChat() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  openEmail() {
    window.open(
      `mailto:${this.staticWhiteLabelConditions.customerSupportEmail}`,
      '_blank'
    );
  }

  openCall() {
    if (this.staticWhiteLabelConditions.customerSupportNo) {
      window.open(
        `tel:${this.staticWhiteLabelConditions.customerSupportNo}`,
        '_blank'
      );
    } else {
      window.open(this.staticWhiteLabelConditions.helpWebsite, '_blank');
    }
  }

  openCallBack() {
    let dialogRef = null;
    if (this.type() === 'request-integration') {
      dialogRef = this.dialog.open(RequestIntegrationModalComponent, {
        width: '600px',
        minHeight: '850px',
        disableClose: true,
        data: {
          type: 'call-back'
        }
      });
    } else {
      dialogRef = this.dialog.open(CommonCallMeComponent, {
        width: '350px',
        maxWidth: '90%',
        disableClose: true
      });
    }

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: this.type() === 'request-integration' ? `Thank you for requesting a callback. We'll be in touch with you shortly. Expect a call from us soon.` : `Successfully updated`,
            timeout: 2000
          });
        }
      });
  }

  openSubmitTicket() {
    this.dialog
      .open(AddQuestionModalComponent, {
        maxWidth: '510px',
        width: '93%'
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        if (res) {
          this.alertService.successAlert({
            content: `Thank you for submitting your ticket. We'll be in touch with you shortly.`,
            timeout: 2000
          });
        }
      });
  }
}
