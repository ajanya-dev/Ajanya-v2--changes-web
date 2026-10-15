import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

export interface IRecipientFieldCount {
  recipientName: string;
  recipientEmail: string;
  fieldCount: number;
}

export interface IConfirmSignModalData {
  recipients: IRecipientFieldCount[];
}

@Component({
  selector: 'app-confirm-sign-modal',
  standalone: true,
  imports: [CommonModule, FaIconComponent, CommonButtonV35Component],
  templateUrl: './confirm-sign-modal.component.html',
  styleUrl: './confirm-sign-modal.component.scss'
})
export class ConfirmSignModalComponent {
  private dialogRef = inject(MatDialogRef<ConfirmSignModalComponent>);
  public data = inject<IConfirmSignModalData>(MAT_DIALOG_DATA);

  get recipients(): IRecipientFieldCount[] {
    return this.data.recipients || [];
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
