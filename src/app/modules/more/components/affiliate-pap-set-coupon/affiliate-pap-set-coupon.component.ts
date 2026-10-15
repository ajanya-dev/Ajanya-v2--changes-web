import { finalize } from 'rxjs/operators';
import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  inject,
  OnDestroy,
  Input
} from '@angular/core';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { Subscription } from 'rxjs';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NgClass } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

/**
 * Component for setting up affiliate coupons.
 */
@Component({
  selector: 'app-affiliate-pap-set-coupon',
  templateUrl: './affiliate-pap-set-coupon.component.html',
  styleUrls: ['./affiliate-pap-set-coupon.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgClass,
    CommonButtonV35Component
  ]
})
export class AffiliatePapSetCouponComponent implements OnInit, OnDestroy {

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  /**
   * Event emitter for the "next" action.
   */
  @Output() nextEvent = new EventEmitter();

  /**
   * Event emitter for the "back" action.
   */
  @Output() backEvent = new EventEmitter();

  /**
   * Input for the user mode ('new-user' or 'existing-user').
   */
  @Input() userMode: 'new-user' | 'existing-user';

  private _affilateServices = inject(AffiliateProgramsService);
  private _alertService = inject(AlertService);

  /**
   * Array to hold active subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * Array of available coupon discounts.
   */
  couponDiscounts: {
    id: number;
    code: string;
    value: string;
    affiliate_commission: string;
  }[] = [];

  /**
   * Currently selected coupon discount.
   */
  selectedDiscount: {
    id: number;
    code: string;
    value: string;
    affiliate_commission: string;
  };

  /**
   * Loading indicator for the component.
   */
  loading = false;

  /**
   * Loading indicator for coupon generation.
   */
  couponGenerationLoading = false;

  /**
   * Form group for coupon management.
   */
  couponForm: FormGroup;

  /**
   * Initializes the component and retrieves initial data.
   */
  ngOnInit(): void {
    this.getAvailableDiscounts();
    this.initForm();
  }

  /**
   * Initializes the coupon management form.
   */
  initForm() {
    this.couponForm = new FormGroup({
      couponCode: new FormControl('', [
        Validators.required,
        Validators.minLength(4)
      ])
    });
  }

  /**
   * Retrieves all available coupon discounts.
   */
  getAvailableDiscounts() {
    this.loading = true;
    this._affilateServices
      .getAvailableDiscounts()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.couponDiscounts = res.data;
            this.selectedDiscount = res.data[0];
          }
        }
      });
  }

  /**
   * Selects a coupon discount rate by index.
   *
   * @param index - Index of the selected discount.
   */
  selectDiscountRate(index: number) {
    this.selectedDiscount = this.couponDiscounts[index];
  }

  /**
   * Handles the "next" action, emitting the appropriate event.
   */
  onNext() {
    if (this.userMode === 'new-user') {
      this.nextEvent.emit({ registered: true });
    }
    this.nextEvent.emit();
  }

  /**
   * Handles the "back" action, emitting the appropriate event.
   */
  onBack() {
    if (this.userMode === 'new-user') {
      return;
    }
    this.backEvent.emit();
  }

  /**
   * Generates a coupon based on the provided code and discount.
   */
  generateCoupon() {
    this.couponForm.markAllAsTouched();
    if (this.couponForm.invalid) {
      return;
    }

    this.couponGenerationLoading = true;
    this.subscriptions.push(
      this._affilateServices
        .generateCoupon(
          this.couponForm.controls.couponCode.value,
          this.selectedDiscount.id
        )
        .pipe(finalize(() => (this.couponGenerationLoading = false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this._alertService.successAlert({ content: res.message });
              if (this.userMode === 'new-user') {
                this.nextEvent.emit({ registered: true });
              }
              this.nextEvent.emit();
            }
          }
        })
    );
  }

  /**
   * Unsubscribes from active subscriptions on component destruction.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
