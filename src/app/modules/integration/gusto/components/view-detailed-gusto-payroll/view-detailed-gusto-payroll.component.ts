import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IGustoSelectedCompany } from 'src/app/modules/integration/model/integration';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';

/**
 * Component for viewing detailed Gusto payroll information.
 */
@Component({
  selector: 'app-view-detailed-gusto-payroll',
  templateUrl: './view-detailed-gusto-payroll.component.html',
  styleUrls: ['./view-detailed-gusto-payroll.component.scss'],
  standalone: true,
  imports: [MatTooltip, NgIf, NgFor, NgClass]
})
export class ViewDetailedGustoPayrollComponent implements OnInit, OnDestroy {

  private integrationService = inject(IntegrationService);
  private headerService = inject(HeaderService);
  /**
   * Input property for the selected Gusto company.
   */
  @Input() selectedCompany: IGustoSelectedCompany;

  /**
   * Input property for the selected Gusto payroll ID.
   */
  @Input() selectedPayrollId: string;

  /**
   * Input property for the selected Gusto payroll ID.
   */
  @Input() isOffCycle: boolean;

  /**
   * Input property for all Gusto companies.
   */
  @Input() allCompanies: string[] = [];

  /**
   * Output EventEmitter for the back button press.
   */
  @Output() backButtonPressed = new EventEmitter();

  /**
   * Array defining table headers.
   */
  tableHeaders = ['PAY ID', 'NAME', 'EMAIL ID', 'NET PAY', 'PAYMENT METHOD'];

  /**
   * Provider code for Gusto integration.
   */
  providerCode = 'gusto';

  /**
   * Array to store subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * Data object to store imported payrolls.
   */
  importedPayrolls: unknown;

  /**
   * Data object to store company details.
   */
  companyDetails: unknown;

  /**
   * Loading state object.
   */
  loading = {
    default: false
  };

  gustoReimbursements = false;


  /**
   * Initializes the component and loads Gusto payroll details.
   */
  ngOnInit(): void {
    this.loadPayrollDetails();
    this.checkPlugin();
  }

  checkPlugin(){
    this.subscriptions.push(
      this.headerService.headerData().subscribe((res) => {
        if(res){
          const userPlugins = (res.data as IHeaderData).enabledPlugins;
          if(!userPlugins.length) return;
          this.gustoReimbursements = userPlugins.includes('gusto-reimbursements');
        }
      })
    );
  }

  /**
   * Loads Gusto payroll details for the selected company and payroll ID.
   */
  loadPayrollDetails(): void {
    this.loading.default = true;
    this.subscriptions.push(
      this.integrationService
        .viewGustoPayroll(
          this.providerCode,
          this.selectedCompany.id,
          this.selectedPayrollId
        )
        .pipe(finalize(() => (this.loading.default = false)))
        .subscribe((res) => {
          if (res.success) {
            this.companyDetails = res.data;
          }
        })
    );
  }

  /**
   * Handles the back button press event.
   * @param type - The type of back button action.
   */
  onGoBack(type: string): void {
    if(this.isOffCycle) {
      const type = 'off-cycle-payroll-view'
      this.backButtonPressed.emit({ clicked: true, type: type });
    } else {
      this.backButtonPressed.emit({ clicked: true, type: type });
    }
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
