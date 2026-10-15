import { UserService } from 'src/app/shared/service/user/user.service';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import {
  IBankAccountEditDetails,
  IBankData,
  IBusinessDetails
} from 'src/app/models/bank';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { IUserVerification } from 'src/app/models/user';
import { AddBusinessModalComponent } from 'src/app/modules/common-verification/components/add-business-modal/add-business-modal.component';
import {
  CVSourceType,
  ISelectBizData,
  IActionLoaderData,
  IAddBizData
} from 'src/app/modules/common-verification/model/common-verification';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { LoaderModalComponent } from 'src/app/shared/modal/loader-modal/loader-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { HttpClient } from '@angular/common/http';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ConfirmMicroDepositModalComponent } from '../../bank-v2/modals/confirm-micro-deposit-modal/confirm-micro-deposit-modal.component';
import { SelectBusinessComponent } from '../../bank-v2/modals/select-business/select-business.component';
import {
  IBankAccountSignalState,
  IExportAllBankAccounts,
  ISelectedBankAccountSignalState
} from '../model/bank-v35';
import { VirtualAccountConfirmationModalComponent } from '../../bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { EditBankAccountModalComponent } from '../../bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';

@Injectable({
  providedIn: 'root'
})
export class BankDataV35Service implements OnDestroy {
  /**
   * @description Dependancy injection using inject method
   */
  private dataTableService = inject(DataTableService);
  private bankAccountsService = inject(BankAccountsService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private userProfileService = inject(UserProfileService);
  private commonVerificationService = inject(CommonVerificationService);
  private userService = inject(UserService);
  private paymentsService = inject(PaymentsService);
  private activatedRoute = inject(ActivatedRoute);
  private personaHelperService = inject(PersonaHelperService);
  private sharedService = inject(SharedService);
  private http = inject(HttpClient);
  private v3DataTableService = inject(V3DataTableService);
  private headerService = inject(HeaderService);
  private payeeOnboardingService = inject(PayeeOnboardingService);

  ROOT_URL = environment?.rootUrl;
  public isLoadDesign$: Subject<boolean> = new Subject();

  /** State */

  private defaultBankAccountsState = {
    bankAccountList: [],
    selectedBankAccount: undefined,
    bankAccountCount: undefined,
    bankAccountLoading: false
  };

  private defaultSelectedBankState = {
    bankAccountInfo: undefined,
    storeBankAccountInfo: {},
    storeAuditTrails: {},
    auditTrailList: undefined,
    auditTrailLoading: false,
    bankAccountInfoLoading: false
  };

  bankAccountsStateSignal = signal<IBankAccountSignalState>(
    this.defaultBankAccountsState
  );

  public selectedBankInfoStateSignal = signal<ISelectedBankAccountSignalState>(
    this.defaultSelectedBankState
  );
  /** Selectors */

  bankAccountsSignal = computed(
    () => this.bankAccountsStateSignal()?.bankAccountList
  );

  selectedBankAccountSignal = computed(
    () => this.bankAccountsStateSignal()?.selectedBankAccount
  );

  bankAccountCountSignal = computed(
    () => this.bankAccountsStateSignal()?.bankAccountCount
  );

  accountLoadingSignal = computed(
    () => this.bankAccountsStateSignal()?.bankAccountLoading
  );

  checkNumberSignal = computed(
    () => this.selectedBankInfoStateSignal().bankAccountInfo
  );

  storedcheckNumberSignal = computed(
    () => this.selectedBankInfoStateSignal().storeBankAccountInfo
  );

  storedAuditTrailSignal = computed(
    () => this.selectedBankInfoStateSignal().storeAuditTrails
  );

  auditTrailSignal = computed(
    () => this.selectedBankInfoStateSignal().auditTrailList
  );

  checkNumberLoadingSignal = computed(
    () => this.selectedBankInfoStateSignal().bankAccountInfoLoading
  );

  auditTrailLoadingSignal = computed(
    () => this.selectedBankInfoStateSignal().auditTrailLoading
  );

  /**
   * Variables
   */
  subscriptions: Subscription[] = [];
  public tableId = 9; // Data Table Id

  private bankAccounts$ = new BehaviorSubject<IBankData[]>([]);
  private checkNumberAndAddress$ = new Subject<
    IApiRes<IBankAccountEditDetails>
  >();

  private gridChange$ = new Subject<boolean>();

  public isRemainingLoading = false;
  public gettingCheckNumber = false;
  private bankAccountsCount$ = new Subject<number>();
  public totalBankAccountsCount$ = new BehaviorSubject<number | undefined>(
    undefined
  );

  isGridView = true;
  kycKybStatus: { kycStatus: number; kybStatus: number };
  showDropDown = false;
  accountNumberVisible = false;
  private preSelectedBankAccount: IBankData | undefined = undefined;
  statusFetchingSignal = signal(<{ loading: boolean; autoClick?: boolean }>{
    loading: false
  });

  isFromService: 'manual' | 'service' | null;
  selectedBankId = signal<string | undefined>(undefined);
  searchInputSignal = signal<string>('');

  /**
   * @description Toggle grid view and list view
   * @param value boolean value
   */
  toggleView(value: { gridView: boolean }) {
    this.isGridView = value.gridView;
    if (this.isGridView) {
      this.setAccounts();
    }
  }

  /** Setting grid change value */
  setGrid(val: boolean) {
    this.gridChange$.next(val);
  }

  /** Getting grid change value */
  getGrid(): Observable<boolean> {
    return this.gridChange$.asObservable();
  }

  /**
   * Method to get bank accounts after adding new.
   */
  setNewBank() {
    this.setAccounts();
    this.setTotalBankAccountsCount();
  }

  /**
   * ACH application status from event emitted from bank account details
   * @usageNotes
   * #### null means ACH not applied
   * #### 0 means ACH requested
   * #### 1 means ACH active
   * @param selectedAccount selected bank details
   */
  applyAchClick(selectedAccount: IBankData) {
    if (selectedAccount.bank_account_country === 'Canada') {
      this.alertService.warningAlert({
        content: 'Verification for Canadian bank accounts is not permitted.'
      });
      return;
    }
    let type = 0;
    /**
     * type 1 = ach completed
     *      2 = ach pending
     *      3 = ach more document-GENERAL
     *      4 = verified account
     *      5 = ach rejected
     *      6 = zilbank account
     */
    if (selectedAccount.ach_application_status === 1) {
      type = 1;
    } else if (selectedAccount.ach_application_status === 0) {
      type = 2;
    } else if (selectedAccount.ach_application_status === 2) {
      type = 3;
    } else if (
      selectedAccount.ach_application_status === null &&
      selectedAccount.mark_as_verified === 1
    ) {
      type = 4;
    } else if (selectedAccount.ach_application_status === 3) {
      type = 5;
    }
    if (
      selectedAccount.bank_account_nature_type === 2 ||
      selectedAccount.bank_name === 'ZilBank'
    ) {
      type = 6;
    }
    if (type === 4 || type === 5) {
      this.isEmailAndPhoneVerfied(
        selectedAccount.encrypted_bankacc_id,
        selectedAccount
      );
    } else {
      this.bankVerificationRequiredConfirm(selectedAccount);
    }
  }

  /**
   * @description Checks wheather email, phone verified and if not verified gives an alert with verify link
   * @param encrypted_bankacc_id Selected bank account's encrypted id
   * @param data Selected bank details
   */
  isEmailAndPhoneVerfied(encrypted_bankacc_id: string, data: IBankData) {
    this.isFromService = 'manual';
    this.selectedBankId.set(encrypted_bankacc_id);
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.isFromService =
          this.isFromService === 'manual' ? 'manual' : 'service';

        if (this.isFromService === 'service') {
          return;
        }

        if (res.email_verified === 0 || res.phone_verified === 0) {
          this.verifyPhoneEmail(res);
        } else {
          this.getUserKysKybStatus(encrypted_bankacc_id, data);
        }
      })
    );
  }

  /**
   * @description Bank verification alert with verify modal open button
   * @param id
   */
  bankVerificationRequiredConfirm(bankAcData: IBankData) {
    /**
     * ach_application_status = 0 (pending)
     * ach_application_status = 1 (completed)
     * ach_application_status = 2 (more document-GENERAL)
     * ach_application_status = 3 (reject)
     * ach_application_status = 4 (more document-VIP)
     * ach_application_status = 5 (show_all)
     * ach_application_status = 6 (ready to upload)
     * ach_application_status = 7 (partner approved)
     * ach_application_status = 8 (partner rejected)
     *
     * verified_by = 2 - is verified by MD,
     * verified_by = 3 - is waiting for confirmation MD,
     * verified_by = 4 - is requested MD,
     * verified_by = 5 - is approved request MD,
     * verified_by = 6 - Rejected Requests
     * verified_by = 7 - AUTO_VERIFYBY YODLY
     * verified_by = 8 - VERIFIED BY ADMIN
     * verified_by = 9 - AUTO_VERIFYBY YODLY FROM OUTSIDE
     * verified_by = 10- Allow MD Do it Again
     * verified_by = 11- Softly verified //only verified last 4 digits of the account number
     * verified_by = 12- Confirm MD attempt Completed
     * verified_by = 13- cloud bank auto verication
     * verified_by = 14- verified using documents
     */
    if (bankAcData?.verified_by === 4) {
      this.alertService.warningAlert({
        content: 'The bank account you have chosen has not been verified.',
        doneMsg: 'OK',
        isCancel: false
      });
      return;
    }
    const ref = this.alertService.warningAlert({
      content: 'Please verify your bank account',
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        if (
          (bankAcData?.verified_by === 6 || bankAcData?.verified_by === 12) &&
          bankAcData?.ach_application_status !== 1
        ) {
          this.verifyInstantly(bankAcData);
          return;
        }
        this.openBankVerifyModal(bankAcData);
      }
    });
  }

  /**
   * @description Opens @component 'YodleeParentModalComponent' for bank verify instantly
   */
  verifyInstantly(bankAcData: IBankData | undefined) {
    const data = {
      mode: 'verify_now',
      verifyNowAccountData: bankAcData as IBankData
    };
    const dialog = this.dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data,
      panelClass: 'yodlee-modal-new'
    });
    dialog.afterClosed().subscribe((res) => {
      /**
       * @description Checking if the response is true, and proceeding to all other operations if its true. else it refreshes the whole page for nothing
       */
      if (res) {
        this.updateAccounts(bankAcData as IBankData);
      }
    });
  }

  /**
   * @description Bank verify modal opens
   * @param encrypted_bankacc_id
   */
  openBankVerifyModal(bankAcData: IBankData) {
    const dialog = this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '420px',
      width: '95%',
      data: bankAcData,
      disableClose: true
    });
    dialog.afterClosed().subscribe((res) => {
      /**
       * @description Checking if the status from response is true, and proceeding to all other operations if its true. else it refreshes the whole page for nothing
       */
      if (res.success) {
        this.setAccounts();
      }
    });
  }

  /**
   * @description If phone or email are not verified then gives an alert.after closing the alert it navigates into corresponding route
   * @param res User verification details : email, email verified or not, phone , phone verified or not
   */
  verifyPhoneEmail(res: IUserVerification) {
    const msg = () => {
      if (!res.email_verified && !res.phone_verified) return 'Phone and Email';
      if (!res.phone_verified) return 'Phone';

      return 'Email';
    };

    const ref = this.alertService.warningAlert({
      content: `Please verify your ${msg()}`,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((response) => {
      if (response) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: '/manage/bank-accounts/index',
            type: CVSourceType.ACH
          }
        });
      }
    });
  }

  /**
   * @description Get user's kyc and kyb status
   * @param encrypted_bankacc_id Selected bank account's encrypted id
   * @param data Selected bank details
   */
  getUserKysKybStatus(encrypted_bankacc_id: string, bankDetails: IBankData) {
    this.statusFetchingSignal.set({ loading: true });
    this.dataTableService.setHeaderButtonClassList({
      ids: ['id_ach_apply'],
      cssClass: ['btn_blur'],
      action: 'add'
    });
    this.subscriptions.push(
      this.commonVerificationService.applicationStatus().subscribe((res) => {
        if (res?.success) {
          this.kycKybStatus = res.data;
          this.checkVirtualAccount(encrypted_bankacc_id, bankDetails);
        }
      })
    );
  }

  checkVirtualAccount(encrypted_bankacc_id: string, bankDetails: IBankData) {
    if(bankDetails.is_virtual_account) {
      this.alertService.infoAlert({
        content:
          'Since you added your Bank account using instant verification, we received a virtual account number. You won’t be able to apply for ACH application with this account, please confirm your original account number to use it for checks.',
        doneMsg: 'Update',
        isCancel: true
      }).afterClosed().subscribe((res) => {
        if (res) {
          this.openVirtualAccountConfirmationModal(encrypted_bankacc_id, bankDetails);
        }else{
          this.statusFetchingSignal.set({ loading: false });
        }
      });
    }else if (
      bankDetails.mark_as_verified === 0 && bankDetails.verified_by === 88
    ){
      this.alertService.failedAlert({
        content:
          'Your Bank account verification was rejected. You won’t be able to apply for ACH application with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.',
        doneMsg: 'Update',
        isCancel: true
      }).afterClosed().subscribe((res) => {
        if (res) {
          this.openVirtualAccountConfirmationModal(encrypted_bankacc_id, bankDetails);
        }else{
          this.statusFetchingSignal.set({ loading: false });
        }
      });
    }else {
      this.getBusinesses(encrypted_bankacc_id, bankDetails);
    }
  }

  openVirtualAccountConfirmationModal(encrypted_bankacc_id: string, bankDetails: IBankData, type?: string) {
    if (type === 'plaid') {
      this.openVirtualAccountConfirmationModalForPlaid(encrypted_bankacc_id);
    } else {
      const confirmationDialog = this.openVirtualAccountModal(encrypted_bankacc_id);
      confirmationDialog.afterClosed().subscribe((result) => {
        if (result && result.success) {
          this.getBusinesses(encrypted_bankacc_id, bankDetails);
        } else {
          this.setAccounts();
          this.statusFetchingSignal.set({ loading: false });
        }
      });
    }
  }

  openVirtualAccountConfirmationModalForPlaid(encrypted_bankacc_id: string){
    const dialogRef = this.alertService.infoAlert({
      content:
        'Since you added your Bank account using instant verification, we received a virtual account number. Please confirm your original account number.',
      doneMsg: 'Update',
      isCancel: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.openVirtualAccountModal(encrypted_bankacc_id);
      }
    });
  }

  openVirtualAccountModal(encrypted_bankacc_id: string) {
    return this.dialog.open(
      VirtualAccountConfirmationModalComponent,
      {
        maxWidth: '1200px',
        width: '100%',
        disableClose: true,
        data: { bankAccountIds: [encrypted_bankacc_id] }
      }
    );
  }

  /**
   * @description Get business details if available, other wise add business details
   * @param bankDetails Selected bank details
   * @param encrypted_bankacc_id Bank accounts encrypted id
   */
  getBusinesses(encrypted_bankacc_id: string, bankDetails: IBankData) {
    this.subscriptions.push(
      this.commonVerificationService.getUserBusinesses().subscribe((res) => {
        if (res?.success) {
          const businessDetails = res?.data;
          this.statusFetchingSignal.set({ loading: false });
          if (businessDetails?.length) {
            this.selectBusiness(encrypted_bankacc_id, {
              ...bankDetails,
              businessDetails
            });
          } else if (this.kycKybStatus?.kycStatus !== null) {
            if (environment.isV4Persona) {
              this.personaHelperService
                .openModal('kyb', CVSourceType.add_new_business)
                .subscribe((resp) => {
                  if (resp?.data.inquiry_id) {
                    this.statusFetchingSignal.set({
                      loading: true,
                      autoClick: true
                    });
                  }
                });
            } else {
              const url = '/manage/users/verify-user-id?type=7';
              this.router.navigateByUrl(url);
              // this.addBusinessModal(encrypted_bankacc_id);
            }
          } else if (environment.isV4Persona) {
            this.personaHelperService
              .openModal('kyc', CVSourceType.ACH)
              .subscribe((response) => {
                if (response?.data.inquiry_type === 'kyb') {
                  this.statusFetchingSignal.set({
                    loading: true,
                    autoClick: true
                  });
                }
              });
          } else {
            const url = '/manage/users/verify-user-id?type=2';
            this.router.navigateByUrl(url);
          }
        }
      })
    );
  }

  /**
   * @description Select business details from modal
   * @param bankAccountId Account id @type string
   * @param data Selected bank details
   */
  selectBusiness(
    bankAccountId: string,
    data: IBankData & { businessDetails: IBusinessDetails[] }
  ) {
    const { url } = this.router;
    let word;
    if (url) {
      word = url.split('manage/')[1].split('/')[0];
    }
    const ref = this.dialog.open<SelectBusinessComponent, ISelectBizData>(
      SelectBusinessComponent,
      {
        width: '450px',
        maxWidth: '95%',
        disableClose: true,
        data: {
          bankData: data,
          applicationStatus: this.kycKybStatus,
          sourceType: CVSourceType.ACH,
          from: word
        }
      }
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.businessId) {
        this.openLoaderModal(res.businessId, bankAccountId, res.selectedBusiness);
      }else if (data?.is_virtual_account === 0){
        this.setAccounts();
      }
    });
  }

  /**
   * All Bank Accounts Data download
   * @param body - Payload of the API
   */
  exportAllBankAccountsData(body: IExportAllBankAccounts) {
    return this.http.post<IApiRes<{ url: string }>>(
      `${this.ROOT_URL}/bank-accounts/export`,
      body
    );
  }

  /**
   * @description Loader modal for account create
   * @param businessId Business id
   * @param bankAccountId Account id
   */
  openLoaderModal(businessId: string, bankAccountId: string, selectedBusiness?: string) {
    const loader = this.dialog.open<LoaderModalComponent, IActionLoaderData>(
      LoaderModalComponent,
      {
        maxWidth: '400px',
        width: '80%',
        minHeight: '200px',
        height: 'unset',
        disableClose: true,
        data: { type: { ach: { businessId, bankAccountId } } }
      }
    );

    loader.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.v3DataTableService.refreshV3DataTable();
        this.setAccounts();
      }else if(res?.errorCode === 10021){
        const editDialogRef = this.dialog.open(EditBankAccountModalComponent, {
          maxWidth: '510px',
          width: '100%',
          disableClose: true,
          autoFocus: false,
          data: { id: bankAccountId, businessName: selectedBusiness }
        });
        editDialogRef.afterClosed().subscribe((updatedData) => {
          if (updatedData) {
            this.openLoaderModal(businessId, bankAccountId, selectedBusiness);
          }
        });
      }
    });
  }

  /**
   * @description Modal for adding new business
   * @param bankAccountId Account id
   */
  addBusinessModal(bankAccountId: string) {
    this.dialog.open<AddBusinessModalComponent, IAddBizData>(
      AddBusinessModalComponent,
      {
        maxWidth: '95%',
        width: '950px',
        height: '835px',
        data: { sourceType: CVSourceType.ACH, bankAccountId }
      }
    );
  }

  /**
   * @description Micro deposit modal opens and after close it refresh the data table and fetch update latest changed data
   * @param val Selected bank details
   */
  microDeposit(val: IBankData) {
    const dialog = this.dialog.open(ConfirmMicroDepositModalComponent, {
      maxWidth: '750px',
      width: '500px',
      data: val
    });
    dialog.afterClosed().subscribe(() => {
      this.setAccounts();
    });
  }

  /**
   * @description Reset the bankData$
   */
  resetData() {
    this.bankAccountsStateSignal.update((value) => ({
      ...value,
      selectedBankAccount: undefined
    }));
  }

  /**
   * @description Get the bank accounts list
   * @returns
   */
  getAccounts(): Observable<IBankData[]> {
    return this.bankAccounts$;
  }

  /**
   * @description Get total bank account count
   * @returns
   */
  getAccountsCount(): Observable<number> {
    return this.bankAccountsCount$;
  }

  /**
   * The function preSelectBankAccount sets a pre-selected bank account.
   * @param {IBankData} account - The parameter `account` is of type `IBankData`, which represents bank
   * account data.
   */
  preSelectBankAccount(account: IBankData): void {
    this.preSelectedBankAccount = account;
  }

  /**
   * @description To update into latest bank account list and count
   */
  setAccounts(filtervalue = '', bankAccountId?: string) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const searchInput = parseFloat(filtervalue);
    let bankAccountNumberLast4;
    let bankAccountNickName;

    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(searchInput) && filtervalue.length <= 4) {
      bankAccountNumberLast4 = {
        filterType: 'text',
        type: 'contains',
        filter: filtervalue
      };
    } else {
      bankAccountNickName = {
        filterType: 'text',
        type: 'contains',
        filter: filtervalue
      };
    }

    let filterModel: Record<string, unknown> = bankAccountNickName
      ? { bank_account_nick_name: bankAccountNickName }
      : { bank_account_number_last4: bankAccountNumberLast4 };

    if (!filtervalue) filterModel = {};

    const postData = {
      endRow: 20,
      filterModel,
      groupKeys: [],
      pivotCols: [],
      pivotMode: false,
      rowGroupCols: [],
      bankAccountId,
      sortModel: [],
      startRow: 0,
      valueCols: []
    };
    this.bankAccountsStateSignal.update((value) => ({
      ...value,
      bankAccountLoading: true
    }));
    this.subscriptions.push(
      this.dataTableService
        .getTableListData(postData, this.tableId)
        .pipe(
          finalize(() => {
            this.bankAccountsStateSignal.update((value) => ({
              ...value,
              bankAccountLoading: false
            }));
          })
        )
        .subscribe((res) => {
          if (res && res.rowData) {
            const rowData: IBankData[] = [];
            if (this.preSelectedBankAccount !== undefined) {
              let accountExistOnApiIndex: undefined | number;
              // finding if the bank account already exists on the api list
              (res.rowData as IBankData[]).forEach((apiBankAccount, index) => {
                if (
                  apiBankAccount.encrypted_bankacc_id ===
                  this.preSelectedBankAccount?.encrypted_bankacc_id
                ) {
                  accountExistOnApiIndex = index;
                }
              });
              // if data doesn't exist on api, then prepends to the list
              if (accountExistOnApiIndex === undefined) {
                rowData.push(this.preSelectedBankAccount as IBankData);
              }
              // selecting the this.preSelectedBankAccount
              this.bankAccountsStateSignal.update((value) => ({
                ...value,
                selectedBankAccount: this.preSelectedBankAccount
              }));
              // clearing the this.preSelectedBankAccount after use to prevent using it again.
              this.preSelectedBankAccount = undefined;
            }
            rowData.push(...(res.rowData as IBankData[]));
            this.bankAccountsStateSignal.update((value) => ({
              ...value,
              bankAccountList: rowData,
              bankAccountCount: res.rowCount
            }));
            const { firstAccSelected } =
              this.activatedRoute.snapshot.queryParams;
            if (firstAccSelected || bankAccountId) {
              this.bankAccountsStateSignal.update((value) => ({
                ...value,
                selectedBankAccount:
                  this.bankAccountsStateSignal().bankAccountList[0]
              }));
            }
            const current = res?.rowData.filter(
              (item: IBankData) =>
                item?.encrypted_bankacc_id ===
                this.selectedBankAccountSignal()?.encrypted_bankacc_id
            );
            if (current?.length) {
              this.bankAccountsStateSignal.update((value) => ({
                ...value,
                selectedBankAccount: current[0]
              }));
            }
          }
          if (!res.success && res.permissionType === 'page') {
            this.router.navigateByUrl(
              this.router.url.includes('v4') ? '/v4/manage/permission-denied' : '/manage/permission-denied'
            );
          }
        })
    );
  }

  /**
   * @description update the bankAccounts$
   */
  updateAccounts(updatedValue: IBankData) {
    const currentValue = this.bankAccountsSignal();
    const newValue = currentValue.map((item) =>
      item.id === updatedValue.id ? updatedValue : item
    );
    this.bankAccountsStateSignal.update((value) => ({
      ...value,
      bankAccountList: newValue,
      selectedBankAccount: updatedValue
    }));

    const newBank = {
      ...(this.checkNumberSignal() as IBankAccountEditDetails),
      bankAccountAddressLine1: updatedValue.bank_account_address_line_1,
      bankAccountAddressLine2: updatedValue.bank_account_address_line_2,
      bankAccountPhone: updatedValue.bank_account_phone,
      bankAccountEmail: updatedValue.bank_account_email,
      bankAccountCity: updatedValue.bank_account_city,
      bankAccountState: updatedValue.bank_account_state,
      bankAccountCountry: updatedValue.bank_account_country,
      bankAccountZip: updatedValue.bank_account_zip
    };

    const accountInfo = this.storedcheckNumberSignal();
    accountInfo[newBank.id] = newBank;
    this.selectedBankInfoStateSignal.update((val) => ({
      ...val,
      bankAccountInfo: newBank,
      storeBankAccountInfo: accountInfo
    }));
  }

  /**
   * @description delete bankAccount from bankAccounts$
   */
  deleteAccount(toBeDeleted: IBankData) {
    const bankAccounts = this.bankAccountsSignal();
    bankAccounts.forEach((item, index) => {
      if (item.encrypted_bankacc_id === toBeDeleted.encrypted_bankacc_id) {
        bankAccounts.splice(index, 1);
      }
    });
    this.bankAccountsStateSignal.update((value) => ({
      ...value,
      bankAccountList: bankAccounts,
      selectedBankAccount: this.bankAccountsSignal()[0],
      bankAccountCount: bankAccounts.length
    }));
  }

  /**
   * @description To get the next 300 bank accounts
   * @param page
   */
  getRemainingAccounts(page: number) {
    const endRow = page * 20;
    const postData = {
      endRow,
      filterModel: {},
      groupKeys: [],
      pivotCols: [],
      pivotMode: false,
      rowGroupCols: [],
      sortModel: [],
      startRow: endRow - 20,
      valueCols: []
    };
    this.isRemainingLoading = true;
    this.subscriptions.push(
      this.dataTableService
        .getTableListData(postData, this.tableId)
        .pipe(
          finalize(() => {
            this.isRemainingLoading = false;
          })
        )
        .subscribe((res) => {
          if (res) {
            /**
             * If the same data exists in both the API and the current list due to the logics (regards this.preSelectedBankAccount) in the "setAccount" method,
             * we'll update the list with the new data from the server, removing any existing data from it.
             */
            let currentValue: IBankData[] = [];
            try {
              currentValue = JSON.parse(
                JSON.stringify(this.bankAccountsSignal())
              ) as IBankData[];
            } catch (error) {
              currentValue = [];
            }
            currentValue = currentValue.filter((existingAccount) => {
              let isAccountExistOnApi = false;
              (res.rowData as IBankData[]).forEach((apiBankAccount) => {
                if (apiBankAccount.id === existingAccount.id) {
                  isAccountExistOnApi = true;
                }
              });
              return !isAccountExistOnApi;
            });
            const updatedValue = [...currentValue, ...res.rowData];
            this.bankAccountsStateSignal.update((value) => ({
              ...value,
              bankAccountList: updatedValue,
              bankAccountCount: res.rowCount
            }));
            this.bankAccounts$.next(updatedValue);
            this.bankAccountsCount$.next(res.rowCount);
          }
        })
    );
  }

  /**
   * @description Set the check number and address for a bank account
   * @param bankId selected bank id
   */
  setCheckNumberAndAddress(bankId: string,isRefresh = false) {
    const accountInfo = this.storedcheckNumberSignal();
    if (accountInfo[bankId] && !isRefresh) {
      this.selectedBankInfoStateSignal.update((value) => ({
        ...value,
        bankAccountInfo: accountInfo[bankId]
      }));
      return;
    }
    this.selectedBankInfoStateSignal.update((value) => ({
      ...value,
      bankAccountInfoLoading: true
    }));
    this.subscriptions.push(
      this.bankAccountsService
        .viewBankById(bankId)
        .pipe(
          finalize(() => {
            this.selectedBankInfoStateSignal.update((value) => ({
              ...value,
              bankAccountInfoLoading: false
            }));
          })
        )
        .subscribe((res) => {
          if (res) {
            accountInfo[bankId] = res.data;
            this.selectedBankInfoStateSignal.update((value) => ({
              ...value,
              bankAccountInfo: res.data,
              storeBankAccountInfo: accountInfo
            }));
            this.checkNumberAndAddress$.next(res);
          }
        })
    );
  }

  /**
   * @description To select bank account
   * @param item @type IBankData
   * @returns
   */
  selectBankAccount(item: IBankData) {
    if (item.id === this.selectedBankAccountSignal()?.id) {
      return;
    }
    this.sharedService.selectedPayees.reset();
    this.accountNumberVisible = false;
    this.bankAccountsStateSignal.update((value) => ({
      ...value,
      selectedBankAccount: item
    }));
    this.showDropDown = !this.showDropDown;
  }

  /**
   * @description Method to get total account count.
   */
  setTotalBankAccountsCount() {
    this.subscriptions.push(
      this.userService
        .getUserOverallData()
        .pipe(take(1))
        .subscribe((res) => {
          if (res.success) {
            this.totalBankAccountsCount$.next(res.data.bankAccountCount);
          }
        })
    );
  }

  /**
   * @description Get audit trial data of the selected bank
   * @param id Selected Bank id
   */
  getAuditTrial(id: string, isRefresh = false) {
    const auditTrails = this.storedAuditTrailSignal();
    if (auditTrails[id] && !isRefresh) {
      this.selectedBankInfoStateSignal.update((value) => ({
        ...value,
        auditTrailList: auditTrails[id]
      }));
      return;
    }

    this.selectedBankInfoStateSignal.update((value) => ({
      ...value,
      auditTrailLoading: true
    }));

    this.paymentsService
      .bankAccountsAuditTrial(id)
      .pipe(
        finalize(() => {
          this.selectedBankInfoStateSignal.update((value) => ({
            ...value,
            auditTrailLoading: false
          }));
        })
      )
      .subscribe((res) => {
        auditTrails[id] = res.data;
        this.selectedBankInfoStateSignal.update((value) => ({
          ...value,
          auditTrailList: auditTrails[id],
          storeAuditTrails: auditTrails
        }));
      });
  }

  /**
   * @description Getter for total bank accounts count subject.
   */
  get getTotalBankAccountsCount() {
    return this.totalBankAccountsCount$.asObservable();
  }

  /**
   * @description Used to reset signal value to default value.
   */
  resetSignal() {
    this.bankAccountsStateSignal.set(this.defaultBankAccountsState);
    this.selectedBankInfoStateSignal.set(this.defaultSelectedBankState);
  }

  /**
   * @description Checks if there is a pending ACH application for a given bank account.
   * @param {IBankData} bank - The bank data object containing information about the bank account.
   * @returns {boolean} Returns true if there is a pending ACH application, otherwise false.
   */
  isAchPending(bank: IBankData, isV4 = false): boolean {
    if (
      bank.ach_application_status === 0 ||
      bank.ach_application_status === 2 ||
      bank.ach_application_status === 7
    ) {
      const alertSvc = isV4 ? this.v4AlertService : this.alertService;
      alertSvc.warningAlert({
        content: `Sorry, you have a pending ACH application for this bank account. So you can't delete this bank account until the application is processed.`
      });
      return true;
    }
    return false;
  }

  onCreateBankAccount() {
    if (this.bankAccountsService.isPermissionPopupEnabled) {
      return;
    }

    if (this.payeeOnboardingService.payeeOnboardingSignal().initiatorId) {
      this.router.navigate(['/manage/payee-onboarding/set-password']);
      return;
    }

    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        if (isUser) {
          this.bankAccountsService.isPermissionPopupEnabled = true;
          this.subscriptions.push(
            this.bankAccountsService
              .AddBank({ permission_check_to_create_bank_account: '' })
              .pipe(
                finalize(() => {
                  this.bankAccountsService.isPermissionPopupEnabled = false;
                })
              )
              .subscribe({
                next: (_) => {
                  this.router.navigate([`/manage/users/add-bank-account`], {
                    queryParams: { returnUrl: '/manage/bank-accounts/index' }
                  });
                }
              })
          );
        } else {
          this.router.navigate([`/manage/users/add-bank-account`], {
            queryParams: { returnUrl: '/manage/bank-accounts/index' }
          });
        }
      })
    );
  }

  /**
   * @description Unsubscribe all subscriptions when the component destroys
   */
  ngOnDestroy(): void {
    this.resetSignal();
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
