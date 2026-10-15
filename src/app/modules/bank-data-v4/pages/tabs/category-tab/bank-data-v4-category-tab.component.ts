import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankDataV4ApiService } from '../../../services/bank-data-v4-api.service';
import { BankDataV4TransactionsStateService } from '../../../services/bank-data-v4-transactions-state.service';
import {
  BankDataV4CreateCategoryModalComponent,
  IBankDataV4CategoryModalData
} from '../../../modals/create-category-modal/bank-data-v4-create-category-modal.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { V4DataTableEmptyStateComponent } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';

interface ICategoryItem {
  id: string;
  name: string;
  yd_category_id?: number;
  level?: number;
  cleanName?: string;
}

@Component({
  selector: 'app-bank-data-v4-category-tab',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component,
    MatTooltipModule,
    V4DataTableEmptyStateComponent
  ],
  templateUrl: './bank-data-v4-category-tab.component.html'
})
export class BankDataV4CategoryTabComponent implements OnInit {
  state = inject(BankDataV4TransactionsStateService);
  private api = inject(BankDataV4ApiService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);

  deletingId = signal<string | null>(null);

  userCategories = computed(() => this.state.userCategories());

  parsedCategories = computed(() =>
    this.userCategories().map((cat) => ({
      ...cat,
      level: cat.level || 0,
      cleanName: cat.name
    }))
  );

  ngOnInit(): void {
    this.state.loadIndex();
    this.state.loadCategories();
  }

  onAddCategory(): void {
    const data: IBankDataV4CategoryModalData = {
      mode: 'new'
    };

    const ref = this.dialog.open(BankDataV4CreateCategoryModalComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      disableClose: true,
      data
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.success) this.state.loadCategories();
    });
  }

  onEditCategory(cat: ICategoryItem): void {
    const data: IBankDataV4CategoryModalData = {
      mode: 'edit',
      category: cat
    };

    const ref = this.dialog.open(BankDataV4CreateCategoryModalComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      disableClose: true,
      data
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.success) this.state.loadCategories();
    });
  }

  onDeleteCategory(cat: ICategoryItem): void {
    if (!cat?.id || this.deletingId()) return;

    const dRef = this.alertService.confirmAlert({
      title: 'Are you sure',
      content: 'You want to delete this category?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.deletingId.set(cat.id);
      this.api.deleteCategory(cat.id).subscribe({
        next: (res: { success?: boolean }) => {
          this.deletingId.set(null);
          if (res?.success) {
            this.alertService.successAlert({ content: 'Category deleted' });
            this.state.userCategories.update((cats) =>
              cats.filter((c) => c.id !== cat.id)
            );
          }
        },
        error: () => this.deletingId.set(null)
      });
    });
  }
}
