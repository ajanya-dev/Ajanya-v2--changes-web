import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-sign-agreement-modal',
  standalone: true,
  imports: [FaIconComponent, CommonButtonV35Component, MatDialogClose],
  templateUrl: './sign-agreement-modal.component.html',
  styleUrl: './sign-agreement-modal.component.scss'
})
export class SignAgreementModalComponent implements OnInit {

  private dialogRef = inject(MatDialogRef<SignAgreementModalComponent>);
  private data = inject(MAT_DIALOG_DATA);

  email = signal<string>('');
  username = signal<string>('');

  ngOnInit(): void {
    this.email.set(this.data.email);
    this.username.set(this.data.username);
  }

  onAgree(): void {
    this.dialogRef.close(true);
  }

}
