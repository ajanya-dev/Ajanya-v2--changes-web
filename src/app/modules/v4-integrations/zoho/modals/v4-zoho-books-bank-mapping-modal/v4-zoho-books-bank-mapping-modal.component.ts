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
import { NgClass } from '@angular/common';
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
import { V4ZohoBooksMapBankAccountComponent } from '../v4-zoho-books-map-bank-account/v4-zoho-books-map-bank-account.component';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import {
  IConnectedCompanyList,
  IMappingBankAccount
} from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-zoho-books-bank-mapping-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    MatDialogModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ],
  templateUrl: './v4-zoho-books-bank-mapping-modal.component.html',
  styleUrl: './v4-zoho-books-bank-mapping-modal.component.scss'
})
export class V4ZohoBooksMapBankAccountsModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly data: { companies: IConnectedCompanyList[] } =
    inject(MAT_DIALOG_DATA);
  readonly providerCode = 'zoho_books' as const;

  mappedBanks = signal<IMappingBankAccount[]>([]);
  loading = signal(false);
  isImporting = signal(false);
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
        if (res.success) {
          this.mappedBanks.set(res.data);
          const deleteState: Record<number, boolean> = {};
          res.data.forEach((_, i) => (deleteState[i] = false));
          this.deleteBank.set(deleteState);
          this.changeDetector.markForCheck();
        }
      });
  }

  importBank(): void {
    this.dialog
      .open(V4CompanySelectModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { mode: 'Bank', companyList: this.data.companies }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: IConnectedCompanyList | false) => {
        if (!result) return;
        this.isImporting.set(true);
        this.changeDetector.markForCheck();
        this.integrationService
          .importZohoBankAccount(this.providerCode, {
            companyId: result.companyId,
            type: 2
          })
          .pipe(
            finalize(() => {
              this.isImporting.set(false);
              this.changeDetector.markForCheck();
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: res.message || 'Bank accounts imported successfully.',
                close: true
              });
              this.getMappedBanks();
            }
          });
      });
  }

  openBankAccountMappingModal(id: string, bank: IMappingBankAccount): void {
    this.dialog
      .open(V4ZohoBooksMapBankAccountComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { zohoBookId: id, zohoBookData: bank }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.getMappedBanks();
        }
      });
  }

  onEditRow(id: string, bank: IMappingBankAccount): void {
    this.dialog
      .open(V4ZohoBooksMapBankAccountComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { zohoBookId: id, zohoBookData: bank, mode: 'edit' }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.getMappedBanks();
        }
      });
  }

  onDeleteRow(bankId: string, index: number): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteBank.update((s) => ({ ...s, [index]: true }));
        this.changeDetector.markForCheck();
        this.integrationService
          .deleteMappedBank(this.providerCode, bankId)
          .pipe(
            finalize(() => {
              this.deleteBank.update((s) => ({ ...s, [index]: false }));
              this.changeDetector.markForCheck();
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.getMappedBanks();
              this.alertService.successAlert({
                content: 'Deleted Successfully'
              });
            }
          });
      }
    });
  }
}
