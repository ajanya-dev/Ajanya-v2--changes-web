import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { LucideAngularModule, Clock } from 'lucide-angular';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-timeout-modal-v4',
  templateUrl: './timeout-modal-v4.component.html',
  styleUrls: ['./timeout-modal-v4.component.scss'],
  standalone: true,
  imports: [MatDialogActions, LucideAngularModule, CommonButtonV4Component],
  encapsulation: ViewEncapsulation.None
})
export class TimeoutModalV4Component implements OnInit, OnDestroy {
  timer = '';
  readonly ClockIcon = Clock;
  private intervalId: ReturnType<typeof setInterval> | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { warningTimer: number },
    private _dialogRef: MatDialogRef<TimeoutModalV4Component>,
    private _localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.timer = this.millisToMinutesAndSeconds();
    this.intervalId = setInterval(() => {
      this.timer = this.millisToMinutesAndSeconds();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  millisToMinutesAndSeconds(): string {
    this.data.warningTimer -= 1000;
    if (this.data.warningTimer <= 0) {
      this.close(false);
      return '0:00';
    }
    const minutes = Math.floor(this.data.warningTimer / 60000);
    const seconds = ((this.data.warningTimer % 60000) / 1000).toFixed(0);
    return minutes + ':' + (Number(seconds) < 10 ? '0' : '') + seconds;
  }

  close(val: boolean): void {
    const sessionTimerOpen = val ? '0' : '-1';
    this._localStorageService.setItem('sessionTimerOpen', sessionTimerOpen);
    this._dialogRef.close(val);
  }
}
