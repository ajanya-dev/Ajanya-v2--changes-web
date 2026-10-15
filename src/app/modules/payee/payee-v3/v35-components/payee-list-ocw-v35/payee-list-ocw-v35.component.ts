import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  take,
  takeUntil
} from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Store } from '@ngrx/store';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { toObservable } from '@angular/core/rxjs-interop';
import { UserService } from 'src/app/shared/service/user/user.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import {
  BankModalService,
  LEGAL_NAME_EDIT_MODAL
} from 'src/app/shared/bank-modal/service/bank-modal.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonLayoutToggleService } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faEdit,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { PayeeTableOcwV35Component } from '../payee-table-ocw-v35/payee-table-ocw-v35.component';
import { CommonListSkeltonComponent } from '../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { ScrollToEndDirective } from '../../../../../directive/scroll-to-end.directive';
import { ListHeaderV35Component } from '../../../../../shared/v3/common-components/list-header-v35/list-header-v35.component';
import { V35CommonDropDownSelectorComponent } from '../../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { ListViewToggleComponent } from '../../../../../shared/v3/common-components/list-view-toggle/list-view-toggle.component';

@Component({
  selector: 'app-payee-list-ocw-v35',
  templateUrl: './payee-list-ocw-v35.component.html',
  styleUrls: ['./payee-list-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    ListViewToggleComponent,
    V35CommonDropDownSelectorComponent,
    FormsModule,
    ListHeaderV35Component,
    ScrollToEndDirective,
    NgClass,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    CommonListSkeltonComponent,
    PayeeTableOcwV35Component,
    UpperCasePipe,
    WhiteLabelPipe,
    FaIconComponent
  ]
})
export class PayeeListOcwV35Component implements OnDestroy, OnInit {
  /** dependancy injection using injecrt method */
  dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);
  public payeeDataService = inject(PayeeDataV35Service);
  private alertService = inject(AlertService);
  private store = inject(Store);
  private userService = inject(UserService);
  private payeeModalService = inject(PayeeModalService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private commonLayoutToggleService = inject(CommonLayoutToggleService);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private bankModalService = inject(BankModalService);
  private headerService = inject(HeaderService);

  private bankEditOpened = false;

  /** variables */
  subscriptions: Subscription[] = [];
  isGridView = true;
  filterCategory = '0';
  searchTerm = '';
  nameSearchInput = '';
  page = 1;
  searchPage = 1;
  selectFromHere = false;
  noPayees = false;
  subjectKeyUp = new Subject();
  destroy$ = new Subject();
  payeeType = [
    { value: '0', name: '' },
    { value: '1', name: 'Customer' },
    { value: '2', name: 'Vendor' },
    { value: '3', name: 'Employee' }
  ];

  loadingSignal = computed(
    () => this.payeeDataService.payeeListSignal().loading
  );

  selectedPayeeSignal = computed(() => this.payeeDataService.payeeDataSignal());

  filteredPayeesSignal = computed(
    () => this.payeeDataService.payeeListSignal().filteredPayees
  );

  searchedPayeeSignal = computed(
    () => this.payeeDataService.payeeListSignal().searchedPayees
  );

  payeesSignal = computed(
    () => this.payeeDataService.payeeListSignal().allPayees
  );

  filterPage = 0;
  rowData = [];

  tabsArray: { value: string; name: string }[] = [
    { value: '0', name: 'All' },
    { value: '1', name: 'Customers' },
    { value: '2', name: 'Vendors' },
    { value: '3', name: 'Employees' }
  ];

  isListEmpty: boolean;
  updateSinglePayee = signal(false);
  env = environment;
  routedPayeeInfo: IPayeeDropdown[];
  resize = false;
  faTrash = faTrash;
  faEdit = faEdit;
  faArrowRotate = faArrowsRotate;

  set selectedValue(item: string) {
    const selectedPayee: IPayeeDropdown = JSON.parse(item);
    if (selectedPayee) {
      this.selectPayee(selectedPayee);
    }
  }

  get selectedValue(): string {
    return JSON.stringify(this.selectedPayeeSignal());
  }

  constructor() {
    this.getView();
  }

  ngOnInit(): void {
    this.debounceSearch();
    this.setAddedPayee();
    this.getPayeeCount();
    this.reloadPayee();
    this.getPayeeId();
    this.checkResize();
    this.handleLegalNameEditRedirect();
  }

  handleLegalNameEditRedirect(): void {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((params) => {
        if (params['payee-bank-edit'] === undefined || this.bankEditOpened) {
          return;
        }
        const bankId = params.payeebank_account_id;
        const payeeId = params.payee_id;
        if (!bankId || !payeeId) {
          return;
        }
        this.bankEditOpened = true;
        this.queueLegalNameEditModal(payeeId, bankId);
        this.router.navigate([], {
          relativeTo: this.activatedRoute,
          queryParams: {
            'payee-bank-edit': null,
            payeebank_account_id: null,
            payee_id: null
          },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      })
    );
  }

  private queueLegalNameEditModal(payeeId: string, bankId: string): void {
    this.headerService.enqueueModal(LEGAL_NAME_EDIT_MODAL, true);
    this.subscriptions.push(
      this.headerService.modalQueue$
        .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe((queue) => {
          if (
            !queue.length ||
            queue[0].modal !== LEGAL_NAME_EDIT_MODAL ||
            queue[0].wasOpened
          ) {
            return;
          }
          this.headerService.updateModalStatus();
          this.bankModalService
            .openAddBankNormalModal({
              editMode: true,
              id: payeeId,
              bankId,
              legalNameEdit: true
            })
            .pipe(take(1), takeUntil(this.destroy$))
            .subscribe((dialogRef) => {
              if (!dialogRef) {
                this.headerService.dequeueModal();
                return;
              }
              dialogRef
                .afterClosed()
                .pipe(take(1))
                .subscribe(() => this.headerService.dequeueModal());
            });
        })
    );
  }

  checkResize(): void {
    this.subscriptions.push(
      this.commonLayoutToggleService.toggleChange$.subscribe((res) => {
        this.resize = res;
      })
    );
  }

  /**
   * @description Extracts the payee ID from the URL and calls loadPayeeById if present.
   * This function is used in scenarios where the URL contains a payee ID.
   * @example URL format: `manage/payees/${payeeId}`
   */
  getPayeeId() {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe((params) => {
        const payeeId = params.get('id') as string;
        if (payeeId) {
          this.loadPayeeById(payeeId);
        }
      })
    );
  }

  /**
   * @description Fetches the payee details for a given payee ID.
   * @param {string} payeeId - The unique identifier of the payee.
   */
  loadPayeeById(payeeId: string, isFromUpdate = false) {
    const id: string[] = [];
    id.push(payeeId);
    this.subscriptions.push(
      this.payeeService.getPayeesByIds(id).subscribe((res) => {
        if (res.success && res.data?.length > 0) {
          this.routedPayeeInfo = res.data;
          if (isFromUpdate) {
            this.payeeDataService.payeeDataSignal.set(res.data[0]);
          }
        }
      })
    );
  }

  /**
   * @description the Entered searchTerm will be stored in subjectKeyUp subject()
   */
  fetchSearchData(search: string) {
    this.searchTerm = search;
    this.subjectKeyUp.next(this.searchTerm);
  }

  /**
   * @description Method to get total account count.
   */
  getPayeeCount() {
    this.subscriptions.push(
      this.userService.getUserOverallData().subscribe((res) => {
        if (res.success) {
          this.payeeService.payeeTotalCountSignal.set(res.data.payeeCount);
        }
      })
    );
  }

  /**
   * @descritpion in this function 2 rxjs operators used for best performance
   * @operator debounceTime  will call api after 1 second it only call api when there is a 1 second gap between 2 changes on subject other changes will be ignored
   * @operator distinctUntilChanged it will checks whether the value on subject is same as preveous if it is same as previous it will not call api
   */
  debounceSearch() {
    this.subjectKeyUp
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.filterCategory === '0') {
          this.searchPage = 1;
          this.fetchSeachedPayees([1, 2]);
        } else {
          this.categoryFilter(this.filterCategory);
        }
      });
  }

  fetchSeachedPayees(pages: number[]) {
    this.updateLoading(true);

    const payeeRequests = pages.map((page) =>
      this.payeeService
        .getPayees(page, this.searchTerm)
        .pipe(takeUntil(this.destroy$))
    );

    this.subscriptions.push(
      forkJoin(payeeRequests)
        .pipe(
          finalize(() => {
            this.updateLoading(false);
          })
        )
        .subscribe({
          next: (responses) => {
            const allData = responses.flatMap((res) => res.data);
            this.payeeDataService.payeeListSignal.update((val) => ({
              ...val,
              searchedPayees: allData
            }));
            if (allData.length > 0) {
              this.payeeDataService.payeeDataSignal.set(allData[0]);
              this.payeeDataService.setPayeeSearchResult(true);
              this.searchPage += 1;
            } else {
              this.payeeDataService.setPayeeSearchResult(false);
            }
          },
          error: () => {
            this.payeeDataService.setPayeeSearchResult(false);
          }
        })
    );
  }

  /**
   * @description subscribe to the observables for view change , edited data and selected payee
   * if the edited payee is not edited from this component then it will swap the data with 0 th index and it will selected
   */
  getView() {
    toObservable(this.payeeDataService.isGridViewSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isGridView = res;
        if (res) {
          this.page = 1;
          this.loadPayees(undefined, undefined, true);
        }
      });
    toObservable(this.payeeDataService.editedPayeeSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          res.encryptedId = res.id;

          let index = this.payeesSignal().findIndex(
            (el) => el.encryptedId === res.encryptedId
          );
          if (index >= 0) {
            const payees = this.payeesSignal();
            payees[index] = res;

            if (!this.selectFromHere) {
              [payees[index], payees[0]] = [payees[0], payees[index]];
              this.filterCategory = '0';
            }

            this.payeeDataService.payeeListSignal.update((val) => ({
              ...val,
              allPayees: payees
            }));
          } else {
            const searchedPayees = this.searchedPayeeSignal();
            index = searchedPayees.findIndex(
              (el) => el.encryptedId === res.encryptedId
            );
            if (index >= 0) {
              searchedPayees[index] = res;
              searchedPayees[index].encryptedId = res.encryptedId;

              if (!this.selectFromHere) {
                [searchedPayees[index], searchedPayees[0]] = [
                  searchedPayees[0],
                  searchedPayees[index]
                ];
              }

              this.payeeDataService.payeeListSignal.update((val) => ({
                ...val,
                searchedPayees
              }));
            } else {
              const payees = this.payeesSignal();

              index = payees.findIndex(
                (el) => el.encryptedId === res.encryptedId
              );
              payees[index] = res;
              payees[index].encryptedId = res.encryptedId;
              if (!this.selectFromHere) {
                [payees[index], payees[0]] = [payees[0], payees[index]];
              }
              this.payeeDataService.payeeListSignal.update((val) => ({
                ...val,
                allPayees: payees
              }));
            }
          }
          if (this.filteredPayeesSignal().length) {
            let isFilterChanged = false;
            if (this.filterCategory !== '0') {
              if (this.filterCategory !== res.payeeTypeId) {
                isFilterChanged = true;
              }
              if (isFilterChanged) {
                const payees = this.filteredPayeesSignal().filter(
                  (data) => data.encryptedId !== res.encryptedId
                );
                this.payeeDataService.payeeListSignal.update((val) => ({
                  ...val,
                  filteredPayees: payees
                }));
                if (this.filteredPayeesSignal.length === 0) {
                  this.categoryFilter(this.filterCategory);
                }
              } else {
                this.setPayeeEditedDetails(res);
              }
            } else {
              this.setPayeeEditedDetails(res);
            }
          }
        }
      });
    toObservable(this.payeeDataService.payeeDataSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const searchArr =
          this.searchTerm !== ''
            ? this.searchedPayeeSignal()
            : this.payeesSignal();
        const arr =
          this.filterCategory !== '0' ? this.filteredPayeesSignal() : searchArr;
        const data = arr.find((e) => e?.encryptedId === res?.encryptedId);
        if (!data) {
          if (res) {
            arr.unshift(res);
            this.payeeDataService.payeeDataSignal.set(res);
            this.updateUrl(res);
          }
        } else {
          if (this.selectFromHere === false) {
            const index = arr.findIndex(
              (el) => el.encryptedId === res?.encryptedId
            );
            [arr[index], arr[0]] = [arr[0], arr[index]];
          }
          this.payeeDataService.payeeDataSignal.set(res);
          this.updateUrl(res);
        }
      });
  }

  /**
   * @description Method to set edited payee details
   */
  setPayeeEditedDetails(payee: IPayeeDropdown) {
    if (this.filteredPayeesSignal().length) {
      const payees = this.filteredPayeesSignal();

      const index = payees.findIndex(
        (el) => el.encryptedId === payee.encryptedId
      );

      payees[index] = payee;

      if (!this.selectFromHere) {
        [payees[index], payees[0]] = [payees[0], payees[index]];
      }

      this.payeeDataService.payeeListSignal.update((val) => ({
        ...val,
        filteredPayees: payees
      }));
    }

    if (this.searchedPayeeSignal().length) {
      const searchData = this.searchedPayeeSignal();
      const index = searchData.findIndex(
        (el) => el.encryptedId === payee.encryptedId
      );

      searchData[index] = payee;
      searchData[index].encryptedId = payee.encryptedId;

      if (!this.selectFromHere) {
        [searchData[index], searchData[0]] = [searchData[0], searchData[index]];
      }
      this.payeeDataService.payeeListSignal.update((val) => ({
        ...val,
        searchedPayees: searchData
      }));
    }
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param index
   * @returns
   */
  trackByIndex(index: number) {
    return index;
  }

  /**
   * @description change the view into list view
   * */
  viewToggle(val: boolean) {
    this.isGridView = val;
    this.payeeDataService?.setPayeeView(val);
  }

  /**
   * @description loads the first 10 payees on first and select the first payee
   * @param edit
   * @param type
   */
  loadPayees(edit?: boolean, type?: boolean, initialLoad?: boolean) {
    this.payeeDataService.loadingSigal.set(true);
    if (edit) {
      if (type) {
        this.editedPayee(type);
        return;
      }
      this.editedPayee();
      return;
    }

    this.updateLoading(true);

    const list1 = this.payeeService.getPayees(this.page);
    if (initialLoad) {
      this.page += 1;
    }
    const list2 = initialLoad
      ? this.payeeService.getPayees(this.page)
      : of({ data: [] });

    forkJoin([list1, list2])
      .pipe(
        finalize(() => {
          this.updateLoading(false);
          this.payeeDataService.loadingSigal.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          const uniquePayees = (
            newPayees: IPayeeDropdown[],
            existingPayees: IPayeeDropdown[]
          ) => {
            const existingIds = new Set(
              existingPayees.map((payee) => payee.id)
            );
            return newPayees.filter((payee) => !existingIds.has(payee.id));
          };

          if (!this.payeeDataService.payeeDataSignal()?.encryptedId) {
            if (res[0].data.length > 0) {
              if (this.isListEmpty) {
                this.isListEmpty = false;
              } else {
                this.payeeDataService.payeeDataSignal.set(
                  this.routedPayeeInfo?.length > 0
                    ? this.routedPayeeInfo[0]
                    : res[0].data[0]
                );
              }

              this.payeeDataService.payeeListSignal.update((val) => {
                let newAllPayees = val.allPayees;

                // Add routedPayeeInfo if it has items
                if (this.routedPayeeInfo?.length > 0) {
                  newAllPayees = [...this.routedPayeeInfo, ...newAllPayees];
                }

                // Add unique payees from the response
                const uniqueNewPayees = uniquePayees(
                  [...res[0].data, ...res[1].data],
                  newAllPayees
                );

                return {
                  ...val,
                  allPayees: [...newAllPayees, ...uniqueNewPayees]
                };
              });
            } else {
              this.payeeDataService.payeeListSignal.update((val) => ({
                ...val,
                allPayees: []
              }));
              this.selectPayee();
            }
          } else {
            if (this.payeeDataService.isFromPayeeSummary()) {
              const payeeData =
                this.payeeDataService.payeeDataSignal() as IPayeeDropdown;
              this.payeeDataService.payeeListSignal.update((val) => ({
                ...val,
                allPayees: [
                  payeeData,
                  ...uniquePayees(
                    [...res[0].data, ...res[1].data],
                    [payeeData, ...val.allPayees]
                  )
                ]
              }));
              this.payeeDataService.isFromPayeeSummary.set(false);
            } else if (!this.payeeService.isFromGrid) {
              this.payeeDataService.payeeListSignal.update((val) => ({
                ...val,
                allPayees: [
                  ...val.allPayees,
                  ...uniquePayees(
                    [...res[0].data, ...res[1].data],
                    val.allPayees
                  )
                ]
              }));
            }
            this.selectPayee(this.payeeDataService.payeeDataSignal());
          }
          this.payeeService.isFromGrid = false;
        },
        error: () => {}
      });
  }

  /**
   * @description the edited payee from another component wants to make the same change on the existing list if the payee doesnt loaded then the payee inserted into the existing active array
   * @param type
   */
  editedPayee(type?: boolean) {
    if (type || this.filterCategory === '0') {
      this.filterCategory = '0';
      const payees = this.payeesSignal();
      const index = payees.findIndex(
        (el) => el.encryptedId === this.selectedPayeeSignal()?.encryptedId
      );
      if (index >= 0) {
        delete payees[index];
      }
      payees.unshift(this.selectedPayeeSignal() as IPayeeDropdown);
      this.payeeDataService.payeeListSignal.update((val) => ({
        ...val,
        allPayees: payees
      }));
    } else if (this.filterCategory !== '0') {
      const payees = this.filteredPayeesSignal();
      const index = payees.findIndex(
        (el) => el.encryptedId === this.selectedPayeeSignal()?.encryptedId
      );
      if (index >= 0) {
        delete payees[index];
      }

      payees.unshift(this.selectedPayeeSignal() as IPayeeDropdown);

      this.payeeDataService.payeeListSignal.update((val) => ({
        ...val,
        filteredPayees: payees
      }));
    } else {
      const payees = this.searchedPayeeSignal();
      const index = payees.findIndex(
        (el) => el.encryptedId === this.selectedPayeeSignal()?.encryptedId
      );
      if (index >= 0) {
        delete payees[index];
      }

      payees.unshift(this.selectedPayeeSignal() as IPayeeDropdown);

      this.payeeDataService.payeeListSignal.update((val) => ({
        ...val,
        searchedPayees: payees
      }));
    }
  }

  /**
   * @description call api for fetching next 10 datas when scrolls to end of div occurs
   * @returns
   */
  onScrollToEnd() {
    if (this.noPayees) {
      return;
    }
    if (this.filterCategory !== '0') {
      this.filterPage += 1;
    } else if (this.filterCategory === '0' && this.searchTerm !== '') {
      this.searchPage += 1;
    } else {
      this.page += 1;
    }
    if (this.filterCategory !== '0') {
      this.updateLoading(true);
      this.payeeService
        .getFilteredPayees(
          this.filterPage,
          parseInt(this.filterCategory, 10),
          this.searchTerm
        )
        .pipe(
          finalize(() => {
            this.updateLoading(false);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          this.payeeDataService.payeeListSignal.update((val) => ({
            ...val,
            filteredPayees: [...val.filteredPayees, ...res.data]
          }));
        });
      return;
    }
    this.updateLoading(true);
    this.payeeService
      .getPayees(
        this.searchTerm === '' ? this.page : this.searchPage,
        this.searchTerm
      )
      .pipe(
        finalize(() => {
          this.updateLoading(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.data.length === 0) {
          this.noPayees = true;
          return;
        }
        if (this.searchTerm === '') {
          this.payeeDataService.payeeListSignal.update((val) => {
            const newPayees = res.data.filter(
              (newPayee) =>
                !val.allPayees.some(
                  (existingPayee) =>
                    existingPayee.encryptedId === newPayee.encryptedId
                )
            );
            return {
              ...val,
              allPayees: [...val.allPayees, ...newPayees]
            };
          });
        } else {
          this.payeeDataService.payeeListSignal.update((val) => ({
            ...val,
            searchedPayees: [...val.searchedPayees, ...res.data]
          }));

          setTimeout(() => {
            const accountList: HTMLElement = document.querySelector(
              '.bank-accounts-list'
            ) as HTMLElement;
            accountList?.scrollTo(0, accountList.scrollTop - 1);
          }, 1);
        }
      });
  }

  /**
   * @description Opens the add payee modal.
   */
  openAddPayee() {
    const payeeType = parseInt(this.filterCategory, 10);

    this.subscriptions.push(
      this.payeeModalService
        .openAddPayee('addPayeeModal', {
          payeeType: payeeType !== 0 ? payeeType : 1
        })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                if (res?.success) {
                  this.page = 1;
                  res.encryptedId = res.id;
                  const payee = {
                    id: res.id,
                    name: res.name,
                    nickName: res.nickName,
                    phone: res.phone,
                    addressLine1: res.addressLine1,
                    addressLine2: res.addressLine2,
                    city: res.city,
                    company: res.company,
                    country: res.country,
                    email: res.email,
                    encryptedId: res.id,
                    state: res.state,
                    zip: res.zip,
                    payeeIdNumber: res.payeeIdNumber,
                    payeeTypeId: res.payeeTypeId,
                    merchantCategory: res.merchantCategory,
                    typeDetails: {
                      payee: {
                        payeeId: res.id,
                        payeeMobilePhone: res.phone
                      }
                    }
                  } as IPayeeDropdown;
                  this.updateExistingPayeeListAddPayee(
                    payee,
                    this.filterCategory
                  );
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description This method will add the payee to the payee signal list
   * @param payeeId Payee id that needs to be added to the payee list
   */
  updateExistingPayeeListAddPayee(payee: IPayeeDropdown, category: string) {
    const existingPayees = this.payeeDataService.payeeListSignal();
    existingPayees.allPayees.unshift(payee);
    if (payee.payeeTypeId === category) {
      existingPayees.filteredPayees.unshift(payee);
    }
    if (payee.payeeTypeId === category || category === '0') {
      this.payeeDataService.payeeDataSignal.set(payee);
    }
    this.payeeDataService.payeeListSignal.update((value) => ({
      ...value,
      ...existingPayees
    }));
  }

  /**
   * @description modal for editing existing payee
   * @param id
   */
  openEditPayee(id: string | undefined) {
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(id as string, 'addPayeeModal', {
          edit: true,
          id: id as string,
          type: 'string'
        })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                this.store.dispatch(payeesActions.payeesReset());
                if (res) {
                  res.encryptedId = res?.id;
                  this.payeeDataService.editedPayeeSignal.set(
                    res as IPayeeDropdown
                  );
                }
                if (res?.success) {
                  delete res?.success;
                  const updatedAllPayee = this.payeeDataService
                    .payeeListSignal()
                    .allPayees.filter((payee) => payee.id !== res.id);
                  updatedAllPayee.unshift({ ...res });
                  this.payeeDataService.payeeListSignal.update((payee) => ({
                    ...payee,
                    allPayees: updatedAllPayee
                  }));
                  if (this.filterCategory === '0') {
                    this.payeeDataService.payeeDataSignal.set(
                      this.payeesSignal()[0]
                    );

                    if (this.searchTerm !== '') {
                      const updatedSearchedAllPayee = this.payeeDataService
                        .payeeListSignal()
                        .searchedPayees.filter((payee) => payee.id !== res.id);

                      updatedSearchedAllPayee.unshift({ ...res });
                      this.payeeDataService.payeeListSignal.update((payee) => ({
                        ...payee,
                        searchedPayees: updatedSearchedAllPayee
                      }));
                    }

                    return;
                  }
                  const filteredPayee = this.payeeDataService
                    .payeeListSignal()
                    .filteredPayees.filter((payee) => payee.id !== res.id);
                  if (res.payeeTypeId === this.filterCategory) {
                    filteredPayee.unshift({ ...res });
                  }
                  this.payeeDataService.payeeListSignal.update((payee) => ({
                    ...payee,
                    filteredPayees: filteredPayee
                  }));
                  this.payeeDataService.payeeDataSignal.set(
                    this.filteredPayeesSignal()[0]
                  );
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description payee delete confirmation
   * @param id
   */
  deletePayee(id: string | undefined) {
    const alertData = {
      content: 'Are you sure to delete this payee?',
      cancelMsg: 'No, cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    const alert = this.alertService.confirmAlert(alertData);
    alert.afterClosed().subscribe((res) => {
      if (res) this.onSingleDelAction(id as string);
    });
  }

  /**
   * @description delete payee
   * @param itemId
   * @param warn
   */
  onSingleDelAction(itemId: string, warn: 1 | 0 = 0,confirmed: 1 | 0 = 0) {
    this.payeeService
      .deleteSinglePayee(itemId, warn,confirmed)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Payee deleted.' });
            this.updateExistingPayeeListDeletePayee(itemId);
            this.payeeService.payeeTotalCountSignal.update(
              (value) => value - 1
            );
            this.store.dispatch(
              payeesActions.removePayeeFromPayees({ payeeId: itemId })
            );
          }
        },
        error: (err) => {
          this.handlePayeeError(itemId, err);
        }
      });
  }

  /**
   * @description This method will remove the payee from the payee signal list
   * @param payeeId Payee id that needs to be removed from the payee list
   */
  updateExistingPayeeListDeletePayee(payeeId: string) {
    const existingPayees = this.payeeDataService.payeeListSignal();
    existingPayees.allPayees = existingPayees.allPayees.filter(
      (payee) => payee.id !== payeeId
    );
    existingPayees.filteredPayees = existingPayees.filteredPayees.filter(
      (payee) => payee.id !== payeeId
    );
    existingPayees.searchedPayees = existingPayees.searchedPayees.filter(
      (payee) => payee.id !== payeeId
    );
    this.payeeDataService.payeeListSignal.update((value) => ({
      ...value,
      ...existingPayees
    }));
    if (this.filterCategory === '0') {
      if (this.payeeDataService.payeeListSignal().searchedPayees.length) {
        this.payeeDataService.payeeDataSignal.set(
          existingPayees.searchedPayees[0]
        );
      } else if (
        this.payeeDataService.payeeListSignal().searchedPayees.length === 0 &&
        this.searchTerm.length
      ) {
        this.payeeDataService.payeeDataSignal.set(undefined);
      } else {
        this.payeeDataService.payeeDataSignal.set(existingPayees.allPayees[0]);
      }
    } else {
      this.payeeDataService.payeeDataSignal.set(
        existingPayees.filteredPayees[0]
      );
    }
  }

  /**
   * @description confirmation to  delete after confirm delete and when the payee has the transaction data or the payee has included in any other records
   * @param itemId
   * @param err
   */
  handlePayeeError(
    itemId: string,
    err: { error: { errorCode: number; errorMsg: string } }
  ) {
    if (err.error?.errorCode === 123) {
      this.alertService.warningAlert({
        content: `Sorry ,You have a recurring mail check on this payee,You need to cancel all recurring
        service before delete this payee <a href='/manage/checkmailing/recurring'>click to see</a>`
      });
    } else if (err.error?.errorCode === 124) {
      const alertData = {
        content: err.error.errorMsg,
        cancelMsg: 'Cancel',
        doneMsg: 'Delete'
      };
      const dRef = this.alertService.confirmAlert(alertData);
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          this.onSingleDelAction(itemId, 1);
        }
      });
    } else if (err.error?.errorCode === 126) {
    const alertData = {
      content: err.error.errorMsg,
      cancelMsg: 'Cancel',
      doneMsg: 'Delete'
    };
    const dRef = this.alertService.confirmAlert(alertData);
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.onSingleDelAction(itemId, 1,1);
      }
    });
  }
  }

  /**
   * @description filter the payees by category
   * @param val  = all || vendor || customer || employee
   */
  categoryFilter(val: string) {
    this.filterPage = 1;
    this.updateLoading(true);
    this.filterCategory = val;
    if (val === '0') {
      this.searchPage = 1;
      this.payeeService
        .getPayees(this.searchPage, this.searchTerm)
        .pipe(
          finalize(() => {
            this.updateLoading(false);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          if (res.data.length > 0) {
            this.payeeDataService.payeeDataSignal.set(res.data[0]);
            this.payeeDataService.payeeListSignal.update((values) => ({
              ...values,
              searchedPayees: res.data
            }));
          }
        });
    } else {
      const list1 = this.payeeService.getFilteredPayees(
        this.filterPage,
        parseInt(val, 10),
        this.searchTerm
      );
      this.filterPage += 1;
      const list2 = this.payeeService.getFilteredPayees(
        this.filterPage,
        parseInt(val, 10),
        this.searchTerm
      );
      forkJoin([list1, list2])
        .pipe(
          finalize(() => {
            this.updateLoading(false);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          this.payeeDataService.payeeListSignal.update((value) => ({
            ...value,
            filteredPayees: [...res[0].data, ...res[1].data]
          }));

          if (res[0].data.length > 0) {
            this.payeeDataService.payeeDataSignal.set(res[0].data[0]);
            this.payeeDataService.setPayeeSearchResult(true);
          } else {
            this.isListEmpty = true;
            this.payeeDataService.setPayeeSearchResult(false);
          }
        });
    }
  }

  /**
   * @description select a payee
   * @param item
   */
  selectPayee(item?: IPayeeDropdown) {
    if (this.selectedPayeeSignal()?.id === item?.id) {
      return;
    }

    this.selectFromHere = true;
    this.payeeDataService.actionSignal.update(() => 'details');
    this.payeeDataService.payeeDataSignal.set(item);
    this.updateUrl(item);
  }

  /**
   * Update the URL with the selected payee's ID.This function created for Compass ent customers.
   * @param {IPayeeDropdown} payee - Selected Payee
   */
  updateUrl(payee: IPayeeDropdown | undefined) {
    if (this.env.env_id !== 'compass') return;
    if (payee && payee.id) {
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { id: payee.id },
        queryParamsHandling: 'merge'
      });
    }
  }

  /**
   * Method for adding new payee to existing payee list
   */
  setAddedPayee() {
    this.payeeService
      .getNewPayee()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.page = 1;
          this.isListEmpty = true;
          this.loadPayees(undefined, undefined, false);
          res.encryptedId = res.id;
          this.payeeDataService.editedPayeeSignal.set(res);
          const payee = {
            ...res,
            typeDetails: {
              payee: {
                payeeId: res.id,
                payeeMobilePhone: res.phone
              }
            }
          } as IPayeeDropdown;
          this.store.dispatch(
            payeesActions.addCreatedPayeeIntoPayees({ payee })
          );
        }
      });
  }

  updateLoading(loading: boolean) {
    this.payeeDataService.payeeListSignal.update((val) => ({
      ...val,
      loading
    }));
  }

  /**
   * @description Reloads the list of payees.
   */
  reloadPayee(): void {
    this.subscriptions.push(
      this.payeeDataService.refreshPayee.subscribe((res) => {
        if (res) {
          this.page = 1;
          this.loadPayees(undefined, undefined, true);
        }
      })
    );
  }

  updatePayee(payeeId: string) {
    this.updateSinglePayee.set(true);
    this.netsuiteIntegrationService
      .updateSignlePayee({ id: payeeId })
      .pipe(
        finalize(() => {
          this.updateSinglePayee.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'Successfully Updated' });
          this.loadPayeeById(payeeId, true);
        }
      });
  }

  /**
   * @descripiton unsubscribe the whole subscritions subscribed from this component
   * when the component is destroyed
   */
  ngOnDestroy() {
    this.payeeDataService.payeeDataSignal.set(undefined);
    this.payeeDataService.payeeListSignal.set({
      loading: false,
      allPayees: [],
      filteredPayees: [],
      searchedPayees: []
    });
    this.destroy$.next(true);
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
