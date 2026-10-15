import { Component, inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faCircleCheck, faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-two-factor-turnon',
  templateUrl: './two-factor-turnon.component.html',
  styleUrls: ['./two-factor-turnon.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FaIconComponent, CommonButtonV35Component]
})
export class TwoFactorTurnonComponent implements OnDestroy {
  private userService = inject(UserProfileService);
  private dialogRef = inject(MatDialogRef<TwoFactorTurnonComponent>);

  subscriptions: Subscription[] = [];
  backupCpdes = false;
  data: string[];
  backupCodesGroup: string[];
  btnDidsabled = false;
  faXmark = faXmark;
  faCircleCheck = faCircleCheck;

  /**
   * @description Method is called when the "Activate backup code" checkbox is clicked.
   * It toggles the backupCpdes property and fetches the backup codes from the UserProfileService if the checkbox is checked.
   * @param ev
   */
  Backup(ev: KeyboardEvent) {
    if ((ev.target as HTMLInputElement).checked) {
      this.backupCpdes = !this.backupCpdes;
      this.subscriptions.push(
        this.userService.getBackupCodes().subscribe((res) => {
          this.backupCodesGroup = res.data;
        })
      );
    } else if (!(ev.target as HTMLInputElement).checked) {
      this.backupCpdes = !this.backupCpdes;
    }
  }

  /**
   * @description method is called when the "Turn ON" button is clicked.
   * It triggers the activation of the backup codes, initiates the download of the backup codes file, and closes the dialog if the activation is successful.
   */
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

  /**
   * @description Downloads the backup codes as a text file.
   */
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

  /**
   * @description Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
