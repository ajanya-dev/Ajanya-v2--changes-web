import { NgOptimizedImage } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';

@Component({
  standalone: true,
  imports: [NgOptimizedImage, MatDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fedex-saturday-confirmation',
  templateUrl: './fedexSaturdayConfirmation.component.html',
  styleUrls: ['./fedexSaturdayConfirmation.component.scss']
})
export class FedexSaturdayConfirmationComponent {
  public data: { message: string } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<FedexSaturdayConfirmationComponent>);

  processSaturday() {
    this.dialogRef.close({ success: true, process: 'Saturday' });
  }

  processMonday() {
    this.dialogRef.close({ success: true, process: 'Monday' });
  }
}
