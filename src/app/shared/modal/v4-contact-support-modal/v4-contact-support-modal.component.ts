import { Component, inject, OnInit, signal } from '@angular/core';
import { take } from 'rxjs';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
  LucideAngularModule,
  MessageSquare,
  Mail,
  PhoneCall,
  PhoneIncoming,
  Ticket,
  X,
  CircleCheck
} from 'lucide-angular';
import { Router } from '@angular/router';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AddQuestionModalComponent } from 'src/app/modules/user-support/modals/v4-add-question-modal/v4-add-question-modal.component';
import { V4RequestIntegrationModalComponent } from 'src/app/modules/user-support/modals/v4-request-integration-modal/v4-request-integration-modal.component';
import { V4AlertService } from '../../service/alert/v4-alert.service';
import { V4CallBackModalComponent } from '../v4-call-back-modal/v4-call-back-modal.component';

interface ISupportOption {
  id: string;
  title: string;
  description: string;
  icon: object;
  accent: string;
  footnote?: string;
  highlight?: string;
}

@Component({
  selector: 'app-v4-contact-support-modal',
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose],
  templateUrl: './v4-contact-support-modal.component.html',
  styleUrls: ['./v4-contact-support-modal.component.scss']
})
export class V4ContactSupportModalComponent implements OnInit {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);
  private v4AlertService = inject(V4AlertService);
  private matDialogRef = inject(MatDialogRef<V4ContactSupportModalComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private router = inject(Router);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  readonly XIcon = X;
  readonly circleCheckIcon = CircleCheck;

  type = signal<string>('');
  title = signal<string>('Request an App');
  subtitle = signal<string>(
    "Choose how you'd like to reach our integrations team."
  );
  requestStatus = signal<{ title: string; description: string } | null>(null);

  supportOptions: ISupportOption[] = [
    {
      id: 'live-chat',
      title: 'Live Chat',
      description:
        'Start a real-time conversation with our integration specialists.',
      icon: MessageSquare,
      accent: 'color: var(--v4-primary-brand-bold-color)',
      highlight: 'Typically replies in under 2 minutes'
    },
    {
      id: 'email',
      title: 'Email',
      description:
        'Send us the details for the integration you need and we will respond shortly.',
      icon: Mail,
      accent: 'color: var(--v4-badge-warning-text-color)',
      footnote: StaticWhiteLabelConditions.customerSupportEmail
    },
    {
      id: 'call',
      title: 'Call Now',
      description:
        'Speak directly with a support representative about your request.',
      icon: PhoneCall,
      accent: 'color: var(--v4-secondary-brand-color)',
      footnote: StaticWhiteLabelConditions.customerSupportNo ?? undefined
    },
    {
      id: 'call-back',
      title: 'Call Back Request',
      description: 'Share your preferred time and we will reach out to you.',
      icon: PhoneIncoming,
      accent: 'color: var(--v4-badge-accent-text-color)',
      highlight: 'Same business day follow up'
    },
    {
      id: 'submit-ticket',
      title: 'Submit Ticket',
      description:
        'Log a detailed ticket with attachments so we can scope your integration.',
      icon: Ticket,
      accent: 'color: var(--v4-common-red-color)'
    }
  ];

  ngOnInit(): void {
    if (this.data?.type) {
      this.type.set(this.data.type as string);
    }
    if (this.data?.title) {
      this.title.set(this.data.title as string);
    }
    if (this.data?.subtitle) {
      this.subtitle.set(this.data.subtitle as string);
    }
    if (this.data?.hideSubmitTicket) {
      this.supportOptions = this.supportOptions.filter(
        (option) => option.id !== 'submit-ticket'
      );
    }
  }

  selectOption(option: ISupportOption): void {
    this.requestStatus.set(null);

    switch (option.id) {
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
  }

  close(): void {
    this.matDialogRef.close();
  }

  private openLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
    this.close();
  }

  private openEmail(): void {
    window.open(
      `mailto:${StaticWhiteLabelConditions.customerSupportEmail}`,
      '_blank'
    );
    this.close();
  }

  private openCall(): void {
    if (StaticWhiteLabelConditions.customerSupportNo) {
      window.open(
        `tel:${StaticWhiteLabelConditions.customerSupportNo}`,
        '_blank'
      );
    } else {
      window.open(StaticWhiteLabelConditions.helpWebsite, '_blank');
    }
    this.close();
  }

  private openCallBack(): void {
    this.close();

    let dialogRef;
    if (this.type() === 'request-integration') {
      dialogRef = this.dialog.open(V4RequestIntegrationModalComponent, {
        width: '600px',
        maxWidth: '95%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { type: 'call-back' }
      });
    } else {
      dialogRef = this.dialog.open(V4CallBackModalComponent, {
        width: '420px',
        maxWidth: '93%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true
      });
    }

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        if (res?.success) {
          this.v4AlertService.successAlert({
            content:`Thank you for requesting a callback. We'll be in touch with you shortly. Expect a call from us soon.`,
            timeout: 2000
          });
        }
      });
  }

  private openSubmitTicket(): void {
    this.close();

    this.dialog
      .open(V4AddQuestionModalComponent, {
        maxWidth: '560px',
        width: '93%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        if (res) {
          if (this.router.url.startsWith('/v4/manage/user-support')) {
            this.v4AlertService.successAlert({
              content: `Thank you for submitting your ticket. We'll be in touch with you shortly.`,
              timeout: 2000
            });
            this.dataTableService.setRefreshStatus(true);
            this.v3DataTableService.refreshV3DataTable();
          } else {
            this.router.navigate(['/v4/manage/user-support']);
          }
        }
      });
  }
}
