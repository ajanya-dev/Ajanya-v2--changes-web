import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { LucideAngularModule } from 'lucide-angular';
import {
  finalize,
  forkJoin,
  Subject,
  debounceTime,
  distinctUntilChanged
} from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  IPaymentButtons,
  PaymentButtons
} from 'src/app/modules/payment-link/pages/payment-settings/paymentButtons.data';

import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IPaymentLinksListItem,
  SelectedPaymentLink
} from 'src/app/modules/data-table/components/data-table/data-table.model';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DataTableEmptyStateComponent } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';

import { V4PaymentLinksService } from './services/v4-payment-links.service';
import { ListPanelComponent } from './components/list-panel/list-panel.component';
import { HeaderCardComponent } from './components/header-card/header-card.component';
import { SubLinksTabComponent } from './components/sub-links-tab/sub-links-tab.component';
import { DynamicIframeTabComponent } from './components/dynamic-iframe-tab/dynamic-iframe-tab.component';
import { EcommerceButtonsTabComponent } from './components/ecommerce-buttons-tab/ecommerce-buttons-tab.component';
import { ViewDetailsDrawerComponent } from './components/view-details-drawer/view-details-drawer.component';
import { PreviewDrawerComponent } from './components/preview-drawer/preview-drawer.component';
import { V4PaymentLinksHeaderComponent } from './components/v4-payment-links-header/v4-payment-links-header.component';

@Component({
  selector: 'app-v4-payment-links',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component,
    ListPanelComponent,
    HeaderCardComponent,
    V4PaymentLinksHeaderComponent,
    SubLinksTabComponent,
    DynamicIframeTabComponent,
    EcommerceButtonsTabComponent,
    ViewDetailsDrawerComponent,
    PreviewDrawerComponent,
    V4DataTableEmptyStateComponent
  ],
  templateUrl: './v4-payment-links.component.html',
  styleUrls: ['./v4-payment-links.component.scss']
})
export class V4PaymentLinksComponent implements OnInit {
  private paymentLinkService = inject(PaymentLinkService);
  private paymentLinksService = inject(V4PaymentLinksService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private clipboard = inject(Clipboard);
  private breakpointObserver = inject(BreakpointObserver);

  links = signal<IPaymentLinksListItem[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  listCollapsed = signal(false);
  activeTab = signal<string>('sub-links');
  viewDetailsLink = signal<SelectedPaymentLink | undefined>(undefined);
  previewOpen = signal(false);
  // Held in the parent so the search input survives viewport-driven re-mounts of the list panel.
  currentSearchTerm = signal('');

  // Link ids with a status-mutating request (toggle/archive/restore) currently in flight.
  pendingLinkActions = signal<Set<string>>(new Set());

  // Responsive layout state (mirrors common-layout-v4 pattern)
  isSmallScreen = signal<boolean>(false);
  showMobileDetail = signal<boolean>(false);

  selectedLink = computed(() => this.paymentLinksService.selectedLink());

  // Dynamic & Iframe data (fetched eagerly like V3)
  dynamicLink = signal('');
  iframeCode = signal('');
  dynamicIframeLoading = signal(false);

  // E-Commerce buttons (generated eagerly like V3)
  private paymentButtonsObj = new PaymentButtons();
  eCButtons = signal<IPaymentButtons[]>([]);
  selectedButtonIndex = signal(0);
  selectedButtonDetails = computed(
    () => this.eCButtons()[this.selectedButtonIndex()]
  );

  // Credit card token from API (global, not per-link)
  private creditCardFormToken: string | null = null;

  // Pagination tracking (mirrors V3 pattern)
  private term?: string;
  private page = { common: 2, search: 0 };
  private endReached = { common: false, search: false };
  private list: IPaymentLinksListItem[] = [];
  private searchedList: IPaymentLinksListItem[] = [];
  private search$ = new Subject<string>();

  // Archived list state (independent from active list, not cached — refetched on every tab switch)
  private archivedList: IPaymentLinksListItem[] = [];
  private archivedPage = 2;
  private archivedEndReached = false;
  private archivedTerm?: string;
  private linkIdToSelectAfterActiveRefresh: string | null = null;

  selectedListTab = computed(() => this.paymentLinksService.selectedListTab());
  isArchivedView = computed(() => this.selectedListTab() === 'archived');

  tabs = [
    { label: 'Sub-Links', value: 'sub-links' },
    { label: 'Dynamic & Iframe Link', value: 'dynamic-iframe' },
    { label: 'E-Commerce Buttons', value: 'ecommerce' }
  ];

  ngOnInit() {
    this.breakpointObserver
      .observe(['(max-width: 1024px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.isSmallScreen.set(result.matches);
        if (!result.matches) {
          this.showMobileDetail.set(false);
        }
      });

    this.getList([1, 2]);
    // Tab selection persists in the service across navigation; if the user left the page
    // on the archived tab, also load archived so the list panel isn't empty on return.
    if (this.isArchivedView()) {
      this.getArchivedList([1, 2]);
    }
    this.onSearch();

    this.paymentLinksService.linkDeleted
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        // Drop the archived item from every cached list in place — mirrors the
        // restore flow so neither tab needs a refetch on next visit.
        this.list = this.list.filter((item) => item.id !== id);
        this.searchedList = this.searchedList.filter((item) => item.id !== id);
        this.archivedList = this.archivedList.filter((item) => item.id !== id);
        let currentList: IPaymentLinksListItem[];
        if (this.isArchivedView()) {
          currentList = this.archivedList;
        } else if (this.term) {
          currentList = this.searchedList;
        } else {
          currentList = this.list;
        }
        this.links.set(currentList);
        this.totalCount.set(currentList.length);
        if (this.selectedLink()?.id === id) {
          this.selectFirstLink();
        }
      });

    this.paymentLinksService.linkRestored
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.archivedList = this.archivedList.filter((item) => item.id !== id);
        if (this.selectedLink()?.id === id) {
          this.paymentLinksService.selectedLink.set(undefined);
        }
        // Remember the restored id so we can re-select it once the active list refetches
        this.linkIdToSelectAfterActiveRefresh = id;
        this.paymentLinksService.selectedListTab.set('active');
        this.term = undefined;
        this.archivedTerm = undefined;
        this.list = [];
        this.searchedList = [];
        this.page.common = 2;
        this.page.search = 0;
        this.endReached.common = false;
        this.endReached.search = false;
        this.getList([1, 2]);
      });

    this.paymentLinksService.linkUpdated
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshList();
      });
  }

  getList(pages: number[], term?: string) {
    const observables = pages.map((p) =>
      this.paymentLinkService.getAllLinks(p, term)
    );

    this.loading.set(true);
    forkJoin(observables)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res.every((val) => val.success)) return;

        // Drop stale responses whose term no longer matches the active search —
        // prevents a late-resolving older search's finalize from flipping `loading`
        // false (and briefly showing the empty state) while a newer search is in flight.
        if (term !== this.term) return;

        if (res[0].creditCardFormToken) {
          this.creditCardFormToken = res[0].creditCardFormToken;
          this.paymentLinksService.creditCardEnabled.set(true);
        }

        // If last page returned < 10 items, end reached
        if (res[res.length - 1].data.length < 10) {
          if (term) this.endReached.search = true;
          else this.endReached.common = true;
        }

        const newItems = res.flatMap((val) => val.data);

        if (term) {
          this.searchedList = [...this.searchedList, ...newItems];
        } else {
          this.list = [...this.list, ...newItems];
        }

        // Race guard: drop into active list state only if user is still on the active tab
        if (this.isArchivedView()) return;

        const currentList = term ? this.searchedList : this.list;
        this.links.set(currentList);
        this.totalCount.set(currentList.length);

        if (!this.selectedLink() && this.list.length > 0) {
          // Prefer the just-restored link if it's now in the list; else auto-select first
          const restoredId = this.linkIdToSelectAfterActiveRefresh;
          const target =
            (restoredId && this.list.find((l) => l.id === restoredId)) ||
            this.list[0];
          this.linkIdToSelectAfterActiveRefresh = null;
          const selected: SelectedPaymentLink = {
            ...target,
            creditCardFormToken: this.creditCardFormToken
          };
          this.paymentLinksService.selectedLink.set(selected);
          this.getDynamicAndIframeLink(target.id);
          this.getECommerceButtons(target.id);
        }
      });
  }

  getArchivedList(pages: number[], term?: string) {
    const observables = pages.map((p) =>
      this.paymentLinkService.getArchivedPaymentLinks(p, term)
    );

    this.loading.set(true);
    forkJoin(observables)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res.every((val) => val.success)) return;

        // Drop stale responses whose term no longer matches the active search —
        // prevents unfiltered in-flight items from polluting later filtered results.
        if (term !== this.archivedTerm) return;

        if (res[res.length - 1].data.length < 10) {
          this.archivedEndReached = true;
        }

        const newItems = res.flatMap((val) => val.data);
        this.archivedList = [...this.archivedList, ...newItems];

        // Race guard: drop archived data only if user is still on the archived tab
        if (!this.isArchivedView()) return;

        this.links.set(this.archivedList);
        this.totalCount.set(this.archivedList.length);

        if (!this.selectedLink() && this.archivedList.length > 0) {
          const firstItem = this.archivedList[0];
          const selected: SelectedPaymentLink = {
            ...firstItem,
            creditCardFormToken: this.creditCardFormToken
          };
          this.paymentLinksService.selectedLink.set(selected);
        }
      });
  }

  refreshList() {
    this.page.common = 2;
    this.endReached.common = false;

    this.list = [];
    this.getList([1, 2]);
  }

  onLoadMore() {
    if (this.loading()) return;

    if (this.isArchivedView()) {
      if (this.archivedEndReached) return;
      this.archivedPage += 1;
      this.getArchivedList([this.archivedPage], this.archivedTerm);
      return;
    }

    if (this.term && this.endReached.search) return;
    if (!this.term && this.endReached.common) return;

    const page = this.term ? (this.page.search += 1) : (this.page.common += 1);

    this.getList([page], this.term);
  }

  onSearchChange(term: string) {
    this.currentSearchTerm.set(term);
    this.search$.next(term);
  }

  private onSearch() {
    this.search$
      .pipe(
        debounceTime(700),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((val) => {
        if (this.isArchivedView()) {
          this.archivedList = [];
          this.archivedPage = 2;
          this.archivedEndReached = false;
          this.archivedTerm = val || undefined;
          this.links.set([]);
          this.totalCount.set(0);
          this.getArchivedList([1, 2], this.archivedTerm);
          return;
        }

        this.page.search = 0;
        this.searchedList = [];
        this.endReached.search = false;
        this.term = val || undefined;

        if (!val) {
          this.links.set([]);
          this.totalCount.set(0);
          this.refreshList();
          return;
        }

        this.links.set([]);
        this.totalCount.set(0);
        this.getList(
          [(this.page.search += 1), (this.page.search += 1)],
          this.term
        );
      });
  }

  onTabChange(tab: 'active' | 'archived') {
    if (this.selectedListTab() === tab) return;
    this.paymentLinksService.selectedListTab.set(tab);
    this.paymentLinksService.selectedLink.set(undefined);
    this.currentSearchTerm.set('');

    if (tab === 'archived') {
      // Archived is not cached — always refetch on tab switch so freshly-archived
      // items show up immediately (matches staging behavior).
      this.links.set([]);
      this.totalCount.set(0);
      this.archivedList = [];
      this.archivedPage = 2;
      this.archivedEndReached = false;
      this.archivedTerm = undefined;
      this.getArchivedList([1, 2]);
    } else {
      this.term = undefined;
      this.links.set(this.list);
      this.totalCount.set(this.list.length);
      if (this.list.length > 0) {
        const firstItem = this.list[0];
        this.paymentLinksService.selectedLink.set({
          ...firstItem,
          creditCardFormToken: this.creditCardFormToken
        });
        this.getDynamicAndIframeLink(firstItem.id);
        this.getECommerceButtons(firstItem.id);
      }
    }
  }

  // --- Dynamic & Iframe (mirrors V3 getDynamicAndIframeLink) ---
  private getDynamicAndIframeLink(id: string) {
    this.dynamicIframeLoading.set(true);
    this.paymentLinkService
      .getDandILink(id)
      .pipe(
        finalize(() => this.dynamicIframeLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res.success) return;
        this.dynamicLink.set(res.data.dynamicAmountLink || '');
        this.iframeCode.set(res.data.iframe || '');
      });
  }

  // --- E-Commerce Buttons (mirrors V3 getButtons) ---
  getECommerceButtons(id: string, amount?: string) {
    const btns = this.paymentButtonsObj.getV2Buttons({
      paymentId: id,
      amount
    });
    this.eCButtons.set(btns);
    // Preserve selected button index; default to 0
    if (this.selectedButtonIndex() >= btns.length) {
      this.selectedButtonIndex.set(0);
    }
  }

  onSelectECommerceButton(index: number) {
    this.selectedButtonIndex.set(index);
  }

  onUpdateECommerceAmount(amount?: string) {
    const id = this.selectedLink()?.id;
    if (!id) return;
    this.getECommerceButtons(id, amount);
  }

  onSelectLink(item: IPaymentLinksListItem) {
    const selected: SelectedPaymentLink = {
      ...item,
      creditCardFormToken: this.creditCardFormToken
    };
    this.paymentLinksService.selectedLink.set(selected);

    // On small screens, switch to detail view when a link is selected
    if (this.isSmallScreen()) {
      this.showMobileDetail.set(true);
    }

    // Skip sub-tab data fetching when viewing archived links — their sub-tabs are hidden
    if (this.isArchivedView() || item.isArchived) return;

    // Eagerly fetch data for all tabs (V3 pattern)
    this.getDynamicAndIframeLink(item.id);
    this.getECommerceButtons(item.id);
  }

  goBackToList() {
    this.showMobileDetail.set(false);
  }

  selectFirstLink() {
    const all = this.links();
    if (all.length > 0) {
      this.onSelectLink(all[0]);
    } else {
      this.paymentLinksService.selectedLink.set(undefined);
    }
  }

  onViewDetails(item: IPaymentLinksListItem) {
    // On smaller screens, route into the full detail view (mirrors onSelectLink
    // behavior). On larger screens, open the side drawer as usual.
    if (this.isSmallScreen()) {
      this.onSelectLink(item);
      return;
    }
    const link: SelectedPaymentLink = {
      ...item,
      creditCardFormToken: this.creditCardFormToken
    };
    this.viewDetailsLink.set(link);
  }

  closeViewDetails() {
    this.viewDetailsLink.set(undefined);
  }

  onEditLink(item: IPaymentLinksListItem) {
    this.router.navigate(['../update', item.id], { relativeTo: this.route });
  }

  onCopyLink(item: IPaymentLinksListItem) {
    const url = `${StaticWhiteLabelConditions.paymentShortLink}/${item.shortUrl}`;
    this.clipboard.copy(url);
    this.v4AlertService.successAlert({
      title: 'Success',
      content: 'Link copied to clipboard!'
    });
  }

  onShareLink(item: IPaymentLinksListItem) {
    const url = `${StaticWhiteLabelConditions.paymentShortLink}/${item.shortUrl}`;
    this.paymentLinksService.openShareLinkModal(url, item.name);
  }

  isLinkActionPending(id: string): boolean {
    return this.pendingLinkActions().has(id);
  }

  private beginLinkAction(id: string) {
    this.pendingLinkActions.update((ids) => new Set(ids).add(id));
  }

  private endLinkAction(id: string) {
    this.pendingLinkActions.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  onArchiveLink(item: IPaymentLinksListItem) {
    this.v4AlertService
      .warningAlert({
        title: 'Archive Payment Link',
        content:
          'Are you sure you want to archive this payment link? You can restore it later from the Archived tab.',
        doneMsg: 'Yes, Archive',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || this.isLinkActionPending(item.id)) return;
        this.beginLinkAction(item.id);
        this.paymentLinkService
          .deletePaymentLinkMain(item.id)
          .pipe(
            finalize(() => this.endLinkAction(item.id)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.v4AlertService.successAlert({
                title: 'Success',
                content: 'Payment link archived.'
              });
              this.paymentLinksService.linkDeleted.next(item.id);
            }
          });
      });
  }

  openAuditTrail(id: string) {
    this.paymentLinksService.openAuditTrailModal(id);
  }

  onRestoreLink(item: IPaymentLinksListItem) {
    this.v4AlertService
      .confirmAlert({
        title: 'Restore Payment Link',
        content: 'Are you sure you want to restore this payment link?',
        doneMsg: 'Yes, Restore',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || this.isLinkActionPending(item.id)) return;
        this.beginLinkAction(item.id);
        this.paymentLinkService
          .restorePaymentLink(item.id)
          .pipe(
            finalize(() => this.endLinkAction(item.id)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.v4AlertService.successAlert({
                title: 'Success',
                content: 'Payment link restored.'
              });
              this.paymentLinksService.linkRestored.next(item.id);
            }
          });
      });
  }

  onToggleStatus(active: boolean) {
    const link = this.selectedLink();
    if (!link || this.isLinkActionPending(link.id)) return;

    this.v4AlertService
      .warningAlert({
        title: active ? 'Activate Payment Link' : 'Disable Payment Link',
        content: active
          ? 'Are you sure you want to activate this payment link?'
          : 'Are you sure you want to disable this payment link?',
        doneMsg: active ? 'Yes, Activate' : 'Yes, Disable',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || this.isLinkActionPending(link.id)) return;
        this.beginLinkAction(link.id);

        const api$ = active
          ? this.paymentLinkService.activePaymentLink(link.id)
          : this.paymentLinkService.inactivePaymentLink(link.id);

        api$
          .pipe(
            finalize(() => this.endLinkAction(link.id)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.v4AlertService.successAlert({
                content: active ? 'Payment link activated.' : 'Payment link disabled.'
              });
              const updatedIsPaused = active ? 0 : 1;
              const updateItem = (item: IPaymentLinksListItem) =>
                item.id === link.id ? { ...item, isPaused: updatedIsPaused } : item;

              this.list = this.list.map(updateItem);
              this.searchedList = this.searchedList.map(updateItem);
              this.links.set(this.term ? this.searchedList : this.list);
              this.paymentLinksService.selectedLink.update((l) =>
                l ? { ...l, isPaused: updatedIsPaused } : l
              );
            }
          });
      });
  }

  onPreview() {
    this.previewOpen.set(true);
  }

  onDuplicate() {
    const link = this.selectedLink();
    if (!link) return;
    this.router.navigate(['../create'], {
      relativeTo: this.route,
      queryParams: { duplicate: link.id }
    });
  }

  onShare() {
    const link = this.selectedLink();
    if (!link) return;
    const url = `${StaticWhiteLabelConditions.paymentShortLink}/${link.shortUrl}`;
    this.paymentLinksService.openShareLinkModal(url, link.name);
  }

  onCustomizeNotification() {
    this.paymentLinksService.openNotificationModal();
  }

  // --- View Details Drawer actions ---
  onViewDetailsPreview() {
    this.closeViewDetails();
    this.previewOpen.set(true);
  }

  onViewDetailsDuplicate() {
    const link = this.viewDetailsLink();
    if (!link) return;
    this.closeViewDetails();
    this.router.navigate(['../create'], {
      relativeTo: this.route,
      queryParams: { duplicate: link.id }
    });
  }

  onViewDetailsShare() {
    const link = this.viewDetailsLink();
    if (!link) return;
    const url = `${StaticWhiteLabelConditions.paymentShortLink}/${link.shortUrl}`;
    this.paymentLinksService.openShareLinkModal(url, link.name);
  }

  onViewDetailsToggleStatus(active: boolean) {
    const link = this.viewDetailsLink();
    if (!link || this.isLinkActionPending(link.id)) return;

    this.v4AlertService
      .warningAlert({
        title: active ? 'Activate Payment Link' : 'Disable Payment Link',
        content: active
          ? 'Are you sure you want to activate this payment link?'
          : 'Are you sure you want to disable this payment link?',
        doneMsg: active ? 'Yes, Activate' : 'Yes, Disable',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || this.isLinkActionPending(link.id)) return;
        this.beginLinkAction(link.id);

        const api$ = active
          ? this.paymentLinkService.activePaymentLink(link.id)
          : this.paymentLinkService.inactivePaymentLink(link.id);

        api$
          .pipe(
            finalize(() => this.endLinkAction(link.id)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.v4AlertService.successAlert({
                content: active ? 'Payment link activated.' : 'Payment link disabled.'
              });
              const updatedIsPaused = active ? 0 : 1;
              const updateItem = (item: IPaymentLinksListItem) =>
                item.id === link.id ? { ...item, isPaused: updatedIsPaused } : item;

              this.list = this.list.map(updateItem);
              this.searchedList = this.searchedList.map(updateItem);
              this.links.set(this.term ? this.searchedList : this.list);
              this.paymentLinksService.selectedLink.update((l) =>
                l ? { ...l, isPaused: updatedIsPaused } : l
              );
              // Update the drawer link too
              this.viewDetailsLink.update((l) =>
                l ? { ...l, isPaused: updatedIsPaused } : l
              );
            }
          });
      });
  }

  onCreateNew() {
    this.router.navigate(['../create'], { relativeTo: this.route });
  }

  goToSettings() {
    this.router.navigate(['../payment-settings'], { relativeTo: this.route });
  }

  filteredLinks = computed(() => this.links());
}
