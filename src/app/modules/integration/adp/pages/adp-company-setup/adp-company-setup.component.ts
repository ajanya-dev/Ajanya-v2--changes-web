import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Data } from '@angular/router';
import { Subscription } from 'rxjs';
import { ScriptService } from 'src/app/core/services/script.service';
import { IBankAccountEditDetails, IBankCreateRes, IBankDropdown } from 'src/app/models/bank';
import {
  IADPSetupRequest,
} from 'src/app/modules/integration/model/integration';
import { ConfirmMicroDepositModalComponent } from 'src/app/modules/bank/bank-v2/modals/confirm-micro-deposit-modal/confirm-micro-deposit-modal.component';
import { CreateBankOptionsModalComponent } from 'src/app/modules/bank/bank-v2/modals/create-bank-options-modal/create-bank-options-modal.component';
import { EditBankAccountModalComponent } from 'src/app/modules/bank/bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { WireRoutingnumberAddComponent } from 'src/app/shared/bank-modal/modals/wire-routingnumber-add/wire-routingnumber-add.component';
import { ViewAuditTrailModalComponent } from 'src/app/shared/modal/common-modal/view-audit-trail-modal/view-audit-trail-modal.component';
import { NewCreditCardModalComponent } from 'src/app/shared/modal/cyber-source-modals/new-credit-card-modal/new-credit-card-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { NgxMaskDirective } from 'ngx-mask';
import {
  MatExpansionPanel,
  MatExpansionPanelDescription
} from '@angular/material/expansion';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { DropDownBankComponent } from '../../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { MatTooltip } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';

/**
 * Interface representing card details.
 */
interface ICardDetails {
  card?: string;
  cardId?: string;
  nickName?: string;
  bgColor?: string;
}

/**
 * Component representing the ADP company setup.
 */
@Component({
  selector: 'app-adp-company-setup',
  templateUrl: './adp-company-setup.component.html',
  styleUrls: ['./adp-company-setup.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    NgIf,
    NgClass,
    FormsModule,
    NgFor,
    MatTooltip,
    DropDownBankComponent,
    MatRadioGroup,
    MatRadioButton,
    MatExpansionPanel,
    MatExpansionPanelDescription,
    NgxMaskDirective
  ]
})
export class AdpCompanySetupComponent implements OnInit, OnDestroy {
  private cybersourceService = inject(CybersourceService);
  private adpService = inject(AdpService);
  private _sharedService = inject(SharedService);
  private activatedRoute = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private dialogue = inject(MatDialog);
  private scriptService = inject(ScriptService);
  private _bankAccService = inject(BankAccountsService);
  private matDialog = inject(MatDialog);
  private openAddCardService = inject(OpenAddCardService);
  private bankModalService = inject(BankModalService);

  // Defines class properties
  subscriptions: Subscription[] = [];
  cards: ICardDetails[] = [];
  companyName: string;
  companyId: string;
  selectedCardId = '';
  selectedTransferType = '6';
  loadingSave: boolean;
  selectedBankAc: IBankDropdown | undefined;
  loading: boolean;
  isADPMarketPlaceUser: boolean;
  accountRefillTypes = ['autoProcess', 'partiallyCharge', 'iDecide'];
  accountRefill: {
    type: false | 'autoProcess' | 'partiallyCharge' | 'iDecide';
  } = {
    type: false
  };
  presetAmount = '';
  isBanAcDetailsLoading: boolean;
  selectedBankAcDetails: IBankAccountEditDetails;

  ngOnInit(): void {
    this.getCards();
    this.initiateParams();
    this.processADPUserDetails();
    this.scriptService.addADPZohoSrcipt();
  }

  /**
   * Initializes parameters and subscribes to route parameters and bank account events.
   */
  initiateParams() {
    this.subscriptions.push(
      this.activatedRoute.params.subscribe((res: Data) => {
        this.companyName = res?.name;
        this.companyId = res?.id;
        this.getADPSetupDetails();
      })
    );

    this._bankAccService.bancAcEvents.subscribe((res) => {
      if (
        res?.message == 'MD Request' &&
        this.selectedBankAc?.id == res?.bankAcId
      ) {
        if (this.selectedBankAcDetails) {
          this.getBankDetails();
        }
      } else if (
        res?.message == 'Bank Account Verified' &&
        this.selectedBankAc?.id == res?.bankAcId
      ) {
        this.selectedBankAc!.verified = 1;
      } else if (res?.message == 'Add Bank Manually Clicked Yodlee') {
        this.openBankModal();
      }
    });
  }

  /**
   * Processes ADP user details.
   */
  processADPUserDetails() {
    this.subscriptions.push(
      this.adpService.adpUserDetails.subscribe((res) => {
        if (res?.adpMarketPlaceUser == 1) {
          this.isADPMarketPlaceUser = true;
        }
      })
    );
  }

  /**
   * Retrieves ADP setup details.
   */
  getADPSetupDetails() {
    this.loading = true;
    this.subscriptions.push(
      this.adpService.getADPSetupDetails(this.companyId).subscribe(
        (res) => {
          this.loading = false;
          if (res?.success && res?.data?.length > 0) {
            const adpDetails = res?.data[0];
            this.selectedCardId = adpDetails.cardId;
            this.selectedBankAc = {
              accountNumber: 0,
              bankName: '',
              cashAccount: 0,
              id: adpDetails.bankaccountId,
              isItZil: 0,
              mAch: 0,
              name: adpDetails.bankAccountName,
              nickName: adpDetails.bankAccountNickName,
              routingNumber: 0,
              status: '',
              statusDescription: '',
              verified: 1
            };
            this.accountRefill.type = (() => {
              if (adpDetails.automateType) {
                switch (adpDetails.automateType) {
                  case 1:
                    return 'autoProcess';
                  case 2:
                    return 'partiallyCharge';
                  case 3:
                    return 'iDecide';
                  default:
                    return false;
                }
              }
              return false;
            })();
            this.presetAmount =
              this.accountRefill.type == 'partiallyCharge'
                ? adpDetails.automateAmount
                : '';
            this._sharedService.setNewBankCreatedData({
              bankAccountNickName: adpDetails.bankAccountNickName
            });
          }
        },
        () => {
          this.loading = false;
        }
      )
    );
  }

  /**
   * Saving ADP setup details.
   */
  saveADPSetupDetailsClicked() {
    if (!this.selectedCardId || this.selectedCardId == '') {
      this.alertService.infoAlert({ content: 'Please select a card' });
    } else if (!this.selectedBankAc) {
      this.alertService.infoAlert({ content: 'Please select a bank account' });
    } else if (!this.selectedTransferType) {
      this.alertService.infoAlert({
        content: 'Please select a transfer method'
      });
    } else if (this.selectedBankAc?.verified != 1) {
      const infoalert = this.alertService.infoAlert({
        content:
          'This bank account has not been verified yet,Please verify your bank account',
        doneMsg: 'Verify Now',
        isCancel: true
      });
      this.subscriptions.push(
        infoalert.afterClosed().subscribe((res) => {
          if (res) {
            this.openVerifyModal(this.selectedBankAc?.id);
          }
        })
      );
    } else if (!this.accountRefill.type) {
      this.alertService.infoAlert({
        content: 'Please choose how to process payroll'
      });
    } else if (
      this.accountRefill.type == 'partiallyCharge' &&
      (!this.presetAmount ||
        this.presetAmount == '' ||
        this.presetAmount == '0')
    ) {
      this.alertService.infoAlert({ content: 'Please enter a preset amount' });
    } else {
      this.checkWireRoutingNumberAndSave(this.selectedBankAc);
    }
  }

  /**
   * Saves the ADP setup details after validation.
   */
  saveSetup() {
    this.loadingSave = true;
    const sendingData: IADPSetupRequest = {
      companyId: this.companyId,
      cardId: this.selectedCardId,
      bankaccountId: this.selectedBankAc?.id,
      mode: this.selectedTransferType,
      automate:
        this.accountRefill.type && this.accountRefill.type != 'iDecide' ? 1 : 0,
      automateType: (() => {
        if (this.accountRefill.type) {
          switch (this.accountRefill.type) {
            case 'autoProcess':
              return 1;
            case 'partiallyCharge':
              return 2;
            case 'iDecide':
              return 3;
            default:
              return 0;
          }
        }
        return 0;
      })(),
      automateAmount:
        this.accountRefill.type === 'partiallyCharge' ? this.presetAmount : 0
    };
    this.subscriptions.push(
      this.adpService.setADPSetupDetails(sendingData).subscribe(
        (res) => {
          this.loadingSave = false;
          if (res?.success) {
            this.alertService.successAlert({
              content: 'ADP Account setup saved successfully'
            });
          }
        },
        (err: HttpErrorResponse) => {
          this.loadingSave = false;
          if (err?.error.errorCode === 555) {
            this.bankAccountDetailsRequired(err);
          }
        }
      )
    );
  }

  /**
   * Handles the scenario when bank account details are required.
   * Opens the "Edit Bank Account" modal.
   * @param err The HttpErrorResponse containing the error details.
   */
  bankAccountDetailsRequired(err: HttpErrorResponse): void {
    const alert = this.alertService.warningAlert({
      content: err.error?.errorMsg,
      doneMsg: 'Update',
      cancelMsg: 'cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((e) => {
      if (e) {
        this.editBankModal();
      }
    });
  }

  /**
   * Opens the "Edit Bank Account" modal.
   */
  editBankModal(): void {
    this.dialogue.open(EditBankAccountModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: this.selectedBankAc
    });
  }

  /**
   * Handles the click event when "New Bank" is clicked.
   * Opens the "Create Bank Options" modal and checks if the user wants to add a bank manually.
   */
  onNewBank() {
    const dialogueRef = this.dialogue.open(CreateBankOptionsModalComponent, {
      //open modal
      maxWidth: '550px',
      width: '100%',
      disableClose: true,
      data: { mode: this.isADPMarketPlaceUser ? 'adp' : '' }
    });
    this.subscriptions.push(
      dialogueRef
        .afterClosed()
        .subscribe((res: { isAddManually: boolean } & boolean) => {
          if (res?.isAddManually) {
            this.openBankModal();
          }
        })
    );
  }

  /**
   * Opens the "New Bank Account" modal.
   */
  openBankModal() {
    if(this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBankOptimizedModal({ wireRoutingNumberRequired: 1 }).subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this._sharedService.setNewBankCreatedData({
                  bankAccountId: result?.id
                });
                this.onBankAcSelect({
                  accountNumber: Number(
                    (result?.bankAcData as IBankCreateRes)?.bankAccountNumber
                  ),
                  bankName: (result?.bankAcData as IBankCreateRes)?.bankAccountNumber,
                  cashAccount: 0,
                  id: result?.id,
                  isItZil: Number((result?.bankAcData as IBankCreateRes)?.is_neo_bank),
                  mAch: 0,
                  name: (result?.bankAcData as IBankCreateRes)?.bankAccountName,
                  nickName: (result?.bankAcData as IBankCreateRes)?.bankAccountNickName,
                  routingNumber: 0,
                  status: '',
                  statusDescription: '',
                  verified: Number((result?.bankAcData as IBankCreateRes)?.bankAccountVerified)
                });
              }
            })
          );
        }
      })
    );
  }

  /**
   * Handles the selection of a bank account.
   * @param event The selected bank account.
   */
  onBankAcSelect(event: IBankDropdown) {
    this.selectedBankAc = event;
    this.getBankDetails();
  }

  /**
   * Retrieves existing cards.
   */
  getCards() {
    this.subscriptions.push(
      this.cybersourceService.getExistingCards().subscribe((res) => {
        if (res?.success && res?.data.length) {
          this.cards = res?.data;
        }
      })
    );
  }

  /**
   * Handles the click event when the "Add Card" button is clicked.
   * Opens the "New Credit Card" modal.
   */
  addCard() {
    if(this.openAddCardService.isLoading()) return;
    const sub = this.openAddCardService
      .openAddCard()
      .subscribe((cardModal) => {
        if(cardModal){
          cardModal
          .afterClosed()
          .subscribe((res) => {
            if (res && res.success) {
              this.alertService.successAlert({ content: res.data.message });
              this.getCards();
            } else if (res?.cardCreated) {
              // Backed out of "Confirm Card": the card exists (unconfirmed).
              this.getCards();
            }
          });
        }
      });
    this.subscriptions.push(sub);
  }

  /**
   * Handles the click event when the "Update Card" button is clicked.
   * Opens the "New Credit Card" modal in edit mode.
   * @param cardId The ID of the card to be updated.
   */
  updateCard(cardId: string) {
    const card = this.cards.find((el) => el.cardId == cardId);
    if (card) {
      this.dialogue
        .open(NewCreditCardModalComponent, {
          width: '400px',
          data: { mode: 'EDIT', cardId: cardId, nickName: card.nickName }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res?.nickName) {
            card.nickName = res?.nickName;
          }
        });
    }
  }

  /**
   * Retrieves bank details for the selected bank account.
   */
  getBankDetails() {
    if (this.selectedBankAc?.id) {
      this.isBanAcDetailsLoading = true;
      this.subscriptions.push(
        this._bankAccService.viewBankById(this.selectedBankAc?.id).subscribe(
          (res) => {
            this.isBanAcDetailsLoading = false;
            if (res.success) {
              this.selectedBankAcDetails = res.data;
            }
          },
          () => {
            this.isBanAcDetailsLoading = false;
          }
        )
      );
    }
  }

  /**
   * Opens the "Verify Bank Account" modal.
   */
  verifyBankAc() {
    this.openVerifyModal(this.selectedBankAc?.id);
  }

  /**
   * Opens the "Bank Verify" modal with the encrypted bank account ID.
   * @param encrypted_bankacc_id The encrypted bank account ID.
   */
  openVerifyModal(encrypted_bankacc_id: string) {
    this.dialogue.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id },
      disableClose: true
    });
  }

  /**
   * Opens the "Confirm Micro Deposit" modal.
   */
  confirmMicroDeposit() {
    this.dialogue
      .open(ConfirmMicroDepositModalComponent, {
        maxWidth: '750px',
        width: '500px',
        data: { encrypted_bankacc_id: this.selectedBankAc?.id }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && this.selectedBankAc) {
          this.selectedBankAc.verified = 1;
        }
      });
  }

  /**
   * Checks the wire routing number and saves the setup accordingly.
   * @param bankAc The bank account details.
   * @param wireRoutingNumber The wire routing number (optional).
   */
  checkWireRoutingNumberAndSave(
    bankAc: IBankDropdown,
    wireRoutingNumber?: string
  ) {
    this.subscriptions.push(
      this._bankAccService
        .validateWireRoutingNumber({
          bankAccountId: bankAc.id,
          wireRoutingNumber: wireRoutingNumber
        })
        .subscribe(
          (res) => {
            if (res.success) {
              this.saveSetup();
            }
          },
          (err: HttpErrorResponse) => {
            if (err.error?.errorCode === 55) {
              this.dialogue
                .open(WireRoutingnumberAddComponent, {
                  maxWidth: '510px',
                  width: '93%',
                  disableClose: true,
                  data: { bankAc }
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res.wireRoutingNumber) {
                    this.checkWireRoutingNumberAndSave(
                      bankAc,
                      res.wireRoutingNumber
                    );
                  }
                });
            }
          }
        )
    );
  }

  /**
   * Opens the "Audit Log" modal to view ADP settings audit trail.
   */
  openAuditLog(): void {
    this.matDialog.open(ViewAuditTrailModalComponent, {
      maxWidth: '800px',
      width: '93%',
      data: {
        heading: 'ADP Settings',
        slug: 'integrations/adp/settings',
        id: this.companyId,
        suffix: 'audit-logs',
        columns: [
          { name: 'Date', field: 'date' },
          { name: 'By', field: 'username' },
          { name: 'Notes', field: 'description' },
          { name: 'Changes', field: 'changes' }
        ]
      }
    });
  }

  /**
   * Lifecycle hook: OnDestroy handles memory leak;
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.scriptService.removeScript(['zsiqchatADP']);
  }
}
