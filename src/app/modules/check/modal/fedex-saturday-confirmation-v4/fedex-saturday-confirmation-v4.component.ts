import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  standalone: true,
  imports: [LucideAngularModule, MatDialogClose, CommonButtonV4Component],
  selector: 'app-fedex-saturday-confirmation-v4',
  templateUrl: './fedex-saturday-confirmation-v4.component.html'
})
export class FedexSaturdayConfirmationV4Component {
  public data: { message: string } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<FedexSaturdayConfirmationV4Component>);

  XIcon = X;

  processSaturday() {
    this.dialogRef.close({ success: true, process: 'Saturday' });
  }

  processMonday() {
    this.dialogRef.close({ success: true, process: 'Monday' });
  }
}
