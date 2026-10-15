import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { BankDataV4ApiService } from '../../../services/bank-data-v4-api.service';
import { BankDataV4CompanyModalComponent } from '../../../modals/company-modal/bank-data-v4-company-modal.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { V4DataTableEmptyStateComponent } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';

@Component({
  selector: 'app-bank-data-v4-company-tab',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component,
    MatTooltipModule,
    V4DataTableEmptyStateComponent
  ],
  templateUrl: './bank-data-v4-company-tab.component.html'
})
export class BankDataV4CompanyTabComponent implements OnInit {
  private api = inject(BankDataV4ApiService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private bankDataService = inject(BankDataService);
  private destroyRef = inject(DestroyRef);

  companies = signal<{ id: string; name: string }[]>([]);
  companiesLoaded = signal(false);

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.bankDataService
      .getCompanyList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.companies.set(list);
          this.companiesLoaded.set(true);
        },
        error: () => this.companiesLoaded.set(true)
      });
  }

  openCompanyModal(
    mode: 'new' | 'edit',
    company?: { id: string; name: string }
  ): void {
    const ref = this.dialog.open(BankDataV4CompanyModalComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      data: { mode, company }
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.success) this.loadCompanies();
    });
  }

  deleteCompany(company: { id: string; name: string }): void {
    const dRef = this.alertService.confirmAlert({
      title: 'Are you sure',
      content: 'You want to delete this company permanently?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api
        .deleteCompany(company.id)
        .subscribe((res: { success?: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Company deleted' });
            this.loadCompanies();
          }
        });
    });
  }
}
