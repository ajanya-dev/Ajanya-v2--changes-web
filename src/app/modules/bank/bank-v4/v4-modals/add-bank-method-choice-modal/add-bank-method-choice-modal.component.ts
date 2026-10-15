import { Component, inject } from '@angular/core';
import { LucideAngularModule, X, ShieldCheck } from 'lucide-angular';
import { Store } from '@ngrx/store';

import { DOUBLE_SIDE_MODAL_REF } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { IBankDropdown } from 'src/app/models/bank';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { AddBankInfoModalComponent } from '../add-bank-info-modal/add-bank-info-modal.component';
import { BankDataV35Service } from '../../../bank-v3/v35-services/bank-data-v35.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-add-bank-method-choice-modal',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './add-bank-method-choice-modal.component.html'
})
export class AddBankMethodChoiceModalComponent {
  private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);
  private plaidHelperService = inject(PlaidHelperService);
  private headerService = inject(HeaderService);
  private store = inject(Store);
  private bankDataService = inject(BankDataV35Service);
  private customDoubleSideModalService = inject(CustomDoubleSideModalService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  readonly XIcon = X;
  readonly ShieldCheckIcon = ShieldCheck;

  onClose(): void {
    this.modalRef.close(undefined);
  }

  onPlaid(): void {
    this.modalRef.close(undefined);
    this.plaidHelperService
      .openPlaidModal({
        isVerify: false,
        selectedBankId: '',
        sourceType: 1,
        isV4: true
      })
      .subscribe((result) => {
        if (result) {
          this.headerService.refreshDynamicHeader.next(true);
          this.bankDataService.setAccounts();
          if (result.bankAccounts?.length) {
            // eslint-disable-next-line no-restricted-syntax
            for (const bank of result.bankAccounts) {
              const bankAccount = {
                accountNumber: `xxxx${bank.bankAccountNumber?.slice(-4) ?? ''}`,
                achApplicationStatus: '',
                bankName: bank.bankName ?? '',
                cashAccount: 0,
                id: bank.id,
                isItZil: 0,
                mAch: 0,
                name: bank.bankAccountName ?? '',
                nickName: bank.bankAccountNickName ?? '',
                routingNumber: bank.routingNumber ?? '',
                status: '',
                statusDescription: '',
                verifiedBy: '',
                verified: 0
              } as unknown as IBankDropdown;
              this.store.dispatch(
                bankAccountsActions.addCreatedBankAccountIntoBankAccounts({
                  bankAccount
                })
              );
            }
          }
        }
      });
  }

  onManual(): void {
    // Opening a new double-side modal automatically destroys this choice modal.
    const modalRef = this.customDoubleSideModalService.open<
      AddBankInfoModalComponent,
      { onBack: () => void },
      { success?: boolean }
    >(AddBankInfoModalComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      // Back arrow in the info modal returns to this method-choice modal.
      data: { onBack: () => this.openMethodChoiceModal() }
    });

    modalRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.dataTableService.setRefreshStatus(true);
        this.v3DataTableService.refreshV3DataTable();
        this.bankDataService.setAccounts();
        this.headerService.refreshDynamicHeader.next(true);
      }
    });
  }

  private openMethodChoiceModal(): void {
    this.customDoubleSideModalService.open(AddBankMethodChoiceModalComponent, {
      width: '480px',
      disableClose: true
    });
  }
}
