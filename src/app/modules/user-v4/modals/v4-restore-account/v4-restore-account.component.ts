import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { ILoginDetails } from 'src/app/modules/auth/model/login';
import { ILoginPayload } from 'src/app/models/user';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DeleteModalComponent } from 'src/app/modules/user-v4/modals/v4-delete-modal/v4-delete-modal.component';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';

@Component({
  selector: 'app-v4-restore-account',
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose, CommonButtonV4Component],
  templateUrl: './v4-restore-account.component.html'
})
export class V4RestoreAccountComponent implements OnInit, OnDestroy {
  private recaptchaService = inject(RecaptchaService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<V4RestoreAccountComponent>);
  private authDataService = inject(AuthDataService);
  private authService = inject(AuthService);
  private browserTokenService = inject(BrowserTokenService);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);

  readonly XIcon = X;

  subscriptions: Subscription[] = [];
  restoreDate = '';
  recaptchaToken = '';
  showLogoutBtn = signal(false);
  isRestoreAccount = signal(false);

  ngOnInit(): void {
    this.restoreDate = this.localStorageService.getItem('restore-date') || '';
    this.getBrowserAuthToken();
  }

  cancelDeletion(): void {
    const dialogRef = this.dialog.open(V4DeleteModalComponent, {
      maxWidth: '470px',
      width: '93%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { type: 'restore' }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.isRestoreAccount.set(true);
        this.onLogin(res);
      }
    });
  }

  onLogin(loginBody: ILoginPayload): void {
    const doHttpRequest = () => {
      const payload = {
        ...loginBody,
        recaptcha: this.recaptchaToken
      };
      this.subscriptions.push(
        this.authService
          .login(payload)
          .pipe(finalize(() => this.isRestoreAccount.set(false)))
          .subscribe((res: ILoginDetails) => {
            if (res.success) {
              this.dialogRef.close();
              this.authDataService.afterLogin(res, '', '');
            }
          })
      );
    };
    this.subscriptions.push(
      this.recaptchaService.recaptchaToken.subscribe(
        (res: string | undefined) => {
          this.recaptchaToken = res as string;
          doHttpRequest();
        }
      )
    );
  }

  confirmDeletion(): void {
    if (!this.showLogoutBtn()) {
      this.showLogoutBtn.set(true);
    } else {
      this.dialogRef.close();
      this.localStorageService.clearLocalStorage();
      this.router.navigateByUrl('/login');
    }
  }

  getBrowserAuthToken(): void {
    this.browserTokenService.refresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
