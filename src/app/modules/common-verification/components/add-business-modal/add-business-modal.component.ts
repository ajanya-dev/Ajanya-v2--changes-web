import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { VerificationBusinessDetailsComponent } from '../verification-business-details/verification-business-details.component';

interface IRecievedData {
  sourceType: CVSourceType;
  bankAccountId?: string;
}

/**
 * @description Modal component for adding business
 */
@Component({
  selector: 'app-add-business-modal',
  templateUrl: './add-business-modal.component.html',
  styleUrls: ['./add-business-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, VerificationBusinessDetailsComponent, MatDialogModule]
})
export class AddBusinessModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IRecievedData,
    private dialogRef: MatDialogRef<AddBusinessModalComponent>
  ) {}

  /**
   * @description Closes the modal, if the `next` event emitted by child contains closeModal set to true.
   * @param ev - event.
   */
  handleNext(ev: any) {
    if (ev?.closeModal) {
      this.dialogRef.close({
        success: true,
        sourceType: this.data?.sourceType
      });
    }
  }
}
