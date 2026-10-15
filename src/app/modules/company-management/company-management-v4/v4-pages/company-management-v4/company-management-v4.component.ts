import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';

import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { mainStateActions } from 'src/app/modules/store';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { IOwnCompany, IInvitedCompany } from 'src/app/layout/model/header';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4SidebarService } from 'src/app/layout/v4-layout/services/v4-sidebar.service';
import { ICompanyRow } from '../../v4-components/cm-company-card-v4/cm-company-card-v4.component';
import { CmHeaderV4Component } from '../../v4-components/cm-header-v4/cm-header-v4.component';
import { CmSummaryCardsV4Component } from '../../v4-components/cm-summary-cards-v4/cm-summary-cards-v4.component';
import { CmCompanyTableV4Component } from '../../v4-components/cm-company-table-v4/cm-company-table-v4.component';
import { AddCompanyModalV4Component } from '../../v4-modals/add-company-modal-v4/add-company-modal-v4.component';
import { RequestAccessModalV4Component } from '../../v4-modals/request-access-modal-v4/request-access-modal-v4.component';
import { DeleteCompanyModalV4Component } from '../../v4-modals/delete-company-modal-v4/delete-company-modal-v4.component';
import { RemoveAccessModalV4Component } from '../../v4-modals/remove-access-modal-v4/remove-access-modal-v4.component';
import { OnboardingLinkModalV4Component } from '../../v4-modals/onboarding-link-modal-v4/onboarding-link-modal-v4.component';

type TabValue = 'my-companies' | 'invited' | 'all';

function isModalResult(
  val: unknown
): val is { success?: boolean; confirmed?: boolean } {
  return val !== null && typeof val === 'object';
}

@Component({
  selector: 'app-company-management-v4',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    CommonTabV4Component,
    CmHeaderV4Component,
    CmSummaryCardsV4Component,
    CmCompanyTableV4Component
  ],
  templateUrl: './company-management-v4.component.html',
  styleUrls: ['./company-management-v4.component.scss']
})
export class CompanyManagementV4Component implements OnInit {
  private destroyRef = inject(DestroyRef);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private companyManagementService = inject(CompanyManagementService);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private dataTableService = inject(DataTableService);
  private dtCacheService = inject(DataTableCacheService);
  private userManagementService = inject(UserManagementV35Service);
  private payeeDataV35Service = inject(PayeeDataV35Service);
  private router = inject(Router);
  private store = inject(Store);
  private modalService = inject(CustomDoubleSideModalService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private v4SidebarService = inject(V4SidebarService);

  // State
  activeTab = signal<TabValue>('my-companies');
  searchQuery = signal('');
  loading = signal(false);
  editingCompanyId = signal<string | null>(null);

  ownCompanies = signal<IOwnCompany[]>([]);
  invitedCompanies = signal<IInvitedCompany[]>([]);
  private _activeCompanyTrigger = signal(0);
  // Tabs config
  readonly tabs: ITabItem[] = [
    { label: 'My Companies', value: 'my-companies', lucideIcon: 'building-2' },
    { label: 'Invited', value: 'invited', lucideIcon: 'mail' },
    { label: 'All', value: 'all' }
  ];

  // Computed
  activeCompanyId = computed(() => {
    this._activeCompanyTrigger(); // re-evaluate when active company changes externally
    return this.companyManagementService.getActiveCompanyId();
  });

  activeCompanyName = computed(() => {
    const id = this.activeCompanyId();
    const ownFound = this.ownCompanies().find((c) => c.companyId === id);
    if (ownFound) return ownFound.companyName;
    const invitedFound = this.invitedCompanies().find((c) => c.companyId === id);
    return invitedFound?.companyName ?? 'None selected';
  });

  totalCount = computed(
    () => this.ownCompanies().length + this.invitedCompanies().length
  );

  filteredCompanies = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const tab = this.activeTab();
    const activeId = this.activeCompanyId();

    let rows: ICompanyRow[] = [];

    if (tab === 'my-companies' || tab === 'all') {
      rows = [
        ...rows,
        ...this.ownCompanies().map((c) => this.mapOwnCompany(c, activeId))
      ];
    }

    if (tab === 'invited' || tab === 'all') {
      rows = [
        ...rows,
        ...this.invitedCompanies().map((c) =>
          this.mapInvitedCompany(c, activeId)
        )
      ];
    }

    if (query) {
      rows = rows.filter((r) => r.companyName.toLowerCase().includes(query));
    }

    return rows;
  });

  ngOnInit(): void {
    this.loadAllData();

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['action'] === 'createCompany') {
          this.openAddCompany();
        }
      });
  }

  // ──── Data Loading ────

  loadAllData(): void {
    this.loading.set(true);
    this.loadOwnCompanies();
    this.loadInvitedCompanies();
  }

  private loadOwnCompanies(): void {
    this.companySwitchRepo
      .getOwnCompanies()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.ownCompanies.set(res.data ?? []);
      });
  }

  private loadInvitedCompanies(): void {
    this.companySwitchRepo
      .getInvitedCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          const filtered = (res.data ?? []).filter(
            (c: IInvitedCompany) => c.status !== 2
          );
          this.invitedCompanies.set(filtered);
        }
      });
  }

  // ──── Row Mappers ────

  private mapOwnCompany(c: IOwnCompany, activeId: string): ICompanyRow {
    return {
      id: String(c.id),
      companyId: c.companyId,
      companyName: c.companyName,
      companyLogoUrl: c.companyLogoUrl,
      type: 'own',
      isActive: c.companyId === activeId,
      customerRef: c.customerRef
    };
  }

  private mapInvitedCompany(c: IInvitedCompany, activeId: string): ICompanyRow {
    const type = c.status === 3 ? 'requested' : 'invited';
    return {
      id: c.id,
      companyId: c.companyId,
      companyName: c.companyName,
      type,
      invitedStatus: c.status,
      isActive: c.companyId === activeId,
      clientManagementId: c.id
    };
  }

  // ──── Tab / Search ────

  onTabChange(tab: string): void {
    this.activeTab.set(tab as TabValue);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  // ──── Actions ────

  openAddCompany(): void {
    const ref = this.modalService.open(AddCompanyModalV4Component, {
      width: '700px',
      disableClose: true,
      data: { editMode: false }
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: unknown) => {
        if (isModalResult(result) && result.success) {
          this.loadAllData();
        }
      });
  }

  openEditCompany(row: ICompanyRow): void {
    this.editingCompanyId.set(row.id);

    this.companySwitchRepo
      .getCompaniesDetails(row.id)
      .pipe(
        finalize(() => this.editingCompanyId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const ref = this.modalService.open(AddCompanyModalV4Component, {
          width: '700px',
          disableClose: true,
          data: {
            editMode: true,
            companyKeyId: row.id,
            companyDetails: res.data
          }
        });
        ref
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((result: unknown) => {
            if (isModalResult(result) && result.success) {
              this.loadAllData();
            }
          });
      });
  }

  openOnboardingLink(row: ICompanyRow): void {
    if (!row.customerRef) return;

    this.dialog.open(OnboardingLinkModalV4Component, {
      panelClass: 'paddingless-modal-rounded',
      width: '440px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true,
      data: { customerRef: row.customerRef, companyName: row.companyName }
    });
  }

  openRequestAccess(): void {
    const ref = this.modalService.open(RequestAccessModalV4Component, {
      width: '600px',
      disableClose: true
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: unknown) => {
        if (isModalResult(result) && result.success) {
          this.loadInvitedCompanies();
        }
      });
  }

  openDeleteCompany(row: ICompanyRow): void {
    // v3 parity: default/parent company cannot be deleted
    const company = this.ownCompanies().find(
      (c) => String(c.id) === row.id
    );
    if (company?.isItDefault === 1) {
      this.alertService.warningAlert({
        content: 'The default company cannot be deleted.'
      });
      return;
    }

    // Step 1: Use common V4 confirm alert (same as v3)
    this.alertService
      .confirmAlert({
        content:
          'Are you sure you want to delete this company? You will lose all the associated data.'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        // Steps 2-4: Open multi-step delete modal (instructions → password → final)
        const ref = this.modalService.open(DeleteCompanyModalV4Component, {
          width: '480px',
          data: { companyId: row.id }
        });
        ref
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((result: unknown) => {
            if (isModalResult(result) && result.success) {
              this._activeCompanyTrigger.update((v) => v + 1);
              this.loadAllData();
            }
          });
      });
  }

  switchCompany(row: ICompanyRow): void {
    this.store.dispatch(mainStateActions.resetStatesOnCompanyChange());

    if (row.type === 'invited') {
      const invitedCompany = this.invitedCompanies().find(
        (c) => c.id === row.id
      );
      if (!invitedCompany) return;

      this.companyManagementService.setActiveCompanyInfo(
        invitedCompany.companyId,
        invitedCompany.companyName,
        invitedCompany.type,
        invitedCompany.isItDefault ? 1 : 0
      );
    } else {
      const company = this.ownCompanies().find(
        (c) => String(c.id) === row.id
      );
      if (!company) return;

      this.companyManagementService.setActiveCompanyInfo(
        company.companyId,
        company.companyName,
        'owncmp',
        company.isItDefault ?? 0
      );
    }

    this.userManagementService.selectedUser$.next(false);
    this.dtCacheService.deleteDb();
    this.headerService.setHeaderValueChanged(true);
    this.dataTableService.setRefreshStatus(true);
    this.payeeDataV35Service.resetPayeeSignal();
    this.companyManagementService.setCompanyChange(true);
    this.v4SidebarService.setCompanySwitched(true);

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (
          event instanceof NavigationEnd &&
          event.urlAfterRedirects === '/v4/manage/home'
        ) {
          window.location.reload();
        }
      });

    this.router.navigate(['/v4/manage/home']);
  }

  acceptInvite(row: ICompanyRow): void {
    const { clientManagementId } = row;
    if (!clientManagementId) return;

    this.alertService
      .confirmAlert({ content: 'Are you sure you want to accept?' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.companySwitchRepo
          .acceptCompany(clientManagementId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: res.message,
                close: true
              });
              this.headerService.setHeaderValueChanged(true);
              this.loadInvitedCompanies();
            }
          });
      });
  }

  rejectInvite(row: ICompanyRow): void {
    const { clientManagementId } = row;
    if (!clientManagementId) return;

    this.alertService
      .confirmAlert({ content: 'Are you sure you want to reject?' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.companySwitchRepo
          .requestReject({ clientManagementId })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: res.message,
                close: true
              });
              this.headerService.setHeaderValueChanged(true);
              this.loadInvitedCompanies();
            }
          });
      });
  }

  removeAccess(row: ICompanyRow): void {
    const { clientManagementId } = row;
    if (!clientManagementId) return;

    const activeId = this.companyManagementService.getActiveCompanyId();
    if (activeId === row.companyId) {
      this.alertService.warningAlert({
        content: 'You cannot remove access to the active company.'
      });
      return;
    }

    const ref = this.modalService.open(RemoveAccessModalV4Component, {
      width: '480px',
      data: { companyName: row.companyName, action: 'remove-access' }
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: unknown) => {
        if (!isModalResult(result) || !result.confirmed) return;
        this.companySwitchRepo
          .removeAccess(clientManagementId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: res.message,
                close: true
              });
              this.headerService.setHeaderValueChanged(true);
              this.loadInvitedCompanies();
            }
          });
      });
  }

  resendRequest(row: ICompanyRow): void {
    const { clientManagementId } = row;
    if (!clientManagementId) return;

    this.companySwitchRepo
      .resendInvitation(clientManagementId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: res.message,
            close: true
          });
        }
      });
  }
}
