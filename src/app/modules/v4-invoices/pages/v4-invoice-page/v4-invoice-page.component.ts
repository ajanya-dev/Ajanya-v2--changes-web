import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';

import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { V4InvoiceListComponent } from 'src/app/modules/v4-invoices/pages/v4-invoice-list/v4-invoice-list.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4AddInvoiceComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice/v4-add-invoice.component';
import { V4EntAddInvoiceComponent } from 'src/app/modules/v4-invoices/modals/v4-ent-add-invoice/v4-ent-add-invoice.component';
import { V4ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/v4-thirdparty-imports/v4-thirdparty-import-main-modal/v4-thirdparty-import-main-modal.component';
import { V4InvoiceOverviewComponent } from '../v4-invoice-overview/v4-invoice-overview.component';

@Component({
  selector: 'app-v4-invoice-page',
  standalone: true,
  templateUrl: './v4-invoice-page.component.html',
  imports: [
    V4PageHeaderComponent,
    V4InvoiceListComponent,
    V4InvoiceOverviewComponent,
    LucideAngularModule,
    MatDivider,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip
  ]
})
export class V4InvoicePageComponent implements OnInit {
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private headerService = inject(HeaderService);
  readonly v4AlertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private v3DataTableService = inject(V3DataTableService);

  activeTab = signal('detailed');
  isEnablePricingRule = false;

  readonly headerActions: IV4HeaderAction[] = [
    { id: 'import', text: 'Import Invoice', style: 'navy', lucideIcon: 'download' },
    {
      id: 'credit_memo',
      text: 'Credit Memo',
      style: 'navy',
      lucideIcon: 'credit-card',
      toolTip: 'View and manage credit memos'
    },
    {
      id: 'new',
      text: 'New Invoice',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Create a new invoice'
    }
  ];

  onHeaderAction(id: string | number): void {
    if (id === 'import') this.importInvoice();
    if (id === 'credit_memo') this.openCreditMemo();
    if (id === 'new') this.addNewInvoice();
  }

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'overview') {
      this.activeTab.set('overview');
    }

    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(
        filter((res) => !!res),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) {
          this.isEnablePricingRule =
            res.enabledPlugins?.includes('invoice_pricing_rule') ?? false;
        }
      });
  }

  addNewInvoice(): void {
    if (this.isEnablePricingRule) {
      this.matDialog
        .open(V4EntAddInvoiceComponent, {
          disableClose: true,
          maxWidth: '1400px',
          width: '99%',
          height: '96vh',
          autoFocus: false,
          panelClass: 'paddingless-modal-rounded'
        })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result) this.v3DataTableService.refreshV3DataTable();
        });
    } else {
      this.matDialog
        .open(V4AddInvoiceComponent, {
          disableClose: true,
          maxWidth: '1400px',
          width: '99%',
          height: '96vh',
          autoFocus: false,
          panelClass: 'paddingless-modal-rounded'
        })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result) this.v3DataTableService.refreshV3DataTable();
        });
    }
  }

  openCreditMemo(): void {
    this.router.navigate(['/v4/manage/invoice/memo']);
  }

  goToItems(): void {
    this.router.navigate(['/v4/manage/invoice/items']);
  }

  goToTaxes(): void {
    this.router.navigate(['/v4/manage/invoice/taxes']);
  }

  importInvoice(): void {
    this.matDialog.open(V4ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { type: 'invoices' }
    });
  }
}
