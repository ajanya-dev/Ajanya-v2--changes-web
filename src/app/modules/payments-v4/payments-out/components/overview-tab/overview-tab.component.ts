import {
  Component,
  DestroyRef,
  HostBinding,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  DollarSign,
  Activity,
  CheckCircle2
} from 'lucide-angular';
import { DecimalPipe } from '@angular/common';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { IPaymentOutQuickCards } from 'src/app/modules/payments-v4/shared/models/payments-v4.models';

@Component({
  selector: 'app-overview-tab',
  standalone: true,
  imports: [LucideAngularModule, DecimalPipe],
  templateUrl: './overview-tab.component.html',
  styleUrl: './overview-tab.component.scss'
})
export class OverviewTabComponent implements OnInit {
  @HostBinding('class') class = 'block';

  private paymentsV4Service = inject(PaymentsV4Service);
  private destroyRef = inject(DestroyRef);

  readonly DollarSignIcon = DollarSign;
  readonly ActivityIcon = Activity;
  readonly CheckCircle2Icon = CheckCircle2;

  isLoading = signal(true);
  total = signal<IPaymentOutQuickCards['total']>({ amount: 0, count: 0 });
  processing = signal<IPaymentOutQuickCards['processing']>({
    amount: 0,
    count: '0'
  });

  completedToday = signal<IPaymentOutQuickCards['completed_today']>({
    amount: 0,
    count: '0'
  });

  ngOnInit(): void {
    this.paymentsV4Service
      .getPaymentOutQuickCards()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data) {
            this.total.set(res.data.total);
            this.processing.set(res.data.processing);
            this.completedToday.set(res.data.completed_today);
          }
        },
        error: () => this.isLoading.set(false),
        complete: () => this.isLoading.set(false)
      });
  }
}
