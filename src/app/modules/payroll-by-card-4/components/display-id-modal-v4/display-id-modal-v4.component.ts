import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { PaychexConfirmConnectionModalV4Component } from '../paychex-confirm-connection-modal-v4/paychex-confirm-connection-modal-v4.component';

@Component({
  selector: 'app-display-id-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './display-id-modal-v4.component.html',
  styleUrl: './display-id-modal-v4.component.scss'
})
export class DisplayIDModalV4Component implements OnInit {
  private payrollService = inject(PayrollService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef);
  private dialog = inject(MatDialog);
  private dialogData: { kybBypassedUser: number; bypassedFor: number } =
    inject(MAT_DIALOG_DATA);

  readonly XIcon = X;

  kybBypassedUser: number;
  bypassedFor: number;
  displayID = new FormControl<string>('', Validators.required);
  isLoading = signal(false);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.kybBypassedUser = this.dialogData.kybBypassedUser;
    this.bypassedFor = this.dialogData.bypassedFor;
  }

  /**
   * @description Runs the KYB (Know Your Business) bypass process.
   *
   */
  connectToPaychex() {
    this.displayID.markAllAsTouched();
    this.isLoading.set(true);
    if (this.displayID.invalid) {
      this.isLoading.set(false);
      return;
    }
    this.payrollService
      .connectToPaychex(this.displayID.value ?? '')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.isLoading.set(false);
          return throwError(() => error);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          const confirm = this.dialog.open(
            PaychexConfirmConnectionModalV4Component,
            {
              maxWidth: '562px',
              width: '95%',
              disableClose: true,
              autoFocus: false,
              panelClass: 'paddingless-modal-rounded',
              data: { displayId: this.displayID.value ?? '' }
            }
          );
          if (res.data.msg !== 'Already Connected') {
            window.open(res?.data?.Link);
          }
          confirm.afterClosed().subscribe((resp) => {
            if (resp) {
              this.confirmConnection(true);
            } else {
              this.isLoading.set(false);
              this.dialogRef.close();
            }
          });
        }
      });
  }

  confirmConnection(showMsg = false) {
    this.payrollService
      .confirmPaychexConnection(this.displayID.value ?? '')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.dialogRef.close();
          if (response.data.is_connected === 1) {
            this.payrollService.isConnectedSuccess.next(true);
            if (showMsg) {
              this.alertService.successAlert({
                content: 'Connected successfully.'
              });
            }
          } else {
            this.alertService.failedAlert({
              content: 'Unable to connect. Please check and try again.'
            });
          }
        },
        // The error interceptor already alerted; keep the modal open for a retry.
        error: () => {}
      });
  }

  /**
   * @description Close the modal
   */
  close() {
    this.dialogRef.close();
  }

  /**
   * navigation to "how to get client id documentation"
   */
  getClientId() {
    window.open(
      'https://support.onlinecheckwriter.com/portal/en/kb/articles/how-to-connect-paychex',
      '_blank'
    );
  }
}
