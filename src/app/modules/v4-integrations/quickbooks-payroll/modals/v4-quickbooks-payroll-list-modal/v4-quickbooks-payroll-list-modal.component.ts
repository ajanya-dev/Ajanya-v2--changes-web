import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IQuickbooksPayrollCompany } from 'src/app/modules/integration/model/integration';
import { IQuickbooksPayrollRun } from 'src/app/modules/integration/pages/quickbooks-payroll/model/quickbooks-payroll-run';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4QuickbooksPayrollDetailsModalComponent } from '../v4-quickbooks-payroll-details-modal/v4-quickbooks-payroll-details-modal.component';

/**
 * Pay period list for a QuickBooks Payroll company. Same flow as the V3 page:
 * the fetch-payrolls endpoint fills the table, Create imports one check per
 * employee of the pay run, and the view icon opens the pay run details.
 */
@Component({
  selector: 'app-v4-quickbooks-payroll-list-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-quickbooks-payroll-list-modal.component.html',
  imports: [
    CommonModule,
    MatDialogModule,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4QuickbooksPayrollListModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  readonly data: { company: IQuickbooksPayrollCompany } =
    inject(MAT_DIALOG_DATA);

  loading = signal(false);
  fetching = signal(false);
  creating = signal<string | null>(null);
  payrolls = signal<IQuickbooksPayrollRun[]>([]);

  /**
   * Whether the company has a bank account mapped. Creating checks requires
   * one, so the Create button stays disabled until this is true.
   */
  isBankMapped = signal(false);

  ngOnInit(): void {
    this.getPayrolls();
    this.getBankMappingState();
  }

  /**
   * Reads the bank account mapping of the company from the mapping list, which
   * is the precondition for creating checks.
   */
  private getBankMappingState(): void {
    this.integrationService
      .getQuickbooksPayrollBankMappings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const mapping = (res?.data ?? []).find(
          (bank) => bank.companyId === this.data.company.companyId
        );
        this.isBankMapped.set(mapping?.isMapped === 1);
      });
  }

  /**
   * Fetches the last 30 days of pay runs for the company live from Intuit and
   * fills the table.
   * @param loader -Signal driving the spinner: the table on load, the Fetch
   * Payroll button on demand.
   */
  getPayrolls(loader = this.loading): void {
    loader.set(true);
    this.integrationService
      .fetchQuickbooksPayrolls(this.data.company.companyId)
      .pipe(
        finalize(() => loader.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.payrolls.set(res.data ?? []);
        } else if (res?.errorMsg) {
          this.alertService.warningAlert({ content: res.errorMsg });
        }
      });
  }

  /**
   * Fetch Payroll button. Refreshes the table on demand.
   */
  onFetchPayroll(): void {
    this.getPayrolls(this.fetching);
  }

  /**
   * Creates one check per employee in the pay run, drawn on the bank account
   * mapped to the company. The company must have a mapped bank account first,
   * so the button stays disabled until `isBankMapped` is known to be true.
   * @param row Pay run to create the checks from.
   */
  onCreateCheck(row: IQuickbooksPayrollRun): void {
    if (!this.isBankMapped()) {
      this.alertService.warningAlert({
        content: 'Please map bank account for company before import check !'
      });
      return;
    }
    this.creating.set(row.payrollId);
    this.integrationService
      .importQuickbooksPayrollTransactions(
        this.data.company.companyId,
        row.payrollId
      )
      .pipe(
        finalize(() => this.creating.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: this.createdChecksMessage(res.check ?? 0),
            close: true
          });
          this.getPayrolls();
        } else if (res?.errorMsg) {
          this.alertService.warningAlert({ content: res.errorMsg });
        }
      });
  }

  /**
   * Builds the alert text for a create. Duplicate protection skips employees
   * that already have a check, so a re-run legitimately creates none.
   * @param check Number of newly created checks.
   */
  private createdChecksMessage(check: number): string {
    if (!check) {
      return 'No new checks were created. Checks already exist for this pay run.';
    }
    return `${check} check${check > 1 ? 's' : ''} created successfully.`;
  }

  /**
   * Opens the details modal for a pay run.
   * @param payroll Pay run to show.
   */
  onViewDetails(payroll: IQuickbooksPayrollRun): void {
    this.dialog.open(V4QuickbooksPayrollDetailsModalComponent, {
      maxWidth: '560px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { payroll }
    });
  }
}
