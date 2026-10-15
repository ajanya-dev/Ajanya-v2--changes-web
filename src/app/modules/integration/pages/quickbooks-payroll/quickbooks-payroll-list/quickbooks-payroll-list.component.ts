import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, TitleCasePipe } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faEye } from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { IQuickbooksPayrollRun } from '../model/quickbooks-payroll-run';
import { QuickbooksPayrollDetailsModalComponent } from '../quickbooks-payroll-details-modal/quickbooks-payroll-details-modal.component';

/**
 * Payroll list shown after clicking "Payroll Checks" on the QuickBooks Payroll
 * integration page.
 */
@Component({
  selector: 'app-quickbooks-payroll-list',
  templateUrl: './quickbooks-payroll-list.component.html',
  styleUrls: ['./quickbooks-payroll-list.component.scss'],
  standalone: true,
  imports: [MatTooltip, FaIconComponent, TitleCasePipe, NgClass]
})
export class QuickbooksPayrollListComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  faArrowLeft = faArrowLeft;
  faEye = faEye;

  /**
   * Company whose payrolls are listed.
   */
  @Input() companyName = '';

  /**
   * QuickBooks company id (realmId) the pay runs are imported for.
   */
  @Input() companyId = '';

  /**
   * Emitted when the back button is pressed.
   */
  @Output() backButtonPressed = new EventEmitter<void>();

  /**
   * Table headers for payroll information.
   */
  readonly tableHeaders: string[] = [
    'PAY PERIOD',
    'PROCESSED DATE',
    'CHECK DATE',
    'ACTION'
  ];

  /**
   * Pay runs listed in the table.
   */
  payrollDetails: IQuickbooksPayrollRun[] = [];

  /**
   * Whether the company has a bank account mapped. Creating checks requires
   * one, so the Create button stays disabled until this is true.
   */
  isBankMapped = false;

  /**
   * Pay run currently being created, so only its button shows as busy.
   */
  creatingPayrollId: string | null = null;

  /**
   * True while the pay runs are being fetched, so Fetch Payroll cannot be
   * fired twice.
   */
  fetching = false;

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
          (bank) => bank.companyId === this.companyId
        );
        this.isBankMapped = mapping?.isMapped === 1;
      });
  }

  /**
   * Fetches the last 30 days of pay runs for the company live from Intuit and
   * fills the table. Errors are surfaced with the message returned by the API.
   */
  getPayrolls(): void {
    this.fetching = true;
    this.integrationService
      .fetchQuickbooksPayrolls(this.companyId)
      .pipe(
        finalize(() => (this.fetching = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.payrollDetails = res.data ?? [];
        } else if (res?.errorMsg) {
          this.alertService.warningAlert({ content: res.errorMsg });
        }
      });
  }

  /**
   * Fetch Payroll button. Refreshes the table on demand.
   */
  onFetchPayroll(): void {
    this.getPayrolls();
  }

  /**
   * Creates one check per employee in the pay run, drawn on the bank account
   * mapped to the company. The company must have a mapped bank account first,
   * so the button stays disabled until `isBankMapped` is known to be true.
   * @param row Pay run to create the checks from.
   */
  onCreateCheck(row: IQuickbooksPayrollRun): void {
    if (!this.isBankMapped) {
      this.alertService.warningAlert({
        content: 'Please map bank account for company before import check !'
      });
      return;
    }
    this.creatingPayrollId = row.payrollId;
    this.integrationService
      .importQuickbooksPayrollTransactions(this.companyId, row.payrollId)
      .pipe(
        finalize(() => (this.creatingPayrollId = null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: this.createdChecksMessage(res.check ?? 0),
            close: true,
            timeout: 1200
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
    this.dialog.open(QuickbooksPayrollDetailsModalComponent, {
      maxWidth: '440px',
      width: '95%',
      autoFocus: false,
      data: payroll
    });
  }

  /**
   * Returns to the company list.
   */
  onGoBack(): void {
    this.backButtonPressed.emit();
  }
}
