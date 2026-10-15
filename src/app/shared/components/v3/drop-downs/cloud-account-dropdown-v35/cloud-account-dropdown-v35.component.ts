import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ICloudBankAccountDetailsAirwallex } from 'src/app/modules/cloud-bank/model/cloudbank';
import { Utils } from 'src/app/data/utils';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { CloudBankAccountsActions } from 'src/app/modules/store/cloud-bank/cloud-bank.actions';
import * as cloudBankSelector from 'src/app/modules/store/cloud-bank/cloud-bank.selectors';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { faBuildingColumns } from '@fortawesome/pro-solid-svg-icons';

@Component({
  standalone: true,
  selector: 'app-cloud-account-dropdown-v35',
  templateUrl: './cloud-account-dropdown-v35.component.html',
  styleUrls: ['./cloud-account-dropdown-v35.component.scss'],
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule
  ]
})
export class CloudAccountDropdownV35Component
  implements OnInit, AfterViewInit, OnDestroy
{
  /**
   * @description Injecting dependencies using inject method
   */
  private router = inject(Router);
  private paymentService = inject(PaymentsService);
  private store$ = inject(Store);
  private payeeService = inject(PayeeService);

  faBuildingColumns = faBuildingColumns;

  /**
   * @description Variables
   */
  subscriptions: Subscription[] = [];
  accountArray: ICloudBankAccountDetailsAirwallex[];
  isLoading$: Observable<boolean> = this.store$.select(
    cloudBankSelector.selectIsCloudLoading
  );

  isRequired = false;
  selectDropdownItem: ICloudBankAccountDetailsAirwallex;
  cloudAccounts$ = new BehaviorSubject<ICloudBankAccountDetailsAirwallex[]>([]);
  isLoadingWithId = false;

  @Input() id = 'cloud'; // Its better to pass a unique id always for avoiding conflict.
  @Input() set setIsRequired(state: boolean) {
    this.isRequired = state;
    this.loadRequiredLabel();
  }

  @Input() placeholder = 'Select Your Account';
  @Input() customHeight: '0' | '1' | '2' | '3' | '4' = '3';
  @Input() enableAddNew: boolean = true;
  @Input() append = 'body';
  @Output() selectionEvent = new EventEmitter();
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() clearEvent = new EventEmitter();
  @Input() set setSelectDropdownItem(
    state: ICloudBankAccountDetailsAirwallex | string | undefined
  ) {
    if (!this.payeeService.fromCloudSendBtn.getValue() && state) {
      if (typeof state === 'string') {
        const selectedItem = this.accountArray?.find(
          (account) => account.id === state
        );
        if (selectedItem) this.selectDropdownItem = selectedItem;
      } else {
        this.selectDropdownItem = state;
      }
      if (this.selectDropdownItem) {
        this.handleSelectedItem();
      }
    }
  }

  selectedItem: ICloudBankAccountDetailsAirwallex;
  onReadyResponse: IV3DropDownOnReady = {};

  utils = Utils;

  /**
   * Access ng-select
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  ngAfterViewInit() {
    this.loadRequiredLabel();
  }

  ngOnInit(): void {
    this.getAccounts();
    this.store$.dispatch(
      CloudBankAccountsActions.loadCloudBankAccountsAirwallex()
    );
    this.handleAccessError();
    this.onReady();
  }

  /**
   * @description get cloud bank accounts' details from service.
   */
  getAccounts(): void {
    this.subscriptions.push(
      this.store$
        .select(cloudBankSelector.selectCLoudBanksAirwallexStates)
        .subscribe((cloudAccounts) => {
          this.accountArray = cloudAccounts;
          this.cloudAccounts$.next(cloudAccounts);
        })
    );
  }

  /**
   * Called when the component is ready. Emits a response with the setItemWithId function.
   */
  onReady() {
    this.onReadyResponse = {
      setItemWithId: this.setItemWithId
    };
    this.ready.emit(this.onReadyResponse);
  }

  /**
   * Sets an item with a specific ID in the selected bank account.
   * @param id - The ID of the bank account to set.
   */
  setItemWithId = (id: string) => {
    this.subscriptions.push(
      this.cloudAccounts$.subscribe((res) => {
        if (res.length) {
          const item = res.find((ele) => ele.id === id);
          if (item) {
            this.selectedItem = item;
          }
        }
      })
    );
  };

  /**
   * @description selectDropdownItem is set as selectedItem.
   */
  handleSelectedItem() {
    this.selectedItem = this.selectDropdownItem;
  }

  /**
   * @description based on the change event addNewCloudAccount method is called or selectionEvent is emitted.
   * @param ev - contain dropdown selected or 'add-new' string.
   */
  getChange(ev: Event | 'add-new') {
    this.payeeService.fromCloudSendBtn.next(false);
    if (ev === 'add-new') {
      this.addNewCloudAccount();
      this.ngSelectComponent.handleClearClick();
      return;
    }
    this.selectionEvent.emit(ev);
  }

  /**
   * @description route to add new cloud bank account.
   */
  addNewCloudAccount() {
    this.router.navigate(['/manage/cloud-bank/index']);
  }

  /**
   * @description red star mark indicating mandatory field is added to ng-select.
   */
  loadRequiredLabel() {
    const dd = document.querySelectorAll(
      `#drop_down_${this.id} .ng-select-container .ng-value-container .ng-placeholder`
    );
    if (this.isRequired) dd[0]?.classList.add('drop_down_required_star');
    else dd[0]?.classList.remove('drop_down_required_star');
  }

  /**
   * Clears the value inside ng select.
   * if you invoke this function it will cause to emit clearevent from ng-select
   * and then it will cause to invoke clear() function.
   */
  clearValue() {
    this.ngSelectComponent.handleClearClick();
  }

  handleAccessError() {
    this.subscriptions.push(
      this.store$
        .select(cloudBankSelector.selectCloudBankError)
        .subscribe((err) => {
          const error = err as HttpErrorResponse;
          if (
            error?.error?.permissionRequired === 'cloudbank-view-account' &&
            error?.error.permissionType === 'page'
          ) {
            const noPermission = {
              noPermission: true,
              payMethode: ' cloud bank accounts'
            };
            this.paymentService.isPermissionDenied.next(noPermission);
          }
        })
    );
  }

  /**
   * @description emits event when clear button in ng-select is clicked.
   */
  clear() {
    this.clearEvent.emit();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
