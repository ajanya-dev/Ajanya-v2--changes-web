import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { Injectable, inject } from '@angular/core';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { CloudBankDetailsDataV35Service } from 'src/app/modules/cloud-bank/cloud-bank-v3/services/cloud-bank-details-data-v35.service';
import { CloudListV35Service } from 'src/app/modules/cloud-bank/cloud-bank-v3/services/cloud-list-v35.service';
import { WalletDataService } from 'src/app/modules/wallet/wallet-v3/services/wallet-data.service';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { PaymentTypeAccessService } from '../shared/payment-type-access/payment-type-access.service';
import { VirtualCardService } from 'src/app/modules/virtual-card/services/virtual-card.service';
import { V4PaymentLinksService } from 'src/app/modules/v4-pages/v4-payment-links/services/v4-payment-links.service';

@Injectable({
  providedIn: 'root'
})
export class DestroyerService {
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private bankDataV35Service = inject(BankDataV35Service);
  private cloudBankDetailsDataV35Service = inject(
    CloudBankDetailsDataV35Service
  );

  private cloudListV35Service = inject(CloudListV35Service);
  private walletDataService = inject(WalletDataService);
  private walletDataV35Service = inject(WalletDataV35Service);
  private cardsDataService = inject(CardsDataServiceService);
  private userManagementV35Service = inject(UserManagementV35Service);
  private payeeDataV35Service = inject(PayeeDataV35Service);
  private virtualCardService = inject(VirtualCardService);
  private v4PaymentLinksService = inject(V4PaymentLinksService);

  destroyDataStoredInServices() {
    this.paymentTypeAccessService.ngOnDestroy();
    this.bankDataV35Service.ngOnDestroy();
    this.paymentTypeAccessService.ngOnDestroy();
    this.cloudBankDetailsDataV35Service.ngOnDestroy();
    this.cloudListV35Service.ngOnDestroy();
    this.cardsDataService.ngOnDestroy();
    this.walletDataService.ngOnDestroy();
    this.walletDataV35Service.ngOnDestroy();
    this.userManagementV35Service.ngOnDestroy();
    this.payeeDataV35Service.ngOnDestroy();
    this.virtualCardService.ngOnDestroy();
    this.v4PaymentLinksService.ngOnDestroy();
  }
}
