import { inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { IInternationalBankAccountRequest, IInternationalPayeeAccount } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IpayeeTypeDetails } from 'src/app/modules/payments/model/payments';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { MatDialog } from '@angular/material/dialog';
import { IApiRes } from 'src/app/models/api';
import { AddRecipientModalComponent } from '../modal/add-recipient-modal/add-recipient-modal.component';
import { WalletDataV35Service } from '../../wallet/wallet-v3/services/wallet-data-v35.service';
import { MapSourceWithBusinessModalComponent } from '../../payments/shared/modal/map-source-with-business-modal/map-source-with-business-modal.component';

@Injectable({
  providedIn: 'root'
})
export class WalletInternationalPaymentService implements OnDestroy {

    public walletDataService = inject(WalletDataV35Service);
    public paymentsService = inject(PaymentsService);
    public alertService = inject(AlertService);
    public walletService = inject(WalletService);
    private payeeModalService = inject(PayeeModalService);
    private store = inject(Store);
      private dialog = inject(MatDialog);

    destroy$ = new Subject();
    businessSelected$ = new Subject<string>();

    onEditPayee(payeeId?:string): void {
      const payeeEncryptedId = payeeId || (this.walletDataService?.interSelectedRecipientSignal()?.encryptedId as string);
      this.payeeModalService
        .openEditPayee(
          payeeEncryptedId,
          undefined,
          {
            edit: true,
            id: payeeEncryptedId
          }
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe((payeeModal) => {
          if (payeeModal) {
            payeeModal.afterClosed()
              .pipe(takeUntil(this.destroy$))
              .subscribe((result) => {
                if (result?.id) {                
                  // this.getRecipientDetails(result.id,true);        
                  // Map the API response to the IPayeeDropdown structure
                  const updatedPayee: IPayeeDropdown = {
                    id: result.id,
                    name: result.name,
                    nickName: result.nickName,
                    phone: result.phone,
                    addressLine1: result.addressLine1,
                    addressLine2: result.addressLine2,
                    city: result.city,
                    company: result.company,
                    country: result.country,
                    email: result.email,
                    encryptedId: result.id,
                    state: result.state,
                    zip: result.zip,
                    payeeIdNumber: result.payeeIdNumber,
                    payeeTypeId: result.payeeTypeId,
                    createdAt: '',
                    typeDetails: {} as IpayeeTypeDetails,
                    merchantCategory: result.merchantCategory
                  };
                  this.store.dispatch(
                    payeesActions.addUpdatedPayeeIntoPayees({ payee:updatedPayee })
                  );
                  
                  // Update the wallet data service with the new payee details
                  // Keep the existing bank details if they exist
                  // this.recipient = updatedPayee;
                  this.walletDataService.internationalPayment.update((value) => {
                    const currentRecipient = value.selectedRecipient;                  
                    return {
                      ...value,
                      selectedRecipient: {
                        ...updatedPayee,
                        bank: currentRecipient?.bank as IInternationalPayeeAccount
                      }
                    };
                  });
                }
              });
          }
        });
    }

      addNewRecipientBank(isEdit = false) {
        if (!this.walletDataService?.interSelectedRecipientSignal()?.encryptedId) {
          return;
        }
        const selectedRecipient = this.walletDataService?.interSelectedRecipientSignal();
        const dialogRef = this.dialog.open(AddRecipientModalComponent, {
          maxWidth: '95%',
          width: '700px',
          disableClose: true,
          data: {
            editMode: isEdit,
            id: this.walletDataService?.interSelectedRecipientSignal()?.encryptedId,
            bankAcId: isEdit ? this.walletDataService?.interSelectedRecipientSignal()?.bank?.encrypted_id : undefined,
            recipientId: selectedRecipient?.id,
            payeeEmail: selectedRecipient?.email,
            payeePhone: selectedRecipient?.phone
          }
        });
    
        dialogRef
          .afterClosed()
          .subscribe((response: IApiRes<IInternationalBankAccountRequest>) => {
            if (response.success) {
              // this.selectedRecipientBank = '';
              // const newInternationalPayeeBancAc: IInternationalPayeeAccount = {
              //   payee_id:
              //     this.walletDataService?.interSelectedRecipientSignal()
              //       ?.encryptedId,
              //   bank_name: response.data.bankName,
              //   account_number: response.data.accountNumber,
              //   swift_or_bic: response.data.identifierCode,
              //   account_type: response.data.accountType,
              //   bank_identifier_type: response.data.identifierType,
              //   bank_identifier_code: response.data.identifierCode,
              //   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              //   encrypted_id: response.data.id!,
              //   beneficiary: response.data.beneficiary,
              //   beneficiaryBankDetails: response.data.beneficiaryBankDetails,
              //   ifsc: response.data.ifsc
              // };
              // this.internationalAccounts.update((currentAccounts) => [
              //   ...currentAccounts,
              //   newInternationalPayeeBancAc
              // ]);
              // this.setDefaultBank(newInternationalPayeeBancAc);
              this.alertService.successAlert({
                title: 'Success',
                content: `Bank account ${isEdit ? 'updated' : 'added'} successfully`,
                close: true
              });
            }
          });
      }

    
  addWalletToBusiness(walletId:string){
    const dialog = this.dialog.open(MapSourceWithBusinessModalComponent, {
      maxWidth: '430px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal',
      data: {
        type: 'wallet',
        wallet: walletId
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res.success) {
        this.businessSelected$.next(res.business.id);
      }
    });
  }

      
    ngOnDestroy(): void {
      this.destroy$.next(true);
      this.destroy$.complete();
    }
}
