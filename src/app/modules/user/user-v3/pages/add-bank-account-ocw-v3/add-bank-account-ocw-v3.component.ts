import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location, NgFor, NgClass, NgIf } from '@angular/common';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { ChooseBankOptionModalComponent } from 'src/app/shared/yodlee/components/choose-bank-option-modal/choose-bank-option-modal.component';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { MatTooltip } from '@angular/material/tooltip';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { OcwPreventMultiClickDirective } from '../../../../../directive/ocw-prevent-multi-click.directive';

@Component({
  selector: 'app-add-bank-account-ocw-v3',
  templateUrl: './add-bank-account-ocw-v3.component.html',
  styleUrls: ['./add-bank-account-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    NgFor,
    NgClass,
    OcwPreventMultiClickDirective,
    NgIf,
    MatTooltip
  ]
})
export class AddBankAccountOcwV3Component implements OnInit, OnDestroy {
  /**
   * dependency injection using inject method
   */
  location = inject(Location);
  router = inject(Router);
  private dialog = inject(MatDialog);
  private bankAccService = inject(BankAccountsService);
  private payeeOnboardingService = inject(PayeeOnboardingService);
  private route = inject(ActivatedRoute);
  private localStorageService = inject(LocalStorageService);
  private personaHelperService = inject(PersonaHelperService);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private plaidHelperService = inject(PlaidHelperService);
  public headerService = inject(HeaderService);
  userId = this.localStorageService.getItem('userId');
  enablePlaid = true;


  subscriptions: Subscription[] = [];
  returnUrl: string;
  isOlliePay = environment.env_id === 'olliepay';
  cardsData = [
    {
      id: 1,
      svg: true,
      title: 'Connect Instantly',
      onClickFunction: 'onConnectNewBankClicked()',
      content: 'Add with your net banking username & password'
    },
    {
      id: 2,
      icon: 'fa-building-columns',
      title: 'Add Manually',
      onClickUrl: '/manage/users/add-bank-manually',
      content: 'Add by providing account details manually'
    },
    // {
    //   id: 3,
    //   title: 'Create Cloud Bank',
    //   fdic: true,
    //   onClickUrl: '/manage/cloud-bank/index',
    //   content:
    //     'Open an online checking A/C now. Transfer money instantly between accounts without any charges'
    // }
  ];

  /**
   * @description checks whether resources are loaded
   */

  isLoading = true;

  bankAddMethod = signal<'instant' | 'manual'>('instant');
  isFirstBankAttempt = signal(false);
  bankCountBefore = signal(0);

  ngOnInit(): void {
    if(environment.env_id === 'olliepay' || this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('isArcharina')){
      this.cardsData = this.cardsData.filter(el => el.id !== 3);
    }
  }

  isFirstBankAttemptChecker(totalCount: number, bankAccountNumber: string | number): boolean {
    if(totalCount === 0) return true;
    if(totalCount === 1 && (bankAccountNumber).toString() === '1111111111') return true;
    return false;
  }

  onCardClick(url: string) {
    this.returnUrl = this.route.snapshot.queryParams?.returnUrl;
    if (url === 'function') {
      if (this.enablePlaid) {
        this.plaidHelperService.openPlaidModal().subscribe({
          next: (res) => {
            if (res?.success) {
              this.alertService.successAlert({content:'Bank accounts imported successfully.'});
              this.headerService.onRefreshDynamicHeader = true;
              this.router.navigate(['manage/bank-accounts/index']);
            }
          }
        });
      }
    
    } else if (
      this.payeeOnboardingService.payeeOnboardingSignal()?.initiatedFrom ===
      'directDepositReceiving'
    ) {

      this.router.navigate([url], {
        queryParams: {
          returnUrl: this.returnUrl
        }
      });
    } else {

      if (!this.returnUrl) {
        this.returnUrl = '/manage/bank-accounts/index';
      }
      this.router.navigate([url], {
        queryParams: { returnUrl: this.returnUrl }
      });
    }
  }

  /**
   * @description  Handles the action of linking the bank account instantly.
   * The behavior varies based on the mode and the presence of unlinked accounts.
   */
  onConnectNewBankClicked() {
    this.subscriptions.push(
      this.bankAccService.getUnlinkedAccounts().subscribe({
        next: (res) => {
          if (res.success === true) {
            if (res.data.unlinkedAccounts > 0) {
              this.dialog.open(ChooseBankOptionModalComponent, {
                maxWidth: '470px',
                width: '93%',
                disableClose: true,
                autoFocus: false,
                data: res
              });
            } else {
              const data = {
                mode: 'connect_new_bank'
              };
              this.dialog.open(YodleeParentModalComponent, {
                disableClose: true,
                backdropClass: 'disbled-backdrop-yodlee',
                autoFocus: false,
                data,
                panelClass: 'yodlee-modal-new'
              });
            }
          }
          const unverifiedError = res as unknown as { errorCode: string };
          if (unverifiedError.errorCode === '106') {
            this.router.navigateByUrl('/manage/users/verify-email-phone');
          }
        },
        error:(err => {
          if(err.error.errorCode === 517){
            if (environment.isV4Persona) {
              this.personaHelperService
                .openModal('kyc', CVSourceType.getting_started_v3)
                .subscribe();
            } else {
              this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
            }
          }else if(err.error.errorCode === 520){
            this.handleVerificationError('Your personal verification is under the verification process .Please contact our support team for faster approval.');
          }else if(err.error.errorCode === 521){
            this.handleVerificationError('Your personal verification has been rejected.Please contact support team for more information.');
          }
        })
      })
    );
    this.subscriptions.push(
      this.bankAccService.bancAcEvents.subscribe((res) => {
        if (res?.message === 'Bank Account Created') {
          if (
            this.payeeOnboardingService.payeeOnboardingSignal()?.initiatorId
          ) {
            [
              'payeeObInitId',
              'payeeObExtToken',
              'payeeObInitFrom',
              'payeePasswordSet'
            ].forEach((val) => {
              this.localStorageService.removeItem(val);

            });
            this.payeeOnboardingService.ngOnDestroy();
            this.router.navigate(['/manage/wallet/transactions']);
            return;
          }
          if (this.returnUrl) {
            this.router.navigateByUrl(this.returnUrl);
          } else {
            this.router.navigateByUrl('/manage/verification/index');
          }
        }
      })
    );
  }

  handleVerificationError(msg: string): void {
    const action =  this.alertService.infoAlert({
      content: `${msg}`,
      cancelMsg: 'Not Now',
      isCancel: true,
      isOk: true,
      doneMsg: 'Contact Now'
    });
    action.afterClosed().subscribe(res => {
      if(res){
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  onBackClick(): void {
    this.router.navigateByUrl('/manage/bank-accounts/index');
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
