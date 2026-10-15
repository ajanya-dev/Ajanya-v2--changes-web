import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  InputSignal,
  OnChanges,
  OnDestroy,
  inject,
  input,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { finalize, Subscription } from 'rxjs';
import { DeviceModalComponent } from 'src/app/shared/modal/device-modal/device-modal/device-modal.component';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';

@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-deposit-slip-activitylog',
  templateUrl: './deposit-slip-activitylog.component.html',
  styleUrls: ['./deposit-slip-activitylog.component.scss']
})
export class DepositSlipActivitylogComponent implements OnChanges, OnDestroy {
  private depositSlipService = inject(DepositSlipsService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  slipId: InputSignal<string> = input<string>('');
  activityData: { [key: string]: string }[];
  subscriptions: Subscription[] = [];
  isLoading = signal(false);

  ngOnChanges(): void {
    if (this.slipId() !== undefined) this.loadDepositSlipActivity();
  }

  /** Method for updating device */
  editDeviceName(deviceAddress: string): void {
    const dialogRef = this.dialog.open(DeviceModalComponent, {
      maxWidth: '510px',
      width: '93%',
      disableClose: true,
      data: { deviceAddress: deviceAddress }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.loadDepositSlipActivity();
      }
    });
  }

  /** Method for loading activities */
  loadDepositSlipActivity(): void {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.depositSlipService
        .getDepositSlipActivites(this.slipId())
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            this.activityData = res.data;
            this.cdr.detectChanges();
          }
        })
    );
  }

  /** destroyer */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
