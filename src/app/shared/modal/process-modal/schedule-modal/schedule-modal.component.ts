import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

/**
 * @description Modal component for scheduling payments.
 */
@Component({
  selector: 'app-schedule-modal',
  templateUrl: './schedule-modal.component.html',
  styleUrls: ['./schedule-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    FaIconComponent,
    CommonButtonV35Component
  ]
})
export class ScheduleModalComponent implements OnInit {
  private datePipe = inject(DatePipe);
  private dialogRef = inject(MatDialogRef<ScheduleModalComponent>);

  minDate: Date | string;
  selectedDate: Date | string;
  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;

  ngOnInit(): void {
    this.setMinDate();
  }

  setMinDate() {
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate = this.datePipe.transform(
      this.minDate,
      'yyyy-MM-dd'
    ) as string;
    this.selectedDate = this.minDate;
  }

  /**
   * @description Method invoked when 'Next' button is clicked in template.
   * Cloese the dialog and the submitted value can be accessed
   * by subscribing to the observable returned by the `afterClosed()` method on dialogRef in parent.
   * @returns
   */
  submit() {
    if (this.selectedDate < this.minDate) {
      return;
    }

    this.dialogRef.close(this.selectedDate);
  }
}
