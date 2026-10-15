import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';

interface IInjectData {
  amount: string;
  cardName: string;
  cardNumber: string;
  bankAccount: string;
  fee: string;
  total: string;
  bankName:string
}

@Component({
  selector: 'app-payroll-iniated-modal',
  standalone: true,
  imports: [MatDialogClose,CurrencyPipe],
  templateUrl: './payroll-iniated-modal.component.html',
  styleUrl: './payroll-iniated-modal.component.scss'
})
export class PayrollIniatedModalComponent {
  public injectData = inject<IInjectData>(MAT_DIALOG_DATA);
}
