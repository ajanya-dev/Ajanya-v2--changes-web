import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-positive-pay-restrictions',
  templateUrl: './v4-positive-pay-restrictions.component.html',
  styleUrl: './v4-positive-pay-restrictions.component.scss',
  standalone: true,
  imports: [CommonButtonV4Component, LucideAngularModule]
})
export class V4PositivePayRestrictionsComponent {
  private router = inject(Router);

  readonly features = [
    {
      icon: 'shield-check',
      title: 'Fraud Prevention',
      description:
        'Automatically notify your bank about checks and ACH payments you issue to prevent unauthorized transactions.'
    },
    {
      icon: 'file-check',
      title: 'Auto Verification',
      description:
        'Bank compares payment details with your records. Mismatches are flagged and blocked automatically.'
    },
    {
      icon: 'clock',
      title: 'Daily Sync',
      description:
        'Once configured, files are sent to your bank daily, ensuring only legitimate checks get cashed.'
    },
    {
      icon: 'download',
      title: 'Download Records',
      description:
        'Access and download check records anytime for proof of approved payments and audit trails.'
    }
  ];

  readonly steps = [
    "Click 'Proceed to Setup' to access the Positive Pay dashboard",
    'Select your bank account and configure Positive Pay settings',
    'Once configured, check files are automatically sent to your bank daily',
    'Download check records anytime for proof of approved payments'
  ];

  requestNow(): void {
    this.router.navigateByUrl('/v4/manage/positivepay/index');
  }

  goBackToBankAccounts(): void {
    this.router.navigateByUrl('/v4/manage/bank-accounts/index');
  }
}
