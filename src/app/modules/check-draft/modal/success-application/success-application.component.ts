import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * @description Modal Component to show the success status of the verfication.
 */
@Component({
  selector: 'app-success-application',
  templateUrl: './success-application.component.html',
  styleUrls: ['./success-application.component.scss'],
  standalone: true
})
export class SuccessApplicationComponent {
  constructor(public dialogRef: MatDialogRef<SuccessApplicationComponent>) {}

  gotoHome() {
    this.dialogRef.close(true);
  }
}
