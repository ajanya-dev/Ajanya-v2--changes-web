import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

@Component({
  selector: 'app-timeout-modal',
  templateUrl: './timeout-modal.component.html',
  styleUrls: ['./timeout-modal.component.scss'],
  standalone: true,
  imports: [MatDialogActions]
})
export class TimeoutModalComponent implements OnInit {
  timer: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { warningTimer: number },
    private _dialogRef: MatDialogRef<TimeoutModalComponent>,
    private _localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    setInterval(() => {
      this.timer = this.millisToMinutesAndSeconds();
    }, 1000);
  }

  /**
   * @description Converts a given time in milliseconds to a string representation of minutes and seconds.
   * If the warning timer reaches zero, it calls the 'close' method with a 'false' argument.
   */
  millisToMinutesAndSeconds(): string {
    this.data.warningTimer -= 1000;
    if (!this.data.warningTimer) {
      this.close(false);
    }
    const minutes = Math.floor(this.data.warningTimer / 60000);
    const seconds = ((this.data.warningTimer % 60000) / 1000).toFixed(0);
    return minutes + ':' + (Number(seconds) < 10 ? '0' : '') + seconds;
  }

  /**
   * @description Closes the current dialog and handles session timer state.
   * Sets the 'sessionTimerOpen' value in local storage based on the provided boolean value.
   * @param {boolean} val - The boolean value indicating the session timer state.
   */
  close(val: boolean) {
    const sessionTimerOpen = val ? '0' : '-1';
    this._localStorageService.setItem('sessionTimerOpen', sessionTimerOpen);
    this._dialogRef.close(val);
  }
}
