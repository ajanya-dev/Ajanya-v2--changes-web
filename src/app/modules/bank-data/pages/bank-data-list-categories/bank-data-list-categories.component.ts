import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { BankDataAddCategoryModalComponent } from '../../modals/bank-data-add-category-modal/bank-data-add-category-modal.component';
import { NgFor } from '@angular/common';
import {
  ICategoryNode,
  buildCategoryTree
} from '../../utils/category-tree.util';

@Component({
  selector: 'app-bank-data-list-categories',
  templateUrl: './bank-data-list-categories.component.html',
  styleUrls: ['./bank-data-list-categories.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgFor]
})
export class BankDataListCategoriesComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  categories: { categories: ICategoryNode[]; yd_categories: ICategoryNode[] } = {
    categories: [],
    yd_categories: []
  };

  displayCategories: ICategoryNode[] = [];

  constructor(
    public dialog: MatDialog,
    private bankDataService: BankDataService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.getCategories();
  }

  /**
   * @description  To get category.
   *
   */
  getCategories() {
    this.subscriptions.push(
      this.bankDataService.getCategories().subscribe((data) => {
        if (data?.success) {
          this.categories = data?.data;
          this.displayCategories = buildCategoryTree(
            this.categories.categories
          );
        }
      })
    );
  }

  /**
   * @description  To delete category.
   *
   */
  deleteCategory(id: string) {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this Category permanently?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankDataService.deleteCategory(id).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                content: 'Category Deleted!',
                close: true,
                timeout: 2000
              });
              this.getCategories();
            }
          })
        );
      }
    });
  }

  /**
   * @description  To update category.
   *
   */
  openCategoryModal(mode: string, category?: { id: string; name?: string }) {
    const dialogRef = this.dialog.open(BankDataAddCategoryModalComponent, {
      width: '510px',
      maxWidth: '93%',
      data: { mode, category, categories: this.categories.categories }
    });

    dialogRef.afterClosed().subscribe((result) => {
      let content = '';
      if (result?.success) {
        if (mode === 'new') {
          this.getCategories();
          content = 'Category Created!';
        } else if (mode === 'edit') {
          content = 'Category Updated !';
          this.getCategories();
        }

        this.alertService.successAlert({ content, close: true, timeout: 2000 });
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
