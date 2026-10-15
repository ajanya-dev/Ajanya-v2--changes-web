import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PaymentsOutHeaderComponent } from './components/payments-out-header/payments-out-header.component';

@Component({
  selector: 'app-payments-out',
  standalone: true,
  imports: [RouterModule, PaymentsOutHeaderComponent],
  templateUrl: './payments-out.component.html',
  styleUrl: './payments-out.component.scss'
})
export class PaymentsOutComponent {
  private router = inject(Router);

  onNewPayment(): void {
    this.router.navigate(['/v4/manage/payments/pay']);
  }
}
