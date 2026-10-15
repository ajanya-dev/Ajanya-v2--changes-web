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
  IbankAccountList
} from 'src/app/modules/integration/model/integration';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import { V4XeroMapBankAccountModalComponent } from '../v4-xero-map-bank-account-modal/v4-xero-map-bank-account-modal.component';

@Component({
  selector: 'app-v4-xero-bank-mapping-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-xero-bank-mapping-modal.component.html',
  styleUrls: ['./v4-xero-bank-mapping-modal.component.scss'],
  imports: [
    MatDialogModule,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4XeroBankMappingModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly data: { companies: IConnectedCompanyList[] } =
    inject(MAT_DIALOG_DATA);

  bankAccountList = signal<IbankAccountList[]>([]);
  loading = signal(false);
  importing = signal(false);
  deleting = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.getMappedData();
  }

  getMappedData(): void {
    this.loading.set(true);
    this.changeDetector.markForCheck();
    this.integrationService
      .getBankAccountMappingXero()
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.bankAccountList.set(res.data || []);
          this.changeDetector.markForCheck();
        }
      });
  }

  importBankAccounts(): void {
    if (!this.data.companies?.length) {
      this.alertService.warningAlert({
        content: 'Connect a Xero company before importing bank accounts.'
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
      .subscribe((res) => {
        if (res?.companyId) {
          this.importFromCompany(res.companyId);
        }
      });
  }

  private importFromCompany(companyId: string): void {
    this.importing.set(true);
    this.changeDetector.markForCheck();
    this.integrationService
      .getImportXeroCompanies({
        importTime: 1,
        companyId,
        importBill: 5
      })
      .pipe(
        finalize(() => {
          this.importing.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message,
            close: true
          });
          this.getMappedData();
        }
      });
  }

  openMapModal(bank: IbankAccountList, mode: 'edit' | '' = ''): void {
    if (mode === 'edit' && !bank.isMapped) return;
    this.dialog
      .open(V4XeroMapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { xeroId: bank.id, bank, mode }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.getMappedData();
      });
  }

  onDeleteRow(bank: IbankAccountList): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.deleting.update((s) => ({ ...s, [bank.id]: true }));
      this.changeDetector.markForCheck();
      this.integrationService
        .deleteXeroMappedBank(bank.id)
        .pipe(
          finalize(() => {
            this.deleting.update((s) => ({ ...s, [bank.id]: false }));
            this.changeDetector.markForCheck();
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Bank account deleted.',
              close: true
            });
            this.bankAccountList.update((list) =>
              list.filter((b) => b.id !== bank.id)
            );
            this.changeDetector.markForCheck();
          }
        });
    });
  }
}
