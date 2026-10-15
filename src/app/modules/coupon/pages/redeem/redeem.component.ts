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
import { CouponService } from 'src/app/shared/service/coupon/coupon.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-redeem',
  templateUrl: './redeem.component.html',
  styleUrls: ['./redeem.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgClass]
})
export class RedeemComponent implements OnInit, OnDestroy {
  redeemForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  loading = false;
  constructor(
    private _couponService: CouponService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.init();
  }

  /**
   * @description Initializes the redeemForm by creating a FormGroup with a redeemCouponCode FormControl.
   */
  init() {
    this.redeemForm = this.fb.group({
      redeemCouponCode: ['', [Validators.required]]
    });
  }

  /**
   * @description  Handles the form submission for redeeming a coupon code.
   */
  onSubmit() {
    if (this.redeemForm.invalid) {
      return;
    }
    this.loading = true;

    const data = this.redeemForm.value;
    const couponCodedata = {
      code: data.redeemCouponCode
    };
    this.subscriptions.push(
      this._couponService
        .redeemCouponCodeApi(couponCodedata)
        .pipe(
          catchError(() => {
            return of(false);
          })
        )

        .subscribe((res) => {
          const response = res as IApiResMesssage;
          if (response.success == true) {
            // let data = {
            //   title: "Failed",
            //   content: "This coupon code has already been redeemed. Please talk to our customer support for further instruction",
            //   doneMsg: "ok",
            //   cancelMsg: "cancel",
            //   close: true,
            //   timeout: 2000
            // }
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
