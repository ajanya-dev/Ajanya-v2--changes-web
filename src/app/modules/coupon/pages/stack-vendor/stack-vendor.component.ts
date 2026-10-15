import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IApiResMesssage } from 'src/app/models/api';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CouponService } from 'src/app/shared/service/coupon/coupon.service';
import { NgClass, NgFor } from '@angular/common';

@Component({
  selector: 'app-stack-vendor',
  templateUrl: './stack-vendor.component.html',
  styleUrls: ['./stack-vendor.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgClass, NgFor]
})
export class StackVendorComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  codeForm: UntypedFormGroup;
  couponDataDetails: any;
  loading = false;

  constructor(
    private _couponService: CouponService,
    private _alert: AlertService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.init();
    this.usedCouponCodes();
  }

  /**
   * @description Initializes the codeForm by creating a FormGroup with a couponCode FormControl.
   */
  init() {
    this.codeForm = this.fb.group({
      couponCode: ['', [Validators.required]]
    });
  }

  /**
   * @description Retrieves and updates the details of used coupon codes by subscribing to the usedCouponCodes observable.
   */
  usedCouponCodes(): void {
    this.subscriptions.push(
      this._couponService.usedCouponCodes().subscribe((res) => {
        if (res.success == true) {
          this.couponDataDetails = res.data;
        }
      })
    );
  }

  /**
   * @description Handles the form submission for entering a coupon code.
   */
  onSubmit() {
    if (this.codeForm.controls.couponCode.value == '') {
      return;
    }
    this.loading = true;

    const data = this.codeForm.value;
    const couponCodeData = {
      code: data.couponCode
    };

    this.subscriptions.push(
      this._couponService
        .enterCouponCode(couponCodeData)
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IApiResMesssage;
          if (response.success == true) {
            const data = {
              title: 'Failed',
              content:
                'This coupon code has already been redeemed. Please talk to our customer support for further instruction',
              doneMsg: 'OK',
              cancelMsg: 'cancel',
              close: true,
              timeout: 2000
            };
            this._alert.failedAlert(data);
          } else {
            this.loading = false;
          }
        })
    );
  }

  /**
   * @description Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
