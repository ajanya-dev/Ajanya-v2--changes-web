import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CategoryService } from 'src/app/shared/service/category/category.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { ICategoryData } from 'src/app/modules/Cash-Expense/model/CashExpense';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { NgStyle, NgIf } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

/**
 * @description Modal component for adding category.
 */
@Component({
  selector: 'app-category-add-modal',
  templateUrl: './category-add-modal.component.html',
  styleUrls: ['./category-add-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    ControlMessageComponent,
    MatDialogActions,
    NgStyle,
    NgIf,
    MatTooltip
  ]
})
export class CategoryAddModalComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<CategoryAddModalComponent>);
  private dataTableService = inject(DataTableService);
  public data: { selectedItem: ICategoryData } = inject(MAT_DIALOG_DATA);

  loading = false;
  subscriptions: Subscription[] = [];
  selectedItem: ICategoryData | null;
  UpdateMode  = signal(false);
  categoryForm = new FormGroup({
    categoryName: new FormControl('', [Validators.required]),
    categoryType: new FormControl('', [Validators.required]),
    categoryStatus: new FormControl<number>(1, [Validators.required])
  });

  ngOnInit(): void {
    if (this.data) {
      this.selectedItem = this.data?.selectedItem;
      this.UpdateMode.set(true);
    }
    this.setFormValues();
  }


  /**
   * Method to patch form values
   */
  setFormValues() {
    if (this.selectedItem) {
      this.categoryForm.patchValue({
        categoryName: this.selectedItem.catagory_name,
        categoryType: String(this.selectedItem.catagory_type),
        categoryStatus: this.selectedItem.category_status
      });
    }
  }

  /**
   * @description Creates category object with form data and returns it.
   * @returns category object.
   */
  createCategoryBody() {
    const data = this.categoryForm.value;

    return {
      categoryName: data.categoryName as string,
      categoryType: Number(data.categoryType),
      categoryStatus: Number(data.categoryStatus)
    };
  }

  /**
   * @description Method for submitting the category form.
   * Creates new category or updates based on whether `this.selectedItem` exist or not.
   */
  onSubmit() {
    this.categoryForm.markAllAsTouched();
    if (this.categoryForm.invalid ) return;
    if (this.selectedItem) {
      this.onUpdate();
    } else {
      this.onSave();
    }
  }

  /**
   * Method to update category
   */
  onUpdate() {
    this.loading = true;
    const dataToCreate = this.createCategoryBody();
    this.subscriptions.push(
      this.categoryService
        .updateCategory(this.selectedItem?.id as string, dataToCreate)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success === true) {
            this.dialogRef.close({
              success: true,
              id: res.data.id,
              categoryData: {
                id: res.data.id,
                name: dataToCreate.categoryName,
                type: dataToCreate.categoryType
              } as ICategoryDropdown
            });
            this.dataTableService.setRefreshStatus(true);
            this.successAlert('Category updated successfully');
          }
        })
    );
  }

  /**
   * @description Method to create new category with data returned from `this.createCategoryBody` method.
   */
  onSave() {
    this.loading = true;
    const dataToCreate = this.createCategoryBody();
    this.subscriptions.push(
      this.categoryService
        .postCategory(dataToCreate)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success === true) {
            this.dialogRef.close({
              success: true,
              id: res.data.id,
              categoryData: {
                id: res.data.id,
                name: dataToCreate.categoryName,
                type: dataToCreate.categoryType
              } as ICategoryDropdown
            });
            this.successAlert('Category added');
          }
        })
    );
  }

  /**
   * @description Shows success alert message.
   * @param content
   */
  successAlert(content: string) {
    const data = {
      title: 'success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
