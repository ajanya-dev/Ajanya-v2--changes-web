import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { MatDialog } from '@angular/material/dialog';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { TCButtonType } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { environment } from 'src/environments/environment';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { faArrowDownToLine, faArrowsRotate, faCodeMerge } from '@fortawesome/pro-solid-svg-icons';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { IConnectedThirdPartyData } from 'src/app/modules/integration/model/integration';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { PayeeImportModalComponent } from '../payee-connection-modal/payee-import-modal.component';
import { PayeeViewOcwV35Component } from '../payee-view-ocw-v35/payee-view-ocw-v35.component';
import { PayeeInternationalAccV35Component } from '../payee-international-acc-v35/payee-international-acc-v35.component';
import { PayeeBankAccV35Component } from '../payee-bank-acc-v35/payee-bank-acc-v35.component';
import { PayeeTransactionsOcwV35Component } from '../payee-transactions-ocw-v35/payee-transactions-ocw-v35.component';
import { EllipsisActiveDirective } from '../../../../../directive/ellipsis-active.directive';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { WhiteLabelDirective } from '../../../../../directive/white-label.directive';
import { BankAccountTableComponent } from '../bank-account-table/bank-account-table.component';
import { InternationalAccountTableComponent } from '../international-account-table/international-account-table.component';

@Component({
  selector: 'app-payee-details-ocw-v35',
  templateUrl: './payee-details-ocw-v35.component.html',
  styleUrls: ['./payee-details-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    MatProgressBar,
    NgClass,
    WhiteLabelDirective,
    FaIconComponent,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    DemoVideoComponent,
    CommonButtonV35Component,
    EllipsisActiveDirective,
    PayeeTransactionsOcwV35Component,
    PayeeBankAccV35Component,
    PayeeInternationalAccV35Component,
    PayeeViewOcwV35Component,
    WhiteLabelPipe,
    BankAccountTableComponent,
    InternationalAccountTableComponent
  ]
})
export class PayeeDetailsOcwV35Component implements OnInit, OnDestroy {
  /** dependancy injection using inject method */
  private router = inject(Router);
  public payeeDataService = inject(PayeeDataV35Service);
  private checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private paymentService = inject(PaymentsService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private store = inject(Store);
  private payeeModalService = inject(PayeeModalService);
  private integrationService = inject(IntegrationService);

  @ViewChild('mainSection') mainSection: ElementRef<HTMLDivElement>;

  /** variables */
  destroy$ = new Subject();
  activeTab = 'details';
  isGridView = true;
  sendButtonType: TCButtonType = { style: 'green', name: 'money-action' };
  receiveButtonType: TCButtonType = { style: 'blue', name: 'money-action' };
  achInviteButtonType: TCButtonType = { style: 'violet', name: 'money-action' };
  editButtonType: TCButtonType = 'list';
  activeAccTab = 'domestic';
  isShadow: boolean;
  env = environment;
  importDropDown = false;
  subscriptions: Subscription[] = [];
  isWhiteLabel: boolean = false;
  ltrTransition = false;
  isNoSearchResult = false;
  whiteLabelName = environment.env_id === 'compass' ? 'Vendor' : 'Payee';
  isCSNHCRequirement = signal(environment.env_id === 'csnhc');

  faCodeMerge = faCodeMerge;
  faArrowsRotate = faArrowsRotate;
  faArrowDownToLine = faArrowDownToLine;

  hubspotDetails: IConnectedThirdPartyData | null = null;
  isHubSpotImportEnabled = signal(false);

  jobberDetails: IConnectedThirdPartyData | null = null;
  isJobberImportEnabled = signal(false);

  clioDetails: IConnectedThirdPartyData | null = null;
  isClioImportEnabled = signal(false);

  payeeSummaryDataSignal = computed(
    () => this.payeeDataService.payeeSummarySignal()
  );

  payeeSummaryLoadingSignal = computed(
    () => this.payeeDataService.payeeSummarySignal().loading
  );

  summaryTab = signal<'bank' | 'cash'>('bank');
  summaryOptions = [
    {
      label: 'Bank',
      value: 'bank'
    },
    {
      label: 'Cash Expense',
      value: 'cash'
    }
  ];

  constructor() {
    this.getPayeeDetails();
    this.getAction();
    this.getHubspotDetails();
    this.getJobberDetails();
    this.getClioDetails();
  }

  ngOnInit() {
    this.getPayeeSearchResult();
    this.isWhiteLabel =
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isWhiteLabel'
      );
  }

  /**
   * @description subscribing the observables when initializing the component
   * on Every payee changes it will call the functions to get complete details about payee
   */
  getPayeeDetails() {
    toObservable(this.payeeDataService.payeeDataSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.loadPayeeSummary();
        }
      });
    toObservable(this.payeeDataService.editedPayeeSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.payeeDataService.payeeDataSignal.set(res);
        }
      });
  }

  /**
   * @description this function is used to get the menu selected from the ag grid table and the corresponding tab will be selected
   */
  getAction() {
    toObservable(this.payeeDataService.actionSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        switch (res) {
          case 'more': {
            this.activeTab = 'more';
            break;
          }
          case 'accounts': {
            this.activeTab = 'details';
            this.activeAccTab = 'domestic';
            break;
          }
          case 'domestic': {
            this.activeTab = 'details';
            this.activeAccTab = 'domestic';
            break;
          }
          case 'international': {
            this.activeTab = 'details';
            this.activeAccTab = 'international';
            break;
          }
          case 'details': {
            this.activeTab = 'details';
            break;
          }
          default:
        }
      });
  }

  /**
   * @description payee transaction summary amounts will be fetched
   * if the encryptedId is not exist then it will @returns without moving into next steps
   */
  loadPayeeSummary(): void {
    if (this.payeeDataService.payeeDataSignal()?.encryptedId === '') return;
    this.payeeDataService.payeeSummarySignal.update((val) => ({
      ...val,
      loading: true
    }));
    this.subscriptions.push(
      this.checkService
        .getPayeeSummary(
          this.payeeDataService.payeeDataSignal()?.encryptedId as string
        )
        .pipe(
          finalize(() => {
            this.payeeDataService.payeeSummarySignal.update((val) => ({
              ...val,
              loading: false
            }));
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          this.payeeDataService.payeeSummarySignal.update((val) => ({
            ...val,
            data: res.other,
            cashexpense: res.cash_expenses
          }));
        })
    );
  }

  /**
   * @description Opens the add payee modal.
   */
  openAddPayee() {
    this.subscriptions.push(
      this.payeeModalService
        .openAddPayee('addPayeeModal')
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                if (res?.success) {
                  res.encryptedId = res.id;
                  this.payeeDataService.payeeDataSignal.set(res);
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description open modal for editing existing payee
   * we want to pass the id of the payee to populate the fields
   */
  openEditPayee() {
    const payeeId = this.payeeDataService.payeeDataSignal()?.encryptedId
      ? this.payeeDataService.payeeDataSignal()?.encryptedId
      : (this.payeeDataService.payeeDataSignal()?.id as string);
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(payeeId as string, 'addPayeeModal', {
          edit: true,
          id: payeeId as string,
          type: 'string'
        })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                if (res?.success) {
                  this.store.dispatch(payeesActions.payeesReset());
                  res.encryptedId = res.id;
                  this.payeeDataService.payeeDataSignal.set(res);
                  this.payeeDataService.editedPayeeSignal.set(res);
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description Navigate into payment source and populate the selected payee
   * @param mode pay or recieve
   */
  goToPayments(mode: 'pay' | 'receive') {
    const payee = this.payeeDataService.payeeDataSignal();
    this.paymentService.initiatePaymentForm = { payee };
    if (mode === 'pay') {
      this.router.navigate(['/manage/payments/main/pay/bankaccount/check'], {
        state: { backUrl: this.router.url }
      });
    } else {
      this.router.navigate(['/manage/payments/main/receive/payer/bank'], {
        state: { backUrl: this.router.url }
      });
    }
  }

  /**
   * @description toggle the main tabs
   * @param val details || more || accounts
   */
  toggleTab(val: string) {
    if (this.activeTab === 'more') {
      this.ltrTransition = true;
    } else if (this.activeTab === 'accounts') {
      if (val === 'more') {
        this.ltrTransition = false;
      } else if (val === 'details') {
        this.ltrTransition = true;
      }
    } else {
      this.ltrTransition = false;
    }
    this.payeeDataService.actionSignal.update(() => val);
  }

  /**
   * @description toggle the sub tabs inside the accounts tab
   * @param val domestic || interntional
   */
  toggleAccTab(val: string) {
    this.activeAccTab = val;
    this.payeeDataService.payeeBankTableActions.update((res) => ({
      ...res,
      onClickNewBank: undefined
    }));
  }

  /**
   * @description navigate into import page
   */
  import() {
    this.router.navigateByUrl('/manage/payee/payee_data_import/step1');
  }

  /**
   * @description switch into grid view
   */
  gridView() {
    this.isGridView = true;
    this.payeeDataService.setPayeeView(true);
  }

  /**
   * @description switch into list view
   */
  listView() {
    this.isGridView = false;
    this.payeeDataService.setPayeeView(false);
  }

  onScroll() {
    if (
      !this.payeeDataService.payeeDataSignal() ||
      this.payeeDataService.loadingSigal()
    )
      return;
    const mainSectionElement = this.mainSection.nativeElement;
    if (mainSectionElement.scrollTop > 0) {
      this.isShadow = true;
    } else {
      this.isShadow = false;
    }
  }

  /**
   * @descripiton Mat menu close event will call this function
   */
  onMatMenuClosed() {
    this.importDropDown = false;
  }

  /**
   * @description open third party import modal
   */
  openThirdPartyImport() {
    const dialogRef = this.dialog.open(PayeeImportModalComponent, {
      maxWidth: '700px',
      disableClose: true,
      width: '33%',
      data: {
        type: 'payees'
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.getPayeeDetails();
    });
  }

  /**
   * @description method to get payee search result
   */
  getPayeeSearchResult() {
    this.subscriptions.push(
      this.payeeDataService
        .getPayeeSearchResult()
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res === false) {
            if (this.payeeDataService.payeeDataSignal()) {
              this.isNoSearchResult = true;
              this.payeeDataService.payeeDataSignal.set(undefined);
            }
          } else {
            this.isNoSearchResult = false;
          }
        })
    );
  }

  /**
   * @description Import Payee from netsuite.
   * This method is specially created for Compass Enterprise customers.
   */
  importFromNetSuite(): void {
    this.payeeDataService.importFromNetSuite();
  }

  updatePayees() {
    this.payeeDataService.updatePayeesFromNetSuit();
  }

  /**
   * @description Open ACH invite emial modal.
   * This modal specially cretad for Compass enterprise customer.
   */
  openAchInviteModal(): void {
    this.payeeDataService.openAchInviteModal();
  }

  newBankAccount(tab: string) {
    this.payeeDataService.payeeBankTableActions.update((val) => ({
      ...val,
      onClickNewBank: tab
    }));
  }

  getHubspotDetails() {
    if (environment.env_id === 'csnhc' || environment.env_id === 'compass') return;
    this.integrationService.getDetails('hubspot')
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.hubspotDetails = res.data;
          this.isHubSpotImportEnabled.set(!!this.hubspotDetails?.connected);
        }
      });
  }

  importFromHubSpot() {
    const connectedHubspotIds = this.hubspotDetails?.companies?.map(company => company.companyId);
    this.payeeDataService.importFromHubSpot(connectedHubspotIds);
  }

  getJobberDetails() {
    this.integrationService.getDetails('jobber')
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.jobberDetails = res.data;
          this.isJobberImportEnabled.set(!!this.jobberDetails?.connected);
        }
      });
  }

  importPayees() {
    this.payeeDataService.importFromDayForce();
  }

  importFromJobber() {
    const connectedJobberIds = this.jobberDetails?.companies?.map(company => company.companyId);
    this.payeeDataService.importFromJobber(connectedJobberIds);
  }

  getClioDetails() {
    this.integrationService.getDetails('clio')
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.clioDetails = res.data;
          this.isClioImportEnabled.set(!!this.clioDetails?.connected);
        }
      });
  }

  importFromClio() {
    const connectedClioIds = this.clioDetails?.companies?.map(company => company.companyId);
    this.payeeDataService.importFromClio(connectedClioIds);
  }

  /**
   * @descripiton unsubscribe the whole subscritions subscribed from this component
   * when the component is destroyed
   */
  ngOnDestroy() {
    this.destroy$.next(true);
    this.payeeDataService.clearSubscriptions();
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
