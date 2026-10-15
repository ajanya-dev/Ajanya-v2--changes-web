import { Router } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntroService } from '../../service/intro.service';

@Component({
  selector: 'app-intro-payment-success',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './intro-payment-success.component.html',
  styleUrl: './intro-payment-success.component.scss'
})
export class IntroPaymentSuccessComponent {
  @Output() closePaymentSuccess = new EventEmitter();

  isRequest = input<boolean>(false);
  isSaved = input<boolean>(false);

  private router = inject(Router);
  introService = inject(IntroService);

  newPayment() {
    if (this.introService.currentIntroStep.isLastStep) {
      return;
    }
    this.closePaymentSuccess.emit();
  }

  introStepUpdate(selector: string) {
    this.introService.introStepChange.next(selector);
  }

  viewPayment() {
    if (this.introService.currentIntroStep.isLastStep) {
      return;
    }
    this.router.navigate(['intro-tour/manage/payment-table'], {
      queryParams: { viewPayment: true }
    });
    this.introStepUpdate('.intro-payment-table-rows');
  }
}
