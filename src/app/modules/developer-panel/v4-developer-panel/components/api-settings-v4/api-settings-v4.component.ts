import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { finalize, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LUCIDE_ICONS_V4 } from 'src/app/shared/V4/lucide-icons';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { DeveloperPanelService } from 'src/app/shared/service/developer-panel/developer-panel.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { OtpModalV4Component } from 'src/app/modules/more/v4-more/modals/reports/otp-modal-v4/otp-modal-v4.component';

@Component({
  selector: 'app-api-settings-v4',
  templateUrl: './api-settings-v4.component.html',
  styleUrls: ['./api-settings-v4.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CommonButtonV4Component, MatTooltip]
})
export class ApiSettingsV4Component implements OnInit {
  private developerPanelService = inject(DeveloperPanelService);
  private v4AlertService = inject(V4AlertService);
  private dialog = inject(MatDialog);

  readonly icons = LUCIDE_ICONS_V4;

  tokenValue = signal<string>('');
  isTokenRevealed = signal<boolean>(false);
  revealTokenLoading = signal<boolean>(false);
  generateLoading = signal<boolean>(false);
  copied = signal<boolean>(false);

  partnerTokenValue = signal<string>('');
  isPartnerTokenRevealed = signal<boolean>(false);
  revealPartnerTokenLoading = signal<boolean>(false);
  partnerCopied = signal<boolean>(false);

  private sessionKey = '';

  ngOnInit(): void {
    this.developerPanelService.getToken().pipe(take(1)).subscribe({});
  }

  revealToken(): void {
    if (this.revealTokenLoading()) return;

    if (this.isTokenRevealed()) {
      this.isTokenRevealed.set(false);
      this.tokenValue.set('');
      return;
    }

    this.revealTokenLoading.set(true);

    this.developerPanelService
      .getToken(this.sessionKey)
      .pipe(finalize(() => this.revealTokenLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.tokenValue.set(res.data.token);
            this.isTokenRevealed.set(true);
          }
        },
        error: (err) => {
          this.sessionKey = err.error?.session_key ?? '';
          if (err.error?.errorCode === '112') {
            const dialog = this.dialog.open(OtpModalV4Component, {
              maxWidth: '410px',
              width: '100%',
              panelClass: 'paddingless-modal-rounded',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) this.revealToken();
            });
          } else if(!err.error?.permissionType) {
            this.v4AlertService.failedAlert({
              content: err.error?.errorMsg ?? 'Failed to retrieve API key. Please try again.'
            });
          }
        }
      });
  }

  revealPartnerToken(): void {
    if (this.revealPartnerTokenLoading()) return;

    if (this.isPartnerTokenRevealed()) {
      this.isPartnerTokenRevealed.set(false);
      this.partnerTokenValue.set('');
      return;
    }

    this.revealPartnerTokenLoading.set(true);

    this.developerPanelService
      .getPartnerConnectToken()
      .pipe(finalize(() => this.revealPartnerTokenLoading.set(false)),take(1))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.partnerTokenValue.set(res.data.connectionKey);
            this.isPartnerTokenRevealed.set(true);
          }
        }
      });
  }

  copyToClipboard(section: 'api' | 'partner' = 'api'): void {
    const revealed =
      section === 'partner'
        ? this.isPartnerTokenRevealed()
        : this.isTokenRevealed();
    if (!revealed) return;

    const value =
      section === 'partner' ? this.partnerTokenValue() : this.tokenValue();
    navigator.clipboard.writeText(value).then(() => {
      if (section === 'partner') {
        this.partnerCopied.set(true);
        setTimeout(() => this.partnerCopied.set(false), 800);
      } else {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 800);
      }
    });
  }

  generateNewKey(): void {
    const confirmRef = this.v4AlertService.confirmAlert({
      title: 'Generate New Key',
      content: 'This will immediately invalidate the current key. Are you sure?'
    });
    confirmRef.afterClosed().subscribe((result) => {
      if (result) this.token();
    });
  }

  private token(): void {
    this.generateLoading.set(true);

    this.developerPanelService
      .tokenApiKey({ session_key: this.sessionKey || '' })
      .pipe(finalize(() => this.generateLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.tokenValue.set(res.data.token);
            this.isTokenRevealed.set(true);
            this.v4AlertService.successAlert({
              title: 'Success',
              content: 'New API key generated successfully.'
            });
          }
        },
        error: (err) => {
          this.sessionKey = err.error?.session_key ?? '';
          if (err.error?.errorCode === '112') {
            const dialog = this.dialog.open(OtpModalV4Component, {
              maxWidth: '410px',
              width: '100%',
              panelClass: 'paddingless-modal-rounded',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) this.token();
            });
          }
        }
      });
  }
}
