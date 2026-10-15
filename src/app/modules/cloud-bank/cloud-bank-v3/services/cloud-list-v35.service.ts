import { Observable, Subject, finalize, takeUntil } from 'rxjs';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  IAirwallexAccountsBalanceSignal,
  IAirwallexAccountsDetails,
  ICloudBankAccountDetailsAirwallex,
  IGroupedCloudAccount
} from '../../model/cloudbank';

@Injectable({
  providedIn: 'root'
})
export class CloudListV35Service implements OnDestroy {
  private cloudBankService = inject(CloudBankService);
  private localStorageService = inject(LocalStorageService);

  /**
   * State
   */
  private defaultState = {
    accounts: [],
    selectedAccount: undefined,
    accountLoading: false
  };

  public isCloudBankSuspended = false;

  private airWallexAccountsStateSignal = signal<IAirwallexAccountsDetails>(
    this.defaultState
  );

  private accountBalanceStateSignal = signal<IAirwallexAccountsBalanceSignal>({
    accountBalance: {},
    balanceLoading: false
  });

  private onBoardingStateSignal = signal({
    onBoardingStatus: '', // 'rejected'|'welcome'|'index'|'submitted';
    onBoardingLoading: false
  });

  /**
   * Selectors
   */
  airWallexAccountsSignal = computed(
    () => this.airWallexAccountsStateSignal()?.accounts
  );

  selectedAccountSignal = computed(
    () => this.airWallexAccountsStateSignal()?.selectedAccount
  );

  airWallexLoadingSignal = computed(
    () => this.airWallexAccountsStateSignal()?.accountLoading
  );

  accountBalanceSignal = computed(() => {
    const accountId = this.selectedAccountSignal()?.id ?? '';
    if (Object.keys(this.accountBalanceStateSignal().accountBalance).length) {
      return this.accountBalanceStateSignal().accountBalance[accountId];
    }
    return 0;
  });

  accountBalanceLoadingSignal = computed(
    () => this.accountBalanceStateSignal()?.balanceLoading
  );

  onBoardingStatusSignal = computed(
    () => this.onBoardingStateSignal()?.onBoardingStatus
  );

  onBoardingLoadingSignal = computed(
    () => this.onBoardingStateSignal()?.onBoardingLoading
  );

  private destroy$ = new Subject<boolean>();
  private userId = this.localStorageService.getItem('userId');
  private selectedAccount$ = toObservable(this.selectedAccountSignal);

  get selectedAccount() {
    return this.selectedAccount$;
  }

  /**
   * @description Get bank account data from the cloud service.
   * @param type The type of account data to get. Defaults to all accounts.
   */
  getBankAccountData(type?: string): void {
    const currentUserId = this.localStorageService.getItem('userId');
    if (
      this.airWallexAccountsStateSignal().accounts.length &&
      type !== 'create' &&
      this.userId === currentUserId
    ) {
      if (this.airWallexAccountsSignal()?.[0]) {
        const accountList: ICloudBankAccountDetailsAirwallex[] = [];
        this.airWallexAccountsSignal().forEach((account) => {
          accountList.push(...account.accounts);
        });
        if (type === 'edit') {
          const selectedAccountId =
            this.airWallexAccountsStateSignal().selectedAccount?.id;
          const selectedAccount = accountList.find(
            (item) => item.id === selectedAccountId
          );
          this.selectAccount(selectedAccount ?? accountList[0]);
          return;
        }
        this.selectAccount(
          this.airWallexAccountsStateSignal().selectedAccount?.id
            ? this.airWallexAccountsStateSignal().selectedAccount
            : accountList[0]
        );
      }
      return;
    }
    if (
      this.airWallexAccountsStateSignal().accounts.length &&
      type === 'create' &&
      this.userId === currentUserId
    ) {
      const accountList: ICloudBankAccountDetailsAirwallex[] = [];
      this.airWallexAccountsSignal().forEach((account) => {
        accountList.push(...account.accounts);
      });
      this.selectAccount(accountList[accountList.length - 1]);
      return;
    }
    this.userId = currentUserId;
    this.cloudBankService.isCloudLoading = true;
    this.airWallexAccountsStateSignal.update((value) => ({
      ...value,
      accountLoading: true
    }));
    this.cloudBankService
      .getAccountsAirwallex()
      .pipe(
        finalize(() => {
          this.cloudBankService.isCloudLoading = false;
          this.airWallexAccountsStateSignal.update((value) => ({
            ...value,
            accountLoading: false
          }));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        const { data } = res;
        if (!data.length && this.isCloudBankSuspended) {
          this.onBoardingStateSignal.update((value) => ({
            ...value,
            onBoardingStatus: 'rejected'
          }));
          return;
        }
        this.setGroupByBusiness(data);
        if (data.length) {
          if (type === 'edit') {
            const selectedAccountId =
              this.airWallexAccountsStateSignal().selectedAccount?.id;
            const selectedAccount = data.find(
              (item) => item.id === selectedAccountId
            );
            this.selectAccount(selectedAccount ?? data[0]);
            return;
          }
          if (type === 'create') {
            this.selectAccount(data[data.length - 1]);
            return;
          }
          const cloudBankAccounts =
            this.airWallexAccountsStateSignal().accounts;
          if (cloudBankAccounts[0]?.accounts[0]) {
            this.selectAccount(cloudBankAccounts[0]?.accounts[0]);
          } else {
            this.selectAccount(data[0]);
          }
          return;
        }
        this.selectAccount(undefined);
      });
  }

  /**
   * @description Group cloud bank accounts by business name.
   * @param {ICloudBankAccountDetailsAirwallex[]} cloudAccounts - The array of cloud bank account details to be grouped.
   */
  setGroupByBusiness(cloudAccounts: ICloudBankAccountDetailsAirwallex[]) {
    const groupedAccounts: { [key: string]: IGroupedCloudAccount } = {};
    cloudAccounts.forEach((item) => {
      const key = item.accountName;
      if (!groupedAccounts[key]) {
        groupedAccounts[key] = { businessName: key, accounts: [] };
      }
      if (item.accountStatus === 'ACTIVE') {
        groupedAccounts[key].accounts.unshift(item);
      } else {
        groupedAccounts[key].accounts.push(item);
      }
    });
    const groupedCloudAccounts = Object.values(groupedAccounts);
    this.airWallexAccountsStateSignal.update((value) => ({
      ...value,
      accounts: groupedCloudAccounts
    }));
    this.setCompanyOrder();
  }

  /**
   * @description Ensure that the first group in the list contains at least one account with status "ACTIVE".
   */
  setCompanyOrder() {
    const cloudBankAccounts = this.airWallexAccountsStateSignal().accounts;
    const activeGroupIndex = cloudBankAccounts.findIndex((group) =>
      group.accounts.some((account) => account.accountStatus === 'ACTIVE')
    );

    if (activeGroupIndex > -1) {
      const [activeGroup] = cloudBankAccounts.splice(activeGroupIndex, 1);
      cloudBankAccounts.unshift(activeGroup);
    }
    this.airWallexAccountsStateSignal.update((value) => ({
      ...value,
      cloudBankAccounts
    }));
  }

  selectAccount(data: ICloudBankAccountDetailsAirwallex | undefined) {
    this.airWallexAccountsStateSignal.update((value) => ({
      ...value,
      selectedAccount: data
    }));
    if (data?.accountStatus === 'ACTIVE') this.getAccountBalance();
  }

  getAccountBalance() {
    if (
      this.airWallexAccountsStateSignal().selectedAccount?.id &&
      this.airWallexAccountsStateSignal().selectedAccount?.accountStatus ===
        'ACTIVE'
    ) {
      const accountId =
        this.airWallexAccountsStateSignal().selectedAccount?.id ?? '';
      const existingAccountIds = Object.keys(
        this.accountBalanceStateSignal().accountBalance
      );
      if (existingAccountIds.includes(accountId)) {
        return;
      }
      this.accountBalanceStateSignal.update((value) => ({
        ...value,
        balanceLoading: true
      }));
      this.cloudBankService
        .getCloudBalance(
          this.airWallexAccountsStateSignal().selectedAccount?.id ?? ''
        )
        .pipe(
          finalize(() => {
            this.accountBalanceStateSignal.update((value) => ({
              ...value,
              balanceLoading: false
            }));
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          let accountBal;
          if (accountId) {
            accountBal = { [accountId]: res.balance };
          }
          const accountBalance = {
            ...this.accountBalanceStateSignal().accountBalance,
            ...accountBal
          };
          this.accountBalanceStateSignal.update((value) => ({
            ...value,
            accountBalance
          }));
        });
    }
  }

  private viewClickSubject$ = new Subject<{
    accountId: string;
    businessName: string;
  }>();

  set viewClickSubject(val: { accountId: string; businessName: string }) {
    this.viewClickSubject$.next(val);
  }

  get viewClickSubject(): Observable<{
    accountId: string;
    businessName: string;
  }> {
    return this.viewClickSubject$.asObservable();
  }

  /**
   * @description check whether the company can apply for cloud bank.
   * Renders the page according to the response code received.
   */
  onBoardingStatus(status?: 'submit') {
    if (status) {
      this.onBoardingStateSignal.update((value) => ({
        ...value,
        onBoardingStatus: 'submitted'
      }));
    }
    const currentUserId = this.localStorageService.getItem('userId');
    if (
      this.onBoardingStateSignal().onBoardingStatus !== '' &&
      this.userId === currentUserId
    ) {
      return;
    }
    this.userId = currentUserId;
    this.onBoardingStateSignal.update((value) => ({
      ...value,
      onBoardingLoading: true
    }));
    this.cloudBankService
      .cloudBankStatus()
      .pipe(
        finalize(() => {
          this.onBoardingStateSignal.update((value) => ({
            ...value,
            onBoardingLoading: false
          }));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.status === 'Suspended') {
            this.isCloudBankSuspended = true;
          }
          switch (res.status) {
            case 'Approved':
              this.localStorageService.removeItem('loadMsg');
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                onBoardingStatus: 'index'
              }));
              break;
            case 'In Review':
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                onBoardingStatus: 'submitted'
              }));
              break;
            case 'Pending':
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                onBoardingStatus: 'submitted'
              }));
              break;
            case 'No Application':
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                onBoardingStatus: 'welcome'
              }));
              break;
            case 'Rejected':
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                onBoardingStatus: 'rejected'
              }));
              break;
            case 'Suspended':
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                onBoardingStatus: 'index'
              }));
              break;
            default:
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                onBoardingStatus: 'welcome'
              }));
              break;
          }
        }
      });
  }

  resetSubscriptions() {
    this.accountBalanceStateSignal.set({
      accountBalance: {},
      balanceLoading: false
    });
    this.destroy$.next(true);
  }

  ngOnDestroy(): void {
    this.airWallexAccountsStateSignal.set(this.defaultState);
    this.onBoardingStateSignal.set({
      onBoardingStatus: '',
      onBoardingLoading: false
    });
  }
}
