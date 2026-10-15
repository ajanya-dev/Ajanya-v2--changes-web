import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { DeviceModalV4Component } from '../../v4-modals/device-modal-v4/device-modal-v4.component';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';

@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-deposit-slip-activitylog-v4',
  templateUrl: './deposit-slip-activitylog-v4.component.html',
  styleUrls: ['./deposit-slip-activitylog-v4.component.scss']
})
export class DepositSlipActivitylogV4Component implements OnChanges {
  private depositSlipService = inject(DepositSlipsService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  slipId = input<string>('');
  activityData: Record<string, string>[] = [];
  isLoading = signal(false);

  ngOnChanges(): void {
    if (this.slipId() !== undefined) this.loadDepositSlipActivity();
  }

  editDeviceName(deviceAddress: string): void {
    const dialogRef = this.dialog.open(DeviceModalV4Component, {
      maxWidth: '510px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { deviceAddress: deviceAddress }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.loadDepositSlipActivity();
      }
    });
  }

  loadDepositSlipActivity(): void {
    this.isLoading.set(true);
    this.depositSlipService
      .getDepositSlipActivites(this.slipId())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.activityData = res.data;
          this.cdr.detectChanges();
        }
      });
  }
}
