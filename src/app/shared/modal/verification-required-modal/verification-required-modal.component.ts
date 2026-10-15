import { Component, inject, ViewEncapsulation } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Lock,
  ShieldCheck,
  Check,
  ArrowRight,
  X
} from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface IVerificationRequiredData {
  description: string;
}

@Component({
  selector: 'app-verification-required-modal',
  templateUrl: './verification-required-modal.component.html',
  styleUrls: ['./verification-required-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class VerificationRequiredModalComponent {
  readonly LockIcon = Lock;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly CheckIcon = Check;
  readonly ArrowRightIcon = ArrowRight;
  readonly XIcon = X;

  private dialogRef = inject(MatDialogRef<VerificationRequiredModalComponent>);
  private router = inject(Router);
  public injectedData: IVerificationRequiredData = inject(MAT_DIALOG_DATA);

  benefits = [
    'Customizable check printing',
    'Send checks via email instantly',
    'Mail your check via USPS/FedEx',
  ];

  startVerification() {
    this.dialogRef.close(true);
    this.router.navigate(['/v4/manage/verification/index'],{
      queryParams : {
        openVerificationModal : true
      }
    });
  }
}
