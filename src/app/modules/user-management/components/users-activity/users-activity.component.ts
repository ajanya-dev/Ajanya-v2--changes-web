import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  Component,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserManagment } from 'src/app/data/data/user';
import {
  IActivityExportPayload,
  IUserActivity,
  IUserRoute,
  IUsersList,
  StatusActions,
  UserActivityTypes
} from 'src/app/models/user';
import { WalletActionViewModalComponent } from 'src/app/shared/modal/wallet-modal/wallet-action-view-modal/wallet-action-view-modal.component';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatTooltip } from '@angular/material/tooltip';
import {
  DatePipe,
  NgClass,
  NgSwitch,
  NgSwitchCase,
  SlicePipe,
  TitleCasePipe
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { faArrowUpToLine, faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { UserWhitelistIpComponent } from '../user-whitelist-ip/user-whitelist-ip.component';
import { UserManagementV35Service } from '../../service/user-management-v35.service';
import { ClientType } from '../user-management-list-v35/user-management-list-v35.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { UserPermissionAuditLogComponent } from '../user-permission-audit-log/user-permission-audit-log.component';

/**
 * @description Component for listing a selected user's activity
 */
@Component({
  selector: 'app-users-activity',
  templateUrl: './users-activity.component.html',
  styleUrls: ['./users-activity.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    NgClass,
    FaIconComponent,
    CommonButtonV35Component,
    FormsModule,
    NgSwitch,
    NgSwitchCase,
    SlicePipe,
    TitleCasePipe,
    UserPermissionAuditLogComponent,
    MatMenuTrigger,
    MatMenu,
    DateRangeComponent
  ]
})
export class UsersActivityComponent implements OnDestroy, OnInit {
  public userManagementServiceV35 = inject(UserManagementV35Service);
  private datePipe = inject(DatePipe);
  private userService = inject(UserManagementService);
  private route = inject(Router);
  private dialog = inject(MatDialog);
  private alert = inject(AlertService);
  private localStorageService = inject(LocalStorageService);

  @Output() statusAction = new EventEmitter<StatusActions>();
  @Input() selectedUser: IUsersList;
  @Input() notFoundUser: string;
  @Input() loading = {
    default: false,
    buttonDisabling: false,
    accepting: undefined as undefined | number,
    sending: undefined as undefined | number,
    rejecting: undefined as undefined | number,
    deleting: undefined as undefined | number
  };

  selectedIndex: number = 0;

  activityTableListHeader = [
    'Action',
    'Ref No.',
    'Date',
    'Bank',
    'Source',
    'Source Name',
    'Amount',
    'Memo',
    'View'
  ];

  activityTableDateHeader = [
    'Action',
    'Ref No.',
    'Date',
    'Type',
    'Bank',
    'Source',
    'Source Name',
    'Amount',
    'Memo',
    'View'
  ];

  activityTabLabel: {id:string,name:UserActivityTypes}[] = [
    {id:'All',name:'All'},
    {id:'Cheque',name:'Check'},
    {id:'ACH',name:'ACH'},
    {id:'Wire',name:'Wire'},
    {id:'Virtual Card',name:'Virtual Card'},
    {id:'Check Mail',name:'Check Mail'},
    {id:'DirectDeposit',name:'Direct deposit'},
    {id:'Bill',name:'Bill'},
    {id:'CashExpense',name:'Cash Expense'},
    {id:'Depositslip',name:'Deposit Slip'},
    {id:'ReceivedCheckList',name:'Received Checklist'},
    {id:'OcwInvoice',name:'Invoice'},
    {id:'Wallet',name:'Wallet'}
  ];

  clientType = ClientType;

  subscriptions: Subscription[] = [];
  activityFilter = UserManagment.filterUserAcitivity();
  selectedFilter: 'list' | 'date' = 'list';
  datewiseActivities: IUserActivity;
  dateWiseActivityDetails: IUserRoute[];
  activityDetails: IUserActivity;
  usersDetails: IUsersList[];

  userId: string;
  availableTypes: UserActivityTypes[] = [];
  selectedType: UserActivityTypes[] = ['All'];
  displayStatus: 'waiting' | 'no_data' | 'empty' | null;
  tableCount = 5;
  isViewShowAll = true;
  isActivityLoaded = false;
  active: string;
  selectedTab: UserActivityTypes = 'All';
  lastActivityPage: number;
  isUserLoading = true;
  activeTab = 'activity';
  fromDate: string;
  toDate: string;
  filterAndExportLoading = signal(false);

  faArrowUptoLine = faArrowUpToLine;
  faSpinner = faSpinner;

  ngOnInit() {
    this.subscriptions.push(
      this.userManagementServiceV35.selectedUser$.subscribe((res) => {
        if (res) {
          this.isUserLoading = true;
          this.selectedUser = res;
          this.userId = res.client_id;
          this.loadUserActivity();
          this.loadUserDateWiseActivity();
        }
      }),
      this.userManagementServiceV35.selectedIndex$.subscribe((res) => {
        if (res) {
          this.selectedIndex = res;
        }
      }),
      this.userManagementServiceV35.loading$.subscribe((res) => {
        if (res) {
          this.loading = res;
        }
      }),
      this.userManagementServiceV35.notFoundUser$.subscribe((res) => {
        if (res) {
          this.notFoundUser = res;
          if (this.notFoundUser === 'not_found') {
            this.displayStatus = 'empty';
          }
        }
      }),
      this.userManagementServiceV35.usersDetails$.subscribe((res) => {
        if (res) {
          this.usersDetails = res;
        }
      })
    );
  }

  /**
   * @description Method to get and set selected user's activities
   */
  loadUserActivity(): void {
    if (this.userManagementServiceV35.usersDetails?.length) {
      this.userManagementServiceV35.isActivityLoaded = false;
      this.userManagementServiceV35.isActivityLoaded$.next(false);
    }
    this.subscriptions.push(
      this.userService
        .getAuditTrail(this.userId)
        .pipe(
          finalize(() => {
            this.userManagementServiceV35.isActivityLoaded = true;
            this.userManagementServiceV35.isActivityLoaded$.next(true);
            this.isActivityLoaded = true;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.notFoundUser = 'found';
            this.selectedTab = 'All';
            this.activityDetails = {...res.data};

            if (this.activityDetails.activities) {
              const reversedTypes = ['ACH', 'Wire','Check Mail','Virtual Card'] as const satisfies UserActivityTypes[];              
              reversedTypes.forEach(type => {
                const activityData = this.activityDetails.activities[type];
                if (activityData) {
                  // Handle both old array structure and new pagination structure
                  if (Array.isArray(activityData)) {
                    this.activityDetails.activities[type] = [...activityData].reverse();
                  } else if (activityData.data) {
                    activityData.data = [...activityData.data].reverse();
                  }
                }
              });

              this.availableTypes = Object.keys(
                this.activityDetails.activities
              ) as UserActivityTypes[];
              this.selectedType = this.availableTypes;
              if (this.selectedType.length >= 1) {
                this.lastActivityPage = this.selectedType.length - 1;
              }
            }
            this.getDisplayStatus();
          }
        })
    );
  }

  /**
   * @description Method to route to urls based on activity type
   * @param type - The type of activity from the activity list
   * @param row - current user activity
   */
  gotoUrl(type: string, row: IUserRoute) {
    if (row.currentStatus === 'deleted' && row.status !== 'deleted') {
      this.openWarningAlert(`This ${type} is Already Deleted`);
      return;
    }

    if (
      (type === 'Received Checklist' && row.status === 'created') ||
      row.status === 'deleted'
    ) {
      return;
    }

    if (type === 'Check') {
      this.route.navigateByUrl(`/manage/cheque/view/${row.referenceId}`);
    } else if (type === 'Cash Expense') {
      this.route.navigateByUrl(`/manage/cashexp/view/${row.referenceId}`);
    } else if (type === 'Bill') {
      this.route.navigateByUrl(`/manage/bill/view/${row.referenceId}`);
    } else if (type === 'Check Draft') {
      this.route.navigateByUrl(`/manage/checkdraft/view/${row.referenceId}`);
    } else if (type === 'Deposit Slip') {
      this.route.navigateByUrl(`/manage/depositslips/view/${row.referenceId}`);
    } else if (type === 'Received Checklist') {
      this.route.navigateByUrl(
        `/manage/receivedchecks/show/${row.referenceId}`
      );
    } else if (type === 'Invoice') {
      this.route.navigate(['/manage/invoice/statement'], {
        queryParams: {
          id: row.referenceId,
          type: row.invoice_status === 3 ? 'unvoid' : 'void',
          is_mailed: row.is_mailed === 1 ? 1 : 0
        }
      });
    } else if (type === 'Wallet') {
      this.dialog.open(WalletActionViewModalComponent, {
        maxWidth: '900px',
        width: '93%',
        data: { id: row.referenceNumber }
      });
    } else if(['ACH','Wire','Virtual Card','Check Mail'].includes(type)){
      this.route.navigateByUrl(`manage/payments-table/payment-view/${row?.uu_id}`);
    }
  }

  /**
   * @description Method to open warning alert modal
   * @param msg - content to be displayed in the alert
   * @returns warningAlert method of alert service.
   */
  openWarningAlert(msg: string) {
    const data = {
      content: msg
    };
    return this.alert.warningAlert(data);
  }

  /**
   * @description Method to load date wise activity of selected user.
   */
  loadUserDateWiseActivity(): void {
    if (this.userManagementServiceV35.usersDetails?.length) {
      this.userManagementServiceV35.isDateWiseActivityLoaded = false;
      this.userManagementServiceV35.isDateWiseActivityLoaded$.next(false);
    }
    this.subscriptions.push(
      this.userService
        .userDatewiseActivities(this.userId)
        .pipe(
          finalize(() => {
            this.userManagementServiceV35.isDateWiseActivityLoaded = true;
            this.userManagementServiceV35.isDateWiseActivityLoaded$.next(true);
            this.isUserLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.datewiseActivities = res.data.activities;
            this.dateWiseActivityDetails = Object?.values(
              this.datewiseActivities ?? ''
            );
            this.dateWiseActivityDetails.forEach((datewiseDatas, index) => {
              if (datewiseDatas.status === 'created') {
                this.dateWiseActivityDetails[index].styleClass = 'created';
              } else if (datewiseDatas.status === 'deleted') {
                this.dateWiseActivityDetails[index].styleClass = 'deleted';
              } else if (datewiseDatas.status === 'printed') {
                this.dateWiseActivityDetails[index].styleClass = 'printed';
              } else if (datewiseDatas.status === 'imported') {
                this.dateWiseActivityDetails[index].styleClass = 'imported';
              } else if (datewiseDatas.status === 'COMPLETED') {
                this.dateWiseActivityDetails[index].styleClass = 'COMPLETED';
              } else if (datewiseDatas.status === 'PENDING') {
                this.dateWiseActivityDetails[index].styleClass = 'PENDING';
              } else if (datewiseDatas.status === 'updated') {
                this.dateWiseActivityDetails[index].styleClass = 'updated';
              } else {
                this.dateWiseActivityDetails[index].styleClass = 'printed';
              }
            });
          }
        })
    );
  }

  /**
   * @description Shows or hides details based on whether type selected is 'All' or not.
   * @param type - Type of activity tab label
   */
  changeActivityTab(type: UserActivityTypes): void {
    if (type === 'All') {
      this.selectedType = this.availableTypes;
      this.tableCount = 5;
      this.isViewShowAll = true;
    } else {
      this.selectedType = [type];
      this.tableCount = this.activityDetails.created_counts?.[type];
      this.isViewShowAll = false;
    }
    if (this.selectedType.length >= 1) {
      this.lastActivityPage = this.selectedType.length - 1;
    }
    this.selectedTab = type;
    this.getDisplayStatus();
  }

  /**
   * @description Sets the displayStatus in accordance with selectedType.
   */
  getDisplayStatus(): void {
    this.selectedType.forEach((value) => {
      if (this.selectedUser.status === 0 || this.selectedUser.status === 3) {
        this.displayStatus = 'waiting';
      }
      if (!this.activityDetails?.created_counts?.[value]) {
        this.displayStatus = 'no_data';
      } else {
        this.displayStatus = null;
      }
    });
  }

  /**
   * @description Routes to the add permissions page for the selected user.
   */
  gotoPermissions(userId:string|undefined): void {
    this.localStorageService.setItem('userPermission', this.activityDetails);
    this.route.navigateByUrl(
      `manage/manage-users/add-permissions/${userId}`
    );
  }

  /**
   * @description Method to emit an event for the parent component, with the action for the status of selected user.
   * @param type - type of action - resend, delete or approve
   */
  doStatus(type: StatusActions): void {
    this.statusAction.emit(type);
    this.userManagementServiceV35.activityStatusAction(type);
  }

  /**
   * @description To set the view to feature wise or date wise.
   * @param id - filter type
   */
  showActivity(id: 'list' | 'date'): void {
    this.selectedFilter = id;
  }

  /**
   * @description Apply styles and classes to selected HTML elements based on conditions
   * @param div - The HTML div element to apply classes/styles.
   */
  mobileActionBtnClick(div: HTMLDivElement): void {
    const ocwOverlay: HTMLDivElement | null = document.querySelector(
      '.ocw-overlay-container'
    );
    if (ocwOverlay) {
      ocwOverlay.style.display = 'block';
    }
    div.classList.toggle('mobile_menu');
  }

  /**
   * @description Apply styles and classes to selected HTML elements based on conditions
   */
  ocwOverlayContainerClick() {
    const ocwOverlay: HTMLDivElement | null = document.querySelector(
      '.ocw-overlay-container'
    );
    if (ocwOverlay) {
      ocwOverlay.style.display = 'none';
    }
    const actionBtn = document.getElementById('action_btns');
    actionBtn?.classList.remove('mobile_menu');
  }

  /**
   * @description Opens modal window for whitelisting ip address.
   */
  openIPAddressModal(): void {
    this.dialog.open(UserWhitelistIpComponent, {
      maxWidth: '500px',
      width: '95%',
      autoFocus: false,
      data: { clientId: this.userId }
    });
  }

  /**
   * The onDelete function calls the onDelete method of the userManagementServiceV35 service with the
   * specified item and index.
   */
  onDelete() {
    this.userManagementServiceV35.onDelete(
      this.selectedUser,
      this.selectedIndex
    );
  }

  /**
   * The onDelete function calls the onDelete method of the userManagementServiceV35 service with the
   * specified item and index.
   */
  onApprove() {
    this.userManagementServiceV35.onApprove(
      this.selectedUser,
      this.selectedIndex
    );
  }

  /**
   * The function "onResend" calls a service method to resend a user item.
   */
  onResend() {
    this.userManagementServiceV35.onResend(
      this.selectedUser,
      this.selectedIndex
    );
  }

  toggleTab(tab:string){
    this.activeTab = tab;
  }

  preventEventPropagation(event: Event) {
    event.stopPropagation();
  }

  filterAndExportDateChange(event: { start: string; end: string }) {    
    this.fromDate = event.start;
    this.toDate = event.end;
  }

  exportFile(fileType: string) {
    this.filterAndExportLoading.set(true);
    const exportType = this.activityTabLabel.find((el) => el.name === this.selectedTab)?.id;
    const formattedFromDate = this.datePipe.transform(this.fromDate, 'YYYY-MM-dd');
    const formattedToDate = this.datePipe.transform(this.toDate, 'YYYY-MM-dd');
    const payload:IActivityExportPayload = {
      type: fileType,
      export_type: exportType as string,
      fromDate: formattedFromDate as string,
      toDate: formattedToDate as string
    };
    
    this.subscriptions.push(
      this.userService
        .exportUserActivity(this.userId,payload)
        .pipe(finalize(() => this.filterAndExportLoading.set(false)))
        .subscribe((res) => {
          if(res.success){
            window.open(res.data.url, '_blank');
          }          
        })
    );
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
