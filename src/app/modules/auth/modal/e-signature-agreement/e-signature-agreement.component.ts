import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowDownToLine } from '@fortawesome/pro-regular-svg-icons';
import { faArrowDown, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { finalize, take } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-e-signature-agreement',
  templateUrl: './e-signature-agreement.component.html',
  styleUrls: ['./e-signature-agreement.component.scss'],
  standalone: true,
  imports: [FaIconComponent, MatDialogClose, NgClass, CommonButtonV35Component]
})
export class ESignatureAgreementComponent {
  private dialogRef = inject(MatDialogRef<ESignatureAgreementComponent>);
  appSettingService = inject(AppSettingsService);

  hasScrolledToBottom = false;
  faArrowDown = faArrowDown;
  faXmark = faXmark;
  faDownload = faArrowDownToLine;

  fileDownloading = signal(false);

  checkScrollPosition(event: Event): void {
    const element = event.target as HTMLInputElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const { scrollHeight } = element;
    const scrollThreshold = scrollHeight * 0.95;
    if (scrollPosition >= scrollThreshold) {
      this.hasScrolledToBottom = true;
    }
  }

  openProhibitedActivitiesList(): void {
    window.open(
      'https://support.zilmoney.com/portal/en/kb/articles/zil-money-prohibited-activities-list',
      '_blank',
      'noopener,noreferrer'
    );
  }

  downloadAgreement() {
    this.fileDownloading.set(true);
    this.appSettingService
      .getDomainSettingApi()
      .pipe(
        finalize(() => {
          this.fileDownloading.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        window.open(res.data.zilMoneyESignatureAgreement, '_blank');
      });
  }

  agreeAndClose() {
    this.dialogRef.close(true);
  }
}
