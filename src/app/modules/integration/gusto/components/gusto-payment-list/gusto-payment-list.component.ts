import { faAngleLeft } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, NgClass, NgFor } from '@angular/common';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  IGustoContractPayments,
  IGustoSelectedCompany
} from '../../../model/integration';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, MatTooltipModule, NgFor, NgClass, CurrencyPipe],
  selector: 'app-gusto-payment-list',
  templateUrl: './gusto-payment-list.component.html',
  styleUrls: ['./gusto-payment-list.component.scss']
})
export class GustoPaymentListComponent implements OnInit {
  /**
   * Input property for the selected Gusto company.
   */
  @Input() selectedCompany: IGustoSelectedCompany;

  /**
   * Event emitter for the back button.
   */
  @Output() backButtonPressed = new EventEmitter<{ clicked: boolean }>();

  /**
   * Event emitter for navigating to payroll details.
   */
  @Output() gotoPaymentDetails = new EventEmitter<{
    contractorId: string;
    selectedCompanyId: string;
  }>();

  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  faAngleLeft = faAngleLeft;
  subscriptions: Subscription[] = [];
  isPaymentsLoading: boolean = false;
  isCheckCreating: boolean = false;
  paymentsList: IGustoContractPayments[];
  selectedContractorId: string;

  ngOnInit() {
    this.getPayments();
  }

  getPayments() {
    if (this.selectedCompany?.id) {
      this.isPaymentsLoading = true;
      this.subscriptions.push(
        this.integrationService
          .getPaymentsForGusto(this.selectedCompany?.id)
          .pipe(
            finalize(() => {
              this.isPaymentsLoading = false;
              this.cdr.detectChanges();
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.paymentsList = res.data.contractor_payments;
                this.cdr.detectChanges();
              }
            }
          })
      );
    }
  }

  createCheck(contractorId: string) {
    if (this.selectedCompany?.id) {
      this.isCheckCreating = true;
      this.selectedContractorId = contractorId;
      this.subscriptions.push(
        this.integrationService
          .importGustoContractorPayment({
            companyId: this.selectedCompany?.id,
            contractorId
          })
          .pipe(
            finalize(() => {
              this.isCheckCreating = false;
              this.cdr.detectChanges();
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alertService.successAlert({
                  content: 'Created Successfully'
                });
                this.cdr.detectChanges();
              }
            }
          })
      );
    }
  }

  /**
   * Emits a back button press event.
   */
  onGoBack(): void {
    this.backButtonPressed.emit({ clicked: true });
  }

  /**
   * Navigates to the payroll details page for a specific payroll.
   * @param contractorId - The ID of the payroll to view details.
   */
  viewPaymentDetails(contractorId: string): void {
    this.gotoPaymentDetails.emit({
      contractorId,
      selectedCompanyId: this.selectedCompany.id
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
