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
  MatDialogModule,
  MatDialogRef
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
import { V4SageBusinessMapBankAccountModalComponent } from '../v4-sage-business-map-bank-account-modal/v4-sage-business-map-bank-account-modal.component';

@Component({
  selector: 'app-v4-sage-business-bank-mapping-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './v4-sage-business-bank-mapping-modal.component.html',
  styleUrls: ['./v4-sage-business-bank-mapping-modal.component.scss'],
  imports: [
    MatDialogModule,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4SageBusinessBankMappingModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(
    MatDialogRef<V4SageBusinessBankMappingModalComponent>
  );

  readonly providerCode = 'sage_business' as const;

  readonly data: { companies: IConnectedCompanyList[] } =
    inject(MAT_DIALOG_DATA);

  bankAccountList = signal<IMappingBankAccount[]>([]);
  loading = signal(false);
  importing = signal(false);
  deleting = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.getMappedData();
  }

  close(): void {
    this.dialogRef.close(false);
  }

  getMappedData(): void {
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
        if (res.success) {
          this.bankAccountList.set(res.data || []);
          this.changeDetector.markForCheck();
        }
      });
  }

  importBankAccounts(): void {
    if (!this.data.companies?.length) {
      this.alertService.warningAlert({
        content: 'Connect a Sage Business company before importing bank accounts.'
      });
      return;
    }

    if (this.data.companies.length === 1) {
      this.importFromCompany(this.data.companies[0].companyId);
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
      .getImportBankAccounts(
        { companyId, importType: 4 },
        this.providerCode
      )
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

  openMapModal(bank: IMappingBankAccount, mode: 'edit' | '' = ''): void {
    if (mode === 'edit' && !bank.isMapped) return;
    this.dialog
      .open(V4SageBusinessMapBankAccountModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { sageId: bank.id, bank, mode }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.getMappedData();
      });
  }

  onDeleteRow(bank: IMappingBankAccount): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.deleting.update((s) => ({ ...s, [bank.id]: true }));
      this.changeDetector.markForCheck();
      this.integrationService
        .deleteMappedBank(this.providerCode, bank.id)
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
