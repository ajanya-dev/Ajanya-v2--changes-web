import { Component, OnInit, inject } from '@angular/core';
import { MatDialogActions, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faSync, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { IntroService } from '../../service/intro.service';

@Component({
  selector: 'app-direct-deposit-modal',
  standalone: true,
  imports: [MatDialogActions,MatDialogClose,FontAwesomeModule, CommonModule],
  templateUrl: './direct-deposit-modal.component.html',
  styleUrl: './direct-deposit-modal.component.scss'
})
export class DirectDepositModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<DirectDepositModalComponent>);
  introService = inject(IntroService);

  faSync = faSync;
  faCalendar = faCalendar;
  faXmark = faXmark;

  data : {
    payTo : string;
    payFrom : string;
    checkNo : string;
    amount : number;
  };

  ngOnInit(): void {
    
    const { amount, selectedPayee, selectedBankAccount, checkNo } =
          this.introService.introForm.value;
  
        this.data = {
          payTo: selectedPayee || 'Payee 1',
          payFrom: selectedBankAccount || 'Bank Account 1',
          checkNo: checkNo || '4563',
          amount: parseInt(amount as string, 10) || 12.00,         
        };
  }

  close() {
    this.dialogRef.close();
  }

  onProcess(){
    this.dialogRef.close('direct-deposit');
  }
}
