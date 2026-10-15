import { Component, inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, X, CircleCheck } from 'lucide-angular';

@Component({
  selector: 'app-v4-two-factor-turnon',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, MatDialogClose],
  templateUrl: './v4-two-factor-turnon.component.html'
})
export class V4TwoFactorTurnonComponent implements OnDestroy {
  private userService = inject(UserProfileService);
  private dialogRef = inject(MatDialogRef<V4TwoFactorTurnonComponent>);

  readonly XIcon = X;
  readonly CircleCheckIcon = CircleCheck;

  subscriptions: Subscription[] = [];
  backupCpdes = false;
  backupCodesGroup: string[];
  btnDidsabled = false;

  Backup(ev: Event) {
    if ((ev.target as HTMLInputElement).checked) {
      this.backupCpdes = true;
      this.subscriptions.push(
        this.userService.getBackupCodes().subscribe((res) => {
          this.backupCodesGroup = res.data;
        })
      );
    } else {
      this.backupCpdes = false;
    }
  }

  activateBackupCode() {
    this.downloadBackupCodes();
    this.btnDidsabled = true;
    this.subscriptions.push(
      this.userService
        .activateBackupCode()
        .pipe(
          finalize(() => {
            this.btnDidsabled = false;
          })
        )
        .subscribe((res) => {
          this.btnDidsabled = false;
          if (res.success) {
            this.dialogRef.close();
          }
        })
    );
  }

  downloadBackupCodes() {
    const data = this.backupCodesGroup.join(',');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'backup-codes.txt';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
