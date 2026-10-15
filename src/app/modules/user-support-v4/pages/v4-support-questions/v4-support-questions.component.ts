import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { UserSupportService } from 'src/app/shared/service/usersupport/user-support.service';
import { V4ContactSupportModalComponent } from 'src/app/shared/modal/v4-contact-support-modal/v4-contact-support-modal.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import {
  ICoulmnDefFields,
  ISelectBoxFilterArray
} from 'src/app/models/v3-datatable';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { V4AddQuestionModalComponent } from '../../../user-support/modals/v4-add-question-modal/v4-add-question-modal.component';
import { SeverityBadgeV4Component } from '../../components/severity-badge-v4/severity-badge-v4.component';
import { StatusBadgeV4Component } from '../../components/status-badge-v4/status-badge-v4.component';
import { SupportActionButtonsV4Component } from '../../components/support-action-buttons-v4/support-action-buttons-v4.component';
import { SupportTicketDrawerV4Component } from '../../components/support-ticket-drawer-v4/support-ticket-drawer-v4.component';

/**
 * v3's `ICoulmnDefFields` narrows `lockPosition` to boolean, so `'right'` will
 * not type-check against it. That model is frozen — widen locally instead and
 * assert once at the grid boundary (`gridColumnDefs`).
 */
type IV4ColumnDef = Omit<ICoulmnDefFields, 'lockPosition'> & {
  lockPosition?: ColDef['lockPosition'];
  /** Project extension: the grid swaps this in when building export rows. */
  cellRendererForExport?: (params: ICellRendererParams) => string;
};

interface ITicketRow {
  id: number;
  support_ticket: string;
  subject: string;
  status: number;
  severity: number;
  created_at?: string;
}

@Component({
  selector: 'app-v4-support-questions',
  templateUrl: './v4-support-questions.component.html',
  styleUrls: ['./v4-support-questions.component.scss'],
  standalone: true,
  imports: [
    V4DataTableComponent,
    V4PageHeaderComponent,
    CommonTabV4Component,
    DetailSidePanelComponent,
    SupportTicketDrawerV4Component,
    LucideAngularModule
  ]
})
export class V4SupportQuestionsComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private userSupportService = inject(UserSupportService);

  readonly tableId = DTTableId.supportQuestions;
  readonly isRowSelectable = () => false;

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'contact',
      text: 'Contact Support',
      style: 'navy',
      lucideIcon: 'headphones',
      toolTip: 'Talk to our support team by chat, phone, or email'
    },
    {
      id: 'create',
      text: 'Create Ticket',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Raise a new support ticket and track its progress here'
    }
  ];

  @ViewChild(SupportTicketDrawerV4Component)
  drawer?: SupportTicketDrawerV4Component;

  // Status filter tabs
  activeFilterTab = signal('all');
  ticketCounts = signal<{ all: number; open: number; resolved: number }>({
    all: 0,
    open: 0,
    resolved: 0
  });

  filterTabs = computed<ITabItem[]>(() => {
    const counts = this.ticketCounts();
    return [
      { label: `All (${counts.all})`, value: 'all' },
      {
        label: `Open (${counts.open})`,
        value: 'open',
        lucideIcon: 'circle-alert'
      },
      {
        label: `Resolved (${counts.resolved})`,
        value: 'resolved',
        lucideIcon: 'circle-check'
      }
    ];
  });

  // Side panel state
  drawerOpen = signal(false);
  selectedRow = signal<ITicketRow | null>(null);
  isActionProcessing = signal(false);
  isPanelExpanded = signal(false);

  panelTitle = computed(() => this.selectedRow()?.support_ticket ?? '');

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const row = this.selectedRow();
    if (!row) return undefined;
    return row.status === 1
      ? {
          text: 'Open',
          color: 'var(--v4-badge-info-text-color)',
          bgColor: 'var(--v4-badge-info-bg-color)'
        }
      : {
          text: 'Resolved',
          color: 'var(--v4-badge-success-text-color)',
          bgColor: 'var(--v4-badge-success-bg-color)'
        };
  });

  panelSeverityBadges = computed<IDetailPanelStatusBadge[]>(() => {
    const severity = this.selectedRow()?.severity;
    switch (severity) {
      case 1:
        return [
          {
            text: 'Low',
            color: 'var(--v4-badge-success-text-color)',
            bgColor: 'var(--v4-badge-success-bg-color)'
          }
        ];
      case 2:
        return [
          {
            text: 'Medium',
            color: 'var(--v4-badge-warning-text-color)',
            bgColor: 'var(--v4-badge-warning-bg-color)'
          }
        ];
      case 3:
        return [
          {
            text: 'High',
            color: 'var(--v4-badge-error-text-color)',
            bgColor: 'var(--v4-badge-error-bg-color)'
          }
        ];
      default:
        return [];
    }
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const row = this.selectedRow();
    if (!row) return [];
    const loading = this.isActionProcessing();
    return row.status === 1
      ? [
          {
            label: 'Mark as Resolved',
            variant: 'primary' as const,
            key: 'resolve',
            lucideIcon: 'circle-check',
            loading
          }
        ]
      : [
          {
            label: 'Re-open',
            variant: 'outline' as const,
            key: 'reopen',
            lucideIcon: 'rotate-ccw',
            loading
          }
        ];
  });

  frameworkComponents = {
    severityBadgeComponent: SeverityBadgeV4Component,
    statusBadgeComponent: StatusBadgeV4Component,
    actionButtonComponent: SupportActionButtonsV4Component,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    dateRangeComponent: V4DateFloatingFilterComponent
  };

  readonly FloatingFilterComponent = {
    selectBox: [
      {
        id: 'severity',
        values: [
          { value: 1, name: 'Low' },
          { value: 2, name: 'Medium' },
          { value: 3, name: 'High' }
        ]
      },
      {
        id: 'status',
        values: [
          { value: 1, name: 'Open' },
          { value: 2, name: 'Resolved' }
        ]
      }
    ],
    selectDate: [
      { id: 'created_at', initialRange: 'All Time', isPrimary: true }
    ]
  };

  // Render order: View (pinned left) -> Ticket ID -> Severity -> Created ->
  // Subject, with Status pinned to the right edge. Subject sits last and is the
  // only column left uncapped, so `defaultColDef.flex: 1` hands it all the
  // spare width instead of splitting it evenly with the fixed-format columns.
  columnDefs: IV4ColumnDef[] = [
    {
      // Icon cluster = a View column. It pins left and is never subject to the
      // right-edge rule, which belongs to Status and Actions only.
      headerName: 'View',
      field: 'id',
      width: 50,
      minWidth: 50,
      maxWidth: 50,
      sortable: false,
      suppressFloatingFilterButton: true,
      cellRenderer: 'actionButtonComponent',
      floatingFilter: false,
      suppressHeaderMenuButton: true,
      cellClass: 'pl-1',
      pinned: 'left',
      lockPosition: true,
      lockPinned: true,
      suppressMovable: true
    },
    {
      // `ocw-260101-51` is a fixed-length format, so pin it like Created
      // rather than letting it flex. Widened from 180 to balance Subject.
      headerName: 'Ticket ID',
      field: 'support_ticket',
      width: 200,
      minWidth: 200,
      maxWidth: 200,
      suppressFloatingFilterButton: true,
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      sortable: false
    },
    {
      // Badge labels are short and known (Low / Medium / High), so pin the
      // width like the other fixed-format columns and give the chip room to
      // breathe instead of sitting hard against the next column.
      headerName: 'Severity',
      field: 'severity',
      width: 160,
      minWidth: 160,
      maxWidth: 160,
      suppressFloatingFilterButton: true,
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      floatingFilterComponent: 'SelectBoxComponent',
      filter: 'agNumberColumnFilter',
      cellRenderer: 'severityBadgeComponent',
      cellRendererForExport: (params: ICellRendererParams) => {
        if (params.value === 1) return 'Low';
        if (params.value === 2) return 'Medium';
        if (params.value === 3) return 'High';
        return '';
      }
    },
    {
      // A date is a known length. Fixed on all three width properties so it
      // cannot flex - this is the column that was eating Subject's space.
      headerName: 'Created',
      field: 'created_at',
      width: 150,
      minWidth: 150,
      maxWidth: 150,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'dateRangeComponent',
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: ({ data }: { data: { created_at: string } }) => {
        if (!data?.created_at) return '';
        const [date] = data.created_at.toString().split('_');
        return `${date}`;
      }
    },
    {
      // Free text, and deliberately the only uncapped column. Do not add a
      // maxWidth here - that is what makes it absorb the remaining width.
      headerName: 'Subject',
      field: 'subject',
      minWidth: 240,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true
    },
    {
      // Status owns the right edge: it outranks an Actions column for that
      // slot, and this grid has no Actions column at all.
      headerName: 'Status',
      field: 'status',
      minWidth: 120,
      width: 150,
      maxWidth: 300,
      resizable: true,
      pinned: 'right',
      lockPosition: 'right',
      lockPinned: true,
      suppressMovable: true,
      suppressFloatingFilterButton: true,
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      floatingFilterComponent: 'SelectBoxComponent',
      filter: 'agNumberColumnFilter',
      cellRenderer: 'statusBadgeComponent',
      cellRendererForExport: (params: ICellRendererParams) =>
        params.value === 1 ? 'Open' : 'Resolved'
    }
  ];

  /** The one place the widened alias meets the frozen v3 grid input. */
  readonly gridColumnDefs = this.columnDefs as unknown as ICoulmnDefFields[];

  defaultColumnFields = this.columnDefs.map((col) => ({
    id: col.field === 'id' ? 'view' : col.field,
    name: col.headerName,
    isDisabled: ['support_ticket', 'status', 'id'].includes(col.field),
    colDef: col,
    isChecked: true
  }));

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      undefined,
      this.FloatingFilterComponent,
      undefined,
      { actionButton: false, eyeButton: true }
    );
    this.v3DataTableService.refreshV3DataTable();
    this.syncTabWithStatusFilter();
    this.loadTicketCounts();
  }

  private loadTicketCounts(): void {
    this.userSupportService
      .getTicketCounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res?.success) return;
        this.ticketCounts.set({
          all: res.total_ticket_count ?? 0,
          open: res.pending_ticket_count ?? 0,
          resolved: res.resolved_ticket_count ?? 0
        });
      });
  }

  onHeaderAction(id: string | number): void {
    if (id === 'contact') this.onContactSupport();
    if (id === 'create') this.onCreateTicket();
  }

  onContactSupport(): void {
    this.dialog.open(V4ContactSupportModalComponent, {
      width: '540px',
      maxWidth: '95%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        title: 'Contact Support',
        subtitle: "Choose how you'd like to reach our support team.",
        hideSubmitTicket: true
      }
    });
  }

  onCreateTicket(): void {
    const dialogRef = this.dialog.open(V4AddQuestionModalComponent, {
      maxWidth: '560px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataTableService.setRefreshStatus(true);
        this.v3DataTableService.refreshV3DataTable();
        this.loadTicketCounts();
      }
    });
  }

  onViewEvent(event: unknown): void {
    const row = (event as { selectedRow: ITicketRow })?.selectedRow;
    if (row?.id) {
      this.selectedRow.set(row);
      this.drawerOpen.set(true);
    }
  }

  onRowClick(event: unknown): void {
    const row = (event as { data: ITicketRow })?.data;
    if (row?.id) {
      this.selectedRow.set(row);
      this.drawerOpen.set(true);
    }
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  onActionClick(key: string): void {
    if (this.isActionProcessing()) return;
    if (key === 'resolve') {
      this.drawer?.markResolved();
    } else if (key === 'reopen') {
      this.drawer?.reOpenTicket();
    }
  }

  onStatusChanged(newStatus: number): void {
    const row = this.selectedRow();
    if (row) {
      this.selectedRow.set({ ...row, status: newStatus });
    }
    this.dataTableService.setRefreshStatus(true);
    this.v3DataTableService.refreshV3DataTable();
    this.loadTicketCounts();
  }

  onProcessingChange(processing: boolean): void {
    this.isActionProcessing.set(processing);
  }

  onFilterTabChange(tab: string): void {
    // Route tab clicks through setMainFilter so the Status column's
    // floating filter picks up the same value and keeps its UI in sync.
    // Option values on the dropdown are 1 (Open) / 2 (Resolved); '' clears.
    switch (tab) {
      case 'all':
        this.dataTableService.setMainFilter('', 'status');
        break;
      case 'open':
        this.dataTableService.setMainFilter(1, 'status');
        break;
      case 'resolved':
        this.dataTableService.setMainFilter(2, 'status');
        break;
      default:
        break;
    }
  }

  // Mirror changes from the Status column's floating filter back into the
  // All / Open / Resolved tab so the two controls can't drift apart.
  private syncTabWithStatusFilter(): void {
    this.v3DataTableService.updateV3DataTable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((filter) => {
        const statusFilter = (filter as ISelectBoxFilterArray | undefined)
          ?.status;
        if (!statusFilter) return;
        const value = String(statusFilter.filter ?? '');
        if (value === '1') {
          this.activeFilterTab.set('open');
        } else if (value === '2') {
          this.activeFilterTab.set('resolved');
        }
      });

    this.v3DataTableService.updateV3DataTableByRemovingFilter$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fields) => {
        if (fields?.includes('status')) {
          this.activeFilterTab.set('all');
        }
      });
  }
}
