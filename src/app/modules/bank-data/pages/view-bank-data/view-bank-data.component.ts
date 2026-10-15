import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { DateAdapter } from '@angular/material/core';
import { ComponentType } from '@angular/cdk/portal';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';

import {
  IAccountsKeyVal,
  IProviderAccounts,
  IReAuthProvider,
  IProviderAccount
} from 'src/app/modules/bank/bank-v3/model/bank-v35';
import {
  IDtActionCompProp,
  IDtCellrendererBtn
} from 'src/app/modules/data-table/model/datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from '@angular/material/expansion';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { BankDataCommonSearchComponent } from './dtBankDataSearch';
import { bankDataDescriptionComponent } from './bankDataDescription';
import { AddNewRuleModalComponent } from '../../modals/add-new-rule-modal/add-new-rule-modal.component';
import { AddCompanyComponent } from '../../modals/add-company-modal/add-company-modal.component';
import { BankDataEditAccountModalComponent } from '../../modals/bank-data-edit-account-modal/bank-data-edit-account-modal.component';
import { BankDataEditProviderModalComponent } from '../../modals/bank-data-edit-provider-modal/bank-data-edit-provider-modal.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DateRangeComponent } from '../../../../shared/components/date-range/date-range.component';
import { faStar } from '@fortawesome/pro-solid-svg-icons';
import { BankDataLandingComponent } from '../../components/bank-data-landing/bank-data-landing.component';

interface IObjectKeys {
  [key: string]: string;
}
interface PostData extends IObjectKeys {
  fromDate: string;
  toDate: string;
  filteredBankAccounts: string;
  filterCompany: string;
  categoriesList: string;
  filteredDescription: string;
  filteredCategory: string;
  filteredDate: string;
  filteredAmount: string;
}
interface ICompany {
  id: string;
  name: string;
}
@Component({
  selector: 'app-view-bank-data',
  templateUrl: './view-bank-data.component.html',
  styleUrls: ['./view-bank-data.component.scss'],
  standalone: true,

  imports: [
    RouterLink,
    NgClass,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    FormsModule,
    FaIconComponent,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    NgSelectModule,
    DateRangeComponent,
    V3DataTableComponent,
    CurrencyPipe,
    BankDataLandingComponent
  ]
})
export class ViewBankDataComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  public dialog = inject(MatDialog);
  private bankDataService = inject(BankDataService);
  private alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  public currencyPipe = inject(CurrencyPipe);
  private dateAdapter = inject(DateAdapter);
  public datePipe = inject(DatePipe);
  private plaidHelperService = inject(PlaidHelperService);
  private activatedRoute = inject(ActivatedRoute);

  filterColIdMap: IObjectKeys = {
    filteredBankAccounts: 'accountId',
    filteredCategory: 'category_id_custom',
    filteredDescription: 'descriptionSimple',
    filteredDate: 'date',
    filteredAmount: 'amountAmount'
  };

  subscriptions: Subscription[] = [];

  providerAccounts: IProviderAccounts[] = [];
  reAuthProvider: IReAuthProvider = {};
  statusText: { [key: string]: string } = {};
  companies: ICompany[] = [];
  accountsKeyVal: IAccountsKeyVal = {};
  allAccounts: IAccountsKeyVal = {};
  categories: { [key: string]: string } = {};
  categoriesKeyVal: { [key: string]: string } = {};
  transactionTotal: { [key: string]: string } = {};

  showRefresh: boolean;

  public tableId = DTTableId.bankData; // Data Table Id
  headerElements = {};
  floatingFilterComponent = {};
  cellRenderer: IDtCellrendererBtn;
  cellRendererId: string;
  actionComponentProp: IDtActionCompProp;
  isSyncing = signal<{ [key: string]: boolean }>({});
  switchToIframe = signal<boolean>(false);
  showModernUi = signal<boolean>(false);

  faStar = faStar;
  today = new Date();
  startDate = this.dateAdapter
    .addCalendarMonths(this.today, -(12 * 10))
    .toISOString()
    .split('T')[0];

  endDate = this.dateAdapter
    .addCalendarMonths(this.today, +(12 * 10))
    .toISOString()
    .split('T')[0];

  postData: PostData = {
    fromDate: this.startDate,
    toDate: this.endDate,
    filteredBankAccounts: '',
    filterCompany: '',
    categoriesList: '',
    filteredDescription: '',
    filteredCategory: '',
    filteredDate: '',
    filteredAmount: ''
  };

  filters: (
    | { name: string; key: string; type: string; value: string | null }
    | { name: string; key: string; type: null; value: string }
  )[];

  postDataPassed = false;
  indexLoaded = false;

  // Announcement properties
  announcementVisible = true;

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    bankDataDescription: bankDataDescriptionComponent,
    bankDataSearch: BankDataCommonSearchComponent
  };

  ngOnInit(): void {
    this.getIndex();
    this.getCategories();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.subscriptions.push(
      this.bankDataService.searchEvent$.subscribe((search) => {
        if (search.colId) {
          this.customSearch(search);
        }
      })
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['type']) {
        this.showModernUi.set(true);
      }
    });
  }

  customSearch(search: { searchString: string; colId: string }) {
    const { searchString, colId } = search;

    switch (colId) {
      case 'descriptionSimple':
        this.postData.filteredDescription = searchString;
        break;
      case 'date':
        this.postData.filteredDate = searchString;
        break;
      case 'amountAmount':
        this.postData.filteredAmount = searchString;
        break;
      case 'category_id_custom':
        this.postData.filteredCategory = searchString;
        break;
      case 'accountId':
        if (searchString) {
          this.providerAccounts.forEach((bank) => {
            bank.accounts?.forEach((acc: IProviderAccount) => {
              if (acc.id !== searchString) {
                acc.checked = false;
              }
            });
          });
        } else {
          this.checkBankAccOnStatus();
        }
        this.filterAccounts();
        break;
      default:
        break;
    }
    this.v3DataTableService.setPostdata(this.postData);
    this.filterDataTable();
    this.getFiltersApplied();
  }

  getFiltersApplied() {
    const filters = [];

    if (this.postData.filteredDate?.length) {
      filters.push({
        name: 'date',
        key: 'filteredDate',
        type: 'on',
        value: this.datePipe.transform(this.postData.filteredDate, 'MM/dd/YYYY')
      });
    }
    if (this.postData.filteredDescription?.length) {
      filters.push({
        name: 'description',
        key: 'filteredDescription',
        type: 'like',
        value: this.postData.filteredDescription
      });
    }
    if (this.postData.filteredCategory) {
      filters.push({
        name: 'category',
        key: 'filteredCategory',
        type: null,
        value: this.categoriesKeyVal[this.postData.filteredCategory]?.replace(
          /&nbsp;/g,
          ''
        )
      });
    }
    if (
      this.postData.filteredBankAccounts?.length &&
      this.postData.filteredBankAccounts.split(',').length < 2
    ) {
      filters.push({
        name: 'account',
        key: 'filteredBankAccounts',
        type: null,
        value: this.getAccountName(this.postData.filteredBankAccounts)
      });
    }
    if (this.postData.filteredAmount?.length) {
      filters.push({
        name: 'matching amount',
        key: 'filteredAmount',
        type: null,
        value: this.postData.filteredAmount
      });
    }
    this.v3DataTableService.setPostdata(this.postData);
    this.filters = filters;
  }

  clearAllFilters() {
    this.filters = [];
    const filters = [
      'filteredDate',
      'filteredDescription',
      'filteredCategory',
      'filteredAmount',
      'filterCompany'
    ];
    filters.forEach((key) => {
      this.postData[key as keyof PostData] = '';
    });

    this.providerAccounts.forEach((bank) => {
      bank.accounts?.forEach((acc: IProviderAccount) => {
        if (acc.status) {
          acc.checked = true;
        }
      });
    });
    this.v3DataTableService.setPostdata(this.postData);
    this.filterDataTable();
    this.bankDataService.emitClearSearch('all');
  }

  clearFilter(key: string) {
    this.postData[key] = '';
    this.getFiltersApplied();
    this.filterDataTable();
    this.bankDataService.emitClearSearch(this.filterColIdMap[key]);
  }

  getIndex() {
    this.subscriptions.push(
      this.bankDataService
        .getIndex()
        .pipe(
          finalize(() => {
            this.indexLoaded = true;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.providerAccounts = <IProviderAccounts[]>(
              data.data.providerAccounts
            );
            this.checkBankAccOnStatus();
            this.allAccounts = data.data.accounts;
            this.statusText = data.data.status_text;
            this.showRefresh = Boolean(Number(data.data.show_refresh_button));
            this.reAuthProvider = this.makeReauthMessage(
              data.data.reauth_providers as unknown as IReAuthProvider
            );

            Object.entries(data.data.companies).forEach(([id, name]) => {
              const companyExists = this.companies.some(
                (company) => company.id === id
              );
              if (!companyExists) {
                this.companies.push({ id, name } as ICompany);
              }
            });

            this.bankDataService.accounts = this.accountsKeyVal;
            this.categoriesKeyVal = data.data.categories;
            this.bankDataService.categoriesKeyVal = this.categoriesKeyVal;
            if (this.postData.filteredBankAccounts) {
              this.v3DataTableService.setPostdata(this.postData);
            }
            this.filterAccounts();
            this.postDataPassed = true;
            this.filterDataTable();
          }
        })
    );
  }

  // MARK BANK ACCOUNT AS CHECKED WHERE STATUS IS TRUE
  checkBankAccOnStatus() {
    this.providerAccounts.forEach((bank) => {
      bank.accounts?.forEach((acc: IProviderAccount) => {
        acc.checked = !!acc.status;
        if (acc.status) {
          this.accountsKeyVal[acc.id] = acc;
        }
      });
    });
  }

  makeReauthMessage(data: IReAuthProvider) {
    Object.keys(data).forEach((id) => {
      data[id] = {
        status: data[id].status,
        statusMsg: this.statusText[data[id].statusMsg]
      };
    });

    return data;
  }

  selectedCheckDateRange(event: { start: string; end: string }) {
    if (
      !event ||
      !event?.start ||
      !event?.end ||
      (this.postData.fromDate ===
        this.datePipe.transform(event.start, 'yyyy-MM-dd') &&
        this.postData.toDate ===
          this.datePipe.transform(event.end, 'yyyy-MM-dd'))
    ) {
      return;
    }
    this.postData.fromDate = this.datePipe.transform(
      event.start,
      'yyyy-MM-dd'
    ) as string;
    this.postData.toDate = this.datePipe.transform(
      event.end,
      'yyyy-MM-dd'
    ) as string;
    this.v3DataTableService.setPostdata(this.postData);
    this.filterDataTable();
  }

  companyChange(companyId: string) {
    this.postData.filterCompany = companyId || '';
    this.v3DataTableService.setPostdata(this.postData);
    this.filterDataTable();
  }

  allAccountToggle(checked: boolean) {
    this.providerAccounts.forEach((prov) => {
      prov.checked = checked;
      prov?.accounts?.forEach((acc: IProviderAccount) => {
        acc.checked = checked;
      });
    });
    this.filterAccounts();
    this.filterDataTable();
  }

  accountCheckToggle() {
    this.filterAccounts();
    this.filterDataTable();
  }

  providerCheckToggle(provider: IProviderAccounts, checked: boolean) {
    provider.accounts.forEach((acc: IProviderAccount) => {
      acc.checked = checked;
    });
    this.filterAccounts();
    this.filterDataTable();
  }

  filterDataTable() {
    this.getTransactionTotal();
  }

  filterAccounts() {
    const filteredAcc: string[] = [];
    this.providerAccounts.forEach((prov) => {
      filteredAcc.push(
        ...(prov?.accounts ?? [])
          .filter((acc: IProviderAccount) => acc.checked)
          .map((e: { id: string }) => e.id)
      );
    });

    this.postData.filteredBankAccounts = filteredAcc.toString();
    this.v3DataTableService.setPostdata(this.postData);
    this.dataTableService.setRefreshStatus(true);
  }

  getCategories() {
    this.subscriptions.push(
      this.bankDataService.getCategories().subscribe((data) => {
        if (data?.success) {
          this.categories = data.data;
          this.bankDataService.setCategory(this.categories);
        }
      })
    );
  }

  getTransactionTotal() {
    this.subscriptions.push(
      this.bankDataService
        .getTransactionTotal(this.postData)
        .subscribe((data) => {
          if (data?.success) {
            this.transactionTotal = data.data;
          }
        })
    );
  }

  deleteProvider(id: string, index: number) {
    const dRef = this.alertService.confirmAlert({
      content:
        'Are you sure you want to delete this financial institution Accounts permanently?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankDataService.deleteProvider(id).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Provider deleted'
              });
              this.providerAccounts.splice(index, 1);
            }
          })
        );
      }
    });
  }

  editProvider(provider: IProviderAccounts) {
    const dRef = this.dialog.open(BankDataEditProviderModalComponent, {
      width: '500px',
      maxWidth: '93%',
      data: provider
    });

    dRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.alertService.successAlert({ content: 'Bank Updated!' });
        provider.providerName = res.providerName;
      }
    });
  }

  deleteBankAccount(id: string, provider: IProviderAccounts, index: number) {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this Bank permanently?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankDataService.deleteBank(id).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Bank deleted'
              });
              provider.accounts.splice(index, 1);
            }
          })
        );
      }
    });
  }

  activateAccount(id: string, provider: IProviderAccounts, index: number) {
    const dRef = this.alertService.confirmAlert({
      content: "Let's bring transactions of this Account for easy reporting"
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankDataService.activateAccount(id).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: ' ',
                content: 'Account Activated !'
              });
              provider.accounts[index].status = 1;
            }
          })
        );
      }
    });
  }

  deactivateAccount(id: string, provider: IProviderAccounts, index: number) {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure NOT to bring transactions of this account?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankDataService.deActivateAccount(id).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: ' ',
                content: 'Stopped that account',
                close: true
              });
              provider.accounts[index].status = 0;
              provider.accounts[index].checked = false;
            }
          })
        );
      }
    });
  }

  deleteCompany(id: string, index: number) {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this company permanently?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankDataService.deleteCompany(id).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Company deleted'
              });
              this.companies.splice(index, 1);
            }
          })
        );
      }
    });
  }

  openYodleeModal(id: string) {
    const data = {
      mode: 'verify_now',
      verifyNowAccountData: { pk: id }
    };
    this.dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data,
      panelClass: 'yodlee-modal-new'
    });
  }

  openPlaidModal(bankId: string) {
    this.subscriptions.push(
      this.plaidHelperService
        .openPlaidModal({
          isVerify: false,
          selectedBankId: bankId,
          page: 'bankData'
        })
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.alertService.successAlert({
                content: 'Updated successfully'
              });
              this.getIndex();
            }
          }
        })
    );
  }

  syncTransaction(selectedBankId: string) {
    if (this.isSyncing()[selectedBankId]) return;
    const selectedAccountIds =
      this.providerAccounts
        .find((bank) => bank.providerId === selectedBankId)
        ?.accounts.filter((account) => account?.checked)
        .map((account) => account.id) || [];

    const payload = {
      bankId: selectedBankId,
      accountIds: selectedAccountIds
    };

    if (selectedAccountIds.length === 0) {
      this.alertService.infoAlert({
        content: 'Please select at least one account to sync'
      });
      return;
    }

    this.isSyncing.set({ [selectedBankId]: true });

    this.subscriptions.push(
      this.bankDataService
        .syncPlaidTransactions(payload)
        .pipe(finalize(() => this.isSyncing.set({ [selectedBankId]: false })))
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.alertService.successAlert({ content: res.message });
            } else if (res?.errorCode === 'plaid_401') {
              const alert = this.alertService.failedAlert({
                content: res.errorMsg,
                doneMsg: 'Reconnect',
                isCancel: true
              });
              alert.afterClosed().subscribe((response) => {
                if (response) {
                  this.openPlaidModal(selectedBankId);
                }
              });
            }
          }
        })
    );
  }

  openAddCompanyModal(mode: 'new' | 'edit', company?: ICompany) {
    const dialogRef = this.dialog.open(AddCompanyComponent, {
      maxWidth: '93%',
      width: '510px',
      data: { company, mode }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        const content = mode === 'new' ? 'Comapny Added!' : 'Company Updated!';
        this.alertService.successAlert({
          title: 'Success',
          content,
          close: true,
          timeout: 2000
        });

        if (mode === 'new') {
          this.companies.unshift(result?.data);
        } else if (mode === 'edit') {
          if (company) {
            company.name = result.data.name;
          }
        }
      }
    });
  }

  openAddNewRuleModal() {
    this.dialog.open(AddNewRuleModalComponent, {
      width: '1000px',
      maxWidth: '93%'
    });
  }

  openEditAccount(
    account: IProviderAccount,
    provider: { providerName: string }
  ) {
    const dialogRef = this.dialog.open(BankDataEditAccountModalComponent, {
      maxWidth: '93%',
      width: '700px',
      autoFocus: false,
      data: {
        companies: this.companies,
        account,
        providerName: provider.providerName
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.alertService.successAlert({
          title: 'Success',
          content: 'Bank Details Updated',
          close: true,
          timeout: 2000
        });
        this.getIndex();
      }
    });
  }

  getAccountName(id: string): string {
    if (!(id in this.allAccounts)) {
      return '';
    }
    const account = this.allAccounts[id];
    let name = account.short_name ? account.short_name : account.nick_name;
    if (!name) {
      name = account.name?.trim();
    }
    return name as string;
  }

  // ===============> Col Defs <===============

  colDefIndex = {
    headerName: '#',
    field: 'checkNumber',
    suppressFloatingFilterButton: true,
    minWidth: 40,
    maxWidth: 50,
    headerClass: 'pl-3.5',
    suppressHeaderMenuButton: true,
    sortable: false,
    lockPosition: true,
    cellClass: 'flex justify-center',
    cellRenderer: (params: Params) => {
      if (params && params.rowIndex !== undefined) {
        return params.rowIndex + 1;
      }
      return '';
    }
  };

  colDefDescription = {
    headerName: 'Description',
    field: 'description_custom',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'bankDataDescription',
    cellRendererForExport: (params: Params) => {
      let description = 'null';
      if (params?.data?.description_custom) {
        description = params.data.description_custom;
      } else if (params?.value) {
        description = params.value;
      } else if (params?.data?.original_description) {
        description = params.data.original_description;
      }

      return description;
    }
  };

  colDefDate = {
    headerName: 'Date',
    field: 'date',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',

    filterParams: { newRowsAction: 'keep' },
    cellRenderer: (params: Params) =>
      this.datePipe.transform(params?.value, 'MM/dd/yyyy') as string
  };

  colDefCategory = {
    headerName: 'Category',
    field: 'category_id_custom',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    floatingFilterComponent: 'bankDataSearch',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'bankDataDescription',
    cellRendererForExport: (params: Params) =>
      params.data?.category_name_custom?.replace(/&nbsp;/g, '')
  };

  colDefAccount = {
    headerName: 'A/C',
    field: 'account_id',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'bankDataSearch',
    filter: 'agTextColumnFilter',

    cellRenderer: (params: Params) => {
      const name = params.data?.account_name ?? '';
      return `<span title="${name}">${name}</span>`;
    },
    cellRendererForExport: (params: Params) => params.data?.account_name
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amountAmount',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',

    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: Params) =>
      this.currencyPipe.transform(params.value) as string
  };

  colDefType = {
    headerName: 'Type',
    field: 'base_type',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: (params: Params) => {
      const { value } = params;
      const displayValue =
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      const color = value === 'CREDIT' ? '#28a745' : '#dc3545';
      return `<span style="color: ${color}">${displayValue}</span>`;
    }
  };

  columnDefs = [
    this.colDefDescription,
    this.colDefDate,
    this.colDefCategory,
    this.colDefAccount,
    this.colDefType,
    this.colDefAmount
  ];

  columnFields = [
    {
      id: 'SNo',
      name: '#',
      isDisabled: true,
      colDef: this.colDefIndex,
      isChecked: true
    },
    {
      id: 'description',
      name: 'Description',
      isDisabled: false,
      colDef: this.colDefDescription,
      isChecked: true
    },
    {
      id: 'date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'category',
      name: 'Category',
      isDisabled: false,
      colDef: this.colDefCategory,
      isChecked: true
    },
    {
      id: 'account',
      name: 'A/C',
      isDisabled: false,
      colDef: this.colDefAccount,
      isChecked: true
    },
    {
      id: 'base_type',
      name: 'Type',
      isDisabled: false,
      colDef: this.colDefType,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    }
  ];

  onProceedToBankData() {
    this.switchToIframe.update((prev) => !prev);
  }

  toggleView() {
    this.switchToIframe.update((prev) => !prev);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
