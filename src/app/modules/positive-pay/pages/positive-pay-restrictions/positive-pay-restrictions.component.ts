import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-positive-pay-restrictions',
  templateUrl: './positive-pay-restrictions.component.html',
  styleUrls: ['./positive-pay-restrictions.component.scss'],
  standalone: true,
  imports: [CommonButtonV35Component, NgOptimizedImage]
})
export class PositivePayRestrictionsComponent {
  private router = inject(Router);

  requestNow() {
    this.router.navigateByUrl('/manage/positivepay/index');
  }
}
