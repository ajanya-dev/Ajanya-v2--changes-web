import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, X } from 'lucide-angular';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';

import { CategoryService } from 'src/app/shared/service/category/category.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { ICategoryData } from 'src/app/modules/Cash-Expense/model/CashExpense';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

@Component({
  selector: 'app-category-add-modal-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    V4CommonDropDownSelectorComponent,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './category-add-modal-v4.component.html',
  styleUrls: ['./category-add-modal-v4.component.scss']
})
export class CategoryAddModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef<CategoryAddModalV4Component>);
  private categoryService = inject(CategoryService);
  private alertService = inject(V4AlertService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private data: { selectedItem: ICategoryData } | null = inject(MAT_DIALOG_DATA, { optional: true });

  readonly XIcon = X;

  submitting = signal(false);
  editMode = false;
  private selectedItem: ICategoryData | null = null;

  categoryTypeOptions = [
    { value: '1', label: 'Income' },
    { value: '2', label: 'Expense' }
  ];

  categoryTypeConfig: Iv4ngSelectConfig = {
    placeholder: 'Select category type',
    displayField: 'label',
    outputField: 'value'
  };

  categoryStatusOptions = [
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' }
  ];

  categoryStatusConfig: Iv4ngSelectConfig = {
    placeholder: 'Select status',
    displayField: 'label',
    outputField: 'value'
  };

  form: FormGroup = this.fb.group({
    categoryName: ['', [Validators.required, Validators.maxLength(40)]],
    categoryType: [null, Validators.required]
  });

  ngOnInit(): void {
    if (this.data?.selectedItem) {
      this.selectedItem = this.data.selectedItem;
      this.editMode = true;
      const type = this.selectedItem.catagory_type;
      const isSelectable = type === 1 || type === 2;
      if (!isSelectable) {
        this.form.controls.categoryType.clearValidators();
        this.form.controls.categoryType.updateValueAndValidity();
      }
      this.form.addControl(
        'categoryStatus',
        this.fb.control(String(this.selectedItem.category_status ?? 1), Validators.required)
      );
      this.form.patchValue({
        categoryName: this.selectedItem.catagory_name,
        categoryType: isSelectable ? String(type) : null
      });
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;
    if (this.editMode) {
      this.onUpdate();
    } else {
      this.onSave();
    }
  }

  private buildPayload() {
    const { categoryName, categoryType, categoryStatus } = this.form.value;
    const resolvedType =
      categoryType != null && categoryType !== ''
        ? Number(categoryType)
        : (this.selectedItem?.catagory_type as number);
    return {
      categoryName,
      categoryType: resolvedType,
      categoryStatus: this.editMode ? Number(categoryStatus) : 1
    };
  }

  private onSave(): void {
    this.submitting.set(true);
    const { categoryName, categoryType } = this.form.value;

    this.categoryService
      .postCategory(this.buildPayload())
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Category added',
            close: true
          });
          this.dialogRef.close({
            success: true,
            id: res.data.id,
            categoryData: {
              id: res.data.id,
              name: categoryName,
              type: Number(categoryType)
            } as ICategoryDropdown
          });
        }
      });
  }

  private onUpdate(): void {
    this.submitting.set(true);
    this.categoryService
      .updateCategory(this.selectedItem!.id as string, this.buildPayload())
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Category updated successfully',
            timeout: 2000,
            close: true
          });
          this.dialogRef.close({ success: true });
        }
      });
  }
}
