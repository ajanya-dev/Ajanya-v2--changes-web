import { DatePipe, NgClass, NgSwitch, NgSwitchCase, SlicePipe, TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { UserPermissionAuditLogComponent } from '../user-permission-audit-log/user-permission-audit-log.component';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { UserManagementV35Service } from '../../service/user-management-v35.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IActivityExportPayload, IUserActivity, IUserRoute, IUsersList, StatusActions, UserActivityTypes, IUserActivityPaginationPayload, IPaginationResponse, IActivityTypeDetails } from 'src/app/models/user';
import { ClientType } from '../user-management-list-v35/user-management-list-v35.component';
import { finalize, Subscription } from 'rxjs';
import { UserManagment } from 'src/app/data/data/user';
import { faArrowUpToLine, faSpinner, faUpToLine } from '@fortawesome/pro-solid-svg-icons';
import { WalletActionViewModalComponent } from 'src/app/shared/modal/wallet-modal/wallet-action-view-modal/wallet-action-view-modal.component';
import { UserWhitelistIpComponent } from '../user-whitelist-ip/user-whitelist-ip.component';
import { faBuilding, faCalendar, faEnvelope, faUser } from '@fortawesome/pro-regular-svg-icons';
import { UserPermissionsNewComponent } from '../../pages/user-permissions-new/user-permissions-new.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-users-activity-new',
  templateUrl: './users-activity-new.component.html',
  styleUrls: ['./users-activity-new.component.scss'],
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
    DateRangeComponent,
    UserPermissionsNewComponent
  ]
})
export class UsersActivityNewComponent implements OnInit {
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
    {id:'Wallet',name:'Wallet'},
    {id:'BankAccount',name:'Bank Account'}
  ];

  clientType = ClientType;

  subscriptions: Subscription[] = [];
  activityFilter = UserManagment.filterUserAcitivity();
  selectedFilter: 'list' | 'date' = 'list';
  datewiseActivities: IUserActivity;
  dateWiseActivityDetails: IUserRoute[];
  activityDetails: IUserActivity;
  usersDetails: IUsersList[];
  paginationStates: { [key in Exclude<UserActivityTypes, 'All'>]: { page: number; per_page: number } } = {
    'Check': { page: 1, per_page: 10 },
    'Invoice': { page: 1, per_page: 10 },
    'Deposit Slip': { page: 1, per_page: 10 },
    'Cash Expense': { page: 1, per_page: 10 },
    'Received Checklist': { page: 1, per_page: 10 },
    'Bill': { page: 1, per_page: 10 },
    'Wallet': { page: 1, per_page: 10 },
    'ACH': { page: 1, per_page: 10 },
    'Wire': { page: 1, per_page: 10 },
    'Virtual Card': { page: 1, per_page: 10 },
    'Check Mail': { page: 1, per_page: 10 },
    'Direct deposit': { page: 1, per_page: 10 },
    'Bank Account': { page: 1, per_page: 10 }
  };

  userId: string;
  availableTypes: UserActivityTypes[] = [];
  selectedType: UserActivityTypes[] = ['All'];
  displayStatus: 'waiting' | 'no_data' | 'empty' | null;
  tableCount = 10;
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
  env = environment;

  faArrowUptoLine = faArrowUpToLine;
  faSpinner = faSpinner;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faBuilding = faBuilding;
  faCalendar = faCalendar;
  faUpToLine = faUpToLine;

  ngOnInit() {
    this.subscriptions.push(
      this.userManagementServiceV35.selectedUser$.subscribe((res) => {
        if (res) {
          this.isUserLoading = true;
          this.selectedUser = res;
          this.userId = res.client_id;

           // Reset tab state for new user to ensure clean state
          this.selectedTab = 'All' as UserActivityTypes;
          this.selectedType = ['All'];
          this.isViewShowAll = true;

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
  loadUserActivity(type?:Exclude<UserActivityTypes, 'All'>): void {
    if (this.userManagementServiceV35.usersDetails?.length) {
      this.userManagementServiceV35.isActivityLoaded = false;
      this.userManagementServiceV35.isActivityLoaded$.next(false);
    }

    const paginationPayload: IUserActivityPaginationPayload = {
      pagination: this.paginationStates
    };

    this.subscriptions.push(
      this.userService
        .getAuditTrail(this.userId, paginationPayload)
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
            if (type !== undefined) {
              this.selectedTab = type;
            }
            this.activityDetails = {...res.data};

            if (this.activityDetails.activities) {
              const reversedTypes = ['ACH', 'Wire','Check Mail','Virtual Card'] as const satisfies UserActivityTypes[];              
              reversedTypes.forEach(type => {
                const activityData = this.activityDetails.activities[type];
                if (activityData && !Array.isArray(activityData) && activityData.data) {
                  activityData.data = [...activityData.data].reverse();
                }
              });

              this.availableTypes = Object.keys(
                this.activityDetails.activities
              ) as UserActivityTypes[];
              
              // Only set selectedType to availableTypes if we're loading all activities (no specific type)
              // or if selectedType is empty/invalid
              if (type === undefined || this.selectedType.length === 0) {
                this.selectedType = this.availableTypes;
              }
              
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
    } else if (type === 'Bank Account') {
      this.route.navigate(['/manage/bank-accounts/index'], {
        queryParams: { id: row.referenceId }
      });
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

  goBackToUserActivity(){
    this.userManagementServiceV35.showPermissions.set(false);
  }

  /**
   * @description Method to load date wise activity of selected user.
   */
  loadUserDateWiseActivity(): void {
    if (this.userManagementServiceV35.usersDetails?.length) {
      this.userManagementServiceV35.isDateWiseActivityLoaded = false;
      this.userManagementServiceV35.isDateWiseActivityLoaded$.next(false);
    }

    const paginationPayload: IUserActivityPaginationPayload = {
      pagination: this.paginationStates
    };

    this.subscriptions.push(
      this.userService
        .userDatewiseActivities(this.userId, paginationPayload)
        .pipe(
          finalize(() => {
            this.userManagementServiceV35.isDateWiseActivityLoaded = true;
            this.userManagementServiceV35.isDateWiseActivityLoaded$.next(true);
            this.isUserLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.datewiseActivities = { ...res.data };

            // Process date-wise activities same as regular activities
            let flattenedActivities: IUserRoute[] = [];

            if (this.datewiseActivities?.activities) {
              Object.keys(this.datewiseActivities.activities).forEach((activityType) => {
                const activityData =
                  (this.datewiseActivities!.activities as Record<string, any>)[
                    activityType
                  ];

                if (Array.isArray(activityData)) {
                  // Old structure - array of activities
                  flattenedActivities = flattenedActivities.concat(
                    activityData as IUserRoute[]
                  );
                } else if (activityData?.data) {
                  // New structure - pagination with data array
                  flattenedActivities = flattenedActivities.concat(
                    activityData.data as IUserRoute[]
                  );
                }
              });
            }

            this.dateWiseActivityDetails = flattenedActivities;
            
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
      this.tableCount = 10;
      this.isViewShowAll = true;
    } else {
      this.selectedType = [type];
      const activityData = this.activityDetails.activities?.[type];
      if (activityData && !Array.isArray(activityData)) {
        this.tableCount = activityData.pagination?.total || 0;
      } else {
        this.tableCount = this.activityDetails.created_counts?.[type] || 0;
      }
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
    // Validate selectedTab exists in availableTypes, reset to 'All' if invalid
    if (this.selectedTab !== 'All' && this.availableTypes.length > 0 &&
      !this.availableTypes.includes(this.selectedTab)) {
          this.selectedTab = 'All';
          this.selectedType = this.availableTypes;
          this.isViewShowAll = true;
        }

    if (this.selectedUser?.status === 0 || this.selectedUser?.status === 3) {
      this.displayStatus = 'waiting';
    }

    // For "All" tab, check if ANY activity type has data
    if (this.selectedTab === 'All') {
      let hasAnyData = false;
      for (const value of this.selectedType) {
        if (this.activityDetails?.created_counts?.[value] > 0) {
          hasAnyData = true;
          break;
        }
      }
      this.displayStatus = hasAnyData ? null : 'no_data';
    } else {
      // For individual activity type tabs - check if the specific tab has data
      const selectedTabType = this.selectedTab;
      const hasData = this.getActivityCount(selectedTabType) > 0;
      
      this.displayStatus = hasData ? null : 'no_data';
    }
  }

  /**
   * @description Routes to the add permissions page for the selected user.
   */
  gotoPermissions(userId:string|undefined): void {
    this.localStorageService.setItem('userPermission', this.activityDetails);
    this.userManagementServiceV35.showPermissions.set(true);
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

  exportPermission(type: 'xlsx' | 'csv') {
    this.userManagementServiceV35.exportPermission(type);
  }

  /**
   * @description Get activity count for a given type (handles both old and new structure)
   */
  getActivityCount(type: UserActivityTypes): number {
    const activityData = this.activityDetails?.activities?.[type];
    if (Array.isArray(activityData)) {
      return activityData.length;
    } else if (activityData?.pagination) {
      return activityData.pagination.total;
    }
    return this.activityDetails?.created_counts?.[type] || 0;
  }

  /**
   * @description Get activity data array for a given type (handles both old and new structure)
   */
  getActivityData(type: UserActivityTypes): IActivityTypeDetails[] {
    const activityData = this.activityDetails?.activities?.[type];
    if (Array.isArray(activityData)) {
      return activityData;
    } else if (activityData?.data) {
      return activityData.data;
    }
    return [];
  }

  /**
   * @description Get pagination info for a given type (only for new structure)
   */
  getActivityPagination(type: UserActivityTypes): IPaginationResponse | null {
    const activityData = this.activityDetails?.activities?.[type];
    if (activityData && !Array.isArray(activityData) && activityData.pagination) {
      return activityData.pagination;
    }
    return null;
  }

  /**
   * @description Get pagination info for date-wise activities
   */
  getDateWiseActivityPagination(): IPaginationResponse | null {
    // For date-wise, we can use any activity type's pagination since they all have the same page info
    if (this.datewiseActivities?.activities) {
      const firstActivityType = Object.keys(this.datewiseActivities.activities)[0] as UserActivityTypes;
      const activityData = this.datewiseActivities.activities[firstActivityType];
      if (activityData && !Array.isArray(activityData) && activityData.pagination) {
        return activityData.pagination;
      }
    }
    return null;
  }

  /**
   * @description Navigate to a specific page for date-wise activities
   */
  navigateToDateWisePage(page: number): void {
    if (page < 1) return;
    
    // Update all pagination states since date-wise shows all activities
    Object.keys(this.paginationStates).forEach(type => {
      this.paginationStates[type as Exclude<UserActivityTypes, 'All'>].page = page;
    });
    
    this.loadUserDateWiseActivity();
  }

  /**
   * @description Navigate to a specific page for All tab (updates all activity types)
   * @param page - The page number to navigate to
   */
  navigateToAllPage(page: number): void {
    if (page < 1) return;
    
    // Update all pagination states since "All" shows all activities
    Object.keys(this.paginationStates).forEach(type => {
      this.paginationStates[type as Exclude<UserActivityTypes, 'All'>].page = page;
    });
    
    // Ensure we stay in All tab context
    this.selectedTab = 'All';
    this.selectedType = this.availableTypes;
    this.isViewShowAll = true;
    
    this.loadUserActivity();
  }

  /**
   * @description Navigate to a specific page for a specific activity type within All tab context
   * @param type - The specific activity type to paginate
   * @param page - The page number to navigate to
   */
  navigateToAllPageForType(type: Exclude<UserActivityTypes, 'All'>, page: number): void {
    if (page < 1) return;
    
    // Update only the specific activity type's pagination state
    this.paginationStates[type].page = page;
    
    // Ensure we stay in All tab context
    this.selectedTab = 'All';
    this.selectedType = this.availableTypes;
    this.isViewShowAll = true;
    
    this.loadUserActivity();
  }

  /**
   * @description Navigate to a specific page for a given activity type
   * @param type - The activity type
   * @param page - The page number to navigate to
   */
  navigateToPage(type: Exclude<UserActivityTypes, 'All'>, page: number): void {
    if (page < 1) return;
    
    this.paginationStates[type].page = page;

     // Ensure the selected tab matches the type being paginated
    this.selectedTab = type;

     // Update selectedType to show only this specific type
    this.selectedType = [type];
    this.isViewShowAll = false;

    this.loadUserActivity(type);
  }

  /**
   * @description Get page numbers array for pagination display
   * @param pagination - The pagination response object
   * @returns Array of page numbers to display
   */
  getPageNumbers(pagination: IPaginationResponse): number[] {
    const pages: number[] = [];
    const currentPage = pagination.current_page;
    const lastPage = pagination.last_page;
    
    // Show max 5 pages at a time
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(lastPage, startPage + 4);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
