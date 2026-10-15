import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { of, Subscription } from 'rxjs';
import { catchError, debounceTime, finalize, tap } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { environment } from 'src/environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import {
  IConnectBank,
  ISelectAccountData,
  ISelectYodleeAccount,
  IverifiedAccounts
} from 'src/app/models/yodlee';
import { IBankData } from 'src/app/models/bank';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { IYodleeBanks } from './yodlee-bank-model';

interface IInstantVerification {
  success: boolean;
  url: string;
}

interface INewlyBank {
  success: boolean;
  data: ISelectYodleeAccount[];
}
/**
 * @description Modal component for connecting bank account through Yodlee.
 */
@Component({
  selector: 'app-connect-your-bank',
  templateUrl: './connect-your-bank.component.html',
  styleUrls: ['./connect-your-bank.component.scss'],
  standalone: true,
  imports: [MatDialogClose,FontAwesomeModule, ReactiveFormsModule, NgClass, TruncatePipe]
})
export class ConnectYourBankComponent implements OnInit, OnDestroy {

  private bankAccService = inject(BankAccountsService);
  public sanitizer = inject(DomSanitizer);
  private alertService = inject(AlertService);

  @Output() next = new EventEmitter<ISelectYodleeAccount[]>();
  @Output() emitError = new EventEmitter<HttpErrorResponse | { content: string }>();
  @Input() commonData: IConnectBank;
  @Output() reconfig = new EventEmitter<unknown>();
  @Output() emitVerificationFail = new EventEmitter<boolean>();
  api_URL = environment.ocwapiurl;
  urlSafe: SafeResourceUrl;
  subscriptions: Subscription[] = [];
  loadingDone = false;
  dataArr: ISelectYodleeAccount[] = [];
  uuId: string;
  type: number;
  faXmark = faXmark;
  yodleeUrl: string;

  yodleeBanks: IYodleeBanks['data']['provider'] = [];
  searchControl: FormControl = new FormControl();
  isBankSelected = false;
  isSearchResult = false;
  searching = false;
  isChangedSearchValue = false;

  ngOnInit(): void {
    if (this.commonData.dialogueInitializationData?.mode === 'verify_now') {
      this.getUrl(
        this.commonData.dialogueInitializationData
          ?.verifyNowAccountData as IBankData
      );
    } else if (
      this.commonData.dialogueInitializationData?.mode === 'connect_new_bank' ||
      this.commonData.dialogueInitializationData?.mode ===
        'connect_old_bank_accounts'
    ) {
      this.getUrlDirectly();
    }

    this.getYodleeBanks('initial');
    this.getSearchValueChanged();
    
  }

  /**
   * @description Method for verification of bank account, for verifyType 1.
   * @param accountData - data required for verification.
   */
  getUrl(accountData: IBankData) {
    const {pk} = accountData;
    let routingNumber = '';
    if (accountData.bank_routing_number) {
      routingNumber = accountData.bank_routing_number;
    } else if (accountData.routingNumber) {
      routingNumber = accountData.routingNumber;
    }
    let bankName = '';
    if (accountData.bank_name) {
      bankName = accountData.bank_name;
    } else if (accountData.bankName) {
      bankName = accountData.bankName;
    }
    const data = {
      routingNumber,
      verifyType: 1,
      k: bankName,
      pk
    };
    this.subscriptions.push(
      this.bankAccService
        .instantVerification(data)
        .pipe(
          catchError((err) => {
            if (!err.error.success) {
              this.emitVerificationFail.emit(true);
              const alertData = {
                title: 'Failed !',
                content: err.error.errorMsg
              };
              this.alertService.failedAlert(alertData);
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IInstantVerification;
          // this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(  //commneted for new flow change
          //   response.url
          // );

          // this.urlSafe = response.url;
          this.yodleeUrl = response.url;
        })
    );
  }

  /**
   * @description Method for bank account verification for verifyType 2.
   */
  getUrlDirectly() {
    const data = {
      verifyType: 2
    };
    this.subscriptions.push(
      this.bankAccService
        .instantVerification(data)
        .pipe(
          catchError((err) => {
            this.handleError(err);
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IInstantVerification;
          // this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(  //commneted for new flow change
          //   response.url
          // );
          this.yodleeUrl = response.url;
        })
    );
  }

  /**
   * @description Method invoked when message event occurs on window (decorated with HostListener). Sets `this.uuId` from event and emits `reconfig` event or`error` event based on modes.
   * @param e - message event.
   */
  @HostListener('window:message', ['$event'])
  onMessage(e: MessageEvent) {

    if (
      ['https://ocwapi.com', 'https://staging.ocwapi.com/'].includes(e.origin)
    ) {

      if(Object.prototype.hasOwnProperty.call(e.data, 'status') &&  e.data.status === "USER_CLOSE_ACTION"){
        this.isBankSelected = false;
        return;
      }

      this.uuId = e.data.session_token;
      if (
        this.commonData.dialogueInitializationData?.mode ===
        'connect_old_bank_accounts'
      ) {
        this.commonData.dialogueInitializationData.mode = 'connect_new_bank';
        this.reconfig.emit();
      }
      if (e.data.success === true && e.data.session_token !== '') {
        if (
          this.commonData.dialogueInitializationData?.mode === 'connect_new_bank'
        ) {
          this.getNewlyConnectedBankAccounts();
        } else if (
          this.commonData.dialogueInitializationData?.mode === 'verify_now'
        ) {
          this.getVerifiedBankAccounts();
        }
      } else {
        this.emitError.emit();
      }
    }
  }

  /**
   * @description Loads verified bank accounts and sets them to `this.dataArr`.
   * Invokes `this.checkAccountExist` method with the received data.
   */
  getVerifiedBankAccounts() {
    this.subscriptions.push(
      this.bankAccService
        .yodleeGetBankDetails(this.uuId)
        .pipe(
          catchError((err) => {
            this.handleError(err);
            return of(false);
          })
        )
        .subscribe((res) => {
          this.dataArr = res.data;
          this.checkAccountExist(res.data);
        })
    );
  }

  /**
   * @description Emits `error event`.
   * @param err - error
   */
  handleError(err: HttpErrorResponse) {
    if (!err.error.success) {
      this.emitError.emit();
    }
  }

  checkAccountExist(data: ISelectYodleeAccount) {
    let accountsArray: ISelectAccountData[];
    if (data.verified) {
      const res = data.verifiedAccounts as IverifiedAccounts[];
      accountsArray = Object.keys(res).map(
        (key) => res[key as keyof IverifiedAccounts[]]
      ) as unknown as ISelectAccountData[];
    } else {
      accountsArray = data.bankAccounts;
    }
    if (accountsArray.length > 0) {
      const accountData = accountsArray.find(
        (account) =>
          account.accountNumber ===
          this.commonData.dialogueInitializationData?.verifyNowAccountData
            ?.bank_account_account_number
      );
      if (accountData) {
        this.nextPage();
        this.bankAccService.bancAcEvents.next({
          message: 'Bank Account Verified'
        });
      } else {
        this.emitError.emit({
          content:
            "We couldn't find your account in your bank. Please check your account number and try again"
        });
      }
    }
  }

  /**
   * @description Gets the list of newly connected bank accounts and sets them to `this.dataArr`.
   * Invokes `this.nextPage` method.
   */
  getNewlyConnectedBankAccounts() {
    this.subscriptions.push(
      this.bankAccService
        .yodleeGetBankDetailsStep2(this.uuId)
        .pipe(
          catchError((err) => {
            this.handleError(err);
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as INewlyBank;
          this.dataArr = response.data;

          if (response.success) {
            this.nextPage();
          }
        })
    );
  }

  /**
   * @description Emits `nextPage` event with bank accounts data.
   */
  nextPage() {
    this.next.emit(this.dataArr);
  }

  /**
   * @description Sets loading status to done.
   */
  loadingEnd() {
    this.loadingDone = true;
  }

  onSelectBank(id: number): void {
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.yodleeUrl}&provider_id=${id}`);
    this.loadingDone = false;
    this.isBankSelected = true;
  }


  getYodleeBanks(type: 'initial' | 'search', searchTerm?: string): void {
    this.searching = true;
    this.subscriptions.push(
      this.bankAccService.getYodleeBanks(type, searchTerm)
      .pipe((finalize(() => { this.searching = false; this.isChangedSearchValue = false; })))
      .subscribe({
        next:(res => {

          if(type === "initial"){
            this.isSearchResult = false;
          }else{
            this.isSearchResult = true;
          }

          if(!Object.prototype.hasOwnProperty.call(res.data, 'provider')){
            this.yodleeBanks = [];
          }
          
          if(res.success){
            if(type === 'initial'){
              const providerArray = res.data.provider;
              const first13Elements = providerArray.slice(0, 13);
              first13Elements.splice(11, 1);
              this.yodleeBanks = first13Elements;
            }else{
              this.yodleeBanks = res.data.provider;
            }
          }

        })
      })
    );
  }

  getSearchValueChanged(): void {
    this.searchControl.valueChanges.pipe(
      tap(() => {
        this.isChangedSearchValue = true; // Set searching to true immediately
      }),
      debounceTime(500), // Adjust the debounce time as needed
    ).subscribe(value => {

      if(value.length === 1 && value === ' '){
        return;
      }
      
      this.searching = true;
      this.performSearch(value);
    });
  }

  performSearch(searchTerm: string) {

    if(searchTerm.length > 0){
      this.getYodleeBanks('search',searchTerm);
    }else{
      this.getYodleeBanks('initial');
    }
    
  }


removeWhitespace(event: Event): void {
  const input = event.target as HTMLInputElement;
  const trimmedValue = input.value.trimStart(); // Trim leading and trailing whitespace

  // Replace initial whitespace only
  const cleanedValue = trimmedValue.replace(/^\s+/, '');

  // Update the input value with the cleaned version
  input.value = cleanedValue;

  // Update the FormControl value to ensure it is synchronized
  this.searchControl.setValue(cleanedValue, { emitEvent: false });
}

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
