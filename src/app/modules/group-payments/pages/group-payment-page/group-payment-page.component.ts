import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IBillBulkPaymentData } from 'src/app/modules/bill/model/Bill';
import {
  Observable,
  Subscription,
  debounceTime,
  firstValueFrom,
  map
} from 'rxjs';
import { Store } from '@ngrx/store';
import { groupPaymentsFeature } from '../../store/groupPayments.reducer';
import { IGroupPaymentsState } from '../../models/group-payments.models';
import { GroupNameModalComponent } from '../../modals/group-name-modal/group-name-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { groupPaymentsActions } from '../../store/groupPayments.actions';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { GroupPaymentsComponent } from '../../components/group-payments/group-payments.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { BillService } from 'src/app/shared/service/Bill/bill.service';

@Component({
  selector: 'app-group-payment-page',
  templateUrl: './group-payment-page.component.html',
  styleUrls: ['./group-payment-page.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    MatTooltip,
    RouterLink,
    GroupPaymentsComponent,
    AsyncPipe
  ]
})
export class GroupPaymentPageComponent implements OnInit, OnDestroy {
  /** Dependencies */
  private activatedRoute = inject(ActivatedRoute);
  private _store = inject(Store);
  private _dialog = inject(MatDialog);
  private _companyManagementService = inject(CompanyManagementService);
  private _router = inject(Router);
  private _sharedService = inject(SharedService);
  private billService = inject(BillService);

  groupId$ = new Observable<string>();
  subscriptions: Subscription[] = [];
  groupPaymentsState: IGroupPaymentsState;
  selectGroupPaymentsState$: Observable<IGroupPaymentsState>;
  paymentType: string | null = null;
  billBulkData = signal<IBillBulkPaymentData | null>(null);

  ngOnInit(): void {
    this.getIdFromRoute();
    this.initStoreSelectors();
    this.manageCompanyChange();
  }

  /**
   * Initializes store selectors to select data from the store.
   */
  initStoreSelectors() {
    this.selectGroupPaymentsState$ = this._store.select(
      groupPaymentsFeature.selectGroupPaymentsState
    );
  }

  /**
   * Manages company change by subscribing to company change events and navigating to a different route.
   */
  manageCompanyChange() {
    const companyChangeSubscription = this._companyManagementService
      .getCompanyChanges()
      .pipe(debounceTime(100))
      .subscribe(() => {
        this._router.navigate(['/manage/group-payments/table']);
        setTimeout(() => {
          companyChangeSubscription.unsubscribe();
        }, 100);
      });
  }

  /**
   * Retrieves the group ID from the route parameters.
   */
  getIdFromRoute() {
    this.groupId$ = this.activatedRoute.params.pipe(map((res) => res.id));
    this.subscriptions.push(
      this._store
        .select(groupPaymentsFeature.selectGroupPaymentsState)
        .subscribe((groupPaymentsState) => {
          this.groupPaymentsState = groupPaymentsState;
        }),
        this.activatedRoute.queryParams.subscribe((params) => {
          this.paymentType = params?.type || null;
        }),
        this.activatedRoute.queryParams.subscribe((params) => {
          const billId = params?.billId;
          if (billId) {
            this.billService.billId.set(billId.split(','));
            this.subscriptions.push(
              this.billService.getBillBulkPaymentData(billId.split(',')).subscribe((res) => {
                if (res?.data) {
                  this.billBulkData.set(res.data);
                }
              })
            );
          }
        })
    );
  }

  /**
   * Navigates to the previous page.
   */
  goBack() {
    this._sharedService.goBack();
  }

  /**
   * Handles the asynchronous operation for editing the group name.
   */
  async editGroupName() {
    const groupNameModalResult = await firstValueFrom(
      this._dialog
        .open(GroupNameModalComponent, {
          width: '500px',
          data: {
            groupName:
              this.groupPaymentsState?.groupDetails.groupData?.groupName
          }
        })
        .afterClosed()
    );
    if (
      groupNameModalResult?.groupName &&
      this.groupPaymentsState?.groupDetails.groupId
    ) {
      this._store.dispatch(
        groupPaymentsActions.groupPaymentsUpdateName({
          groupName: groupNameModalResult?.groupName
        })
      );
    }
  }

  /**
   * Unsubscribes from subscriptions when the component is destroyed.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((element) => element?.unsubscribe?.());
  }
}
