import { Component, OnDestroy, OnInit, effect, inject, untracked } from '@angular/core';
import { CommonLayoutV35Component } from 'src/app/layout/v3-layout/common-layout-v35/common-layout-v35.component';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  takeUntil
} from 'rxjs';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import {
  IPaymentLinksListItem,
  SelectedPaymentLink
} from 'src/app/modules/data-table/components/data-table/data-table.model';
import { PaymentLinksListComponent } from '../../components/payment-links-list/payment-links-list.component';
import { PaymentLinksDetailsComponent } from '../../components/payment-links-details/payment-links-details.component';
import { PaymentLinksService } from '../../services/payment-links.service';

type ListInput = {
  loading: boolean;
  data: IPaymentLinksListItem[];
  selectedLink: IPaymentLinksListItem | undefined;
};

@Component({
  selector: 'app-payment-links-index',
  standalone: true,
  imports: [CommonLayoutV35Component],
  templateUrl: './payment-links-index.component.html',
  styleUrl: './payment-links-index.component.scss'
})
export class PaymentLinksIndexComponent implements OnInit, OnDestroy {
  public listComponent = PaymentLinksListComponent;
  public detailsComponent = PaymentLinksDetailsComponent;

  private paymentLinkApiService = inject(PaymentLinkService);
  private paymentLinksService = inject(PaymentLinksService);
  private destroy$ = new Subject<boolean>();

  // ── Active list state ────────────────────────────────────────────────────
  listInput: ListInput = {
    data: [],
    loading: false,
    selectedLink: this.paymentLinksService.selectedLink()
  };

  detailsInput = {
    selectedLink: this.paymentLinksService.selectedLink(),
    loading: false
  };

  term?: string;
  page = { common: 2, search: 0 };
  endReached = { common: false, search: false };
  list: IPaymentLinksListItem[] = [];
  searchedList: IPaymentLinksListItem[] = [];
  private creditCardFormToken: string | null = null;

  // ── Archived list state ──────────────────────────────────────────────────
  private archivedList: IPaymentLinksListItem[] = [];
  private archivedPage = 2;
  private archivedEndReached = false;
  private archivedTerm?: string;
  private linkIdToSelectAfterActiveRefresh: string | null = null;

  constructor() {
    // Mirror service selectedLink signal → both input objects (new refs each time)
    effect(() => {
      this.setSelectedLink(this.paymentLinksService.selectedLink());
    });

    // React to tab switches: load archived data or restore active data
    effect(() => {
      const tab = this.paymentLinksService.selectedListTab();
      untracked(() => {
        if (tab === 'archived') {
          this.archivedList = [];
          this.archivedPage = 2;
          this.archivedEndReached = false;
          this.archivedTerm = undefined;
          this.listInput = { ...this.listInput, data: [] };
          this.paymentLinksService.selectedLink.set(undefined);
          this.getArchivedList([1, 2]);
        } else if (this.list.length) {
          // Switching back to active — restore active data and re-select first
          this.listInput = { ...this.listInput, data: this.list };
          const first = this.list[0];
          this.paymentLinksService.selectedLink.set(
            first ? { ...first, creditCardFormToken: this.creditCardFormToken } : undefined
          );
        }
      });
    });
  }

  ngOnInit(): void {
    this.getList([1, 2]);
    this.onScrollToEnd();
    this.onArchivedScrollToEnd();
    this.onDeleted();
    this.onSearch();
    this.onLinkUpdated();
    this.onLinkRestored();
  }

  // ── Active list ──────────────────────────────────────────────────────────

  onScrollToEnd() {
    this.paymentLinksService.listScrollToEnd
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (!val || this.listInput.loading) return;
        if (this.term && this.endReached.search) return;
        if (!this.term && this.endReached.common) return;

        const page = this.term
          ? (this.page.search += 1)
          : (this.page.common += 1);

        this.getList([page], this.term);
      });
  }

  getList(pages: number[], term?: string) {
    const observables = pages.map((val) =>
      this.paymentLinkApiService.getAllLinks(val, term)
    );

    this.setLoading(true);
    forkJoin(observables)
      .pipe(
        finalize(() => this.setLoading(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (!res.every((val) => val.success)) return;

        if (res[0].creditCardFormToken) {
          this.paymentLinksService.creditCardEnabled.set(true);
          this.creditCardFormToken = res[0].creditCardFormToken;
        }

        if (res[res.length - 1].data.length < 10) {
          if (term) this.endReached.search = true;
          else this.endReached.common = true;
        }

        if (term) {
          this.searchedList = [
            ...this.searchedList,
            ...res.flatMap((val) => val.data)
          ];
        } else {
          this.list = [...this.list, ...res.flatMap((val) => val.data)];
        }

        // Only update listInput.data when on the active tab
        if (this.paymentLinksService.selectedListTab() !== 'archived') {
          this.listInput = {
            ...this.listInput,
            data: term ? this.searchedList : this.list
          };
        }

        const token =
          res[0].creditCardFormToken ?? this.creditCardFormToken ?? null;
        const pendingId = this.linkIdToSelectAfterActiveRefresh;
        if (
          pendingId &&
          !term &&
          this.paymentLinksService.selectedListTab() !== 'archived'
        ) {
          const found = this.list.find((el) => el.id === pendingId);
          const pick = found ?? this.list[0];
          if (pick) {
            this.paymentLinksService.selectedLink.set({
              ...pick,
              creditCardFormToken: token
            });
          } else {
            this.paymentLinksService.selectedLink.set(undefined);
          }
          this.linkIdToSelectAfterActiveRefresh = null;
        } else if (!this.paymentLinksService.selectedLink()) {
          const link = res[0].data[0];
          if (!link) return;
          this.paymentLinksService.selectedLink.update(() => ({
            ...link,
            creditCardFormToken: token
          }));
        }
      });
  }

  onDeleted() {
    this.paymentLinksService.linkDeleted
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        if (!id) return;

        const currentLink = this.paymentLinksService.selectedLink();
        this.list = this.list.filter((el) => el.id !== id);
        const filteredData = this.listInput.data.filter((el) => el.id !== id);
        this.listInput = { ...this.listInput, data: filteredData };

        const firstElm = filteredData[0];
        this.paymentLinksService.selectedLink.update(() => {
          if (!firstElm) return undefined;
          return {
            ...firstElm,
            creditCardFormToken: currentLink?.creditCardFormToken ?? null
          };
        });
      });
  }

  onSearch() {
    this.paymentLinksService.listSearch
      .pipe(debounceTime(700), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((val) => {
        if (this.paymentLinksService.selectedListTab() === 'archived') {
          this.archivedList = [];
          this.archivedPage = 2;
          this.archivedEndReached = false;
          this.archivedTerm = val || undefined;
          this.paymentLinksService.selectedLink.set(undefined);
          this.listInput = { ...this.listInput, data: [] };
          this.getArchivedList([1, 2], this.archivedTerm);
          return;
        }

        this.page.search = 0;
        this.searchedList.length = 0;
        this.endReached.search = false;
        this.listInput = { ...this.listInput, data: this.list };
        this.term = val || undefined;

        if (!val) return;

        this.getList(
          [(this.page.search += 1), (this.page.search += 1)],
          this.term
        );
      });
  }

  onLinkUpdated() {
    this.paymentLinksService.linkUpdated
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        const currentLink = this.paymentLinksService.selectedLink();
        if (!currentLink) return;

        const updatedIsPaused = val === 1 ? 0 : 1;

        this.paymentLinksService.selectedLink.update(() => ({
          ...currentLink,
          isPaused: updatedIsPaused
        }));

        const itemIndex = this.listInput.data.findIndex((el) => el.id === currentLink.id);
        if (itemIndex !== -1) {
          this.listInput = {
            ...this.listInput,
            data: this.listInput.data.map((el, i) =>
              i === itemIndex ? { ...el, isPaused: updatedIsPaused } : el
            )
          };
        }

        const listIndex = this.list.findIndex((el) => el.id === currentLink.id);
        if (listIndex !== -1) {
          this.list = [
            ...this.list.slice(0, listIndex),
            { ...this.list[listIndex], isPaused: updatedIsPaused },
            ...this.list.slice(listIndex + 1)
          ];
        }

        const searchedListIndex = this.searchedList.findIndex((el) => el.id === currentLink.id);
        if (searchedListIndex !== -1) {
          this.searchedList = [
            ...this.searchedList.slice(0, searchedListIndex),
            { ...this.searchedList[searchedListIndex], isPaused: updatedIsPaused },
            ...this.searchedList.slice(searchedListIndex + 1)
          ];
        }
      });
  }

  // ── Archived list ────────────────────────────────────────────────────────

  onArchivedScrollToEnd() {
    this.paymentLinksService.archivedListScrollToEnd
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.listInput.loading || this.archivedEndReached) return;
        this.archivedPage += 1;
        this.getArchivedList([this.archivedPage], this.archivedTerm);
      });
  }

  getArchivedList(pages: number[], term?: string) {
    const observables = pages.map((val) =>
      this.paymentLinkApiService.getArchivedPaymentLinks(val, term)
    );

    this.setLoading(true);
    forkJoin(observables)
      .pipe(
        finalize(() => this.setLoading(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (!res.every((val) => val.success)) return;

        if (res[res.length - 1].data.length < 10) {
          this.archivedEndReached = true;
        }

        this.archivedList = [
          ...this.archivedList,
          ...res.flatMap((val) => val.data)
        ];

        this.listInput = { ...this.listInput, data: this.archivedList };

        if (!this.paymentLinksService.selectedLink()) {
          const link = this.archivedList[0];
          if (!link) return;
          this.paymentLinksService.selectedLink.update(() => ({
            ...link,
            creditCardFormToken: null
          }));
        }
      });
  }

  onLinkRestored() {
    this.paymentLinksService.linkRestored
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.archivedList = this.archivedList.filter((el) => el.id !== id);

        if (this.paymentLinksService.selectedListTab() === 'archived') {
          this.listInput = { ...this.listInput, data: this.archivedList };
          const nextLink = this.archivedList[0];
          this.paymentLinksService.selectedLink.set(
            nextLink ? { ...nextLink, creditCardFormToken: null } : undefined
          );
          this.linkIdToSelectAfterActiveRefresh = null;
        } else {
          this.linkIdToSelectAfterActiveRefresh = id;
        }

        this.list = [];
        this.page.common = 2;
        this.endReached.common = false;
        this.getList([1, 2]);
      });
  }

  // ── Shared helpers ───────────────────────────────────────────────────────

  setLoading(loading: boolean) {
    this.listInput = { ...this.listInput, loading };
    this.detailsInput = { ...this.detailsInput, loading };
  }

  setSelectedLink(link?: SelectedPaymentLink) {
    this.detailsInput = { ...this.detailsInput, selectedLink: link };
    this.listInput = { ...this.listInput, selectedLink: link };
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
