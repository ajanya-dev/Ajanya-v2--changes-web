import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { faPencil, faX } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IntroService } from '../../service/intro.service';

@Component({
  selector: 'app-check-mail-modal',
  standalone: true,
  imports: [ReactiveFormsModule,FontAwesomeModule,DemoVideoComponent, MatDialogClose, NewPhoneInputComponent],
  templateUrl: './check-mail-modal.component.html',
  styleUrl: './check-mail-modal.component.scss'
})
export class CheckMailModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<CheckMailModalComponent>);
  introService = inject(IntroService);

  faX = faX;
  faPencil = faPencil;

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

  sendMail(){
    this.dialogRef.close('send-mail');
  }
 
}
