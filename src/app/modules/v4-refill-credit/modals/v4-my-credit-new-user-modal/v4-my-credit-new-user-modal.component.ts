import { Component, inject } from '@angular/core';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { DollarSign, FileText, LucideAngularModule, X, Zap } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-my-credit-new-user-modal',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, MatDialogClose, CurrencyPipe],
  templateUrl: './v4-my-credit-new-user-modal.component.html',
  styleUrl: './v4-my-credit-new-user-modal.component.scss'
})
export class V4MyCreditNewUserModalComponent {
  private dialogRef = inject(MatDialogRef<V4MyCreditNewUserModalComponent>);

  readonly XIcon = X;
  readonly dollarSignIcon = DollarSign;
  readonly fileTextIcon = FileText;
  readonly zapIcon = Zap;

  credit = 0;

  onAddCredits(): void {
    this.dialogRef.close({ addCredits: true });
  }
}
