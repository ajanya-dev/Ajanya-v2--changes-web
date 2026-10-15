import { Component, OnDestroy, inject, OnInit } from '@angular/core';
import { IBankData } from 'src/app/models/bank';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { Subject, Subscription, firstValueFrom, take } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  IconPrefix,
  IconName,
  IconLookup
} from '@fortawesome/fontawesome-svg-core';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { Store } from '@ngrx/store';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import {
  faBallotCheck,
  faClone,
  faEdit,
  faExchange,
  faPencil,
  faSignature,
  faStar,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonLayoutToggleService } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, JsonPipe, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signatureUploadPanelComponent } from 'src/app/shared/components/upload-panel/signature-upload-panel/signature-upload-panel.component';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { IApiRes } from 'src/app/models/api';
import { ICustomRestrictions } from 'src/app/modules/check/model/check';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { ChangeStartingNumberComponent } from '../../../bank-v2/modals/change-starting-number/change-starting-number.component';
import { EditBankAccountModalComponent } from '../../../bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { BankDataV35Service } from '../../v35-services/bank-data-v35.service';
import { CloneCheckDesignComponent } from '../../../bank-v2/modals/clone-check-design/clone-check-design.component';
import { MoveSelectedToTopPipe } from '../../../../../pipes/move-selected-to-top.pipe';
import { BankAccountsDataTableV35Component } from '../bank-accounts-data-table-v35/bank-accounts-data-table-v35.component';
import { CommonListSkeltonComponent } from '../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { ScrollToEndDirective } from '../../../../../directive/scroll-to-end.directive';
import { ListHeaderV35Component } from '../../../../../shared/v3/common-components/list-header-v35/list-header-v35.component';
import { V35CommonDropDownSelectorComponent } from '../../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { ListViewToggleComponent } from '../../../../../shared/v3/common-components/list-view-toggle/list-view-toggle.component';

/**
 * @description Component file for listing bank accounts
 */
@Component({
  selector: 'app-bank-accounts-list-ocw-v35',
  templateUrl: './bank-accounts-list-ocw-v35.component.html',
  styleUrls: ['./bank-accounts-list-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    ListViewToggleComponent,
    V35CommonDropDownSelectorComponent,
    FormsModule,
    ListHeaderV35Component,
    CdkDropList,
    ScrollToEndDirective,
    NgClass,
    CdkDrag,
    FaIconComponent,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    CommonListSkeltonComponent,
    BankAccountsDataTableV35Component,
    JsonPipe,
    MoveSelectedToTopPipe,
    NgOptimizedImage
  ]
})
export class BankAccountsListOcwV35Component implements OnDestroy, OnInit {
  /**
   * Injecting dependencies using inject method
   */
  public bankDataService = inject(BankDataV35Service);
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private bankAccountService = inject(BankAccountsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private headerService = inject(HeaderService);
  private store = inject(Store);
  private banAccountService = inject(BankAccountsService);
  private checkDesignService = inject(CheckDesignService);
  private sharedService = inject(SharedService);
  private localStorageService = inject(LocalStorageService);
  private commonLayoutToggleService = inject(CommonLayoutToggleService);

  /**
   * Variables
   */
  bankData: IBankData[];
  subscriptions: Subscription[] = [];
  page = 1;
  isPermissionPopupEnabled = false;
  selectedBankAccount: IBankData | undefined = undefined;

  settings: {
    name: string;
    id: string;
    icon: string;
    faIcon: [IconPrefix, IconName] | IconLookup;
  }[] = [
    {
      name: 'Edit',
      id: 'id_editRow',
      icon: 'fa fa-edit',
      faIcon: faEdit
    },
    {
      name: 'Edit Design',
      id: 'id_edit_design_row',
      icon: 'fa fa-pencil',
      faIcon: faPencil
    },
    {
      name: 'Delete',
      id: 'id_delete_row',
      icon: 'fa fa-trash',
      faIcon: faTrash
    },
    {
      name: 'Change Starting Number',
      id: 'id_change_starting_number',
      icon: 'fa fa-exchange',
      faIcon: faExchange
    },
    {
      name: 'Clone Design',
      id: 'id_clone_design_row',
      icon: 'fa fa-clone',
      faIcon: faClone
    },
    {
      name: 'Add Signature',
      id: 'id_add_signature',
      icon: 'fa fa-signature',
      faIcon: faSignature
    },
    {
      name: 'ACH Authorization Form',
      id: 'id_ach_authorization_form',
      icon: 'fa-ballot-check fal ',
      faIcon: faBallotCheck
    },
    {
      name: 'Favorite',
      id: 'id_favorite',
      icon: '',
      faIcon: faStar
    }
  ];

  faStar = faStar;
  showSettings = false;
  searchInput = '';
  nameSearchInput = '';
  accountNoSearchInput = '';
  ACHStatusSearchInput = '';
  bankNameSearchInput = '';
  nicknameSearchInput = '';
  verifiedSearchInput = '';
  rowCount: number;
  totalAccountsCount: number | undefined;
  subjectKeyUp = new Subject();
  grabbing = false;
  resize = false;

  set selectedValue(item: string) {
    const selectedAccount: IBankData = JSON.parse(item);
    this.bankDataService.selectBankAccount(selectedAccount);
  }

  get selectedValue(): string {
    if (this.bankDataService.selectedBankAccountSignal()?.id !== 0) {
      return JSON.stringify(this.bankDataService.selectedBankAccountSignal());
    }
    return '';
  }

  /**
   * @description Gets the recently selected bank account and total bank accounts count
   * @function getData() Emits the selected account
   * @function getAccountsCount Emits the counts
   */
  ngOnInit() {
    this.getAccounts();
    this.debounceSearch();
    this.listenQueryParamMap();
    this.checkResize();
  }

  checkResize(): void {
    this.subscriptions.push(
      this.commonLayoutToggleService.toggleChange$.subscribe((res) => {
        this.resize = res;
      })
    );
  }

  /**
   * The function listens for changes in the query parameters and performs certain actions if a
   * specific parameter is present.
   */
  listenQueryParamMap() {
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params) => {
        if (params.get('selectPrev')) {
          this.bankDataService.resetData();
          const currentViewString =
            this.localStorageService.getItem('isGridView');
          if (currentViewString !== null) {
            const currentView = currentViewString === true;
            this.bankDataService.isGridView = currentView;
            this.localStorageService.removeItem('isGridView');
          }
          const selectedBankString =
            this.localStorageService.getItem('selectedBankTemp');
          if (selectedBankString) {
            try {
              this.bankDataService.preSelectBankAccount(selectedBankString);
              this.bankDataService.selectBankAccount(selectedBankString);
              this.localStorageService.removeItem('selectedBankTemp');
            } catch (error) {
              this.localStorageService.removeItem('selectedBankTemp');
            }
          }
        }
      })
    );
  }

  getSelectedBankAccount() {
    this.selectedBankAccount = this.bankDataService.selectedBankAccountSignal();
    if (this.selectedBankAccount) {
      this.bankDataService.selectBankAccount(this.selectedBankAccount);
    }
  }

  getAccounts() {
    this.subscriptions.push(
      this.bankDataService.getTotalBankAccountsCount.subscribe((res) => {
        this.totalAccountsCount = res;
        if (this.totalAccountsCount === 1) {
          this.bankDataService.selectBankAccount(
            this.bankDataService.bankAccountsSignal()[0]
          );
        }
      })
    );
  }

  selectAll() {
    this.bankDataService.resetData();
    this.sharedService.selectedPayees.reset();
  }

  /**
   * @description Get next 10 element on each scroll event
   * @returns
   */
  onScrollToEnd() {
    if (
      this.page * 20 <
      (this.bankDataService.bankAccountCountSignal() as number)
    ) {
      this.page += 1;
      this.bankDataService.getRemainingAccounts(this.page);
    }
  }

  /**
   * @description Toggles view between grid and list
   */
  viewToggle(isGridView: boolean) {
    if (isGridView) {
      this.bankDataService.toggleView({ gridView: true });
    } else {
      this.bankDataService.toggleView({ gridView: false });
    }
  }

  /**
   * @description To open and close bank accounts drop down when the screen size changes into small
   */
  toggleDropDown() {
    this.bankDataService.showDropDown = !this.bankDataService.showDropDown;
  }

  /**
   * @description the Entered searchTerm will be stored in subjectKeyUp subject()
   */
  filterData(searchItem: string) {
    this.searchInput = searchItem;
    this.subjectKeyUp.next(this.searchInput);
  }

  /**
   * @description To filter the existing list while searching
   */
  debounceSearch() {
    this.subscriptions.push(
      this.subjectKeyUp
        .pipe(debounceTime(1000), distinctUntilChanged())
        .subscribe(() => {
          this.bankDataService.setAccounts(this.searchInput);
        })
    );
  }

  /**
   * @description To add new bank account
   */
  onNew() {
    this.bankDataService.onCreateBankAccount();
  }

  /**
   * @description Emits the selected bank data when apply for ach
   * @param val
   */
  applyAchClick(val: IBankData) {
    this.bankDataService.applyAchClick(val);
  }

  /**
   * @description Emits @param encrypted_bankacc_id  through verifyAccount output variable and opens verify bank modal
   * @param encrypted_bankacc_id
   */
  openBankVerifyModal(bankAcData: IBankData) {
    if (bankAcData.bank_account_country === 'Canada') {
      this.alertService.warningAlert({
        content: 'Verification for Canadian bank accounts is not permitted.'
      });
      return;
    }
    this.bankDataService.openBankVerifyModal(bankAcData);
  }

  /**
   * @description Emits @param val through confirmMicroDeposit output variable for micro deposit
   * @param val @type IBankData Bank details
   */
  microDeposit(val: IBankData) {
    this.bankDataService.microDeposit(val);
  }

  /**
   * @description It decides which function wants to be called when clicked an item of menu
   * @param action Action wants to be perfoermed @type string
   * @param item @type IBankData Bank details
   * @returns
   */
  onSettingClick(action: string, item: IBankData) {
    this.showSettings = false;
    const selectedRows = item;

    if (!item) {
      return;
    }

    if (item?.is_neo_bank) {
      this.dataTableService.setActionButtonDisable(true, [
        '',
        'id_edit_design_row',
        '',
        '',
        '',
        ''
      ]);
    } else {
      this.dataTableService.setActionButtonDisable(true, [
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    }

    switch (action) {
      case 'id_editRow':
        this.onEditRow(selectedRows);
        break;
      case 'id_edit_design_row':
        this.goToCheckDesign(selectedRows);
        break;
      case 'id_delete_row':
        this.onDeleteRow(selectedRows);
        break;
      case 'id_change_starting_number':
        this.changeStartingNo(selectedRows);
        break;
      case 'id_clone_design_row':
        this.onCloneDesignRow(selectedRows);
        break;
      case 'id_add_signature':
        this.addSignature(selectedRows);
        break;
      case 'id_ach_authorization_form':
        this.achAutherizationForm(selectedRows);
        break;
      case 'id_favorite':
        this.bankAccountFavorite(selectedRows);
        break;
      default:
    }
  }

  //* ***************************action click fucntions******************** */
  /**
   * @description To edit bank account
   * @param val Bank details
   */
  onEditRow(val: IBankData) {
    const editBankModal = this.dialog.open(EditBankAccountModalComponent, {
      // open modal
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val
    });
    editBankModal.afterClosed().subscribe((result) => {
      if (result) {
        (
          this.bankDataService.selectedBankAccountSignal() as IBankData
        ).bank_account_account_name = result.bankAccountName;
        (
          this.bankDataService.selectedBankAccountSignal() as IBankData
        ).bank_account_nick_name = result.bankAccountNickName;
        (
          this.bankDataService.selectedBankAccountSignal() as IBankData
        ).bank_account_account_number = result.bankAccountNumber;
        (
          this.bankDataService.selectedBankAccountSignal() as IBankData
        ).bank_routing_number = result.bankRoutingNumber;
        (
          this.bankDataService.selectedBankAccountSignal() as IBankData
        ).bank_name = result.bankName;
        this.bankDataService.updateAccounts({
          ...(val as IBankData),
          bank_account_address_line_1: result.bankAccountAddressLine1,
          bank_account_address_line_2: result.bankAccountAddressLine2,
          bank_account_phone: result.bankAccountPhone,
          bank_account_email: result.bankAccountEmail,
          bank_account_city: result.bankAccountCity,
          bank_account_state: result.bankAccountState,
          bank_account_country: <'Canada'>result.bankAccountCountry,
          bank_account_zip: result.bankAccountZip
        });
        this.bankDataService.setTotalBankAccountsCount();
        this.bankDataService.getAuditTrial(val.encrypted_bankacc_id, true);
      }
    });
  }

  /**
   * @description Navigate into check design page and for selected account
   * @param selectedRow Selected bank details
   */
  goToCheckDesign(selectedRow: IBankData) {
    this.localStorageService.setItem('selectedBankTemp', selectedRow);
    window.location.href = `checkdesign/edit/${selectedRow.encrypted_bankacc_id}?from=v3`;
  }

  /**
   * @description To delete a row
   * @param val Selected bank details
   */
  onDeleteRow(val: IBankData) {
    const arr: string[] = [];
    arr.push(val.encrypted_bankacc_id);
    const data = {
      ids: arr
    };

    const message = { title: 'Confirm'};
    const response = this.alertService.confirmAlert(message);
    response.afterClosed().subscribe((result) => {
      if (result) {
        if (this.bankDataService.isAchPending(val)) {
          return;
        }
        this.deleteSingleBankAccount(val, data);
      }
    });
  }

  /**
   * @description Deletes a single bank account. When the API responds with
   * errorCode 126 (deletion needs explicit confirmation), a confirm alert is
   * shown and, on confirmation, the same API is re-called with confirmed = 1.
   * @param val - The bank row being deleted.
   * @param data - The encrypted ids payload, reused for the errorCode 125 flow.
   * @param confirmed - Confirmation flag sent to the API (0 by default, 1 after the 126 confirm).
   */
  private deleteSingleBankAccount(
    val: IBankData,
    data: { ids: string[] },
    confirmed = 0
  ) {
    this.subscriptions.push(
      this.bankAccountService
        .deleteBankAccount(val.encrypted_bankacc_id, confirmed)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dataTableService.setRefreshStatus(true);
              const datas = {
                content: 'Deleted',
                close: true,
                timeout: 1500
              };
              this.bankDataService.deleteAccount(val);
              this.alertService.successAlert(datas);
              if (this.totalAccountsCount && this.totalAccountsCount >= 1) {
                this.bankDataService.totalBankAccountsCount$.next(
                  this.totalAccountsCount - 1
                );
              }
              this.headerService.refreshDynamicHeader.next(true);
            }
          },
          error: (err) => {
            if (err.error.errorCode === 125) {
              this.onDeleteBank(data, err.error.errorMsg, val);
            } else if (err.error.errorCode === 126) {
              const alert = this.alertService.confirmAlert({
                content: err.error.errorMsg,
                doneMsg: 'Continue',
                isCancel: true,
                cancelMsg: 'Cancel'
              });
              alert
                .afterClosed()
                .pipe(take(1))
                .subscribe((res) => {
                  if (res) {
                    this.deleteSingleBankAccount(val, data, 1);
                  }
                });
            }
          }
        })
    );
  }

  /**
   * @description Delete bank with payment link
   * @param data Object contains selected ids
   */
  onDeleteBank(data: { ids: string[] }, errorMsg: string, val: IBankData) {
    const deleted = this.alertService.confirmAlert({
      content: errorMsg,
      doneMsg: 'Ok',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    deleted.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankAccountService
            .deleteBankAccountInfo(data)
            .subscribe((result) => {
              if (result?.success) {
                this.dataTableService.setRefreshStatus(true);
                const alertData = {
                  content: 'Deleted',
                  close: true,
                  timeout: 1500
                };
                const id = data.ids[0];
                this.store.dispatch(
                  bankAccountsActions.deleteBankFromBankAccountStore({
                    id
                  })
                );
                this.bankDataService.deleteAccount(val);
                this.alertService.successAlert(alertData);
                if (this.totalAccountsCount && this.totalAccountsCount >= 1) {
                  this.bankDataService.totalBankAccountsCount$.next(
                    this.totalAccountsCount - 1
                  );
                }
                this.headerService.refreshDynamicHeader.next(true);
              }
            })
        );
      }
    });
  }

  /**
   * @description To add the signature of check
   */
  addSignature(val: IBankData) {
    this.subscriptions.push(
      this.checkDesignService.getCustomRestriction().subscribe({
        next: (response: IApiRes<ICustomRestrictions>) => {
          if (response.success) {
            const dialogRef = this.dialog.open(signatureUploadPanelComponent, {
              maxWidth: '690px',
              width: '93%',
              panelClass: 'upload_panel_wrapper',
              minHeight: '410px',
              disableClose: true
            });
            dialogRef.afterClosed().subscribe((signImg) => {
              if (signImg) {
                this.subscriptions.push(
                  this.bankAccountService
                    .addSignature(
                      val.encrypted_bankacc_id,
                      signImg.existSign
                        ? signImg.existSign
                        : signImg.signatureUrl
                    )
                    .subscribe({
                      next: (res) => {
                        if (res) {
                          const alertData = {
                            content: 'Signature added successfully',
                            close: true
                          };
                          this.bankDataService.isLoadDesign$.next(true);
                          this.alertService.successAlert(alertData);
                        }
                      },
                      error: (err) => {
                        this.alertService.warningAlert({
                          content: err.error.errorMsg
                        });
                      }
                    })
                );
              }
            });
          }
        }
      })
    );
  }

  /**
   * @description To change the starting number of check
   * @param val Selected bank details
   */

  changeStartingNo(val: IBankData) {
    const checkNumberModal = this.dialog.open(ChangeStartingNumberComponent, {
      // open modal
      maxWidth: '400px',
      width: '95%',
      disableClose: false,
      autoFocus: false,
      data: val,
      panelClass: 'chekNoModal'
    });
    checkNumberModal.afterClosed().subscribe((result) => {
      this.bankDataService.selectedBankInfoStateSignal.update((value) => ({
        ...value,
        bankAccountInfo: value.bankAccountInfo
          ? {
              ...value.bankAccountInfo,
              nextCheckNumber: result.newValue
            }
          : undefined
      }));
      this.bankDataService.updateAccounts(val);
    });
  }

  /**
   * @description Clone design row
   * @param val Selected bank details
   */

  onCloneDesignRow(val: IBankData) {
    const dialogRef = this.dialog.open(CloneCheckDesignComponent, {
      maxWidth: '450px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val as IBankData
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataTableService.setRefreshStatus(true);
        this.bankDataService.setAccounts();
      }
    });
  }

  /**
   * @description Navigate into  ACH AUTHERIZATION FORM
   * @param val Selected bank details
   */
  achAutherizationForm(val: IBankData) {
    this.router.navigate(
      ['/manage/bankingAch/auth-form/ach-authorization-form'],
      { queryParams: { ba: val.encrypted_bankacc_id } }
    );
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param index
   * @returns
   */
  trackByIndex(index: number) {
    return index;
  }

  dropListSort(event: CdkDragDrop<IBankData[]>) {
    this.bankDataService.bankAccountsStateSignal.update((val) => {
      const item = val.bankAccountList[event.previousIndex];
      if (!item) return { ...val };

      const count = val.bankAccountList.reduce((prev, curr) => {
        if (curr.is_favorite === 1) {
          // eslint-disable-next-line no-param-reassign
          prev += 1;
          return prev;
        }
        return prev;
      }, 0);

      if (event.currentIndex > count - 1) {
        return { ...val };
      }

      const array = [...val.bankAccountList];
      array.splice(event.previousIndex, 1);
      array.splice(event.currentIndex, 0, item);

      const order = array
        .filter((el) => el.is_favorite === 1)
        .reduce(
          (obj, el, i) => {
            // eslint-disable-next-line no-param-reassign
            obj[el.encrypted_bankacc_id] = i;
            return obj;
          },
          {} as Record<string, number>
        );
      this.updateOrder(order);
      return { ...val, bankAccountList: array };
    });
  }

  sortPredicate() {
    return (index: number, _: CdkDragDrop<IBankData[]>) => {
      const data =
        this.bankDataService.bankAccountsStateSignal().bankAccountList;
      const count = data.reduce((prev, curr) => {
        if (curr.is_favorite === 1) {
          // eslint-disable-next-line no-param-reassign
          prev += 1;
          return prev;
        }
        return prev;
      }, 0);

      return !(count - 1 < index);
    };
  }

  updateOrder(order: Record<string, number>) {
    firstValueFrom(this.banAccountService.updateFavoriteOrder({ order }));
  }

  bankAccountFavorite(bank: IBankData) {
    const subscription = this.banAccountService
      .bankAccountFavorite(
        bank.encrypted_bankacc_id,
        bank.is_favorite ? 'unfavorite' : 'favorite'
      )
      .subscribe((res) => {
        if (res.success) {
          const data = [
            ...this.bankDataService.bankAccountsStateSignal().bankAccountList
          ];
          if (!data) return;

          let index: number | undefined;
          const item = data.find((el, i) => {
            index = i;
            return el.id === bank.id;
          });

          if (!item || typeof index === 'undefined') return;

          data.splice(index, 1);

          const totalFavorites = data.reduce((prev, curr) => {
            if (curr.is_favorite === 1) {
              // eslint-disable-next-line no-param-reassign
              prev += 1;
              return prev;
            }
            return prev;
          }, 0);

          if (!bank.is_favorite) {
            data.splice(totalFavorites, 0, {
              ...item,
              is_favorite: 1
            });
          }

          if (bank.is_favorite) {
            data.splice(totalFavorites, 0, {
              ...item,
              is_favorite: 0
            });
          }

          this.alertService.successAlert({ close: true });
          this.bankDataService.bankAccountsStateSignal.update((val) => ({
            ...val,
            bankAccountList: data
          }));
        }
      });
    this.subscriptions.push(subscription);
  }

  dragEvents(event: 'start' | 'end') {
    if (event === 'start') this.grabbing = true;
    if (event === 'end') this.grabbing = false;
  }

  /**
   * @description Unsubscribe all subscriptions when the component destroy
   */
  ngOnDestroy(): void {
    // this.bankDataService.resetData();
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
