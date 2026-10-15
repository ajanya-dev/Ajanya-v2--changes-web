import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, X, ArrowDown, Download } from 'lucide-angular';
import { finalize, take } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-e-signature-agreement-v4',
  templateUrl: './e-signature-agreement-v4.component.html',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatDialogClose,
    NgClass,
    NgTemplateOutlet,
    CommonButtonV4Component
  ]
})
export class ESignatureAgreementV4Component {
  private dialogRef = inject(MatDialogRef<ESignatureAgreementV4Component>);
  appSettingService = inject(AppSettingsService);

  /**
   * Optional dialog data. Pass `{ signupTheme: true }` when opening from the
   * sign-up / register flow to render the branded dark-header concept. When
   * omitted (e.g. reset-password), the modal keeps the default white-header UI.
   */
  private data = inject<{ signupTheme?: boolean } | null>(MAT_DIALOG_DATA, {
    optional: true
  });

  /** True → branded dark-header concept (sign-up). False → default white UI. */
  get isSignupTheme(): boolean {
    return this.data?.signupTheme ?? false;
  }

  readonly XIcon = X;
  readonly ArrowDownIcon = ArrowDown;
  readonly DownloadIcon = Download;

  hasScrolledToBottom = false;
  fileDownloading = signal(false);

  checkScrollPosition(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const { scrollHeight } = element;
    const scrollThreshold = scrollHeight * 0.95;
    if (scrollPosition >= scrollThreshold) {
      this.hasScrolledToBottom = true;
    }
  }

  downloadAgreement(): void {
    this.fileDownloading.set(true);
    this.appSettingService
      .getDomainSettingApi()
      .pipe(
        finalize(() => this.fileDownloading.set(false)),
        take(1)
      )
      .subscribe((res) => {
        window.open(res.data.zilMoneyESignatureAgreement, '_blank');
      });
  }

  agreeAndClose(): void {
    this.dialogRef.close(true);
  }
}
