import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  IConnectedCompanyList,
  IMappingBankAccount
} from 'src/app/modules/integration/model/integration';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import { V4ZohoPayrollMapBankAccountModalComponent } from '../v4-zoho-payroll-map-bank-account-modal/v4-zoho-payroll-map-bank-account-modal.component';

@Component({
  selector: 'app-v4-zoho-payroll-bank-mapping-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-zoho-payroll-bank-mapping-modal.component.html',
  imports: [
    MatDialogModule,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4ZohoPayrollBankMappingModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly data: { companies: IConnectedCompanyList[] } =
    inject(MAT_DIALOG_DATA);

  readonly providerCode = 'zoho_payroll' as const;

  mappedBanks = signal<IMappingBankAccount[]>([]);
  loading = signal(false);
  importingBanks = signal(false);
  deleteBank = signal<Record<number, boolean>>({});

  ngOnInit(): void {
    this.getMappedBanks();
  }

  getMappedBanks(): void {
    this.loading.set(true);
    this.changeDetector.markForCheck();
    this.integrationService
      .getBankAccountMappingList(this.providerCode)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.mappedBanks.set(res.data || []);
          const deleteState: Record<number, boolean> = {};
          (res.data || []).forEach((_, i) => {
            deleteState[i] = false;
          });
          this.deleteBank.set(deleteState);
          this.changeDetector.markForCheck();
        }
      });
  }

  importBanks(): void {
    if (!this.data.companies?.length) {
      this.alertService.warningAlert({
        content: 'No companies available. Import a Zoho Payroll company first.'
      });
      return;
    }

    const dialogRef = this.dialog.open(V4CompanySelectModalComponent, {
      maxWidth: '510px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { mode: 'Bank', companyList: this.data.companies }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selected: IConnectedCompanyList | false) => {
        if (selected && selected.companyId) {
          this.importBankFromCompany(selected.companyId);
        }
      });
  }

  private importBankFromCompany(companyId: string): void {
    this.importingBanks.set(true);
    this.changeDetector.markForCheck();
    this.integrationService
      .importZohoPayrollAccount(this.providerCode, { companyId, type: 4 })
      .pipe(
        finalize(() => {
          this.importingBanks.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message || 'Bank accounts imported.',
            close: true
          });
          this.getMappedBanks();
        }
      });
  }

  openMapModal(bank: IMappingBankAccount, mode?: 'edit'): void {
    if (mode === 'edit' && !bank.isMapped) return;
    this.dialog
      .open(V4ZohoPayrollMapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { bank, mode }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.getMappedBanks();
      });
  }

  onDeleteRow(bank: IMappingBankAccount, index: number): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account mapping?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.deleteBank.update((s) => ({ ...s, [index]: true }));
      this.changeDetector.markForCheck();
      this.integrationService
        .deleteMappedBank(this.providerCode, bank.id)
        .pipe(
          finalize(() => {
            this.deleteBank.update((s) => ({ ...s, [index]: false }));
            this.changeDetector.markForCheck();
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Bank account mapping deleted.',
              close: true
            });
            this.getMappedBanks();
          }
        });
    });
  }
}
