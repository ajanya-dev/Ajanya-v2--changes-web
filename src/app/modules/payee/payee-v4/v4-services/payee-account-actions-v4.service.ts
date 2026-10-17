import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { AddPayeeInternationalBankV4Component } from '../v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import { PayeeAccountKind, PayeeAccountRow } from '../v4-components/payee-details-v4/payee-accounts.util';
import { PayeeDetailsV4Service } from './payee-details-v4.service';
import { PayeeDataV35Service } from '../../payee-v3/v35-services/payee-data-v35.service';

/**
 * Add / edit / delete / make-default for a payee's bank accounts, domestic
 * and international alike. Shared by the details card and the "View all"
 * modal so both act on a `PayeeAccountRow` the same way.
 */
@Injectable({ providedIn: 'root' })
export class PayeeAccountActionsV4Service {
  private payeeDataService = inject(PayeeDataV35Service);
  private detailsService = inject(PayeeDetailsV4Service);
  private bankModalService = inject(BankModalService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  private get payeeId(): string {
    return this.payeeDataService.payeeDataSignal()?.encryptedId || '';
  }

  add(kind: PayeeAccountKind): void {
    if (kind === 'international') {
      this.openInternationalModal();
    } else {
      this.openDomesticModal();
    }
  }

  edit(row: PayeeAccountRow): void {
    if (row.kind === 'international') {
      this.openInternationalModal(row.id);
    } else {
      this.openDomesticModal(row.id);
    }
  }

  delete(row: PayeeAccountRow): void {
    const { payeeId } = this;
    if (!payeeId || !row.id) return;
    const content =
      row.kind === 'international'
        ? 'Are you sure you want to delete this international bank account?'
        : 'Are you sure you want to delete this bank account?';
    this.alertService
      .confirmAlert({ content })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        if (row.kind === 'international') {
          this.detailsService.deleteInternationalBank(row.id, payeeId);
        } else {
          this.detailsService.deleteDomesticBank(payeeId, row.id);
        }
      });
  }

  makeDefault(row: PayeeAccountRow): void {
    const { payeeId } = this;
    if (!payeeId || !row.id) return;
    if (row.kind === 'international') {
      this.detailsService.setDefaultInternationalBank(
        row.id,
        payeeId,
        row.international?.account_type ?? ''
      );
    } else {
      this.detailsService.setDefaultDomesticBank(payeeId, row.id);
    }
  }

  private openDomesticModal(bankId?: string): void {
    if (this.bankModalService.isBankPermissionChecking()) return;
    const { payeeId } = this;
    if (!payeeId) return;
    const payeeName = this.payeeDataService.payeeDataSignal()?.name || '';
    this.bankModalService
      .openAddBankNormalModalV4({
        payeeId,
        payeeName,
        ...(bankId ? { edit: true, bankId } : {})
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bankModal) => {
        if (!bankModal) return;
        bankModal
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((result) => {
            if (result?.success) {
              if (!bankId) {
                this.alertService.successAlert({
                  close: true,
                  timeout: 2000,
                  title: 'Success!',
                  content: 'Bank account added successfully.'
                });
              }
              this.detailsService.loadBankAccounts(payeeId);
            }
          });
      });
  }

  private openInternationalModal(bankId?: string): void {
    if (this.bankModalService.isBankPermissionChecking()) return;
    const { payeeId } = this;
    if (!payeeId) return;
    const dialogRef = this.dialog.open(AddPayeeInternationalBankV4Component, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        payeeId,
        accordionMode: true,
        payeePhone: this.payeeDataService.payeeDataSignal()?.phone || '',
        ...(bankId ? { edit: true, bankId } : {})
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.detailsService.loadBankAccounts(payeeId);
        const currentData = this.payeeDataService.payeeDataSignal();
        if (result?.phone && currentData) {
          this.payeeDataService.payeeDataSignal.set({
            ...currentData,
            phone: result.phone
          });
        }
      });
  }
}
