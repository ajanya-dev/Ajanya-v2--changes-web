import { NgClass } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
  LucideAngularModule,
  MessageCircle,
  Mail,
  Phone,
  PhoneCall,
  FileText,
  X
} from 'lucide-angular';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { take } from 'rxjs';
import { RequestIntegrationModalComponent } from 'src/app/modules/user-support/modals/request-integration-modal/request-integration-modal.component';
import { V4AlertService } from '../../service/alert/v4-alert.service';

interface IContactOption {
  label: string;
  value: string;
  icon: object;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-contact-support-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose, NgClass],
  template: `
    <div class="p-5 font-funnel">
      <!-- Header -->
      <div class="flex justify-between items-center mb-5">
        <h2 class="font-semibold text-lg text-v4-main-text-color">
          Contact Support
        </h2>
        <button
          type="button"
          class="text-v4-tertiary-text-color hover:text-v4-main-text-color transition-colors"
          [mat-dialog-close]="false"
        >
          <i-lucide [img]="XIcon" [size]="20"></i-lucide>
        </button>
      </div>

      <!-- Options Grid -->
      <div class="grid grid-cols-2 gap-4">
        @for (option of contactOptions; track option.value) {
          <div
            role="presentation"
            class="flex flex-col items-center justify-center border border-v4-border-color rounded-xl cursor-pointer transition-all duration-200 pb-3 pt-[14px] group hover:shadow-md"
            tabindex="0"
            [ngClass]="{
              '!border-v4-primary-brand-color !shadow-md':
                selectedOption === option.value
            }"
            (click)="selectOption(option.value)"
          >
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center mb-1"
              [style.background-color]="option.bgColor"
            >
              <i-lucide
                [img]="option.icon"
                [size]="22"
                [style.color]="option.color"
              ></i-lucide>
            </div>
            <span
              class="text-sm font-medium text-v4-main-text-color text-center"
              >{{ option.label }}</span
            >
          </div>
        }
      </div>
    </div>
  `
})
export class ContactSupportModalV4Component implements OnInit {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private matDialogRef = inject(
    MatDialogRef<ContactSupportModalV4Component>
  );
  private data = inject(MAT_DIALOG_DATA);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  readonly XIcon = X;
  type = signal<string>('');
  selectedOption = '';

  contactOptions: IContactOption[] = [
    {
      label: 'Live Chat',
      value: 'live-chat',
      icon: MessageCircle,
      color: 'var(--v4-common-blue-color)',
      bgColor: 'var(--v4-badge-info-bg-color)'
    },
    {
      label: 'Email',
      value: 'email',
      icon: Mail,
      color: 'var(--v4-common-green-color)',
      bgColor: 'var(--v4-badge-success-bg-color)'
    },
    {
      label: 'Call Now',
      value: 'call',
      icon: Phone,
      color: 'var(--v4-common-yellow-color)',
      bgColor: 'var(--v4-badge-warning-bg-color)'
    },
    {
      label: 'Call Back',
      value: 'call-back',
      icon: PhoneCall,
      color: 'var(--v4-badge-accent-text-color, #7c3aed)',
      bgColor: 'var(--v4-badge-accent-bg-color, #ede9fe)'
    },
    {
      label: 'Submit Ticket',
      value: 'submit-ticket',
      icon: FileText,
      color: 'var(--v4-common-red-color)',
      bgColor: 'var(--v4-badge-error-bg-color)'
    }
  ];

  ngOnInit(): void {
    if (this.data?.type) {
      this.type.set(this.data.type as string);
    }
  }

  selectOption(option: string): void {
    this.selectedOption = option;
    switch (option) {
      case 'live-chat':
        this.dynamicWhiteLabelService.goToLiveChat();
        break;
      case 'email':
        window.open(
          `mailto:${this.staticWhiteLabelConditions.customerSupportEmail}`,
          '_blank'
        );
        break;
      case 'call':
        if (this.staticWhiteLabelConditions.customerSupportNo) {
          window.open(
            `tel:${this.staticWhiteLabelConditions.customerSupportNo}`,
            '_blank'
          );
        } else {
          window.open(
            this.staticWhiteLabelConditions.helpWebsite,
            '_blank'
          );
        }
        break;
      case 'call-back':
        this.openCallBack();
        break;
      case 'submit-ticket':
        this.openSubmitTicket();
        break;
    }
    this.matDialogRef.close();
  }

  private async openCallBack(): Promise<void> {
    let dialogRef;
    if (this.type() === 'request-integration') {
      dialogRef = this.dialog.open(RequestIntegrationModalComponent, {
        width: '600px',
        minHeight: '850px',
        disableClose: true,
        data: { type: 'call-back' }
      });
    } else {
      const { V4CallBackModalComponent } = await import(
        '../v4-call-back-modal/v4-call-back-modal.component'
      );
      dialogRef = this.dialog.open(V4CallBackModalComponent, {
        maxWidth: '420px',
        width: '93%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true
      });
    }

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content:
              this.type() === 'request-integration'
                ? "Thank you for requesting a callback. We'll be in touch with you shortly."
                : 'Successfully updated',
            timeout: 2000
          });
        }
      });
  }

  private async openSubmitTicket(): Promise<void> {
    const { V4AddQuestionModalComponent } = await import(
      'src/app/modules/user-support/modals/v4-add-question-modal/v4-add-question-modal.component'
    );
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
          this.alertService.successAlert({
            content:
              "Thank you for submitting your ticket. We'll be in touch with you shortly.",
            timeout: 2000
          });
        }
      });
  }
}
