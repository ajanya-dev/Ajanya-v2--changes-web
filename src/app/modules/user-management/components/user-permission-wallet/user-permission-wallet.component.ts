import { NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  computed
} from '@angular/core';
import { debounceTime, distinctUntilChanged, finalize, Subject, takeUntil } from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faAngleLeft,
  faAngleRight,
  faSpinner,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { Utils } from 'src/app/data/utils';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { IAccountsPermission } from 'src/app/models/user';
import { UserManagementV35Service } from '../../service/user-management-v35.service';

@Component({
  selector: 'app-user-permission-wallet',
  standalone: true,
  imports: [FaIconComponent, FormsModule, NgClass, MatTooltip, TruncatePipe],
  templateUrl: './user-permission-wallet.component.html',
  styleUrl: './user-permission-wallet.component.scss'
})
export class UserPermissionWalletComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private userManagementV35Service = inject(UserManagementV35Service);
  private userService = inject(UserManagementService);

  @Output() rowClicked = new EventEmitter();
  destroy$ = new Subject();
  subjectKeyUp = new Subject();
  isLoading = signal(false);
  walletList: IWalletData[] = [];
  displayedWalletList: IWalletData[] = [];
  totalWallets: number = 0;
  searchInput: string = '';
  permissionName = input('');
  walletIds: { [key: string]: boolean | undefined } = {};
  isEnableAllRowSelection = signal<boolean | undefined>(undefined);
  currentNumber = 1;
  toNumber = 20;
  totalPage = 0;
  initialCount = 1;
  pseudoI: number;
  pageArr: (number | '...')[] = [];
  mode = 1;
  initialPage = 0;
  selectedPage = 1;
  selectedValue: number;
  utils = Utils;
  specificPageInput: number;

  faAngleRight = faAngleRight;
  faAngleLeft = faAngleLeft;
  faSpinner = faSpinner;
  faXmark = faXmark;

  getAllRowSelecton$ = toObservable(
    this.userManagementV35Service.selectAllPermission
  );

  showAllSelected = false;
  allSelectedNames: string[] = [];
  displayedSelectedNames: string[] = [];
  selectAllWallets = false;
  clientPermissionId: string;
  totalSelectedFromApi = 0;
  currentSelectedItemsPage = 1;
  isLoadingMoreSelectedItems = false;
  hasMoreSelectedItems = true;
  isLoadingAccountsPermission = signal(false);
  
  // Signals to store all loaded wallet items with their selection state
  private loadedWalletsSignal = signal<Map<string, { name: string; selected: boolean }>>(new Map());
  
  // Computed signal to get selected names from stored wallet items
  public selectedNamesComputed = computed(() => {
    const items = this.loadedWalletsSignal();
    const selectedNames: string[] = [];
    
    items.forEach((item) => {
      if (item.selected && item.name) {
        // Don't filter duplicates - show all selected names
        selectedNames.push(item.name);
      }
    });
    
    return selectedNames;
  });
  
  // Computed signal for total selected count (combining grid selections and API data)
  public totalSelectedCountComputed = computed(() => {
    const currentPermission = this.permissionName();
    const items = this.loadedWalletsSignal();
    let selectedCount = 0;
    
    // Count selected items from loaded data
    items.forEach((item) => {
      if (item.selected) {
        selectedCount += 1;
      }
    });
    
    // Get count from permission signals for items not yet loaded
    const walletIds = this.userManagementV35Service.permissionBankId()[currentPermission] || {};
    
    // Count selected wallets that aren't in loaded items
    Object.entries(walletIds).forEach(([id, selected]) => {
      if (selected && !items.has(id)) {
        selectedCount += 1;
      }
    });
    
    return selectedCount;
  });

  // Computed signal to check if all wallets are selected
  public isAllWalletsSelectedComputed = computed(() => {
    const currentPermission = this.permissionName();
    const walletIds = this.userManagementV35Service.permissionBankId()[currentPermission] || {};
    
    // Filter out undefined keys and check if all valid entries are selected
    const walletEntries = Object.entries(walletIds).filter(([id]) => id !== 'undefined' && id !== undefined);
    return walletEntries.length > 0 && walletEntries.every(([, selected]) => selected === true);
  });

  ngOnInit(): void {
    this.getClientId();
    this.getWalletData();
    this.setRowSelection();
    this.debounceSearch();
  }

  getClientId(): void {
    this.userManagementV35Service.selectedUser$.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res) {
        this.clientPermissionId = res.client_id;
        this.accountsPermission();
      }
    });
  }

  accountsPermission(): void {
    const currentPermission = this.permissionName();
    if (!this.clientPermissionId) return;
    
    // Reset pagination state
    this.currentSelectedItemsPage = 1;
    this.hasMoreSelectedItems = true;
    this.isLoadingMoreSelectedItems = false;
    this.isLoadingAccountsPermission.set(true);
    const payload = {
      pagination: {
        [currentPermission]: {
          page: 1,
          per_page: 50  // Fetch more items to get all selected ones
        }
      }
    };

    this.userService.getAccountsPermission(this.clientPermissionId, payload)
      .pipe(
        finalize(() => {
          this.isLoadingAccountsPermission.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          // Initialize loaded items from API response
          this.initializeLoadedItemsFromApiResponse(res.data, currentPermission);
          
          // Set pagination state based on response
          const pagination = res.data[currentPermission]?.pagination;
          if (pagination) {
            this.hasMoreSelectedItems = pagination.last_page > 1;
            this.totalSelectedFromApi = pagination.total || 0;
          }
        }
      });
  }

  private initializeLoadedItemsFromApiResponse(apiData: IAccountsPermission, currentPermission: string): void {
    if (!apiData || !apiData[currentPermission]) return;
    
    const permissionData = apiData[currentPermission];
    const currentLoadedWallets = new Map(this.loadedWalletsSignal());
    
    // Get the existing permission IDs to check selection status
    const existingWalletIds = this.userManagementV35Service.permissionBankId()[currentPermission] || {};
    
    // Process the data array from API
    if (permissionData.data && Array.isArray(permissionData.data)) {
      permissionData.data.forEach((item: {id: string, name: string}) => {
        if (item.id && item.name) {
          // Check if this item is selected
          const isSelected = !!existingWalletIds[item.id];
          
          // Add selected items to the loaded items map
          if (isSelected) {
            currentLoadedWallets.set(item.id, {
              name: item.name,
              selected: true
            });
          }
        }
      });
    }
    
    // Update the signal with new loaded items
    this.loadedWalletsSignal.set(currentLoadedWallets);
  }

  getWalletData(page = 1, searchInput = ''): void {
    this.isLoading.set(true);
    this.walletService
      .getWalletInformation(page, searchInput)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.displayedWalletList = res.data;
          if (!this.walletList) {
            this.walletList = [];
          }

          // Avoid duplicates
          const existingIds = new Set(this.walletList.map((item) => item.id));
          res.data.forEach((item) => {
            if (!existingIds.has(item.id)) {
              this.walletList.push(item);
            }
          });

          this.totalWallets = res.totalCount as number;
          this.setShowResult(page, this.totalWallets);
          this.setPagination(res.totalCount as number);
          const isAllSelect = this.isEnableAllRowSelection();
          this.setPermissionIds(typeof isAllSelect === 'boolean', isAllSelect);
          this.setPermissionIds();
        }
      });
  }

  setShowResult(page: number, totalWallets: number) {
    if (!page) return;
    this.currentNumber = (page - 1) * 20 + 1;
    this.toNumber = page * 20;
    if (this.toNumber > totalWallets) {
      this.toNumber = totalWallets;
    }
  }

  setPermissionIds(isFromAllSelect = false, isAllSelect?: boolean): void {
    const currentPermission = this.permissionName();
    const updatedBankIds: { [key: string]: boolean | undefined } = {};

    const existingBankIds =
      this.userManagementV35Service.permissionBankId()[currentPermission] || {};

    // Check if all wallets selection is enabled from the service
    const isAllWalletsSelected = this.userManagementV35Service.allWalletsSelected()[currentPermission] || false;
    
    // Update loaded wallets signal with current wallet data
    const currentLoadedWallets = new Map(this.loadedWalletsSignal());

    this.walletList.forEach((item) => {
      const idToCheck = item.id;
      const {walletName} = item;

      if (isFromAllSelect) {
        if (
          this.userManagementV35Service.indexPermission()?.[
            currentPermission
          ] === false
        ) {
          updatedBankIds[idToCheck] =
            existingBankIds[idToCheck] !== undefined &&
            existingBankIds[idToCheck] !== true
              ? existingBankIds[idToCheck]
              : (isAllSelect ?? false);
        } else {
          updatedBankIds[idToCheck] = isAllSelect ?? false;
        }
      } else if (isAllWalletsSelected) {
        // If selectAllWallets is true, automatically select new wallets when navigating pages
        updatedBankIds[idToCheck] = true;
      } else {
        updatedBankIds[idToCheck] = existingBankIds[idToCheck] || false;
      }
      
      // Store the wallet in the signal with its current selection state
      if (idToCheck && walletName) {
        const isSelected = isFromAllSelect 
          ? (isAllSelect ?? false) 
          : (isAllWalletsSelected ? true : (existingBankIds[idToCheck] || false));
        
        currentLoadedWallets.set(idToCheck, {
          name: walletName,
          selected: !!isSelected
        });
      }
    });
    
    // Update the signal with new loaded wallets
    this.loadedWalletsSignal.set(currentLoadedWallets);

    const mergedBankIds = { ...existingBankIds, ...updatedBankIds };
    this.walletIds = mergedBankIds;

    this.userManagementV35Service.permissionBankId.update((currentValue) => ({
      ...currentValue,
      [currentPermission]: mergedBankIds
    }));
    
    // Check if all wallets are selected and update checkbox state
    const allSelected = isAllWalletsSelected || (this.walletList.length > 0 && 
      this.walletList.every(w => mergedBankIds[w.id] === true));
    this.selectAllWallets = allSelected;
    
    // Only update allWalletsSelected signal if explicitly setting from all select
    if (isFromAllSelect) {
      this.userManagementV35Service.allWalletsSelected.update((current) => ({
        ...current,
        [currentPermission]: allSelected
      }));
    }
    
    // Update selected names display
    setTimeout(() => this.getSelectedNames(), 0);
  }

  onSearch(searchInput: string): void {
    this.searchInput = searchInput;
    this.subjectKeyUp.next(this.searchInput);
  }

  debounceSearch() {
    this.subjectKeyUp
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.getWalletData(1, this.searchInput);
      });
  }

  clearSearch() {
    this.searchInput = '';
    this.getWalletData(1, '');
  }

  setRowSelection() {
    const currentPermission = this.permissionName();
    this.getAllRowSelecton$.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res && typeof res[currentPermission] === 'boolean') {
        this.setPermissionIds(true, res[currentPermission]);
        this.isEnableAllRowSelection.set(res[currentPermission]);
      }
    });
  }

  rowSelect(walletId: string) {
    const currentPermission = this.permissionName();
    
    if (this.walletIds[walletId]) {
      this.walletIds[walletId] = false;
      
      // If deselecting a wallet, clear the global allWalletsSelected flag
      this.userManagementV35Service.allWalletsSelected.update((current) => ({
        ...current,
        [currentPermission]: false
      }));
    } else {
      this.walletIds[walletId] = true;
    }
    
    // Update loaded wallets signal when individual rows are selected
    const currentLoadedWallets = new Map(this.loadedWalletsSignal());
    const wallet = this.walletList.find(w => w.id === walletId);
    
    if (wallet && wallet.walletName) {
      currentLoadedWallets.set(walletId, {
        name: wallet.walletName,
        selected: !!this.walletIds[walletId]
      });
      this.loadedWalletsSignal.set(currentLoadedWallets);
    }
    
    // Update the permission bank IDs in the service
    this.userManagementV35Service.permissionBankId.update((currentValue) => ({
      ...currentValue,
      [currentPermission]: this.walletIds
    }));
    
    // Check if all wallets in current page are selected and update checkbox state
    const allSelected = this.walletList.length > 0 && 
      this.walletList.every(w => this.walletIds[w.id] === true);
    this.selectAllWallets = allSelected;
    
    this.rowClicked.emit(this.permissionName());
    // Update selected names display when row selection changes
    setTimeout(() => this.getSelectedNames(), 0);
  }

  getSelectedNames(): string[] {
    // Use the computed signal to get selected names from all loaded wallets
    const selectedNames = this.selectedNamesComputed();
    
    this.allSelectedNames = selectedNames;
    this.displayedSelectedNames = selectedNames.slice(0, 5);
    
    return this.showAllSelected ? this.allSelectedNames : this.displayedSelectedNames;
  }

  toggleShowAllSelected(): void {
    this.showAllSelected = !this.showAllSelected;
  }

  removeSelectedItem(itemName: string): void {
    // Find the wallet ID by name in the loaded wallets signal
    const currentLoadedWallets = new Map(this.loadedWalletsSignal());
    let walletIdToRemove: string | null = null;
    
    currentLoadedWallets.forEach((value, key) => {
      if (value.name === itemName && value.selected) {
        walletIdToRemove = key;
      }
    });
    
    if (walletIdToRemove) {
      // Update the loaded wallets signal
      currentLoadedWallets.set(walletIdToRemove, {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...currentLoadedWallets.get(walletIdToRemove as string)!,
        selected: false
      });
      this.loadedWalletsSignal.set(currentLoadedWallets);
      
      // Update the wallet IDs
      this.walletIds[walletIdToRemove] = false;
      
      // Update the service
      const currentPermission = this.permissionName();
      this.userManagementV35Service.permissionBankId.update((currentValue) => ({
        ...currentValue,
        [currentPermission]: this.walletIds
      }));
      
      // Update selected names display
      this.getSelectedNames();
    }
  }

  clearAllSelected(): void {
    // Clear the loaded wallets signal
    const currentLoadedWallets = new Map(this.loadedWalletsSignal());
    currentLoadedWallets.forEach((value, key) => {
      currentLoadedWallets.set(key, { ...value, selected: false });
    });
    this.loadedWalletsSignal.set(currentLoadedWallets);
    
    // Clear all selections
    Object.keys(this.walletIds).forEach(id => {
      this.walletIds[id] = false;
    });
    
    // Update the service
    const currentPermission = this.permissionName();
    this.userManagementV35Service.permissionBankId.update((currentValue) => ({
      ...currentValue,
      [currentPermission]: this.walletIds
    }));
    
    // Clear the global allWalletsSelected flag
    this.userManagementV35Service.allWalletsSelected.update((current) => ({
      ...current,
      [currentPermission]: false
    }));
    
    this.selectAllWallets = false;
    this.rowClicked.emit(this.permissionName());
    this.getSelectedNames();
  }

  toggleSelectAll(): void {
    const currentPermission = this.permissionName();
    
    if (this.selectAllWallets) {
      // Select all wallets - set flag for all selection
      this.userManagementV35Service.allWalletsSelected.update((current) => ({
        ...current,
        [currentPermission]: true
      }));
      
      // Select all currently loaded wallets
      const currentLoadedWallets = new Map(this.loadedWalletsSignal());
      
      // Select all wallets in the current list
      this.walletList.forEach((wallet) => {
        this.walletIds[wallet.id] = true;
        currentLoadedWallets.set(wallet.id, {
          name: wallet.walletName,
          selected: true
        });
      });
      
      this.loadedWalletsSignal.set(currentLoadedWallets);
      
      // Update the service with selected wallet IDs
      this.userManagementV35Service.permissionBankId.update((currentValue) => ({
        ...currentValue,
        [currentPermission]: this.walletIds
      }));
    } else {
      // Deselect all wallets
      this.userManagementV35Service.allWalletsSelected.update((current) => ({
        ...current,
        [currentPermission]: false
      }));
      
      this.clearAllSelected();
    }
    
    this.rowClicked.emit(this.permissionName());
    this.getSelectedNames();
  }

  setPagination(totalWallets: number): void {
    this.totalPage = Math.ceil(totalWallets / 20);
    this.paginationArray();
  }

  onPrevious() {
    if (this.initialPage > 0) {
      this.initialPage -= 1;
      this.gotoPage(this.initialPage);
    }
  }

  onNext() {
    if (this.initialPage < this.totalPage - 1) {
      this.initialPage += 1;
      this.gotoPage(this.initialPage);
    }
  }

  /**
   * @description  Navigating to a specific page.
   * @param {number} item - The page number to navigate to.
   */
  gotoPage(item: number) {    
    if (item > this.totalPage) return;
    this.selectedPage = item;
    if (item >= 0) {
      this.initialPage = item;
      if (item < this.initialCount + 3) {
        this.mode = 1;
        this.paginationArray();
      } else if (item >= this.initialCount + 3 && item < this.totalPage - 3) {
        this.selectedValue = item + 1;
        this.mode = 2;
        this.paginationArray();
        this.pseudoI = 4;
      } else {
        this.mode = 3;
        this.paginationArray();
        this.pseudoI = 7 - (this.totalPage - item);
      }
    }
    // Pass the current search input when navigating pages
    this.getWalletData(item, this.searchInput);
  }

  /**
   * @description populates the `pageArr` array based on the current mode.
   * It creates an array representing the pagination buttons to be displayed.
   */
  paginationArray() {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;

      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;

      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;
      default:
        break;
    }

    if (this.totalPage < 8) {
      this.pageArr = [];

      for (let i = 1; i <= this.totalPage; i += 1) {
        this.pageArr.push(i);
      }
    }
  }

  onScrollToEnd(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 5; // pixels from bottom to trigger load
    
    // Check if user has scrolled to the bottom (with small threshold)
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
      this.loadNextPageOfSelectedItems();
    }
  }

  loadNextPageOfSelectedItems(): void {
    const currentPermission = this.permissionName();
    if (this.isLoadingMoreSelectedItems || !this.hasMoreSelectedItems || !this.clientPermissionId) {
      return;
    }

    this.isLoadingMoreSelectedItems = true;
    this.currentSelectedItemsPage += 1;

    const payload = {
      pagination: {
        [currentPermission]: {
          page: this.currentSelectedItemsPage,
          per_page: 50
        }
      }
    };

    this.userService.getAccountsPermission(this.clientPermissionId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // Check if there are more pages
            const pagination = res.data[currentPermission]?.pagination;
            if (pagination) {
              this.hasMoreSelectedItems = this.currentSelectedItemsPage < pagination.last_page;
              
              // Initialize loaded items from API response
              this.initializeLoadedItemsFromApiResponse(res.data, currentPermission);
              
              // Update selected names display
              this.getSelectedNames();
            } else {
              this.hasMoreSelectedItems = false;
            }
          } else {
            this.hasMoreSelectedItems = false;
          }
          this.isLoadingMoreSelectedItems = false;
        },
        error: () => {
          this.isLoadingMoreSelectedItems = false;
          this.currentSelectedItemsPage -= 1; // Revert page increment on error
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
