import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  input,
  output
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCreditCard, faMoneyCheck } from '@fortawesome/pro-solid-svg-icons';
import { faCcVisa, faStripeS } from '@fortawesome/free-brands-svg-icons';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { PaymentsDetailsInput } from '../../models/payment-links.model';
import { NgOptimizedImage } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-payment-links-preview-payments',
  standalone: true,
  imports: [
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  templateUrl: './payment-links-preview-payments.component.html',
  styleUrl: './payment-links-preview-payments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentLinksPreviewPaymentsComponent implements OnInit, OnDestroy {
  config = input.required<PaymentsDetailsInput>();

  updateAmount = output<number>();

  form = new FormGroup({
    amount: new FormControl<number | null>({ value: null, disabled: true }),
    email: new FormControl({ value: '', disabled: true }),
    companyName: new FormControl({ value: '', disabled: true })
  });

  isShowPaybyCHeckOptions = false;
  faMoneyCheck = faMoneyCheck;
  faCreditCard = faCreditCard;
  faCcVisa = faCcVisa;
  faStripeS = faStripeS;

  destroy$ = new Subject<boolean>();

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form.controls.amount.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.updateAmount.emit(val || 0);
      });
  }

  changePayByCheckVisibility() {
    this.isShowPaybyCHeckOptions = !this.isShowPaybyCHeckOptions;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
