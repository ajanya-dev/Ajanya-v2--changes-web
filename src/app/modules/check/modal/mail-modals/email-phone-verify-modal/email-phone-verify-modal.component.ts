import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-email-phone-verify-modal',
  templateUrl: './email-phone-verify-modal.component.html',
  styleUrls: ['./email-phone-verify-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose]
})
export class EmailPhoneVerifyModalComponent implements OnInit {
  errorMsg: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    public dialogRef: MatDialogRef<EmailPhoneVerifyModalComponent>
  ) {}

  ngOnInit(): void {
    this.errorMsg = this.data.data;
  }

  verify() {
    this.router.navigateByUrl('/manage/cheque/create');
    this.dialogRef.close();
  }
}
