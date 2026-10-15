import { Injectable, inject } from '@angular/core';
import {
  Subject,
  Observable,
  Subscription,
  finalize,
  fromEvent,
  BehaviorSubject,
  firstValueFrom,
  tap
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { IConfirmAlert, ISuccessAlert } from 'src/app/models/alert';
import { ActivatedRoute, Router } from '@angular/router';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { IInvitedCompany, IOwnCompany } from 'src/app/layout/model/header';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { AlertService } from '../alert/alert.service';
import { V4AlertService } from '../alert/v4-alert.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { HeaderService } from '../header/header.service';
import { toV4IfEnabled } from '../route/v4-route-mapper';

@Injectable({
  providedIn: 'root'
})
export class CompanyManagementService {
  ROOT_URL = environment.rootUrl;
  loading = {
    default: false,
    buttonDisabling: false,
    autoAccepting: false,
    sending: undefined as undefined | number,
    removingAccess: undefined as undefined | number,
    accepting: undefined as undefined | number,
    rejecting: undefined as undefined | number,
    checkingAccess: false
  };

  subscriptions: Subscription[] = [];
  changeCompany = new Subject<boolean>();
  ownCompanies: IOwnCompany[] = [];
  invitedCompanies: IInvitedCompany[] = [];
  ocwInitialLoader = false;

  returnUrl: string;
  returnUrlIfCompanyZero: string;
  backEvent: Subscription;

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  private localStorageService = inject(LocalStorageService);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  invitedCompanySubject = new BehaviorSubject(<IInvitedCompany>{});

  private isComapanyLoaded = new BehaviorSubject<boolean>(false);
  public isComapanyLoaded$ = this.isComapanyLoaded.asObservable();

  private env = environment;

  /**
   * Prevents navigation back using the browser history.
   */
  preventBack(): void {
    // eslint-disable-next-line no-restricted-globals
    history.pushState(null, '', location.href);
    this.subscriptions.push(
      (this.backEvent = fromEvent(window, 'popstate').subscribe(() => {
        // eslint-disable-next-line no-restricted-globals
        history.pushState(null, '', location.href);
      }))
    );
  }

  onSelectedCompany(data: IInvitedCompany,isItInvitedCompany:boolean): void {
    if(isItInvitedCompany && (this.env.env_id !== 'compass' && this.env.env_id !== 'csnhc')){
      this.checkCompanyPermssion(data);
    }else{
      this.setCompany(data);
    }
  }

  async checkCompanyPermssion(company: IInvitedCompany){
    try {
      const hasPermission = await this.checkPermission(company.companyId);
      if (hasPermission) {
        this.setCompany(company);
      }
    } catch (error) { /* empty */ }
  }

  setCompany(company: IInvitedCompany){
    if (company.status === 0 || company.status === 3) {
      return;
    }
    this.setActiveCompanyInfo(company.companyId, company.companyName, company.type, company.isItDefault ? 1 : 0);
    this.navigateBack();
    this.headerService.getRefillRewards();
  }

  /**
   * Sets active company information in the local storage.
   * @param id - The ID of the active company.
   * @param name - The name of the active company.
   * @param type - The type of the active company ('owncmp' or 'invcomp').
   */
  setActiveCompanyInfo(id: string, name: string, type: string, isItDefault: number): void {
    this.localStorageService.setItem('activeCompanyName', name);
    this.localStorageService.setItem('activeCompanyId', id);
    this.localStorageService.setItem('activeCompanyType', type); // owncmp  or invcomp
    this.localStorageService.setItem('isParentCompany', isItDefault ?? 0);
  }

  /**
   * Sets a value to detect company dropdown change.
   * @param isChange - A boolean indicating whether the company dropdown has changed.
   */
  setCompanyChange(isChange: boolean) {
    this.changeCompany.next(isChange);
  }

  /**
   * Gets an observable for detecting company dropdown changes.
   * @returns Observable indicating whether the company dropdown has changed.
   */
  get getCompanyChange$(): Subject<boolean> {
    return this.changeCompany;
  }

  /**
   * Gets an observable for detecting company dropdown changes.
   * @returns Observable indicating whether the company dropdown has changed.
   */
  getCompanyChanges(): Observable<boolean> {
    return this.changeCompany.asObservable();
  }

  /**
   * Loads all companies, updating the component state.
   */
  loadAllCompanies(): void {
    // Need to set these as empty or else it is showing previously loaded values.
    this.ownCompanies = [];
    this.invitedCompanies = [];

    this.loading.default = true;
    this.loading.buttonDisabling = true;
    this.subscriptions.push(
      this.companySwitchRepo
        .getAllCompanies()
        .pipe(
          finalize(() => {
            this.loading.default = false;
            this.loading.buttonDisabling = false;
            this.isComapanyLoaded.next(true);
          })
        )
        .subscribe((res) => {
          this.invitedCompanies = res.data.invitedCompanies?.filter(
            (element: IInvitedCompany) => element.status !== 2
          );
          if (
           ( this.env.env_id === 'compass' || this.env.env_id === 'csnhc' ) &&
            this.invitedCompanies &&
            this.invitedCompanies?.length !== 0
          ) {
            this.onSelectedCompany(this.invitedCompanies[0],true);
          }
          this.ownCompanies = res.data.ownCompanies;

          this.ownCompanies?.forEach((e: IOwnCompany) => {
            e.type = 'owncmp';
          });
          this.invitedCompanies?.forEach((e: IInvitedCompany) => {
            e.type = 'invcomp';
          });
          if (!this.invitedCompanies) {
            this.invitedCompanies = [];
          }
        })
    );
  }

  /**
   * @description Retrieves and sets query parameters and determines the 'returnUrl' based on certain conditions.
   */
  getQueryParams() {
    if(environment.env_id === 'csnhc') {
      this.returnUrl = '/manage/home';
      return;
    }
    /** Get the 'defaultPage' of the user from local storage. */
    const landingPage = this.localStorageService.getItem('defaultPage');
    const v3RemovedUrl = landingPage?.replace(/\/?v3\/?/, '') || undefined;
    const defaultPage = v3RemovedUrl ?? '/manage/verification/index';
    if (
      this.route.snapshot.queryParams.returnUrl !==
        '/manage/company_management' &&
      this.route.snapshot.queryParams.returnUrl !== undefined
    ) {
      this.returnUrl = this.route.snapshot.queryParams.returnUrl;
    } else if (
      (environment.env_id === 'compass') &&
      defaultPage === '/manage/payments-table/index'
    ) {
      this.returnUrl = '/manage/payments-table/check';
    } else {
      this.returnUrl = defaultPage;
    }
  }

  /**
   * Accepts an invitation from a company.
   * @param i - The index of the invited company in the list.
   * @param data - The data object containing information about the company.
   */
  acceptCompany(i: number, data: IInvitedCompany, autoAcceptCompany: boolean = false) {
    this.loading.accepting = i;
    this.loading.buttonDisabling = true;
    this.subscriptions.push(
      this.companySwitchRepo
        .acceptCompany(data.id)
        .pipe(
          finalize(() => {
            this.loading.accepting = undefined;
            this.loading.buttonDisabling = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Company invitation accepted.');
            this.invitedCompanies[i].status = 1;
            if(autoAcceptCompany){
                this.onSelectedCompany(this.invitedCompanies[i], true);
              }
          }
        })
    );
  }

  /**
   * Rejects an invitation from a company.
   * @param i - The index of the invited company in the list.
   * @param data - The data object containing information about the company.
   */
  rejectCompany(i: number, data: IInvitedCompany) {
    this.loading.rejecting = i;
    this.loading.buttonDisabling = true;
    this.subscriptions.push(
      this.companySwitchRepo
        .rejectCompany(data.id)
        .pipe(
          finalize(() => {
            this.loading.rejecting = undefined;
            this.loading.buttonDisabling = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Company invitation rejected.');
            this.invitedCompanies[i].status = 2;
            this.invitedCompanies.splice(i, 1);
          }
        })
    );
  }

  /**
   * Removes access to a company.
   * @param i - The index of the company in the list.
   * @param data - The data object containing information about the company.
   */
  removeAccess(i: number, data: IInvitedCompany) {
    this.loading.removingAccess = i;
    this.loading.buttonDisabling = true;
    this.subscriptions.push(
      this.companySwitchRepo
        .removeAccess(data.id)
        .pipe(
          finalize(() => {
            this.loading.removingAccess = undefined;
            this.loading.buttonDisabling = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Access removed.');
            this.invitedCompanies.splice(i, 1);
          }
        })
    );
  }

  /**
   * Resends an invitation to a company.
   * @param i - The index of the company in the list.
   * @param data - The data object containing information about the company.
   */
  resendCompany(i: number, data: IInvitedCompany) {
    this.loading.sending = i;
    this.loading.buttonDisabling = true;
    this.subscriptions.push(
      this.companySwitchRepo
        .resendInvitation(data.id)
        .pipe(
          finalize(() => {
            this.loading.sending = undefined;
            this.loading.buttonDisabling = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.openSuccessAlert('Invitation sent.');
          }
        })
    );
  }

  /**
   * Sets a value in the local storage.
   * @param key - The key for the local storage item.
   * @param value - The value to be stored.
   */
  setStorage(key: LocalStorageKeys, value: string | unknown) {
    this.localStorageService.setItem(key, value);
  }

  /**
   * Opens a success alert with the provided content.
   * @param content - The content to be displayed in the success alert.
   */
  openSuccessAlert(content: string) {
    const data: ISuccessAlert = { content };
    return this.alertService.successAlert(data);
  }

  /**
   * Opens a confirmation alert with the provided content.
   * @param content - The content to be displayed in the confirmation alert.
   */
  openConfirmAlert(content: string) {
    const data: IConfirmAlert = { content };
    return this.alertService.confirmAlert(data);
  }

  /**
   * Navigates back to the previous route or the specified return URL.
   *
   * For v4 users, `returnUrl` (a v3 path) is translated to its v4 equivalent
   * via the shared route mapper before navigation. `this.returnUrl` is
   * overwritten with the translated value so the first-loader branch (which
   * reads `companyManagementService.returnUrl` via its template input) also
   * navigates into the v4 UI.
   */
  navigateBack(): void {
    const isV4 = this.localStorageService.getItem('isV4LayoutEnabled') === 1;
    const targetUrl = isV4
      ? toV4IfEnabled(this.returnUrl ?? '', this.localStorageService)
      : (this.returnUrl || '/manage/cheque/checkrecords');
    if (isV4) {
      this.returnUrl = targetUrl;
    }

    const getLoadVal = this.localStorageService.getItem('ocwLoad');
    if (
      getLoadVal == null &&
      this.staticWhiteLabelConditions.showOcwInitialLoader
    ) {
      this.ocwInitialLoader = true;
      this.loading.autoAccepting = false;
    } else {
      this.router.navigateByUrl(targetUrl)
      .then(() => {
        this.loading.autoAccepting = false;
      });
      this.ocwInitialLoader = false;
    }
  }

  /**
   * Checks if an active company ID exists in the local storage.
   * @returns A boolean indicating the existence of an active company ID.
   */
  checkActiveCompanyIdExist(): string | boolean {
    return !!this.localStorageService.getItem('activeCompanyId');
  }

  /**
   * Checks if an active company name exists in the local storage.
   * @returns A boolean indicating the existence of an active company name.
   */
  checkActiveCompanyNameExist(): string | boolean {
    return !!this.localStorageService.getItem('activeCompanyName');
  }

  /**
   * Gets the active company ID from the local storage.
   * @returns The active company ID.
   */
  getActiveCompanyId(): string {
    return this.localStorageService.getItem('activeCompanyId');
  }

  /**
   * Gets the active company name from the local storage.
   * @returns The active company name.
   */
  getActiveCompanyName(): string {
    return this.localStorageService.getItem('activeCompanyName');
  }

  /**
   * Gets the active company type from the local storage.
   * @returns The active company type.
   */
  getActiveCompanyType(): string {
    return this.localStorageService.getItem('activeCompanyType');
  }

  async checkPermission(companyId: string): Promise<boolean> {
    // Retrieve the value of isLoginFromSua from localStorage
    const isLoginFromSua =  this.localStorageService.getItem('ocw-admin') || false;

    // If isLoginFromSua is true, directly return true without calling the API
    if (isLoginFromSua) {
      return true;
    }
    const parentCompanyId = this.localStorageService.getItem('parentCompanyId') || '';
    if (!parentCompanyId) {
      return true;
    }
    const response = await firstValueFrom(
      this.companySwitchRepo.checkIpPermission(parentCompanyId, companyId)
    );
    return Boolean(response.success);
  }

  checkCompanyAccessPermission(
    companyId: string, 
    onSuccess: (data: {success:boolean,access:number,errorMsg:string,errorCode:number}) => void,
    onError?: (data: {success:boolean,access:number,errorMsg:string,errorCode:number}) => void
  ) {
    this.loading.checkingAccess = true;
    return this.companySwitchRepo.checkCompanyAccessPermission(companyId)
    .pipe(
      finalize(() => {
        this.loading.checkingAccess = false;
      }),
      tap((res) => {
        if(res.success && res.data.success && res.data.access === 1){
          onSuccess(res.data);
        }else{
          this.handleAccessError(res.data,onError);
        }
      })
    );
  }

  handleAccessError(data: {success:boolean,access:number,errorMsg:string,errorCode:number},onError?: (data: {success:boolean,access:number,errorMsg:string,errorCode:number}) => void) {
    if(data.errorCode === 145 || data.errorCode === 144){
      const dialogRef = this.v4AlertService.warningAlert({
        title: 'Error',
        content: data.errorCode === 144 ? 'Please accept the company invitation to access the company.' : data.errorMsg
      });
      dialogRef.afterClosed().subscribe(() => {
        this.router.navigate(['manage/company_management/select_company_dashboard']);
      });
      return;
    }
    if(onError){
      onError(data);
      return;
    }
    this.v4AlertService.warningAlert({
      title: 'Error',
      content: data.errorMsg
    });
  }

  /**
   * Clears all subscriptions.
   */
  clearSubsciptions() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
