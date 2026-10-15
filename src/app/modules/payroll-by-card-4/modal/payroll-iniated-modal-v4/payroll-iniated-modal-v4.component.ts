import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, Check, CircleCheck } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface IInjectData {
  amount: string;
  cardName: string;
  cardNumber: string;
  bankAccount: string;
  fee: string;
  total: string;
  bankName: string;
}

@Component({
  selector: 'app-payroll-iniated-modal-v4',
  standalone: true,
  imports: [CurrencyPipe, LucideAngularModule, CommonButtonV4Component],
  templateUrl: './payroll-iniated-modal-v4.component.html',
  styleUrl: './payroll-iniated-modal-v4.component.scss'
})
export class PayrollIniatedModalV4Component {
  public dialogRef = inject(MatDialogRef<PayrollIniatedModalV4Component>);
  public injectData = inject<IInjectData>(MAT_DIALOG_DATA);

  readonly CheckIcon = Check;
  readonly CircleCheckIcon = CircleCheck;
}
