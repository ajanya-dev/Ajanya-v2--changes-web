import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import {
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { PayrollService } from '../../services/payroll.service';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-display-id-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    FontAwesomeModule,
    MatDialogActions,
    MatDialogClose,
    MatTooltip
  ],
  templateUrl: './display-id-modal.component.html',
  styleUrl: './display-id-modal.component.scss'
})
export class DisplayIDModalComponent implements OnInit, OnDestroy {
  private payrollService = inject(PayrollService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef);
  private dialogData: { kybBypassedUser: number; bypassedFor: number } =
    inject(MAT_DIALOG_DATA);

  kybBypassedUser: number;
  bypassedFor: number;
  displayID = new FormControl<string>('', Validators.required);
  isLoading = signal(false);
  destroy$ = new Subject<boolean>();

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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            const confirm = this.alertService.confirmAlert({
              content: 'Have you connected to Paychex?',
              doneMsg: 'Yes'
            });
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
          } else {
            this.isLoading.set(false);
          }
        },
        error: () => this.isLoading.set(false)
      });
  }

  confirmConnection(showMsg = false) {
    this.payrollService
      .confirmPaychexConnection(this.displayID.value ?? '')
      .pipe(
        takeUntil(this.destroy$),
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
  getClientId(){
    window.open("https://support.onlinecheckwriter.com/portal/en/kb/articles/how-to-connect-paychex", '_blank'); 
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
