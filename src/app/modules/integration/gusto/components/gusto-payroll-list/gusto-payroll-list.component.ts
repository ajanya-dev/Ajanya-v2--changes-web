import { HttpHeaders } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IGustoSelectedCompany } from 'src/app/modules/integration/model/integration';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgIf, NgFor, NgStyle, NgClass, DatePipe, TitleCasePipe } from '@angular/common';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-gusto-payroll-list',
  templateUrl: './gusto-payroll-list.component.html',
  styleUrls: ['./gusto-payroll-list.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    FaIconComponent,
    MatRadioGroup,
    FormsModule,
    ReactiveFormsModule,
    MatRadioButton,
    NgIf,
    NgFor,
    NgStyle,
    NgClass,
    DatePipe,
    TitleCasePipe
  ]
})
export class GustoPayrollListComponent implements OnInit, OnDestroy {
  /**
   * Table headers for payroll information.
   */
  tableHeaders = [
    'PAY PERIOD',
    'PROCESSED DATE',
    'CHECK DATE',
    'ACTION'
  ];

  /**
   * Array to store table row data.
   */
  tableRow = [];

  /**
   * Input property for the selected Gusto company.
   */
  @Input() selectedCompany: IGustoSelectedCompany;

  @Input() OffCycleList: boolean = false;

  /**
   * Input property for all Gusto companies.
   */
  @Input() allCompanies: string[] = [];

  /**
   * Event emitter for the back button.
   */
  @Output() backButtonPressed = new EventEmitter();

  /**
   * Event emitter for navigating to payroll details.
   */
  @Output() gotoPayrollDetails = new EventEmitter();

  /**
   *  Form control for selecting the import type.
   */
  importType = new UntypedFormControl('all');

  /**
   * Loading indicators for various actions.
   */
  loading = {
    default: false,
    disabling: false,
    creating: undefined as undefined | number
  };

  /**
   * Array to hold active subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * Provider code for Gusto.
   */
  providerCode = 'gusto';

  /**
   *  Data for payroll details.
   */
  payrollDetails: unknown;

  /**
   * Data for imported payrolls.
   */
  importedPayrolls: unknown;

  constructor(
    private _integrationService: IntegrationService,
    private alertService: AlertService,
    private route: Router
  ) {}

  /**
   * Initializes the Gusto Payroll List component.
   */
  ngOnInit(): void {
    this.getImportedPayrolls();
    if(this.OffCycleList){
      this.getPayroll(true);
    } else {
      this.getPayroll();
    }
  }

  /**
   * Fetches Gusto payroll data for the selected company.
   */
  getPayroll(offCycleOnly?: boolean ): void {
    this.loading.default = true;
    this.loading.disabling = true;
    this.subscriptions.push(
      this._integrationService
        .getPayroll(this.providerCode, this.selectedCompany.id, offCycleOnly)
        .pipe(
          finalize(() => {
            this.loading.default = false;
            this.loading.disabling = false;
          })
        )
        .subscribe((res) => {
          this.payrollDetails = res.data;
        })
    );
  }

  /**
   * Fetches imported Gusto payrolls.
   */
  getImportedPayrolls(): void {
    this.loading.disabling = true;

    this.subscriptions.push(
      this._integrationService
        .getImportedPayrolls()
        .pipe(
          finalize(() => {
            this.loading.disabling = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.importedPayrolls = res.data;
          }
        })
    );
  }

  /**
   * Imports Gusto payroll transactions.
   * @param payrollId - The ID of the payroll to import.
   * @param i - The index of the payroll in the list.
   */
  importPayrollTransactions(payrollId: string, i: number): void {
    this.loading.disabling = true;
    this.loading.creating = i;
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this._integrationService
        .importGustoPayrollTransactions(
          this.selectedCompany.id,
          payrollId,
          this.importType.value,
          headerOptions
        )
        .pipe(
          finalize(() => {
            this.loading.creating = undefined;
            this.loading.disabling = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: `Checks has been imported from Gusto.`
              });
              this.getImportedPayrolls();
            }
          },
          error: (err) => {
            if (
              err.error.errorMsg ===
              'Please map bank account for company before import check !'
            ) {
              const alertConetnt = {
                content:
                  'Please map your bank account with the company imported from Gusto to import the checks.',
                doneMsg: 'Map Now',
                cancelMsg: 'Cancel',
                isCancel: true
              };
              const alert = this.alertService.infoAlert(alertConetnt);
              alert.afterClosed().subscribe((res) => {
                if (res) {
                  this.route.navigateByUrl(
                    'manage/thirdparty_app/gusto/mapping'
                  );
                }
              });
            }
          }
        })
    );
  }

  /**
   * Navigates to the payroll details page for a specific payroll.
   * @param payrollId - The ID of the payroll to view details.
   */
  viewPayrollDetails(payrollId: string): void {
    this.gotoPayrollDetails.emit({
      payrollId: payrollId,
      selectedCompanyId: this.selectedCompany.id,
      isOffCycle: this.OffCycleList
    });
  }

  /**
   * Emits a back button press event.
   */
  onGoBack(): void {
    this.backButtonPressed.emit({ clicked: true });
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
