import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IQuickbooksPayrollBankMapping } from 'src/app/modules/integration/model/integration';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4QuickbooksPayrollMapBankModalComponent } from '../v4-quickbooks-payroll-map-bank-modal/v4-quickbooks-payroll-map-bank-modal.component';

/**
 * Bank account mapping table for the QuickBooks Payroll integration.
 */
@Component({
  selector: 'app-v4-quickbooks-payroll-bank-mapping-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-quickbooks-payroll-bank-mapping-modal.component.html',
  imports: [
    MatDialogModule,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4QuickbooksPayrollBankMappingModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  mappedBanks = signal<IQuickbooksPayrollBankMapping[]>([]);
  loading = signal(false);
  deleting = signal<string | null>(null);

  ngOnInit(): void {
    this.getBankMappings();
  }

  /**
   * Loads the company / bank account mappings.
   */
  getBankMappings(): void {
    this.loading.set(true);
    this.integrationService
      .getQuickbooksPayrollBankMappings()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.mappedBanks.set(res?.data ?? []);
      });
  }

  /**
   * Opens the map / update modal and reloads the table once a mapping is saved.
   * @param bank Mapping row the bank account belongs to.
   * @param mode 'edit' when opened from the edit icon.
   */
  openMapModal(bank: IQuickbooksPayrollBankMapping, mode?: 'edit'): void {
    if (mode === 'edit' && !bank.isMapped) return;
    this.dialog
      .open(V4QuickbooksPayrollMapBankModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { bank, mode }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.getBankMappings();
      });
  }

  /**
   * Removes a mapping after confirmation and reloads the table.
   * @param bank Mapping row to remove.
   */
  onDeleteRow(bank: IQuickbooksPayrollBankMapping): void {
    this.alertService
      .confirmAlert({
        content: `Are you sure you want to remove the mapping of ${bank.companyName}?`,
        doneMsg: 'Yes',
        cancelMsg: 'No'
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deleting.set(bank.id);
        this.integrationService
          .deleteQuickbooksPayrollBankMapping(bank.id)
          .pipe(
            finalize(() => this.deleting.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res?.success) {
              this.alertService.successAlert({
                content: res.message ?? '',
                close: true
              });
              this.getBankMappings();
            } else if (res?.errorMsg) {
              this.alertService.warningAlert({ content: res.errorMsg });
            }
          });
      });
  }
}
