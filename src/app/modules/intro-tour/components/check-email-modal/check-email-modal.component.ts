import { Component, OnInit, inject } from '@angular/core';
import { MatDialogActions, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { CommonModule } from '@angular/common';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { faX } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IntroService } from '../../service/intro.service';

@Component({
  selector: 'app-check-email-modal',
  standalone: true,
  imports: [DemoVideoComponent, MatDialogActions,FontAwesomeModule, MatDialogClose, CommonModule, NewPhoneInputComponent ],
  templateUrl: './check-email-modal.component.html',
  styleUrl: './check-email-modal.component.scss'
})
export class CheckEmailModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<CheckEmailModalComponent>);
  introService = inject(IntroService);
  
  faX = faX;

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

  sendEmail(){
    this.dialogRef.close('send-email');
  }
 
}
