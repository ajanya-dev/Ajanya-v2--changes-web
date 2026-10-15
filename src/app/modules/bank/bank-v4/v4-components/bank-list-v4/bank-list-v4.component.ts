import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  OnInit,
  HostBinding,
  ViewContainerRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IBankData } from 'src/app/models/bank';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialog } from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { Subject, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { ConnectedPosition,OverlayModule } from '@angular/cdk/overlay';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { Store } from '@ngrx/store';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { faStar } from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, JsonPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { V4SignatureUploadPanelComponent } from 'src/app/modules/payments-v4/send-payment/components/modals/signature-upload-panel/v4-signature-upload-panel.component';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { IApiRes } from 'src/app/models/api';
import { ICustomRestrictions } from 'src/app/modules/check/model/check';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { AddBankMethodChoiceModalComponent } from '../../v4-modals/add-bank-method-choice-modal/add-bank-method-choice-modal.component';
import { ChangeStartingNumberV4Component } from '../../v4-modals/change-starting-number-v4/change-starting-number-v4.component';
import { EditBankAccountModalV4Component } from '../../../../user/user-v4/modals/edit-bank-account-modal-v4/edit-bank-account-modal-v4.component';
import { BankDataV35Service } from '../../../bank-v3/v35-services/bank-data-v35.service';
import { BankDataV4Service } from '../../v4-services/bank-data-v4.service';
import { CloneCheckDesignV4Component } from '../../v4-modals/clone-check-design-v4/clone-check-design-v4.component';
import { AchAuthorizationFormV4Component } from '../../v4-modals/ach-authorization-form-v4/ach-authorization-form-v4.component';
import { MoveSelectedToTopPipe } from '../../../../../pipes/move-selected-to-top.pipe';
import { CommonListSkeltonComponent } from '../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { ScrollToEndDirective } from '../../../../../directive/scroll-to-end.directive';
import { ListHeaderV4Component } from '../../../../../shared/v4/common-components/list-header-v4/list-header-v4.component';

@Component({
  selector: 'app-bank-list-v4',
  templateUrl: './bank-list-v4.component.html',
  styleUrls: ['./bank-list-v4.component.scss'],
  standalone: true,
  imports: [
    ListHeaderV4Component,
    FormsModule,
    CdkDropList,
    ScrollToEndDirective,
    NgClass,
    CdkDrag,
    FaIconComponent,
    LucideAngularModule,
    MatTooltip,
    OverlayModule,
    CommonListSkeltonComponent,
    JsonPipe,
    MoveSelectedToTopPipe
  ],
  providers: [CheckdesignCanvasService]
})
export class BankListV4Component implements OnInit {
  @HostBinding('class')
  hostClass = 'flex flex-col h-full overflow-hidden bg-v4-tertiary-background-color';

  public bankDataService = inject(BankDataV35Service);
  private bankDataV4Service = inject(BankDataV4Service);
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private bankAccountService = inject(BankAccountsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private headerService = inject(HeaderService);
  private store = inject(Store);
  private banAccountService = inject(BankAccountsService);
  private payeeOnboardingService = inject(PayeeOnboardingService);
  private checkDesignService = inject(CheckDesignService);
  private sharedService = inject(SharedService);
  private localStorageService = inject(LocalStorageService);
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private customDoubleSideModalService = inject(CustomDoubleSideModalService);
  private viewContainerRef = inject(ViewContainerRef);
  private elementRef = inject(ElementRef);

  private destroyRef = inject(DestroyRef);
  bankData: IBankData[];
  page = 1;
  isPermissionPopupEnabled = false;
  selectedBankAccount: IBankData | undefined = undefined;

  settings: {
    name: string;
    id: string;
    lucideIcon: string;
  }[] = [
    { name: 'Edit', id: 'id_editRow', lucideIcon: 'square-pen' },
    { name: 'Edit Design', id: 'id_edit_design_row', lucideIcon: 'pencil-line' },
    { name: 'Delete', id: 'id_delete_row', lucideIcon: 'trash-2' },
    {
      name: 'Change Starting Number',
      id: 'id_change_starting_number',
      lucideIcon: 'arrow-left-right'
    },
    { name: 'Clone Design', id: 'id_clone_design_row', lucideIcon: 'copy' },
    { name: 'Add Signature', id: 'id_add_signature', lucideIcon: 'pen-tool' },
    {
      name: 'ACH Authorization Form',
      id: 'id_ach_authorization_form',
      lucideIcon: 'clipboard-check'
    },
    { name: 'Favorite', id: 'id_favorite', lucideIcon: 'star' }
  ];

  popoverPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4
    }
  ];

  openPopoverItemId: number | null = null;

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
  isSearchLoading = true;
  private hasSeenLoadingStart = false;

  constructor() {
    effect(() => {
      const loading = this.bankDataService.accountLoadingSignal();
      if (loading) {
        this.hasSeenLoadingStart = true;
      } else if (this.hasSeenLoadingStart) {
        this.isSearchLoading = false;
      }
    });
  }

  ngOnInit() {
    this.getAccounts();
    this.debounceSearch();
    this.listenQueryParamMap();
    this.checkResize();
    this.bankAccountService.requestNewBankAccount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onNew());
  }

  checkResize(): void {
    this.commonLayoutToggleV4Service.toggleChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.resize = res;
        this.updateCollapsedWidth(res);
      });
  }

  private updateCollapsedWidth(isCollapsed: boolean): void {
    const layoutPanel =
      this.elementRef.nativeElement?.parentElement?.parentElement;
    if (!layoutPanel) return;
    if (isCollapsed) {
      layoutPanel.style.setProperty('min-width', '60px', 'important');
      layoutPanel.style.setProperty('width', '60px', 'important');
    } else {
      layoutPanel.style.removeProperty('min-width');
      layoutPanel.style.removeProperty('width');
    }
  }

  listenQueryParamMap() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
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

        if (params.get('action') === 'addBank') {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { action: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
          setTimeout(() => {
            this.onNew();
          });
        }
      });
  }

  getSelectedBankAccount() {
    this.selectedBankAccount = this.bankDataService.selectedBankAccountSignal();
    if (this.selectedBankAccount) {
      this.bankDataService.selectBankAccount(this.selectedBankAccount);
    }
  }

  getAccounts() {
    this.bankDataService.getTotalBankAccountsCount
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.totalAccountsCount = res;
        if (this.totalAccountsCount === 1) {
          this.bankDataService.selectBankAccount(
            this.bankDataService.bankAccountsSignal()[0]
          );
        }
      });
  }

  selectAll() {
    this.bankDataService.resetData();
    this.sharedService.selectedPayees.reset();
    this.commonLayoutToggleV4Service.navigateToDetail();
  }

  onScrollToEnd() {
    if (
      this.page * 20 <
      (this.bankDataService.bankAccountCountSignal() as number)
    ) {
      this.page += 1;
      this.bankDataService.getRemainingAccounts(this.page);
    }
  }

  toggleDropDown() {
    this.bankDataService.showDropDown = !this.bankDataService.showDropDown;
  }

  filterData(searchItem: string) {
    this.searchInput = searchItem;
    this.bankDataService.searchInputSignal.set(searchItem);
    this.selectAll();
    this.isSearchLoading = true;
    if (!searchItem) {
      this.bankDataService.setAccounts('');
      return;
    }
    this.subjectKeyUp.next(this.searchInput);
  }

  debounceSearch() {
    this.subjectKeyUp
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.bankDataService.setAccounts(this.searchInput);
      });
  }

  onNew() {
    if (this.banAccountService.isPermissionPopupEnabled) {
      return;
    }

    if (this.payeeOnboardingService.payeeOnboardingSignal().initiatorId) {
      this.router.navigate(['/v4/manage/payee-onboarding/set-password']);
      return;
    }

    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        if (isUser) {
          this.banAccountService.isPermissionPopupEnabled = true;
          this.banAccountService
            .AddBank({ permission_check_to_create_bank_account: '' })
            .pipe(
              finalize(() => {
                this.banAccountService.isPermissionPopupEnabled = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
              next: () => {
                this.openAddBankMethodChoiceModal();
              }
            });
        } else {
          this.openAddBankMethodChoiceModal();
        }
      });
  }

  private openAddBankMethodChoiceModal(): void {
    this.customDoubleSideModalService.open(
      AddBankMethodChoiceModalComponent,
      { width: '480px', disableClose: true }
    );
  }

  applyAchClick(val: IBankData) {
    this.bankDataService.applyAchClick(val);
  }

  openBankVerifyModal(bankAcData: IBankData) {
    if (bankAcData.bank_account_country === 'Canada') {
      this.alertService.warningAlert({
        content: 'Verification for Canadian bank accounts is not permitted.'
      });
      return;
    }
    this.bankDataV4Service.openBankVerifyModal(bankAcData);
  }

  microDeposit(val: IBankData) {
    this.bankDataV4Service.microDeposit(val);
  }

  onSettingClick(action: string, item: IBankData) {
    this.showSettings = false;
    this.closePopover();
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

    // Defer actions to allow popover CDK overlay to fully close before opening dialogs
    setTimeout(() => {
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
    }, 100);
  }

  onEditRow(val: IBankData) {
    const editBankModal = this.dialog.open(EditBankAccountModalV4Component, {
      maxWidth: '600px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val,
      panelClass: 'paddingless-modal-rounded'
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

  goToCheckDesign(selectedRow: IBankData) {
    this.localStorageService.setItem('selectedBankTemp', selectedRow);
    window.location.href = `checkdesign/edit/${selectedRow.encrypted_bankacc_id}?returnUrl=${encodeURIComponent('/v4/manage/bank-accounts/index?selectPrev=true')}&from=v4`;
  }

  onDeleteRow(val: IBankData) {
    const arr: string[] = [];
    arr.push(val.encrypted_bankacc_id);
    const data = {
      ids: arr
    };

    const message = { title: 'Confirm' };
    const response = this.alertService.confirmAlert(message);
    response.afterClosed().subscribe((result) => {
      if (result) {
        if (this.bankDataService.isAchPending(val, true)) {
          return;
        }
        this.deleteSingleBankAccount(val, data);
      }
    });
  }

  private deleteSingleBankAccount(
    val: IBankData,
    data: { ids: string[] },
    confirmed: 0 | 1 = 0
  ) {
    this.bankAccountService
      .deleteBankAccount(val.encrypted_bankacc_id, confirmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
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
          if (err.error?.errorCode === 125) {
            this.onDeleteBank(data, err.error.errorMsg, val);
          } else if (err.error?.errorCode === 126) {
            const alert = this.alertService.confirmAlert({
              content: err.error.errorMsg,
              doneMsg: 'Continue',
              isCancel: true,
              cancelMsg: 'Cancel'
            });
            alert
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res) {
                  this.deleteSingleBankAccount(val, data, 1);
                }
              });
          }
        }
      });
  }

  onDeleteBank(data: { ids: string[] }, errorMsg: string, val: IBankData) {
    const deleted = this.alertService.failedAlert({
      content: errorMsg,
      doneMsg: 'Ok',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    deleted.afterClosed().subscribe((res) => {
      if (res) {
        this.bankAccountService
          .deleteBankAccountInfo(data)
          .pipe(takeUntilDestroyed(this.destroyRef))
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
          });
      }
    });
  }

  addSignature(val: IBankData) {
    this.checkDesignService
      .getCustomRestriction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiRes<ICustomRestrictions>) => {
          if (response.success) {
            const dialogRef = this.dialog.open(V4SignatureUploadPanelComponent, {
              maxWidth: '690px',
              width: '93%',
              panelClass: 'paddingless-modal-rounded',
              minHeight: '410px',
              disableClose: true
            });
            dialogRef.afterClosed().subscribe((signImg) => {
              if (signImg) {
                this.bankAccountService
                  .addSignature(
                    val.encrypted_bankacc_id,
                    signImg.existSign ? signImg.existSign : signImg.signatureUrl
                  )
                  .pipe(takeUntilDestroyed(this.destroyRef))
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
                  });
              }
            });
          }
        }
      });
  }

  changeStartingNo(val: IBankData) {
    const checkNumberModal = this.dialog.open(ChangeStartingNumberV4Component, {
      maxWidth: '400px',
      width: '100%',
      disableClose: false,
      autoFocus: false,
      data: val,
      panelClass: 'paddingless-modal-rounded'
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

  onCloneDesignRow(val: IBankData) {
    const dialogRef = this.dialog.open(CloneCheckDesignV4Component, {
      maxWidth: '450px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val as IBankData,
      panelClass: 'paddingless-modal-rounded',
      viewContainerRef: this.viewContainerRef
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataTableService.setRefreshStatus(true);
        this.bankDataService.setAccounts();
      }
    });
  }

  achAutherizationForm(val: IBankData) {
    this.dialog.open(AchAuthorizationFormV4Component, {
      maxWidth: '600px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val,
      panelClass: 'paddingless-modal-rounded'
    });
  }

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
    this.banAccountService
      .bankAccountFavorite(
        bank.encrypted_bankacc_id,
        bank.is_favorite ? 'unfavorite' : 'favorite'
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
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
  }

  selectBankAccount(item: IBankData) {
    this.bankDataService.selectBankAccount(item);
    this.commonLayoutToggleV4Service.navigateToDetail();
  }

  dragEvents(event: 'start' | 'end') {
    if (event === 'start') this.grabbing = true;
    if (event === 'end') this.grabbing = false;
  }

  togglePopover(event: MouseEvent, item: IBankData): void {
    event.stopPropagation();
    this.bankDataService.selectBankAccount(item);
    this.openPopoverItemId =
      this.openPopoverItemId === item.id ? null : item.id;
  }

  closePopover(): void {
    this.openPopoverItemId = null;
  }
}
