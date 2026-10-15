import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';

/**
 * @description Represents check draft landing page component.
 */
@Component({
  selector: 'app-check-draft-landing-page',
  templateUrl: './check-draft-landing-page.component.html',
  styleUrls: ['./check-draft-landing-page.component.scss'],
  standalone: true,
  imports: [NgFor, RouterLink]
})
export class CheckDraftLandingPageComponent {
  whatWeProvideOptions = [
    "Get recurring payments, one-time payments, and open payments according to your clients' authorization",
    'Get Client’s Bank Info and Print Checks',
    'No Signature Required By Law',
    'Deposit to Your Bank just Like a Check',
    'Get authorization from your client over the phone, fax, or web link'
  ];
}
