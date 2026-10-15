import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  IConnectedThirdPartyData,
  IGustoSelectedCompany
} from 'src/app/modules/integration/model/integration';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Component for viewing Gusto payroll information.
 */
@Component({
  selector: 'app-view-gusto-payroll',
  templateUrl: './view-gusto-payroll.component.html',
  styleUrls: ['./view-gusto-payroll.component.scss'],
  standalone: true,
  imports: [MatTooltip, NgIf, NgFor, NgClass]
})
export class ViewGustoPayrollComponent implements OnInit, OnDestroy {
  /**
   * Input property for the selected Gusto company.
   */
  @Input() selectedCompany: IGustoSelectedCompany;

  /**
   * Output EventEmitter for the back button press.
   */
  @Output() backButtonPressed = new EventEmitter();

  /**
   * Output EventEmitter for navigating to the payroll list.
   */
  @Output() gotoPayrollList = new EventEmitter();

  /**
   * Loading state object.
   */
  loading = {
    default: false,
    loading: false
  };

  /**
   * Array to store subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * Data object to store company details.
   */
  companyDetails: IConnectedThirdPartyData;

  /**
   * Provider code for Gusto integration.
   */
  providerCode = 'gusto';

  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService
  ) {}

  /**
   * Initializes the component and loads Gusto company details.
   */
  ngOnInit(): void {
    this.getGustoViewData();
  }

  /**
   * Loads Gusto company details for the selected company.
   */
  getGustoViewData(): void {
    this.loading.default = true;
    this.subscriptions.push(
      this._integrationService
        .viewCompanyData(this.selectedCompany.id)
        .pipe(finalize(() => (this.loading.default = false)))
        .subscribe((res) => {
          this.companyDetails = res.data;
        })
    );
  }

  /**
   * Imports the Gusto company.
   */
  importCompany(): void {
    this.loading.loading = true;
    this.subscriptions.push(
      this._integrationService
        .importGustoCompany(this.providerCode, this.selectedCompany.id)
        .pipe(finalize(() => (this.loading.loading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert(
              res.message && res.message != 'Successful'
                ? res.message
                : 'Imported Successfully'
            );
          }
        })
    );
  }

  /**
   * Handles the back button press event.
   */
  onGoBack(): void {
    this.backButtonPressed.emit({ clicked: true });
  }

  /**
   * Navigates to the payroll list for the selected company.
   */
  onGotoPayroll(): void {
    this.gotoPayrollList.emit(this.selectedCompany.id);
  }

  /**
   * Opens a success alert with the given content.
   * @param content - The content for the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
