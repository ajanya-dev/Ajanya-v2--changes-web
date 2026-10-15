import { faAngleLeft } from '@fortawesome/pro-solid-svg-icons';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { CurrencyPipe, DatePipe, NgClass, NgFor } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  IGustoPayment,
  IGustoSelectedCompany
} from '../../../model/integration';
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FontAwesomeModule,
    MatTooltipModule,
    NgFor,
    NgClass,
    DatePipe,
    CurrencyPipe
  ],
  selector: 'app-gusto-payment-view-details',
  templateUrl: './gusto-payment-view-details.component.html',
  styleUrls: ['./gusto-payment-view-details.component.scss']
})
export class GustoPaymentViewDetailsComponent implements OnInit {
  /**
   * Input property for the selected Gusto company.
   */
  @Input() selectedCompany: IGustoSelectedCompany;

  /**
   * Event emitter for the back button.
   */
  @Output() backButtonPressed = new EventEmitter<{
    clicked: boolean;
    type: string;
  }>();

  private integrationService = inject(IntegrationService);
  private cdr = inject(ChangeDetectorRef);

  faAngleLeft = faAngleLeft;
  isPaymentDetailsLoading = false;
  paymentDetails: IGustoPayment[] = [];
  subscriptions: Subscription[] = [];

  ngOnInit() {
    this.getPaymentDetails();
  }

  getPaymentDetails() {
    this.isPaymentDetailsLoading = true;
    this.subscriptions.push(
      this.integrationService
        .getGustoPaymentDetails(
          this.selectedCompany.id,
          this.selectedCompany.contractorId as string
        )
        .pipe(
          finalize(() => {
            this.isPaymentDetailsLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.paymentDetails = res.data?.contractor_payments[0]?.payments;
          }
        })
    );
  }

  /**
   * Emits a back button press event.
   */
  onGoBack(): void {
    this.backButtonPressed.emit({ clicked: true, type: 'payments-view' });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
