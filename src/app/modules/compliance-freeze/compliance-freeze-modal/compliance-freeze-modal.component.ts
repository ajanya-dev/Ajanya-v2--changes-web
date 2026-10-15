import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { ContactSupportNewComponent } from 'src/app/shared/components/contact-support-new/contact-support-new.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ContactSupportModalComponent } from 'src/app/shared/modal/contact-support-modal/contact-support-modal.component';

export interface ComplianceFreezeModalData {
  heading?: string;
  body?: string;
  actionBoxText?: string;
  contactEmail?: string;
  contactPhone?: string;
  caseId?: string;
}

@Component({
  selector: 'app-compliance-freeze-modal',
  templateUrl: './compliance-freeze-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    ContactSupportNewComponent,
    CommonButtonV35Component
  ]
})
export class ComplianceFreezeModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<ComplianceFreezeModalComponent>);
  private appSettingsService = inject(AppSettingsService);
  private dialog = inject(MatDialog);

  appConfig: IAppConfig | null = null;
  faInfoCircle = faInfoCircle;
  faXmark = faXmark;

  private subscription: Subscription;

  ngOnInit(): void {
    this.subscription = this.appSettingsService.appConfig$.subscribe(
      (config) => {
        this.appConfig = config;
      }
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onContactNow(): void {
    this.dialogRef.close();
    this.dialog.open(ContactSupportModalComponent, {
      width: '90%',
      maxWidth: '400px',
      disableClose: true,
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
