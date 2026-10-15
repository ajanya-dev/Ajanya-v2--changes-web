import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input
} from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowUpRightFromSquare,
  faEdit,
  faLink,
  faTrash,
  faEllipsisVertical,
  faTrashRestore,
  faArchive,
  faClockRotateLeft
} from '@fortawesome/pro-solid-svg-icons';
import {
  IPaymentLinksListItem,
  SelectedPaymentLink
} from 'src/app/modules/data-table/components/data-table/data-table.model';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { Router } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { FormsModule } from '@angular/forms';
import { PaymentLinksService } from '../../services/payment-links.service';

@Component({
  selector: 'app-payment-links-list',
  standalone: true,
  imports: [
    ListHeaderV35Component,
    NgClass,
    TruncatePipe,
    FontAwesomeModule,
    MatMenuModule,
    ScrollToEndDirective,
    V35CommonDropDownSelectorComponent,
    FormsModule
  ],
  templateUrl: './payment-links-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './payment-links-list.component.scss'
})
export class PaymentLinksListComponent implements OnDestroy {
  private paymentLinksService = inject(PaymentLinksService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private paymentLinkApiService = inject(PaymentLinkService);
  private cdr = inject(ChangeDetectorRef);
  data = input<IPaymentLinksListItem[]>([]);
  loading = input(false);
  selectedLink = input<SelectedPaymentLink | undefined>(undefined);

  faEdit = faEdit;
  faTrash = faTrash;
  faLink = faLink;
  faEllipsis = faEllipsisVertical;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  faRestore = faTrashRestore;
  faArchive = faArchive;
  faAuditTrail = faClockRotateLeft;

  selectedLinkModel: SelectedPaymentLink | null;
  destroy$ = new Subject<boolean>();
  selectedListTab = computed(() => this.paymentLinksService.selectedListTab());

  tabItems = [
    { name: 'Active', value: 'active' },
    { name: 'Archived', value: 'archived' }
  ];

  constructor() {
    effect(() => {
      const link = this.selectedLink();
      this.selectedLinkModel = link ?? null;
    });
  }

  addNewLink() {
    this.router.navigate(['manage', 'payment-links', 'create']);
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }

  onScrollToEnd() {
    if (this.selectedListTab() === 'archived') {
      this.paymentLinksService.archivedListScrollToEnd.next(true);
    } else {
      this.paymentLinksService.listScrollToEnd.next(true);
    }
  }

  search(searchString: string) {
    this.paymentLinksService.listSearch.next(searchString);
  }

  selectLink(item: IPaymentLinksListItem) {
    if (!item) return;

    let parsedItem: IPaymentLinksListItem = item;
    if (typeof item === 'string') {
      try {
        parsedItem = JSON.parse(item);
      } catch {
        return;
      }
    }

    this.paymentLinksService.selectedLink.update(() => ({
      ...parsedItem,
      creditCardFormToken: this.selectedLink()?.creditCardFormToken ?? null
    }));
  }

  editLink(link: IPaymentLinksListItem) {
    this.router.navigate(['manage', 'payment-links', 'update', link.id]);
  }

  async archiveLink(link: IPaymentLinksListItem) {
    const confirmation = await firstValueFrom(
      this.alertService
        .confirmAlert({ 
          content: 'Are you sure you want to archive this link?',
          doneMsg: 'Yes'
        })
        .afterClosed()
    );
    if (confirmation) {
      this.paymentLinkApiService
        .deletePaymentLinkMain(link.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (!res.success) return;
          this.alertService.successAlert({ content: res.data });
          this.paymentLinksService.linkDeleted.next(link.id);
        });
    }
  }

  restoreLink(link: IPaymentLinksListItem) {
    this.alertService
      .confirmAlert({ 
        content: 'Are you sure you want to restore this link?',
        doneMsg: 'Yes'
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmation) => {
        if (!confirmation) return;
        this.paymentLinkApiService
          .restorePaymentLink(link.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (!res.success) return;
            this.alertService.successAlert({
              content: 'Payment link restored successfully',
              close: true
            });
            this.paymentLinksService.selectedListTab.set('active');
            this.cdr.detectChanges();
            this.paymentLinksService.linkRestored.next(link.id);
          });
      });
  }

  viewAuditTrail(link: IPaymentLinksListItem) {
    this.paymentLinksService.openAuditTrailModal(link.id);
  }

  onTabClick(tab: string) {
    if (this.selectedListTab() === tab) return;
    this.paymentLinksService.selectedListTab.set(tab);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
